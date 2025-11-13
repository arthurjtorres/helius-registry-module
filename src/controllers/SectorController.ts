import { Request, Response, NextFunction } from "express";
import SectorService from "../services/SectorService";

class SectorController {
  private service = new SectorService();

  async createSector(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.createSector(req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em createSector:", error);
      return res.status(500).json("Erro interno ao criar setor.");
    }
  }

  async updateSector(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.updateSector(id, req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em updateSector:", error);
      return res.status(500).json("Erro interno ao atualizar setor.");
    }
  }

  async deleteSector(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteSector(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deleteSector:", error);
      return res.status(500).json("Erro interno ao deletar setor.");
    }
  }

  async getSector(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getSector(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getSector:", error);
      return res.status(500).json("Erro interno ao buscar setor.");
    }
  }

  async findSectors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findSectors(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findSectors:", error);
      return res.status(500).json("Erro interno ao buscar setores.");
    }
  }
}

export default SectorController;
