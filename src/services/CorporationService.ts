import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";

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

    const [updated] = await this.model.update(data, { where: { corporationId: id } });
    if (!updated) return Response.notFound("Organização não encontrada!");

    const result = await this.model.findByPk(id);
    return Response.ok("Organização atualizada com sucesso!", result);
  }

  async deleteCorporation(id: string) {
    const deleted = await this.model.destroy({ where: { corporationId: id } });
    if (!deleted) return Response.notFound("Organização não encontrada!");

    return Response.ok("Organização deletada com sucesso!");
  }

  async getCorporation(id: string) {
    if (!id) return Response.badRequest("ID da organização não informado.");

    const result = await this.model.findByPk(id);
    if (!result) return Response.notFound("Organização não encontrada!");

    return Response.ok("Organização encontrada!", result);
  }

  async findCorporations(query: {
    corporationName?: string;
    corporationCode?: string;
    corporationAcronym?: string;
  }) {
    const where: any = {};

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
