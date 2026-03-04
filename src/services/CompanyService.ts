import { ModelStatic, Op } from "sequelize";
import Response from "../utils/Response";

import CreateValidationSchema from "./validations/CreateValidationSchema";
import UpdateValidationSchema from "./validations/UpdateValidationSchema";

import { CompanyModel, CorporationModel, CompanyGroupModel } from "../database/models";
import CompanyInterface from "../database/interfaces/CompanyInterface";

class CompanyService {
  private model: ModelStatic<CompanyModel> = CompanyModel;

  async createCompany(data: CompanyInterface) {
    data.createdAt = new Date();

    const { error } = CreateValidationSchema.CompanyValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    await this.model.create({ ...data });
    return Response.created("Empresa criada com sucesso!");
  }

  async updateCompany(id: string, data: Partial<CompanyInterface>) {

    if (!id) return Response.badRequest("ID não informado");
    data.updatedAt = new Date();

    const { error } = UpdateValidationSchema.CompanyValidation.validate(data);
    if (error) return Response.badRequest(error.message);

    const [updated] = await this.model.update(data, { where: { companyId: id } });
    if (!updated) return Response.notFound("Empresa não encontrada!");

    const result = await this.model.findByPk(id, {
      include: [
        { model: CorporationModel, as: 'Corporation' },
        { model: CompanyGroupModel, as: 'CompanyGroup' }
      ],
    });

    return Response.ok("Empresa atualizada com sucesso!", result);
  }

  async deleteCompany(id: string) {
    const deleted = await this.model.destroy({ where: { companyId: id } });
    if (!deleted) return Response.notFound("Empresa não encontrada!");

    return Response.ok("Empresa deletada com sucesso!");
  }

  async getCompany(id: string) {
    if (!id) return Response.badRequest("ID da empresa não informado.");

    const result = await this.model.findByPk(id, {
      include: [
        { model: CorporationModel, as: 'Corporation' },
        { model: CompanyGroupModel, as: 'CompanyGroup' }
      ],
    });

    if (!result) return Response.notFound("Empresa não encontrada!");
    return Response.ok("Empresa encontrada!", result);
  }

  async findCompanies(query: {
    companyName?: string;
    companyAcronym?: string;
    companyCode?: string;
    fkCompanyCorporationId?: string;
    fkCompanyGroupId?: string;
  }) {
    const where: any = {};

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
        { model: CorporationModel, as: 'Corporation' },
        { model: CompanyGroupModel, as: 'CompanyGroup' }
      ],
    });

    if (!result.length) {
      return Response.notFound("Nenhuma empresa encontrada com os filtros fornecidos.");
    }

    return Response.ok("Empresas encontradas com sucesso", result);
  }
}

export default CompanyService;
