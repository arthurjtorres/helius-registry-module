import { ModelStatic, Op } from "sequelize";
import PositionModel from "../database/models/PositionModel";
import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";
import Response from "../utils/Response";
import PositionInterface from "../database/interfaces/PositionInterface";

class PositionService {
  private model: ModelStatic<PositionModel> = PositionModel;

  async createPosition(data: PositionInterface) {
    data.createdAt = new Date();
    data.updatedAt = undefined;
    const { error } = CreateValidationSchema.PositionValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Cargo criado com sucesso!");
  }

  async updatePosition(positionId: string, data: Partial<PositionInterface>) {
    data.updatedAt = new Date();
    if (!positionId) return Response.badRequest("ID não informado");

    const { error } = UpdateValidationSchema.UpdateValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { positionId} });
    if (!updated) return Response.notFound("Cargo não encontrado!");

    const result = await this.model.findByPk(positionId);

    return Response.ok("Cargo atualizado com sucesso!", result);
  }

  async deletePosition(id: string) {
    const deleted = await this.model.destroy({ where: { positionId: id } });
    if (!deleted) return Response.notFound("Cargo não encontrado!");

    return Response.ok("Cargo deletado com sucesso!");
  }

  async getPosition(id: string) {
    if (!id) return Response.badRequest("ID do cargo não informado.");

    const result = await this.model.findByPk(id);

    if (!result) return Response.notFound("Cargo não encontrado!");
    return Response.ok("Cargo encontrado!", result);
  }

  async findPositions(query: {
    positionName?: string;
    positionCode?: number;
    fkSectorId?: string;
    fkDepartmentId?:string;
  }) {
    const where: any = {};

    if (query.positionName) {
      where.positionName = { [Op.iLike]: `%${query.positionName}%` };
    }

    if (query.positionCode) {
      where.positionCode = query.positionCode;
    }

    if (query.fkSectorId) {
      where.fkSectorId = query.fkSectorId;
    }

    if (query.fkDepartmentId) {
      where.fkDepartmentId = query.fkDepartmentId;
    }

    const result = await this.model.findAll({
      where
    });

    if (!result.length) {
      return Response.notFound("Nenhum cargo encontrado com os filtros fornecidos.");
    }

    return Response.ok("Cargos encontrados com sucesso", result);
  }
}

export default PositionService;
