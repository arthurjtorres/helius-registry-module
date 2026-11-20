import { ModelStatic, Op } from "sequelize";
import joi from "joi";

import Response from "../utils/Response";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { EmployeeModel, PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel, DocumentModel } from "../database/models";
import EmployeeInterface from "../database/interfaces/EmployeeInterface";

import EmployeeBulkService, { ImportOptions } from "./EmployeeBulkService";
import { buildRegistration } from "../utils/EmployeeImport";
import { hasActiveUserForEmployee, ControlUnavailableError } from "./integrations/UserService";

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

  async createEmployee(data: EmployeeInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const built = await this.registrationFor(data.registration, data.fkCompanyId);
    if (built.error) return built.error;
    const conflict = await this.registrationConflict(built.registration);
    if (conflict) return conflict;

    await this.model.create({ ...data, registration: built.registration });
    return Response.created("Funcionário criado com sucesso!");
  }

  /**
   * Atualiza o funcionário. A empresa não muda pela edição (troca de empresa é demissão e
   * recontratação, T16/T20); a matrícula informada é remontada com a sigla da empresa atual.
   */
  async updateEmployee(id: string, data: Partial<EmployeeInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const current = await this.model.findOne({ where: { employeeId: id, activated: true } });
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
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   * @param authorization Header `Authorization` original, repassado ao `control`.
   * @returns 409 se houver usuário ativo no `control`; 503 se o `control` não puder ser consultado.
   */
  async deleteEmployee(id: string, updatedBy: string, authorization: string) {
    if (!id) return Response.badRequest("ID não informado");

    try {
      if (await hasActiveUserForEmployee(id, authorization)) {
        return Response.conflict("Não é possível desativar: o funcionário possui usuário ativo.");
      }
    } catch (error) {
      if (error instanceof ControlUnavailableError) {
        return Response.unavailable("Não foi possível verificar usuários do funcionário. Tente novamente.");
      }
      throw error;
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { employeeId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Funcionário não encontrado!");

    return Response.ok("Funcionário desativado com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateEmployee(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { employeeId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Funcionário não encontrado ou já ativo!");

    return Response.ok("Funcionário reativado com sucesso!");
  }

  async getEmployee(id: string) {
    if (!id) return Response.badRequest("ID do funcionário não informado.");

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

    if (!result) return Response.notFound("Funcionário não encontrado!");
    return Response.ok("Funcionário encontrado!", result);
  }

  async findEmployees(query: Partial<EmployeeInterface>) {
    const { error } = joi.object({ fkPersonId: joi.string().uuid(), fkCompanyId: joi.string().uuid() })
      .unknown(true).validate(query);
    if (error) return Response.badRequest(error.message);

    const where: any = { activated: true };

    if (query.registration) {
      where.registration = { [Op.iLike]: `%${query.registration}%` };
    }

    if (query.fkPersonId) {
      where.fkPersonId = query.fkPersonId;
    }

    if (query.fkCompanyId) {
      where.fkCompanyId = query.fkCompanyId;
    }

    const result = await this.model.findAll({
      where,
      include: [
        { model: PersonModel, as: 'Person', where: { activated: true }, required: false },
        { model: CompanyModel, as: 'Company', where: { activated: true }, required: false },
        { model: PositionModel, as: 'Position', where: { activated: true }, required: false },
        { model: SectorModel, as: 'Sector', where: { activated: true }, required: false },
        { model: DepartmentModel, as: 'Department', where: { activated: true }, required: false }
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
   */
  async bulkInsert(payload: { companyId?: unknown; userId?: unknown; employees?: unknown }, options: ImportOptions = {}) {
    return new EmployeeBulkService().importEmployees(payload, options);
  }
}

export default EmployeeService;
