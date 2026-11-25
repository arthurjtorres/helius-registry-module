import { ModelStatic, Op, WhereAttributeHash } from "sequelize";
import { ListQuery, activeWhere } from "../utils/ActiveFilter";
import Response from "../utils/Response";
import { EmployeeModel } from "../database/models";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { PositionModel } from "../database/models";
import PositionInterface from "../database/interfaces/PositionInterface";
import { normalizeText } from "../utils/EmployeeImport";

class PositionService {
  private model: ModelStatic<PositionModel> = PositionModel;

  /**
   * Verifica se já existe outro cargo com o mesmo nome normalizado (sem acento, caixa ou espaços extras),
   * que tornaria a importação de funcionários ambígua. Ativo tem prioridade; se só houver inativo, a
   * resposta traz o id para reativação. O banco não tem unique no nome.
   *
   * @param name Nome informado.
   * @param excludeId Cargo a ignorar (o próprio, no `PUT`).
   * @returns Resposta de conflito (409) ou `null` se o nome estiver livre.
   */
  private async findNameConflict(name: string, excludeId?: string) {
    const key = normalizeText(name);
    // shortcut: compara em memória (tabela pequena); se os cargos passarem de alguns milhares, mover para o banco (unaccent)
    const same = (await this.model.findAll({ attributes: ["positionId", "positionName", "activated"] }))
      .filter(p => p.positionId !== excludeId && normalizeText(p.positionName) === key);
    if (same.some(p => p.activated)) return Response.conflict("Já existe um cargo com este nome.");
    if (same.length) {
      const id = same[0].positionId;
      return Response.conflict(`Já existe um cargo inativo com este nome (id: ${id}). Reative-o em PATCH /position/${id}/reactivate.`, { id });
    }
    return null;
  }

  async createPosition(data: PositionInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.PositionValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const conflict = await this.findNameConflict(data.positionName);
    if (conflict) return conflict;

    await this.model.create({ ...data });
    return Response.created("Cargo criado com sucesso!");
  }

  async updatePosition(id: string, data: Partial<PositionInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.PositionValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    if (data.positionName) {
      const conflict = await this.findNameConflict(data.positionName, id);
      if (conflict) return conflict;
    }

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
  } & ListQuery) {
    const where: WhereAttributeHash = { ...activeWhere(query) };

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
