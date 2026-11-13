import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import SectorService from "../services/SectorService";

class SectorController {
  private service = new SectorService();

  async createSector(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createSector(data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createSector", error);
      const resp = Resp.internalError("Erro interno ao criar setor.");
      return res.status(resp.status).json(resp);
    }
  }

  async updateSector(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateSector(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updateSector", error);
      const resp = Resp.internalError("Erro interno ao atualizar setor.");
      return res.status(resp.status).json(resp);
    }
  }

  async deleteSector(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteSector(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deleteSector", error);
      const resp = Resp.internalError("Erro interno ao deletar setor.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivateSector(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivateSector(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivateSector", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getSector(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getSector(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getSector", error);
      const resp = Resp.internalError("Erro interno ao buscar setor.");
      return res.status(resp.status).json(resp);
    }
  }

  async findSectors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findSectors(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findSectors", error);
      const resp = Resp.internalError("Erro interno ao buscar setores.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default SectorController;
