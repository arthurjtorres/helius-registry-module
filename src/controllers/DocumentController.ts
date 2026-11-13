import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import DocumentService from "../services/DocumentService";

class DocumentController {
  private service = new DocumentService();

  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createDocument(data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createDocument", error);
      const resp = Resp.internalError("Erro interno ao criar documento.");
      return res.status(resp.status).json(resp);
    }
  }

  async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateDocument(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updateDocument", error);
      const resp = Resp.internalError("Erro interno ao atualizar documento.");
      return res.status(resp.status).json(resp);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteDocument(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deleteDocument", error);
      const resp = Resp.internalError("Erro interno ao deletar documento.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivateDocument(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivateDocument", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getDocument(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getDocument", error);
      const resp = Resp.internalError("Erro interno ao buscar documento.");
      return res.status(resp.status).json(resp);
    }
  }

  async findDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findDocuments(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findDocuments", error);
      const resp = Resp.internalError("Erro interno ao buscar documentos.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default DocumentController;
