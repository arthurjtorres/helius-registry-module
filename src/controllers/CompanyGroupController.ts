import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import CompanyGroupService from "../services/CompanyGroupService";

class CompanyGroupController {
  private service = new CompanyGroupService();

  async createCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createCompanyGroup(data);

      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createCompanyGroup", error);
      const resp = Resp.internalError("Erro interno ao criar grupo.");
      return res.status(resp.status).json(resp);
    }
  }

  async updateCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateCompanyGroup(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updateCompanyGroup", error);
      const resp = Resp.internalError("Erro interno ao atualizar grupo.");
      return res.status(resp.status).json(resp);
    }
  }

  async deleteCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCompanyGroup(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deleteCompanyGroup", error);
      const resp = Resp.internalError("Erro interno ao deletar grupo.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivateCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivateCompanyGroup(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivateCompanyGroup", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getCompanyGroup(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getCompanyGroup", error);
      const resp = Resp.internalError("Erro interno ao buscar grupo.");
      return res.status(resp.status).json(resp);
    }
  }

  async findCompanyGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findCompanyGroups(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findCompanyGroups", error);
      const resp = Resp.internalError("Erro interno ao buscar grupos.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default CompanyGroupController;
