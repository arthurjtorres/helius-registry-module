import { ModelStatic, Op } from "sequelize";
import CompanyGroupModel from "../database/models/CompanyGroupModel";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";
import Response from "../utils/Response";
import CompanyGroupInterface from "../database/interfaces/CompanyGroupInterface";

class CompanyGroupService {
  private model: ModelStatic<CompanyGroupModel> = CompanyGroupModel;

  async createCompanyGroup(data: CompanyGroupInterface) {
    data.createdAt = new Date();
     
    const { error } = CreateValidationSchema.CompanyGroupValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Grupo criado com sucesso!");
  }

  async updateCompanyGroup(groupId: string, data: Partial<CompanyGroupInterface>) {
    data.updatedAt = new Date();
    if (!groupId) return Response.badRequest("ID não informado");

    const { error } = UpdateValidationSchema.UpdateValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { groupId } });
    if (!updated) return Response.notFound("Grupo não encontrado!");

    const result = await this.model.findByPk(groupId);
    return Response.ok("Grupo atualizado com sucesso!", result);
  }

  async deleteCompanyGroup(id: string) {
    const deleted = await this.model.destroy({ where: { groupId: id } });
    if (!deleted) return Response.notFound("Grupo não encontrado!");

    return Response.ok("Grupo deletado com sucesso!");
  }

  async getCompanyGroup(id: string) {
    if (!id) return Response.badRequest("ID do grupo não informado.");

    const result = await this.model.findByPk(id);
    if (!result) return Response.notFound("Grupo não encontrado!");

    return Response.ok("Grupo encontrado!", result);
  }

  async findCompanyGroups(query: { groupName?: string }) {
    const where: any = {};

    if (query.groupName) {
      where.groupName = { [Op.iLike]: `%${query.groupName}%` };
    }

    const result = await this.model.findAll({ where });

    if (!result.length) {
      return Response.notFound("Nenhum grupo encontrado com os filtros fornecidos.");
    }

    return Response.ok("Grupos encontrados com sucesso", result);
  }
}

export default CompanyGroupService;
