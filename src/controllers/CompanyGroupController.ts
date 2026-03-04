import { Request, Response, NextFunction } from "express";
import CompanyGroupService from "../services/CompanyGroupService";

class CompanyGroupController {
  private service = new CompanyGroupService();

  async createCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        createdBy: user.userId
      }
      const result = await this.service.createCompanyGroup(data);

      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em createCompanyGroup:", error);
      return res.status(500).json("Erro interno ao criar grupo.");
    }
  }

  async updateCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = {
        ...req.body,
        updatedBy: user.userId
      }
      const { id } = req.params;
      const result = await this.service.updateCompanyGroup(id, data);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em updateCompanyGroup:", error);
      return res.status(500).json("Erro interno ao atualizar grupo.");
    }
  }

  async deleteCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCompanyGroup(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deleteCompanyGroup:", error);
      return res.status(500).json("Erro interno ao deletar grupo.");
    }
  }

  async getCompanyGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getCompanyGroup(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getCompanyGroup:", error);
      return res.status(500).json("Erro interno ao buscar grupo.");
    }
  }

  async findCompanyGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findCompanyGroups(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findCompanyGroups:", error);
      return res.status(500).json("Erro interno ao buscar grupos.");
    }
  }
}

export default CompanyGroupController;
