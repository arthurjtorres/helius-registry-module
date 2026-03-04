import { Request, Response, NextFunction } from "express";
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
      console.error("Erro em createPerson:", error);
      return res.status(500).json("Erro interno ao criar pessoa.");
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
      console.error("Erro em updatePerson:", error);
      return res.status(500).json("Erro interno ao atualizar pessoa.");
    }
  }

  async deletePerson(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.deletePerson(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em deletePerson:", error);
      return res.status(500).json("Erro interno ao deletar pessoa.");
    }
  }

  async getPerson(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getPerson(id);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em getPerson:", error);
      return res.status(500).json("Erro interno ao buscar pessoa.");
    }
  }

  async findPersons(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.findPersons(req.query);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error("Erro em findPersons:", error);
      return res.status(500).json("Erro interno ao buscar pessoas.");
    }
  }
}

export default PersonController;
