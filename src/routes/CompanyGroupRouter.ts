import { Router } from "express";
import CompanyGroupController from "../controllers/CompanyGroupController";
import { verifyToken } from "../middlewares/Authentication";

const companyGroupRouter = Router();
const controller = new CompanyGroupController();

companyGroupRouter.post("/", verifyToken, controller.createCompanyGroup.bind(controller));
companyGroupRouter.put("/:id", verifyToken, controller.updateCompanyGroup.bind(controller));
companyGroupRouter.delete("/:id", verifyToken, controller.deleteCompanyGroup.bind(controller));
companyGroupRouter.patch("/:id/reactivate", verifyToken, controller.reactivateCompanyGroup.bind(controller));
companyGroupRouter.get("/:id", verifyToken, controller.getCompanyGroup.bind(controller));
companyGroupRouter.get("/", verifyToken, controller.findCompanyGroups.bind(controller));

export default companyGroupRouter;
