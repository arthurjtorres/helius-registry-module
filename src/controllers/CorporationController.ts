import { Request, Response, NextFunction } from "express";
import CorporationService from "../services/CorporationService";

class CorporationController {
  private service = new CorporationService();

  async createCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.createCorporation(req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em createCorporation:", error);
      return res.status(500).json("Erro interno ao criar organização.");
    }
  }

  async updateCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.updateCorporation(id, req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em updateCorporation:", error);
      return res.status(500).json("Erro interno ao atualizar organização.");
    }
  }

  async deleteCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCorporation(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deleteCorporation:", error);
      return res.status(500).json("Erro interno ao deletar organização.");
    }
  }

  async getCorporation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getCorporation(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getCorporation:", error);
      return res.status(500).json("Erro interno ao buscar organização.");
    }
  }

  async findCorporations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findCorporations(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findCorporations:", error);
      return res.status(500).json("Erro interno ao buscar organizações.");
    }
  }
}

export default CorporationController;
