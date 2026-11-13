import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import CorporationService from "../services/CorporationService";

class CorporationController {
  private service = new CorporationService();

  async createCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createCorporation(data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createCorporation", error);
      const resp = Resp.internalError("Erro interno ao criar organização.");
      return res.status(resp.status).json(resp);
    }
  }

  async updateCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateCorporation(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updateCorporation", error);
      const resp = Resp.internalError("Erro interno ao atualizar organização.");
      return res.status(resp.status).json(resp);
    }
  }

  async deleteCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCorporation(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deleteCorporation", error);
      const resp = Resp.internalError("Erro interno ao deletar organização.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivateCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivateCorporation(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivateCorporation", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getCorporation(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getCorporation", error);
      const resp = Resp.internalError("Erro interno ao buscar organização.");
      return res.status(resp.status).json(resp);
    }
  }

  async findCorporations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findCorporations(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findCorporations", error);
      const resp = Resp.internalError("Erro interno ao buscar organizações.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default CorporationController;
