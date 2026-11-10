import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";
import { CompanyModel } from "../database/models";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { CorporationModel } from "../database/models";
import CorporationInterface from "../database/interfaces/CorporationInterface";

class CorporationService {
  private model: ModelStatic<CorporationModel> = CorporationModel;

  async createCorporation(data: CorporationInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.CorporationValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Organização criada com sucesso!");
  }

  async updateCorporation(id: string, data: Partial<CorporationInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.CorporationValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { corporationId: id, activated: true } });
    if (!updated) return Response.notFound("Organização não encontrada!");

    const result = await this.model.findOne({ where: { corporationId: id, activated: true } });
    return Response.ok("Organização atualizada com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deleteCorporation(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    if (await CompanyModel.count({ where: { fkCorporationId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: a corporação possui empresas ativas.");
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { corporationId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Organização não encontrada!");

    return Response.ok("Organização desativada com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateCorporation(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { corporationId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Organização não encontrada ou já ativa!");

    return Response.ok("Organização reativada com sucesso!");
  }

  async getCorporation(id: string) {
    if (!id) return Response.badRequest("ID da organização não informado.");

    const result = await this.model.findOne({ where: { corporationId: id, activated: true } });
    if (!result) return Response.notFound("Organização não encontrada!");

    return Response.ok("Organização encontrada!", result);
  }

  async findCorporations(query: {
    corporationName?: string;
    corporationCode?: string;
    corporationAcronym?: string;
  }) {
    const where: any = { activated: true };

    if (query.corporationName) {
      where.corporationName = { [Op.iLike]: `%${query.corporationName}%` };
    }

    if (query.corporationCode) {
      where.corporationCode = { [Op.iLike]: `%${query.corporationCode}%` };
    }

    if (query.corporationAcronym) {
      where.corporationAcronym = { [Op.iLike]: `%${query.corporationAcronym}%` };
    }

    const result = await this.model.findAll({ where });

    if (!result.length) {
      return Response.notFound("Nenhuma organização encontrada com os filtros fornecidos.");
    }

    return Response.ok("Organizações encontradas com sucesso", result);
  }
}

export default CorporationService;
