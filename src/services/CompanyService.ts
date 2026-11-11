import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";
import { EmployeeModel } from "../database/models";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { CompanyModel, CorporationModel, CompanyGroupModel } from "../database/models";
import CompanyInterface from "../database/interfaces/CompanyInterface";
import { parseIdList } from "../utils/IdList";

class CompanyService {
  private model: ModelStatic<CompanyModel> = CompanyModel;

  async createCompany(data: CompanyInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.CompanyValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const existing = await this.model.findOne({ where: { companyAcronym: data.companyAcronym } });
    if (existing) {
      return Response.conflict(
        existing.activated
          ? "Sigla da empresa já cadastrado(a)."
          : `Sigla da empresa já existe como registro inativo (id: ${existing.companyId}). Reative-o em PATCH /company/${existing.companyId}/reactivate.`
      );
    }

    await this.model.create({ ...data });
    return Response.created("Empresa criada com sucesso!");
  }

  async updateCompany(id: string, data: Partial<CompanyInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.CompanyValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { companyId: id, activated: true } });
    if (!updated) return Response.notFound("Empresa não encontrada!");

    const result = await this.model.findOne({
      where: { companyId: id, activated: true },
      include: [
        { model: CorporationModel, as: 'Corporation', where: { activated: true }, required: false },
        { model: CompanyGroupModel, as: 'CompanyGroup', where: { activated: true }, required: false }
      ],
    });

    return Response.ok("Empresa atualizada com sucesso!", result);
  }

  /**
   * Desativa o registro (exclusão lógica): `activated = false`.
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async deleteCompany(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    if (await EmployeeModel.count({ where: { fkCompanyId: id, activated: true } }) > 0) {
      return Response.conflict("Não é possível desativar: a empresa possui funcionários ativos.");
    }

    const [updated] = await this.model.update(
      { activated: false, updatedBy, updatedAt: new Date() },
      { where: { companyId: id, activated: true } }
    );
    if (!updated) return Response.notFound("Empresa não encontrada!");

    return Response.ok("Empresa desativada com sucesso!");
  }

  /**
   * Reativa um registro desativado (`activated = true`).
   * @param id Identificador do registro.
   * @param updatedBy Usuário autenticado que executa a operação.
   */
  async reactivateCompany(id: string, updatedBy: string) {
    if (!id) return Response.badRequest("ID não informado");

    const [updated] = await this.model.update(
      { activated: true, updatedBy, updatedAt: new Date() },
      { where: { companyId: id, activated: false } }
    );
    if (!updated) return Response.notFound("Empresa não encontrada ou já ativa!");

    return Response.ok("Empresa reativada com sucesso!");
  }

  async getCompany(id: string) {
    if (!id) return Response.badRequest("ID da empresa não informado.");

    const result = await this.model.findOne({
      where: { companyId: id, activated: true },
      include: [
        { model: CorporationModel, as: 'Corporation', where: { activated: true }, required: false },
        { model: CompanyGroupModel, as: 'CompanyGroup', where: { activated: true }, required: false }
      ],
    });

    if (!result) return Response.notFound("Empresa não encontrada!");
    return Response.ok("Empresa encontrada!", result);
  }

  /**
   * Consulta empresas ativas por lista de IDs (usada por outros módulos, T09).
   * Responde 200 com a lista dos encontrados; IDs inexistentes ou inativos são omitidos
   * (lista vazia é resposta válida, não 404).
   * @param ids Lista de UUIDs no corpo da requisição (1 a 500).
   */
  async getCompaniesByIds(ids: unknown) {
    const parsed = parseIdList(ids);
    if ("error" in parsed) return Response.badRequest(parsed.error);

    const result = await this.model.findAll({
      where: { companyId: { [Op.in]: parsed.ids }, activated: true },
      include: [
        { model: CorporationModel, as: 'Corporation', where: { activated: true }, required: false },
        { model: CompanyGroupModel, as: 'CompanyGroup', where: { activated: true }, required: false }
      ],
    });

    return Response.ok("Empresas consultadas com sucesso.", result);
  }

  async findCompanies(query: {
    companyName?: string;
    companyAcronym?: string;
    companyCode?: string;
    fkCompanyCorporationId?: string;
    fkCompanyGroupId?: string;
  }) {
    const where: any = { activated: true };

    if (query.companyName) {
      where.companyName = { [Op.iLike]: `%${query.companyName}%` };
    }

    if (query.companyCode) {
      where.companyCode = { [Op.iLike]: `%${query.companyCode}%` };
    }

    if (query.companyAcronym) {
      where.companyAcronym = { [Op.iLike]: `%${query.companyAcronym}%` };
    }

    if (query.fkCompanyCorporationId) {
      where.fkCompanyCorporationId = query.fkCompanyCorporationId;
    }

    if (query.fkCompanyGroupId) {
      where.fkCompanyGroupId = query.fkCompanyGroupId;
    }

    const result = await this.model.findAll({
      where,
      include: [
        { model: CorporationModel, as: 'Corporation', where: { activated: true }, required: false },
        { model: CompanyGroupModel, as: 'CompanyGroup', where: { activated: true }, required: false }
      ],
    });

    if (!result.length) {
      return Response.notFound("Nenhuma empresa encontrada com os filtros fornecidos.");
    }

    return Response.ok("Empresas encontradas com sucesso", result);
  }
}

export default CompanyService;
