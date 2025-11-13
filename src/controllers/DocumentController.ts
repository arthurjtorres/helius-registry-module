import { Request, Response, NextFunction } from "express";
import DocumentService from "../services/DocumentService";

class DocumentController {
  private service = new DocumentService();

  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.createDocument(req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em createDocument:", error);
      return res.status(500).json("Erro interno ao criar documento.");
    }
  }

  async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.updateDocument(id, req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em updateDocument:", error);
      return res.status(500).json("Erro interno ao atualizar documento.");
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteDocument(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deleteDocument:", error);
      return res.status(500).json("Erro interno ao deletar documento.");
    }
  }

  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getDocument(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getDocument:", error);
      return res.status(500).json("Erro interno ao buscar documento.");
    }
  }

  async findDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findDocuments(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findDocuments:", error);
      return res.status(500).json("Erro interno ao buscar documentos.");
    }
  }
}

export default DocumentController;
