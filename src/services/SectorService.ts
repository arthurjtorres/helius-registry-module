import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { SectorModel } from "../database/models";
import SectorInterface from "../database/interfaces/SectorInterface";

class SectorService {
  private model: ModelStatic<SectorModel> = SectorModel;

  async createSector(data: SectorInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.SectorValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Setor criado com sucesso!");
  }

  async updateSector(id: string, data: Partial<SectorInterface>) {
    data.updatedAt = new Date();
    if (!id) return Response.badRequest("ID não informado");

    const { error } = UpdateValidationSchema.SectorValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { sectorId: id } });
    if (!updated) return Response.notFound("Setor não encontrado!");

    const result = await this.model.findByPk(id);

    return Response.ok("Setor atualizado com sucesso!", result);
  }

  async deleteSector(id: string) {
    const deleted = await this.model.destroy({ where: { sectorId: id } });
    if (!deleted) return Response.notFound("Setor não encontrado!");

    return Response.ok("Setor deletado com sucesso!");
  }

  async getSector(id: string) {
    if (!id) return Response.badRequest("ID do setor não informado.");

    const result = await this.model.findByPk(id);

    if (!result) return Response.notFound("Setor não encontrado!");
    return Response.ok("Setor encontrado!", result);
  }

  async findSectors(query: {
    sectorName?: string;
    sectorAlias?: string;
    sectorIndex?: number;
  }) {
    const where: any = {};

    if (query.sectorName) {
      where.sectorName = { [Op.iLike]: `%${query.sectorName}%` };
    }

    if (query.sectorAlias) {
      where.sectorAlias = { [Op.iLike]: `%${query.sectorAlias}%` };
    }

    if (query.sectorIndex) {
      where.sectorIndex = query.sectorIndex;
    }

    const result = await this.model.findAll({
      where,
    });

    if (!result.length) {
      return Response.notFound("Nenhum setor encontrado com os filtros fornecidos.");
    }

    return Response.ok("Setores encontrados com sucesso", result);
  }
}

export default SectorService;
