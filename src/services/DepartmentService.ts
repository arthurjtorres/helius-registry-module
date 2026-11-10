import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";
import { EmployeeModel } from "../database/models";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { DepartmentModel } from "../database/models";
import DepartmentInterface from "../database/interfaces/DepartmentInterface";

class DepartmentService {
  private model: ModelStatic<DepartmentModel> = DepartmentModel;

  async createDepartment(data: DepartmentInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.DepartmentValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Departamento criado com sucesso!");
  }

  async updateDepartment(id: string, data: Partial<DepartmentInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.DepartmentValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { departmentId: id, activated: true } });
    if (!updated) return Response.notFound("Departamento não encontrado!");

    const result = await this.model.findOne({ where: { departmentId: id, activated: true } });
    return Response.ok("Departamento atualizado com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deleteDepartment(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    if (await EmployeeModel.count({ where: { fkDepartmentId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: o departamento possui funcionários ativos.");
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { departmentId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Departamento não encontrado!");

    return Response.ok("Departamento desativado com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateDepartment(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { departmentId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Departamento não encontrado ou já ativo!");

    return Response.ok("Departamento reativado com sucesso!");
  }

  async getDepartment(id: string) {
    if (!id) return Response.badRequest("ID do departamento não informado.");

    const result = await this.model.findOne({ where: { departmentId: id, activated: true } });
    if (!result) return Response.notFound("Departamento não encontrado!");

    return Response.ok("Departamento encontrado!", result);
  }

  async findDepartments(query: {
    departmentName?: string;
    departmentAlias?: string;
    departmentIndex?: number;
  }) {
    const where: any = { activated: true };

    if (query.departmentName) {
      where.departmentName = { [Op.iLike]: `%${query.departmentName}%` };
    }

    if (query.departmentAlias) {
      where.departmentAlias = { [Op.iLike]: `%${query.departmentAlias}%` };
    }

    if (query.departmentIndex) {
      where.departmentIndex = query.departmentIndex;
    }

    const result = await this.model.findAll({ where });

    if (!result.length) {
      return Response.notFound("Nenhum departamento encontrado com os filtros fornecidos.");
    }

    return Response.ok("Departamentos encontrados com sucesso", result);
  }
}

export default DepartmentService;
