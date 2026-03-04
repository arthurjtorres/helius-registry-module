import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";

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

    const [updated] = await this.model.update(data, { where: { departmentId: id } });
    if (!updated) return Response.notFound("Departamento não encontrado!");

    const result = await this.model.findByPk(id);
    return Response.ok("Departamento atualizado com sucesso!", result);
  }

  async deleteDepartment(id: string) {
    const deleted = await this.model.destroy({ where: { departmentId: id } });
    if (!deleted) return Response.notFound("Departamento não encontrado!");

    return Response.ok("Departamento deletado com sucesso!");
  }

  async getDepartment(id: string) {
    if (!id) return Response.badRequest("ID do departamento não informado.");

    const result = await this.model.findByPk(id);
    if (!result) return Response.notFound("Departamento não encontrado!");

    return Response.ok("Departamento encontrado!", result);
  }

  async findDepartments(query: {
    departmentName?: string;
    departmentAlias?: string;
    departmentIndex?: number;
  }) {
    const where: any = {};

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
