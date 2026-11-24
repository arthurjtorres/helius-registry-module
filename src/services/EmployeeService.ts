import { ModelStatic, Op } from "sequelize";
import { ListQuery, activeWhere } from "../utils/ActiveFilter";
import joi from "joi";

import Response from "../utils/Response";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import db, { EmployeeModel, PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel, DocumentModel } from "../database/models";
import EmployeeInterface from "../database/interfaces/EmployeeInterface";

import EmployeeBulkService, { activeEmploymentByPerson, activeEmploymentMessage, ImportOptions } from "./EmployeeBulkService";
import { buildRegistration } from "../utils/EmployeeImport";
import { parseIdList } from "../utils/IdList";
import { deactivateUsersByEmployee, ControlUnavailableError } from "./integrations/UserService";
import { inCompanyScope } from "../utils/AccessPolicy";

/** Máximo de funcionários por desligamento em lote, igual à importação e à rota do `control`. */
export const MAX_DEACTIVATE_IDS = 5000;

/**
 * Data de rescisão (T20): `AAAA-MM-DD`, no máximo amanhã; sem valor, hoje em Brasília, independente
 * do fuso do servidor (em UTC, após 21h `toISOString` já é amanhã).
 */
const parseTerminationDate = (value?: string): { date: string } | { error: string } => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const tomorrow = new Date(Date.parse(today) + 86_400_000).toISOString().slice(0, 10);
  const date = value ?? today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || joi.date().iso().validate(date).error) return { error: "Data de rescisão inválida: use AAAA-MM-DD." };
  if (date > tomorrow) return { error: "A data de rescisão não pode passar de amanhã." };
  return { date };
};

/** Admissão até a data de rescisão (ou sem admissão). */
const admittedBy = (admissionDate: unknown, date: string) => !admissionDate || date >= String(admissionDate).slice(0, 10);

/** Filtro de empresa do escopo (T18); `null` = sem filtro. Fora do escopo vira "não encontrado" (404). */
const scopeWhere = (scope: string[] | null) => (scope ? { fkCompanyId: { [Op.in]: scope } } : {});

/** Empresa informada fora do escopo do usuário (T18, decisão 2). */
const OUT_OF_SCOPE = "Empresa fora do seu escopo de acesso.";

const INVALID_REGISTRATION = "Matrícula inválida: informe o número da chapa (ex.: 8598), com ou sem a sigla da empresa.";

class EmployeeService {
  private model: ModelStatic<EmployeeModel> = EmployeeModel;

  /**
   * Monta a matrícula no formato da importação (sigla da empresa + 6 dígitos, T16).
   * @returns A matrícula, ou a resposta de erro (empresa inexistente/inativa ou formato inválido).
   */
  private async registrationFor(raw: unknown, companyId: string | undefined) {
    const company = companyId
      ? await CompanyModel.findOne({ where: { companyId, activated: true }, attributes: ["companyId", "companyAcronym"] })
      : null;
    if (!company) return { error: Response.badRequest("Empresa não encontrada ou inativa.") };
    const registration = buildRegistration(raw, company.companyAcronym);
    return registration ? { registration } : { error: Response.badRequest(INVALID_REGISTRATION) };
  }

  /** 409 se a matrícula já pertence a outro funcionário (ativo ou inativo); `null` se está livre. */
  private async registrationConflict(registration: string, exceptId?: string) {
    const existing = await this.model.findOne({ where: { registration } });
    if (!existing || existing.employeeId === exceptId) return null;
    return Response.conflict(
      existing.activated
        ? "Matrícula já cadastrado(a)."
        : `Matrícula já existe como registro inativo (id: ${existing.employeeId}). Reative-o em PATCH /employee/${existing.employeeId}/reactivate.`
    );
  }

