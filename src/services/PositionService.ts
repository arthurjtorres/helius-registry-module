import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";
import { EmployeeModel } from "../database/models";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { PositionModel } from "../database/models";
import PositionInterface from "../database/interfaces/PositionInterface";

class PositionService {
  private model: ModelStatic<PositionModel> = PositionModel;

  async createPosition(data: PositionInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.PositionValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Cargo criado com sucesso!");
  }

  async updatePosition(id: string, data: Partial<PositionInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.PositionValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { positionId: id, activated: true } });
    if (!updated) return Response.notFound("Cargo não encontrado!");

    const result = await this.model.findOne({ where: { positionId: id, activated: true } });

    return Response.ok("Cargo atualizado com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deletePosition(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    if (await EmployeeModel.count({ where: { fkPositionId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: o cargo possui funcionários ativos.");
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { positionId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Cargo não encontrado!");

    return Response.ok("Cargo desativado com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivatePosition(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { positionId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Cargo não encontrado ou já ativo!");

    return Response.ok("Cargo reativado com sucesso!");
  }

  async getPosition(id: string) {
    if (!id) return Response.badRequest("ID do cargo não informado.");

    const result = await this.model.findOne({ where: { positionId: id, activated: true } });

    if (!result) return Response.notFound("Cargo não encontrado!");
    return Response.ok("Cargo encontrado!", result);
  }

  async findPositions(query: {
    positionName?: string;
    positionCode?: number;
    fkSectorId?: string;
    fkDepartmentId?: string;
  }) {
    const where: any = { activated: true };

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
