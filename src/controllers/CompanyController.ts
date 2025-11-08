import { Request, Response, NextFunction } from "express";
import CompanyService from "../services/CompanyService";

class CompanyController {
  private service = new CompanyService();

  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.createCompany(req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em createCompany:", error);
      return res.status(500).json("Erro interno ao criar empresa.");
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.updateCompany(id, req.body);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em updateCompany:", error);
      return res.status(500).json("Erro interno ao atualizar empresa.");
    }
  }

  async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCompany(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deleteCompany:", error);
      return res.status(500).json("Erro interno ao deletar empresa.");
    }
  }

  async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getCompany(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getCompany:", error);
      return res.status(500).json("Erro interno ao buscar empresa.");
    }
  }

  async findCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findCompanies(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findCompanies:", error);
      return res.status(500).json("Erro interno ao buscar empresas.");
    }
  }
}

export default CompanyController;
