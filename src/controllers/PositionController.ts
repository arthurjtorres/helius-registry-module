import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import PositionService from "../services/PositionService";

class PositionController {
  private service = new PositionService();

  async createPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createPosition(data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createPosition", error);
      const resp = Resp.internalError("Erro interno ao criar cargo.");
      return res.status(resp.status).json(resp);
    }
  }

  async updatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updatePosition(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updatePosition", error);
      const resp = Resp.internalError("Erro interno ao atualizar cargo.");
      return res.status(resp.status).json(resp);
    }
  }

  async deletePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deletePosition(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deletePosition", error);
      const resp = Resp.internalError("Erro interno ao deletar cargo.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivatePosition(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivatePosition", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getPosition(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getPosition", error);
      const resp = Resp.internalError("Erro interno ao buscar cargo.");
      return res.status(resp.status).json(resp);
    }
  }

  async findPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findPositions(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findPositions", error);
      const resp = Resp.internalError("Erro interno ao buscar cargos.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default PositionController;
