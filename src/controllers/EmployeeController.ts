import { Request, Response, NextFunction } from "express";
import EmployeeService from "../services/EmployeeService";

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
      console.error("Erro em createEmployee:", error);
      return res.status(500).json("Erro interno ao criar funcionário.");
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
      console.error("Erro em updateEmployee:", error);
      return res.status(500).json("Erro interno ao atualizar funcionário.");
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteEmployee(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deleteEmployee:", error);
      return res.status(500).json("Erro interno ao deletar funcionário.");
    }
  }

  async getEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getEmployee(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getEmployee:", error);
      return res.status(500).json("Erro interno ao buscar funcionário.");
    }
  }

  async findEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findEmployees(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findEmployees:", error);
      return res.status(500).json("Erro interno ao buscar funcionários.");
    }
  }

  async bulkInsert(req: Request, res: Response, next: NextFunction) {
  try {
    const user = res.locals.user;
    const result = await this.service.bulkInsert(req.body, user.userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Erro em bulkInsertFromTxt:", error);
    return res.status(500).json("Erro interno ao importar funcionários em lote.");
  }
}

}

export default EmployeeController;
