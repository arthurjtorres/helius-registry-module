import { randomUUID } from "crypto";
import { Op, Transaction, UniqueConstraintError } from "sequelize";
import db, { CompanyModel, DocumentModel, EmployeeModel, PersonModel, PositionModel } from "../database/models";
import { DocumentTypeEnum } from "../database/models/enums/DocumentTypeEnum";
import {
  ItemFailure,
  MAX_BULK_ITEMS,
  normalizeText,
  validateEmployeeItems,
  ValidEmployeeItem,
} from "../utils/EmployeeImport";
import { compareEmployee, CurrentEmployee, FieldChange, isConflict } from "../utils/EmployeeUpsert";
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

/** Item ignorado: matrícula já cadastrada (`insert`) ou alteração não confirmada (`upsert`). */
interface SkippedItem {
  line: number;
  registration: string;
  employeeId: string;
  reason: string;
  /** Só em `upsert`: o que mudaria se o id viesse em `confirmIds`. */
  changes?: FieldChange[];
}

/** Funcionário existente que a importação atualiza (ou atualizaria, em `dryRun`). */
interface UpdatedItem {
  line: number;
  registration: string;
  employeeId: string;
  changes: FieldChange[];
}

/** Funcionário existente igual à planilha: nada é gravado. */
interface UnchangedItem {
  line: number;
  registration: string;
  employeeId: string;
}

/** Atualização confirmada, pronta para gravar. */
interface PlannedUpdate extends UpdatedItem {
  personId: string;
  employeePatch: Record<string, unknown>;
  personPatch: Record<string, unknown>;
  addCpf?: string;
}

/** Opções da importação (query string e corpo). */
export interface ImportOptions {
  /** Só valida e relata, sem gravar. */
  dryRun?: boolean;
  /** `insert` (padrão, T09): existentes não mudam. `upsert` (T10): atualiza o que for confirmado. */
  mode?: "insert" | "upsert";
  /** Em `upsert`: permite reativar matrículas inativas trazidas pela planilha. */
  reactivate?: boolean;
  /** Em `upsert`: ids dos funcionários cujas diferenças o usuário confirmou. */
  confirmIds?: string[];
}

/**
 * Corpo do relatório de importação. Em `insert` nunca contém nome completo nem CPF; em `upsert`,
 * as diferenças (`changes`) mostram valor atual e novo, inclusive nome e nascimento (decisão da T10).
 */
