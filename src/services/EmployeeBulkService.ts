import { randomUUID } from "crypto";
import { Op, UniqueConstraintError } from "sequelize";
import db, { CompanyModel, DocumentModel, EmployeeModel, PersonModel, PositionModel } from "../database/models";
import { DocumentTypeEnum } from "../database/models/enums/DocumentTypeEnum";
import {
  ItemFailure,
  MAX_BULK_ITEMS,
  normalizeText,
  validateEmployeeItems,
  ValidEmployeeItem,
} from "../utils/EmployeeImport";
import { logError } from "../utils/logError";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Funcionário que entraria (ou entrou) na importação. */
interface CreatedItem {
  line: number;
  registration: string;
  employeeId: string;
  /** `true` quando a pessoa já existia (mesmo CPF) e foi reaproveitada. */
  personReused: boolean;
}

/** Item ignorado porque a matrícula já está cadastrada e ativa. */
interface SkippedItem {
  line: number;
  registration: string;
  employeeId: string;
  reason: string;
}

/** Corpo do relatório de importação. Nunca contém nome completo nem CPF. */
interface ImportReport {
  dryRun: boolean;
  created: CreatedItem[];
  skipped: SkippedItem[];
  failed: ItemFailure[];
  /** Cargos informados que não existem (ativos) no cadastro, sem repetição. */
  missingPositions: string[];
}

/** Resposta do serviço (mesmo formato `{ status, message, data? }` dos demais). */
interface BulkResult {
  status: number;
  message: string;
  data?: ImportReport;
}

/** Item pronto para gravar, com o destino da pessoa já resolvido. */
interface PlannedItem extends ValidEmployeeItem {
  employeeId: string;
  personId: string;
  personReused: boolean;
  positionId: string;
}

/**
 * Importação de funcionários em lote (T09): valida tudo antes de gravar, grava numa única
 * transação (tudo ou nada) e devolve um relatório por item. Registros existentes não são alterados.
 */
