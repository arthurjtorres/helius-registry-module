import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logError";
import Resp from "../utils/Response";
import EmployeeService from "../services/EmployeeService";
import { parseImportOptions } from "../utils/EmployeeUpsert";

class EmployeeController {
  private service = new EmployeeService();

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createEmployee(data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em createEmployee", error);
      const resp = Resp.internalError("Erro interno ao criar funcionário.");
      return res.status(resp.status).json(resp);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateEmployee(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em updateEmployee", error);
      const resp = Resp.internalError("Erro interno ao atualizar funcionário.");
      return res.status(resp.status).json(resp);
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteEmployee(id, res.locals.user.userId, req.header('Authorization') ?? '');
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em deleteEmployee", error);
      const resp = Resp.internalError("Erro interno ao deletar funcionário.");
      return res.status(resp.status).json(resp);
    }
  }

  /** PATCH /:id/reactivate — reativa o registro (`activated = true`). */
  async reactivateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.reactivateEmployee(id, res.locals.user.userId);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em reactivateEmployee", error);
      const resp = Resp.internalError("Erro interno ao reativar registro.");
      return res.status(resp.status).json(resp);
    }
  }

  async getEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getEmployee(id);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em getEmployee", error);
      const resp = Resp.internalError("Erro interno ao buscar funcionário.");
      return res.status(resp.status).json(resp);
    }
  }

  async findEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findEmployees(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      logError("Erro em findEmployees", error);
      const resp = Resp.internalError("Erro interno ao buscar funcionários.");
      return res.status(resp.status).json(resp);
    }
  }

  async bulkInsert(req: Request, res: Response, next: NextFunction) {
  try {
    const user = res.locals.user;
      const data = {
        ...req.body,
        userId: user.userId
      }
    const parsed = parseImportOptions(req.query, req.body);
    if ("error" in parsed) {
      const resp = Resp.badRequest(parsed.error);
      return res.status(resp.status).json(resp);
    }
    const result = await this.service.bulkInsert(data, parsed.options);
    return res.status(result.status).json(result);
  } catch (error) {
    logError("Erro em bulkInsert", error);
    const resp = Resp.internalError("Erro interno ao importar funcionários em lote.");
    return res.status(resp.status).json(resp);
  }
}

}

export default EmployeeController;
