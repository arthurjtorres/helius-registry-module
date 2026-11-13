import { ModelStatic, Op } from "sequelize";

import Response from "../utils/Response";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { EmployeeModel, PersonModel, CompanyModel, PositionModel, SectorModel, DepartmentModel, DocumentModel } from "../database/models";
import EmployeeInterface from "../database/interfaces/EmployeeInterface";

import EmployeeBulkService, { ImportOptions } from "./EmployeeBulkService";
import { hasActiveUserForEmployee, ControlUnavailableError } from "./integrations/UserService";

class EmployeeService {
  private model: ModelStatic<EmployeeModel> = EmployeeModel;

  async createEmployee(data: EmployeeInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const existing = await this.model.findOne({ where: { registration: data.registration } });
    if (existing) {
      return Response.conflict(
        existing.activated
          ? "Matrícula já cadastrado(a)."
          : `Matrícula já existe como registro inativo (id: ${existing.employeeId}). Reative-o em PATCH /employee/${existing.employeeId}/reactivate.`
      );
    }

    await this.model.create({ ...data });
    return Response.created("Funcionário criado com sucesso!");
  }

  async updateEmployee(id: string, data: Partial<EmployeeInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.EmployeeValidation.validate(data);
    if (error) return Response.badRequest(error.message);

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
    const where: any = { activated: true };

    if (query.registration) {
      where.registration = { [Op.iLike]: `%${query.registration}%` };
    }

    if (query.fkPersonId) {
      where.fkEmployeePersonId = query.fkPersonId;
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
