import { ModelStatic, Op } from "sequelize";
import SectorModel from "../database/models/SectorModel";
import DepartmentModel from "../database/models/DepartmentModel";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";
import Response from "../utils/Response";
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

  async updateSector(sectorId: string, data: Partial<SectorInterface>) {
    data.updatedAt = new Date();
    if (!sectorId) return Response.badRequest("ID não informado");

    const { error } = UpdateValidationSchema.UpdateValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { sectorId } });
    if (!updated) return Response.notFound("Setor não encontrado!");

    const result = await this.model.findByPk(sectorId, {
      include: [DepartmentModel],
    });

    return Response.ok("Setor atualizado com sucesso!", result);
  }

  async deleteSector(id: string) {
    const deleted = await this.model.destroy({ where: { sectorId: id } });
    if (!deleted) return Response.notFound("Setor não encontrado!");

    return Response.ok("Setor deletado com sucesso!");
  }

  async getSector(id: string) {
    if (!id) return Response.badRequest("ID do setor não informado.");

    const result = await this.model.findByPk(id, {
      include: [DepartmentModel],
    });

    if (!result) return Response.notFound("Setor não encontrado!");
    return Response.ok("Setor encontrado!", result);
  }

  async findSectors(query: {
    sectorName?: string;
    sectorAlias?: string;
    sectorIndex?: number;
    //fkSectorDepartmentId?: string;
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

    /*if (query.fkSectorDepartmentId) {
      where.fkSectorDepartmentId = query.fkSectorDepartmentId;
    }*/

    const result = await this.model.findAll({
      where,
      //include: [DepartmentModel],
    });

    if (!result.length) {
      return Response.notFound("Nenhum setor encontrado com os filtros fornecidos.");
    }

    return Response.ok("Setores encontrados com sucesso", result);
  }
}

export default SectorService;
