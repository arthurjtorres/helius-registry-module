import { Request, Response, NextFunction } from "express";
import PositionService from "../services/PositionService";

class PositionController {
  private service = new PositionService();

  async createPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.createPosition(req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em createPosition:", error);
      return res.status(500).json("Erro interno ao criar cargo.");
    }
  }

  async updatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.updatePosition(id, req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em updatePosition:", error);
      return res.status(500).json("Erro interno ao atualizar cargo.");
    }
  }

  async deletePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deletePosition(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deletePosition:", error);
      return res.status(500).json("Erro interno ao deletar cargo.");
    }
  }

  async getPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getPosition(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getPosition:", error);
      return res.status(500).json("Erro interno ao buscar cargo.");
    }
  }

  async findPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findPositions(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findPositions:", error);
      return res.status(500).json("Erro interno ao buscar cargos.");
    }
  }
}

export default PositionController;
