import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import PersonService from "../services/PersonService";

class PersonController {
  private service = new PersonService();

  async createPerson(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createPerson(data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createPerson", error);
      const resp = Resp.internalError("Erro interno ao criar pessoa.");
      return res.status(resp.status).json(resp);
    }
  }

  async updatePerson(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updatePerson(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updatePerson", error);
      const resp = Resp.internalError("Erro interno ao atualizar pessoa.");
      return res.status(resp.status).json(resp);
    }
  }

  async deletePerson(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deletePerson(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deletePerson", error);
      const resp = Resp.internalError("Erro interno ao deletar pessoa.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivatePerson(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivatePerson(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivatePerson", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getPerson(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getPerson(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getPerson", error);
      const resp = Resp.internalError("Erro interno ao buscar pessoa.");
      return res.status(resp.status).json(resp);
    }
  }

  async findPersons(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findPersons(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findPersons", error);
      const resp = Resp.internalError("Erro interno ao buscar pessoas.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default PersonController;
