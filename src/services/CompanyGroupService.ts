import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";
import { CompanyModel } from "../database/models";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { CompanyGroupModel } from "../database/models";
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

  async updateCompanyGroup(id: string, data: Partial<CompanyGroupInterface>) {
    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.CompanyGroupValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { groupId: id, activated: true } });
    if (!updated) return Response.notFound("Grupo não encontrado!");

    const result = await this.model.findOne({ where: { groupId: id, activated: true } });
    return Response.ok("Grupo atualizado com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deleteCompanyGroup(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    if (await CompanyModel.count({ where: { fkCompanyGroupId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: o grupo possui empresas ativas.");
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { groupId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Grupo não encontrado!");

    return Response.ok("Grupo desativado com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateCompanyGroup(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { groupId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Grupo não encontrado ou já ativo!");

    return Response.ok("Grupo reativado com sucesso!");
  }

  async getCompanyGroup(id: string) {
    if (!id) return Response.badRequest("ID do grupo não informado.");

    const result = await this.model.findOne({ where: { groupId: id, activated: true } });
    if (!result) return Response.notFound("Grupo não encontrado!");

    return Response.ok("Grupo encontrado!", result);
  }

  async findCompanyGroups(query: { groupName?: string }) {
    const where: any = { activated: true };

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
