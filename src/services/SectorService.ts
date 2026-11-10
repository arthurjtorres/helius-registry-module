import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";
import { EmployeeModel } from "../database/models";

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

    const [updated] = await this.model.update(data, { where: { sectorId: id, activated: true } });
    if (!updated) return Response.notFound("Setor não encontrado!");

    const result = await this.model.findOne({ where: { sectorId: id, activated: true } });

    return Response.ok("Setor atualizado com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deleteSector(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    if (await EmployeeModel.count({ where: { fkSectorId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: o setor possui funcionários ativos.");
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { sectorId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Setor não encontrado!");

    return Response.ok("Setor desativado com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateSector(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { sectorId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Setor não encontrado ou já ativo!");

    return Response.ok("Setor reativado com sucesso!");
  }

  async getSector(id: string) {
    if (!id) return Response.badRequest("ID do setor não informado.");

    const result = await this.model.findOne({ where: { sectorId: id, activated: true } });

    if (!result) return Response.notFound("Setor não encontrado!");
    return Response.ok("Setor encontrado!", result);
  }

  async findSectors(query: {
    sectorName?: string;
    sectorAlias?: string;
    sectorIndex?: number;
  }) {
    const where: any = { activated: true };

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
