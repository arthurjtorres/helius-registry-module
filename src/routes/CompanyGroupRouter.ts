import { Router } from "express";
import CompanyGroupController from "../controllers/CompanyGroupController";

const companyGroupRouter = Router();
const controller = new CompanyGroupController();

companyGroupRouter.post("/", controller.createCompanyGroup.bind(controller));
companyGroupRouter.put("/:id", controller.updateCompanyGroup.bind(controller));
companyGroupRouter.delete("/:id", controller.deleteCompanyGroup.bind(controller));
companyGroupRouter.get("/:id", controller.getCompanyGroup.bind(controller));
companyGroupRouter.get("/", controller.findCompanyGroups.bind(controller));

export default companyGroupRouter;
