import { Router } from "express";
import CompanyController from "../controllers/CompanyController";
import { verifyToken } from "../middlewares/Authentication";

const companyRouter = Router();
const controller = new CompanyController();

companyRouter.post("/", verifyToken, controller.createCompany.bind(controller));
companyRouter.put("/:id", verifyToken, controller.updateCompany.bind(controller));
companyRouter.delete("/:id", verifyToken, controller.deleteCompany.bind(controller));
companyRouter.get("/:id", controller.getCompany.bind(controller));
companyRouter.get("/", controller.findCompanies.bind(controller));

export default companyRouter;
