import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import DepartmentService from "../services/DepartmentService";

class DepartmentController {
  private service = new DepartmentService();

  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createDepartment(data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createDepartment", error);
      const resp = Resp.internalError("Erro interno ao criar departamento.");
      return res.status(resp.status).json(resp);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateDepartment(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updateDepartment", error);
      const resp = Resp.internalError("Erro interno ao atualizar departamento.");
      return res.status(resp.status).json(resp);
    }
  }

  async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteDepartment(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deleteDepartment", error);
      const resp = Resp.internalError("Erro interno ao deletar departamento.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivateDepartment(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivateDepartment", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getDepartment(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getDepartment", error);
      const resp = Resp.internalError("Erro interno ao buscar departamento.");
      return res.status(resp.status).json(resp);
    }
  }

  async findDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findDepartments(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findDepartments", error);
      const resp = Resp.internalError("Erro interno ao buscar departamentos.");
      return res.status(resp.status).json(resp);
    }
  }
}

export default DepartmentController;
