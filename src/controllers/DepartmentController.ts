import { Request, Response, NextFunction } from "express";
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
      console.error("Erro em createDepartment:", error);
      return res.status(500).json("Erro interno ao criar departamento.");
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
      console.error("Erro em updateDepartment:", error);
      return res.status(500).json("Erro interno ao atualizar departamento.");
    }
  }

  async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteDepartment(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deleteDepartment:", error);
      return res.status(500).json("Erro interno ao deletar departamento.");
    }
  }

  async getDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getDepartment(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getDepartment:", error);
      return res.status(500).json("Erro interno ao buscar departamento.");
    }
  }

  async findDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findDepartments(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findDepartments:", error);
      return res.status(500).json("Erro interno ao buscar departamentos.");
    }
  }
}

export default DepartmentController;