  async createEmployee(data: EmployeeInterface, scope: string[] | null = null) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);
    if (!inCompanyScope(scope, data.fkCompanyId)) return Response.forbidden(OUT_OF_SCOPE);

    const built = await this.registrationFor(data.registration, data.fkCompanyId);
    if (built.error) return built.error;
    const conflict = await this.registrationConflict(built.registration);
    if (conflict) return conflict;
    const employedAt = (await activeEmploymentByPerson([data.fkPersonId], data.fkCompanyId as string)).get(data.fkPersonId);
    if (employedAt) return Response.conflict(activeEmploymentMessage(employedAt));

    await this.model.create({ ...data, registration: built.registration });
    return Response.created("Funcionário criado com sucesso!");
  }

  /**
   * Atualiza o funcionário. A empresa não muda pela edição (troca de empresa é demissão e
   * recontratação, T16/T20); a matrícula informada é remontada com a sigla da empresa atual.
   */
  async updateEmployee(id: string, data: Partial<EmployeeInterface>, scope: string[] | null = null) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const current = await this.model.findOne({ where: { employeeId: id, activated: true, ...scopeWhere(scope) } });
    if (!current) return Response.notFound("Funcionário não encontrado!");

    if (data.fkCompanyId && data.fkCompanyId !== current.fkCompanyId) {
      return Response.badRequest("A empresa do funcionário não muda pela edição: troca de empresa é demissão e recontratação.");
    }

    if (data.registration !== undefined) {
      const built = await this.registrationFor(data.registration, current.fkCompanyId);
      if (built.error) return built.error;
      const conflict = await this.registrationConflict(built.registration, id);
      if (conflict) return conflict;
      data.registration = built.registration;
    }

    const [updated] = await this.model.update(data, { where: { employeeId: id, activated: true } });

    if (!updated) return Response.notFound("Funcionário não encontrado!");

    const result = await this.model.findOne({
      where: { employeeId: id, activated: true },
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false },
        { model: CompanyModel, as: 'Company', where: { activated: true }, required: false },
        { model: PositionModel, as: 'Position', where: { activated: true }, required: false },
        { model: SectorModel, as: 'Sector', where: { activated: true }, required: false },
        { model: DepartmentModel, as: 'Department', where: { activated: true }, required: false }
      ],
    });

    return Response.ok("Funcionário atualizado com sucesso!", result);
  }

  /**
   * Demissão (T20, `04` §6.2): grava a rescisão, desativa o funcionário e pede ao `control`
   * que desative os usuários dele. Sem atomicidade entre módulos: se o `control` falhar,
   * o funcionário continua desativado e a resposta lista o pendente (o login já o recusa).
   * @param id Funcionário.
   * @param updatedBy Usuário autenticado que executa a operação.
   * @param terminationDate Data de rescisão `AAAA-MM-DD` (padrão: hoje em Brasília); entre a admissão e amanhã.
   * @returns 200 com `{ deactivatedUsers, pendingEmployeeIds }`; 400 data inválida; 404 inexistente ou inativo.
   */
  async deleteEmployee(id: string, updatedBy: string, terminationDate?: string, scope: string[] | null = null) {
    if (!id) return Response.badRequest("ID não informado");
    const parsed = parseTerminationDate(terminationDate);
    if ("error" in parsed) return Response.badRequest(parsed.error);
    const { date } = parsed;

    const current = await this.model.findOne({ where: { employeeId: id, activated: true, ...scopeWhere(scope) }, attributes: ["employeeId", "admissionDate"] });
    if (!current) return Response.notFound("Funcionário não encontrado!");
    if (!admittedBy(current.admissionDate, date)) {
      return Response.badRequest("A data de rescisão não pode ser anterior à admissão.");
    }

    const [updated] = await this.model.update(
      { activated: false, terminationDate: date, updatedBy, updatedAt: new Date() },
      { where: { employeeId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Funcionário não encontrado!");

    return this.deactivateUsers([id], updatedBy, {
      ok: "Funcionário desligado com sucesso!",
      pending: "Funcionário desligado, mas o usuário dele não foi desativado (módulo de controle indisponível). Desative o usuário manualmente.",
    });
  }

  /**
   * Demissão em lote (T19, lista "fora da planilha"): tudo ou nada, numa transação. Mesma regra de
   * data do desligamento avulso; depois do commit, pede ao `control` que desative os usuários.
   * @param ids Funcionários (1–5000).
   * @param updatedBy Usuário autenticado que executa a operação.
   * @param terminationDate Data de rescisão `AAAA-MM-DD` para todos (padrão: hoje em Brasília).
   * @returns 200 com `{ deactivated, deactivatedUsers, pendingEmployeeIds }`; 409 `{ ids }` inexistentes ou
   *   inativos; 400 `{ ids }` com admissão posterior à data, ou entrada inválida. Nos erros, nada é gravado.
   */
  async bulkDeactivate(ids: unknown, updatedBy: string, terminationDate?: unknown, scope: string[] | null = null) {
    const parsedIds = parseIdList(ids, MAX_DEACTIVATE_IDS);
    if ("error" in parsedIds) return Response.badRequest(parsedIds.error);
    const parsedDate = parseTerminationDate(terminationDate == null ? undefined : String(terminationDate));
    if ("error" in parsedDate) return Response.badRequest(parsedDate.error);
    const { date } = parsedDate;

    const transaction = await db.transaction();
    try {
      const where = { employeeId: { [Op.in]: parsedIds.ids }, activated: true, ...scopeWhere(scope) };
      const found = await this.model.findAll({ where, attributes: ["employeeId", "admissionDate"], lock: true, transaction });
      const foundIds = new Set(found.map(e => e.employeeId));
      const missing = parsedIds.ids.filter(id => !foundIds.has(id));
      if (missing.length) {
        await transaction.rollback();
        return Response.conflict(`Nada foi desligado: ${missing.length} funcionário(s) não encontrado(s) ou já inativo(s).`, { ids: missing });
      }
      const early = found.filter(e => !admittedBy(e.admissionDate, date)).map(e => e.employeeId);
      if (early.length) {
        await transaction.rollback();
        return { ...Response.badRequest(`Nada foi desligado: a data de rescisão é anterior à admissão de ${early.length} funcionário(s).`), data: { ids: early } };
      }

      await this.model.update({ activated: false, terminationDate: date, updatedBy, updatedAt: new Date() }, { where, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const count = parsedIds.ids.length;
    return this.deactivateUsers(parsedIds.ids, updatedBy, {
      ok: `${count} funcionário(s) desligado(s).`,
      pending: `${count} funcionário(s) desligado(s), mas os usuários deles não foram desativados (módulo de controle indisponível). Desative-os manualmente.`,
    }, { deactivated: count });
  }

  /** Pede ao `control` a desativação dos usuários; se ele falhar, os funcionários vão em `pendingEmployeeIds` (o login já os recusa). */
  private async deactivateUsers(ids: string[], updatedBy: string, messages: { ok: string; pending: string }, extra = {}) {
    try {
      const deactivatedUsers = await deactivateUsersByEmployee(ids, updatedBy);
      return Response.ok(messages.ok, { ...extra, deactivatedUsers, pendingEmployeeIds: [] as string[] });
    } catch (error) {
      if (!(error instanceof ControlUnavailableError)) throw error;
      return Response.ok(messages.pending, { ...extra, deactivatedUsers: [] as string[], pendingEmployeeIds: ids });
    }
  }

  /**
   * Reativa um registro desativado (`activated = true`) e limpa a `terminationDate`: reativar
   * desfaz um desligamento indevido; recontratação é um novo registro (T17, decisão 2).
   * Recusa (409) se a pessoa já tem outro funcionário ativo (`04` §6.2, regra 2).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateEmployee(id: string, updatedBy: string, scope: string[] | null = null) {
    if (!id) return Response.badRequest("ID não informado");

    const target = await this.model.findOne({ where: { employeeId: id, activated: false, ...scopeWhere(scope) }, attributes: ["employeeId", "fkPersonId", "fkCompanyId"] });
    if (!target) return Response.notFound("Funcionário não encontrado ou já ativo!");
    const employedAt = (await activeEmploymentByPerson([target.fkPersonId], target.fkCompanyId as string)).get(target.fkPersonId);
    if (employedAt) return Response.conflict(activeEmploymentMessage(employedAt));

    const [updated] = await this.model.update(
      { activated: true, terminationDate: null, updatedBy, updatedAt: new Date() }, // desfaz o desligamento (T17, decisão 2)
      { where: { employeeId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Funcionário não encontrado ou já ativo!");

    return Response.ok("Funcionário reativado com sucesso!");
  }

  async getEmployee(id: string, scope: string[] | null = null) {
    if (!id) return Response.badRequest("ID do funcionário não informado.");

    const result = await this.model.findOne({
      where: { employeeId: id, activated: true, ...scopeWhere(scope) },
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false },
        { model: CompanyModel, as: 'Company', where: { activated: true }, required: false },
        { model: PositionModel, as: 'Position', where: { activated: true }, required: false },
        { model: SectorModel, as: 'Sector', where: { activated: true }, required: false },
        { model: DepartmentModel, as: 'Department', where: { activated: true }, required: false }
      ],
    });

    if (!result) return Response.notFound("Funcionário não encontrado!");
    return Response.ok("Funcionário encontrado!", result);
  }

  async findEmployees(query: Partial<EmployeeInterface> & ListQuery, scope: string[] | null = null) {
    const { error } = joi.object({ fkPersonId: joi.string().uuid(), fkCompanyId: joi.string().uuid() })
      .unknown(true).validate(query);
    if (error) return Response.badRequest(error.message);

    const where: any = { ...activeWhere(query) };

    if (query.registration) {
      where.registration = { [Op.iLike]: `%${query.registration}%` };
    }

    if (query.fkPersonId) {
      where.fkPersonId = query.fkPersonId;
    }

    if (query.fkCompanyId && !inCompanyScope(scope, query.fkCompanyId)) return Response.forbidden(OUT_OF_SCOPE);
    Object.assign(where, scopeWhere(scope));

    if (query.fkCompanyId) {
      where.fkCompanyId = query.fkCompanyId;
    }

    const result = await this.model.findAll({
      where,
      include: [
        { model: PersonModel, as: 'Person', where: activeWhere(query), required: false },
        { model: CompanyModel, as: 'Company', where: activeWhere(query), required: false },
        { model: PositionModel, as: 'Position', where: activeWhere(query), required: false },
        { model: SectorModel, as: 'Sector', where: activeWhere(query), required: false },
        { model: DepartmentModel, as: 'Department', where: activeWhere(query), required: false }
      ],
    });

    if (!result.length) {
      return Response.notFound("Nenhum funcionário encontrado.");
    }

    return Response.ok("Funcionários encontrados com sucesso", result);
  }

  /**
   * Importa funcionários em lote (T09): valida tudo, grava numa única transação e devolve
   * relatório por item. Ver `EmployeeBulkService`.
   * @param payload Empresa, usuário (do token) e lista de funcionários.
   * @param options `dryRun`: só valida, sem gravar.
   * @param scope Empresas visíveis (T18); empresa fora → 403.
   */
  async bulkInsert(payload: { companyId?: unknown; userId?: unknown; employees?: unknown }, options: ImportOptions = {}, scope: string[] | null = null) {
    if (typeof payload.companyId === "string" && !inCompanyScope(scope, payload.companyId)) return Response.forbidden(OUT_OF_SCOPE);
    return new EmployeeBulkService().importEmployees(payload, options);
  }
}

export default EmployeeService;
