import { Router } from "express";
import CompanyController from "../controllers/CompanyController";

const companyRouter = Router();
const controller = new CompanyController();

companyRouter.post("/", controller.createCompany.bind(controller));
companyRouter.put("/:id", controller.updateCompany.bind(controller));
companyRouter.delete("/:id", controller.deleteCompany.bind(controller));
companyRouter.get("/:id", controller.getCompany.bind(controller));
companyRouter.get("/", controller.findCompanies.bind(controller));

export default companyRouter;