interface ImportReport {
  dryRun: boolean;
  mode: "insert" | "upsert";
  created: CreatedItem[];
  /** Só em `upsert`. */
  updated?: UpdatedItem[];
  /** Só em `upsert`. */
  unchanged?: UnchangedItem[];
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

type WithPosition = ValidEmployeeItem & { positionId: string };
type StoredEmployee = CurrentEmployee & { registration: string };

/**
 * Importação de funcionários em lote: valida tudo antes de gravar, grava numa única transação
 * (tudo ou nada) e devolve um relatório por item. Em `insert` (T09) registros existentes não são
 * alterados; em `upsert` (T10) as diferenças são recalculadas aqui e só as confirmadas são gravadas.
 */
class EmployeeBulkService {
  /**
   * Importa funcionários (e as pessoas e CPFs que vêm junto).
   * @param payload Empresa, usuário autenticado (do token) e lista de itens.
   * @param options Ver {@link ImportOptions}.
   */
  async importEmployees(
    payload: { companyId?: unknown; userId?: unknown; employees?: unknown },
    options: ImportOptions = {}
  ): Promise<BulkResult> {
    const dryRun = options.dryRun === true;
    const mode = options.mode ?? "insert";
    const upsert = mode === "upsert";
    const confirmed = new Set(options.confirmIds ?? []);
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

    const company = await CompanyModel.findOne({ where: { companyId, activated: true }, attributes: ["companyId", "companyAcronym"] });
    if (!company) return { status: 400, message: "Empresa não encontrada ou inativa." };

    // Matrícula gravada = sigla da empresa + número (a planilha traz só o número)
    const { valid, failed } = validateEmployeeItems(employees, company.companyAcronym);

    // Matrículas já cadastradas. insert: ativa → ignora, inativa → conflito (ADR-010).
    // upsert: ativa (ou inativa com reactivate) → comparação com a planilha.
    const existing = valid.length
      ? await EmployeeModel.findAll({
          where: { registration: { [Op.in]: valid.map(v => v.registration) } },
          attributes: upsert
            ? ["employeeId", "registration", "activated", "fkCompanyId", "fkPositionId", "fkPersonId", "admissionDate"]
            : ["employeeId", "registration", "activated"],
        })
      : [];
    const byRegistration = new Map(existing.map(e => [e.registration, e]));
    const skipped: SkippedItem[] = [];
    const candidates: ValidEmployeeItem[] = [];
    const toCompare: ValidEmployeeItem[] = [];
    valid.forEach(item => {
      const found = byRegistration.get(item.registration);
      if (!found) return void candidates.push(item);
      if (upsert && (found.activated || options.reactivate === true)) return void toCompare.push(item);
      if (found.activated) {
        skipped.push({ line: item.line, registration: item.registration, employeeId: found.employeeId, reason: "Matrícula já cadastrada." });
      } else {
        failed.push({
          line: item.line, registration: item.registration, field: "registration", code: "CONFLICT",
          error: `Matrícula já existe como registro inativo (id: ${found.employeeId}). Reative-o em PATCH /employee/${found.employeeId}/reactivate`
            + (upsert ? " ou importe com reactivate=true." : "."),
        });
      }
    });

    // Cargos: comparação exata (sem acento, maiúsculas), só cargos ativos
    const positions = candidates.length || toCompare.length
      ? await PositionModel.findAll({ where: { activated: true }, attributes: ["positionId", "positionName"] })
      : [];
    const positionsByKey = new Map<string, string[]>();
    positions.forEach(p => {
      const key = normalizeText(p.positionName);
      positionsByKey.set(key, [...(positionsByKey.get(key) ?? []), p.positionId]);
    });
    const missingPositions = new Set<string>();
    const withPosition: WithPosition[] = [];
    const compareWithPosition: WithPosition[] = [];
    [...candidates, ...toCompare].forEach(item => {
      const ids = positionsByKey.get(item.positionKey) ?? [];
      const target = byRegistration.has(item.registration) ? compareWithPosition : withPosition;
      if (ids.length === 1) return void target.push({ ...item, positionId: ids[0] });
      if (ids.length === 0) missingPositions.add(item.position);
      failed.push({
        line: item.line, registration: item.registration, field: "position", code: "INVALID",
        error: ids.length === 0 ? `Cargo '${item.position}' não cadastrado.` : `Cargo '${item.position}' ambíguo: há mais de um cargo ativo com esse nome.`,
      });
    });

    // CPFs: reaproveita a pessoa quando o CPF já existe ativo; conflito se inativo ou de outro tipo.
    // Em upsert, também confere se o CPF a preencher já pertence a alguém.
    const cpfs = [...withPosition, ...compareWithPosition].filter(i => i.cpf).map(i => i.cpf as string);
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

    const { updated, unchanged, updates } = upsert
      ? await this.planUpdates(compareWithPosition, byRegistration as Map<string, StoredEmployee>, companyId, documentsByNumber, confirmed, skipped, failed)
      : { updated: [] as UpdatedItem[], unchanged: [] as UnchangedItem[], updates: [] as PlannedUpdate[] };

    failed.sort((a, b) => a.line - b.line);
    const createdPreview: CreatedItem[] = planned.map(p => ({ line: p.line, registration: p.registration, employeeId: p.employeeId, personReused: p.personReused }));
    const report = (created: CreatedItem[], applied: UpdatedItem[] = updated): ImportReport => ({
      dryRun, mode, created,
      ...(upsert ? { updated: applied, unchanged } : {}),
      skipped, failed, missingPositions: [...missingPositions],
    });

    if (failed.length) {
      return { status: 400, message: "Importação rejeitada: nenhum registro foi gravado. Corrija os itens com erro e envie de novo.", data: report([], []) };
    }
    if (dryRun) {
      return { status: 200, message: "Simulação concluída: nenhum registro foi gravado.", data: report(createdPreview) };
    }
    if (!planned.length && !updates.length) {
      return {
        status: 200,
        message: upsert ? "Nada a gravar: nenhum funcionário novo nem alteração confirmada." : "Nenhum funcionário novo: todas as matrículas já estavam cadastradas.",
        data: report([]),
      };
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
      await this.applyUpdates(updates, userId, now, transaction);
      await transaction.commit();
      const message = upsert
        ? `${planned.length} funcionário(s) criado(s) e ${updates.length} atualizado(s).`
        : `${planned.length} funcionário(s) importado(s) com sucesso.`;
      return { status: planned.length ? 201 : 200, message, data: report(createdPreview) };
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

  /**
   * Compara os itens existentes com o cadastro (T10) e separa: inalterados, atualizações
   * confirmadas, diferenças não confirmadas (em `skipped`) e conflitos de identidade (em `failed`).
   */
  private async planUpdates(
    items: WithPosition[],
    byRegistration: Map<string, StoredEmployee>,
    companyId: string,
    documentsByNumber: Map<string, { fkPersonId: string }>,
    confirmed: Set<string>,
    skipped: SkippedItem[],
    failed: ItemFailure[]
  ): Promise<{ updated: UpdatedItem[]; unchanged: UnchangedItem[]; updates: PlannedUpdate[] }> {
    const updated: UpdatedItem[] = [];
    const unchanged: UnchangedItem[] = [];
    const updates: PlannedUpdate[] = [];
    if (!items.length) return { updated, unchanged, updates };

    const employees = items.map(i => byRegistration.get(i.registration) as StoredEmployee);
    const personIds = [...new Set(employees.map(e => e.fkPersonId))];
    const positionIds = [...new Set(employees.map(e => e.fkPositionId).filter((id): id is string => !!id))];
    const [persons, cpfDocs, currentPositions] = await Promise.all([
      PersonModel.findAll({ where: { personId: { [Op.in]: personIds } }, attributes: ["personId", "fullName", "birthDate", "activated"] }),
      DocumentModel.findAll({ where: { fkPersonId: { [Op.in]: personIds }, documentType: DocumentTypeEnum.CPF }, attributes: ["fkPersonId", "documentNumber"] }),
      positionIds.length ? PositionModel.findAll({ where: { positionId: { [Op.in]: positionIds } }, attributes: ["positionId", "positionName"] }) : [],
    ]);
    const personById = new Map(persons.map(p => [p.personId, p]));
    const cpfByPerson = new Map(cpfDocs.map(d => [d.fkPersonId, d.documentNumber]));
    const positionName = new Map(currentPositions.map(p => [p.positionId, p.positionName]));
    // Mesma pessoa em dois itens (duas matrículas) não pode receber dados diferentes
    const personTouched = new Map<string, string>();

    items.forEach((item, index) => {
      const employee = employees[index];
      const base = { line: item.line, registration: item.registration, employeeId: employee.employeeId };
      const conflictWith = (field: string, error: string) =>
        failed.push({ line: item.line, registration: item.registration, field, code: "CONFLICT", error });
      const result = compareEmployee({
        item, positionId: item.positionId, companyId, employee,
        person: personById.get(employee.fkPersonId) ?? null,
        personCpf: cpfByPerson.get(employee.fkPersonId) ?? null,
        currentPositionName: employee.fkPositionId ? positionName.get(employee.fkPositionId) ?? null : null,
      });
      if (isConflict(result)) return void conflictWith(result.conflict.field, result.conflict.error);
      if (!result.changes.length) return void unchanged.push(base);

      if (result.addCpf && documentsByNumber.has(result.addCpf)) {
        return void conflictWith("cpf", "CPF já cadastrado para outra pessoa.");
      }
      const personKey = JSON.stringify({ ...result.personPatch, addCpf: result.addCpf });
      if (personKey !== "{}") {
        const previous = personTouched.get(employee.fkPersonId);
        if (previous !== undefined && previous !== personKey) {
          return void conflictWith("person", "Outra linha do arquivo altera a mesma pessoa com dados diferentes.");
        }
        personTouched.set(employee.fkPersonId, personKey);
      }
      if (!confirmed.has(employee.employeeId)) {
        return void skipped.push({ ...base, reason: "Alteração não confirmada (inclua o id em confirmIds).", changes: result.changes });
      }
      updated.push({ ...base, changes: result.changes });
      updates.push({
        ...base, changes: result.changes, personId: employee.fkPersonId,
        employeePatch: result.employeePatch, personPatch: result.personPatch, addCpf: result.addCpf,
      });
    });
    return { updated, unchanged, updates };
  }

  /** Grava as atualizações confirmadas dentro da transação da importação, com o autor do token. */
  private async applyUpdates(updates: PlannedUpdate[], userId: string, now: Date, transaction: Transaction): Promise<void> {
    const touchedPersons = new Set<string>();
    for (const u of updates) {
      if (Object.keys(u.employeePatch).length) {
        await EmployeeModel.update({ ...u.employeePatch, updatedBy: userId, updatedAt: now }, { where: { employeeId: u.employeeId }, transaction });
      }
      if (Object.keys(u.personPatch).length && !touchedPersons.has(u.personId)) {
        await PersonModel.update({ ...u.personPatch, updatedBy: userId, updatedAt: now }, { where: { personId: u.personId }, transaction });
        touchedPersons.add(u.personId);
      }
    }
    const cpfs = new Map(updates.filter(u => u.addCpf).map(u => [u.personId, u.addCpf as string]));
    if (cpfs.size) {
      await DocumentModel.bulkCreate(
        [...cpfs].map(([personId, number]) => ({
          documentType: DocumentTypeEnum.CPF, documentNumber: number, fkPersonId: personId,
          activated: true, createdBy: userId, createdAt: now,
        })),
        { transaction }
      );
    }
  }
}

export default EmployeeBulkService;
