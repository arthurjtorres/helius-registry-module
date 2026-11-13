import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import CompanyService from "../services/CompanyService";

class CompanyController {
  private service = new CompanyService();

  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createCompany(data);

      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createCompany", error);
      const resp = Resp.internalError("Erro interno ao criar empresa.");
      return res.status(resp.status).json(resp);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateCompany(id, data);
      
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updateCompany", error);
      const resp = Resp.internalError("Erro interno ao atualizar empresa.");
      return res.status(resp.status).json(resp);
    }
  }

  async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCompany(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deleteCompany", error);
      const resp = Resp.internalError("Erro interno ao deletar empresa.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivateCompany(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivateCompany", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getCompany(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getCompany", error);
      const resp = Resp.internalError("Erro interno ao buscar empresa.");
      return res.status(resp.status).json(resp);
    }
  }

  /** POST /lookup — consulta empresas por lista de IDs (corpo `{ ids }`). */
  async lookupCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.getCompaniesByIds(req.body?.ids);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em lookupCompanies", error);
      const resp = Resp.internalError("Erro interno ao consultar empresas em lote.");
      return res.status(resp.status).json(resp);
    }
  }

  async findCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findCompanies(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findCompanies", error);
      const resp = Resp.internalError("Erro interno ao buscar empresas.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default CompanyController;