class EmployeeBulkService {
  /**
   * Importa funcionários (e as pessoas e CPFs que vêm junto).
   * @param payload Empresa, usuário autenticado (do token) e lista de itens.
   * @param options `dryRun`: só valida e relata, sem gravar.
   */
  async importEmployees(
    payload: { companyId?: unknown; userId?: unknown; employees?: unknown },
    options: { dryRun?: boolean } = {}
  ): Promise<BulkResult> {
    const dryRun = options.dryRun === true;
    const { companyId, userId, employees } = payload;

    if (typeof userId !== "string" || !userId) return { status: 401, message: "Usuário não identificado." };
    if (typeof companyId !== "string" || !UUID_REGEX.test(companyId)) {
      return { status: 400, message: "Id da empresa não informado ou inválido." };
    }
    if (!Array.isArray(employees) || employees.length === 0) {
      return { status: 400, message: "Lista de funcionários vazia." };
    }
    if (employees.length > MAX_BULK_ITEMS) {
      return { status: 400, message: `Máximo de ${MAX_BULK_ITEMS} funcionários por importação.` };
    }

    const company = await CompanyModel.findOne({ where: { companyId, activated: true } });
    if (!company) return { status: 400, message: "Empresa não encontrada ou inativa." };

    const { valid, failed } = validateEmployeeItems(employees);

    // Matrículas já cadastradas: ativa → ignora; inativa → conflito (ADR-010)
    const existing = valid.length
      ? await EmployeeModel.findAll({
          where: { registration: { [Op.in]: valid.map(v => v.registration) } },
          attributes: ["employeeId", "registration", "activated"],
        })
      : [];
    const byRegistration = new Map(existing.map(e => [e.registration, e]));
    const skipped: SkippedItem[] = [];
    const candidates: ValidEmployeeItem[] = [];
    valid.forEach(item => {
      const found = byRegistration.get(item.registration);
      if (!found) return void candidates.push(item);
      if (found.activated) {
        skipped.push({ line: item.line, registration: item.registration, employeeId: found.employeeId, reason: "Matrícula já cadastrada." });
      } else {
        failed.push({
          line: item.line, registration: item.registration, field: "registration", code: "CONFLICT",
          error: `Matrícula já existe como registro inativo (id: ${found.employeeId}). Reative-o em PATCH /employee/${found.employeeId}/reactivate.`,
        });
      }
    });

    // Cargos: comparação exata (sem acento, maiúsculas), só cargos ativos
    const positions = candidates.length ? await PositionModel.findAll({ where: { activated: true }, attributes: ["positionId", "positionName"] }) : [];
    const positionsByKey = new Map<string, string[]>();
    positions.forEach(p => {
      const key = normalizeText(p.positionName);
      positionsByKey.set(key, [...(positionsByKey.get(key) ?? []), p.positionId]);
    });
    const missingPositions = new Set<string>();
    const withPosition: (ValidEmployeeItem & { positionId: string })[] = [];
    candidates.forEach(item => {
      const ids = positionsByKey.get(item.positionKey) ?? [];
      if (ids.length === 1) return void withPosition.push({ ...item, positionId: ids[0] });
      if (ids.length === 0) missingPositions.add(item.position);
      failed.push({
        line: item.line, registration: item.registration, field: "position", code: "INVALID",
        error: ids.length === 0 ? `Cargo '${item.position}' não cadastrado.` : `Cargo '${item.position}' ambíguo: há mais de um cargo ativo com esse nome.`,
      });
    });

    // CPFs: reaproveita a pessoa quando o CPF já existe ativo; conflito se inativo ou de outro tipo
    const cpfs = withPosition.filter(i => i.cpf).map(i => i.cpf as string);
    const documents = cpfs.length
      ? await DocumentModel.findAll({
          where: { documentNumber: { [Op.in]: cpfs } },
          attributes: ["documentNumber", "documentType", "fkPersonId", "activated"],
        })
      : [];
    const documentsByNumber = new Map(documents.map(d => [d.documentNumber, d]));
    const reusablePersonIds = documents.filter(d => d.activated && d.documentType === DocumentTypeEnum.CPF).map(d => d.fkPersonId);
    const activePersons = reusablePersonIds.length
      ? await PersonModel.findAll({ where: { personId: { [Op.in]: reusablePersonIds }, activated: true }, attributes: ["personId"] })
      : [];
    const activePersonIds = new Set(activePersons.map(p => p.personId));

    const planned: PlannedItem[] = [];
    withPosition.forEach(item => {
      const doc = item.cpf ? documentsByNumber.get(item.cpf) : undefined;
      if (doc && (doc.documentType !== DocumentTypeEnum.CPF || !doc.activated || !activePersonIds.has(doc.fkPersonId))) {
        failed.push({
          line: item.line, registration: item.registration, field: "cpf", code: "CONFLICT",
          error: doc.documentType !== DocumentTypeEnum.CPF
            ? "Esse número já está cadastrado como outro tipo de documento."
            : "CPF já cadastrado em documento ou pessoa inativos; reative o cadastro antes de importar.",
        });
        return;
      }
      planned.push({
        ...item,
        employeeId: randomUUID(),
        personId: doc ? doc.fkPersonId : randomUUID(),
        personReused: !!doc,
      });
    });

    failed.sort((a, b) => a.line - b.line);
    const createdPreview: CreatedItem[] = planned.map(p => ({ line: p.line, registration: p.registration, employeeId: p.employeeId, personReused: p.personReused }));
    const report = (created: CreatedItem[]): ImportReport => ({ dryRun, created, skipped, failed, missingPositions: [...missingPositions] });

    if (failed.length) {
      return { status: 400, message: "Importação rejeitada: nenhum registro foi gravado. Corrija os itens com erro e envie de novo.", data: report([]) };
    }
    if (dryRun) {
      return { status: 200, message: "Simulação concluída: nenhum registro foi gravado.", data: report(createdPreview) };
    }
    if (!planned.length) {
      return { status: 200, message: "Nenhum funcionário novo: todas as matrículas já estavam cadastradas.", data: report([]) };
    }

    const transaction = await db.transaction();
    try {
      const now = new Date();
      await PersonModel.bulkCreate(
        planned.filter(p => !p.personReused).map(p => ({
          personId: p.personId, firstName: p.firstName, lastName: p.lastName, fullName: p.fullName,
          birthDate: p.birthDate, activated: true, createdBy: userId, createdAt: now,
        })),
        { transaction }
      );
      await DocumentModel.bulkCreate(
        planned.filter(p => p.cpf && !p.personReused).map(p => ({
          documentType: DocumentTypeEnum.CPF, documentNumber: p.cpf as string, fkPersonId: p.personId,
          activated: true, createdBy: userId, createdAt: now,
        })),
        { transaction }
      );
      await EmployeeModel.bulkCreate(
        planned.map(p => ({
          employeeId: p.employeeId, registration: p.registration, fkPersonId: p.personId, fkCompanyId: companyId,
          fkPositionId: p.positionId, admissionDate: p.admissionDate, activated: true, createdBy: userId, createdAt: now,
        })),
        { transaction }
      );
      await transaction.commit();
      return { status: 201, message: `${planned.length} funcionário(s) importado(s) com sucesso.`, data: report(createdPreview) };
    } catch (error: unknown) {
      await transaction.rollback();
      if (error instanceof UniqueConstraintError) {
        return { status: 409, message: "Conflito de unicidade durante a gravação (matrícula ou CPF cadastrados por outra requisição). Nenhum registro foi gravado; tente novamente." };
      }
      // Detalhe só no log do servidor, sem dados do lote
      logError("importEmployees", error);
      return { status: 500, message: "Erro interno ao importar funcionários. Nenhum registro foi gravado." };
    }
  }
}

export default EmployeeBulkService;
