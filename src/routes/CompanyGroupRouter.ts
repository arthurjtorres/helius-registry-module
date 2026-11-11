import { Router } from "express";
import CompanyGroupController from "../controllers/CompanyGroupController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const companyGroupRouter = Router();
const controller = new CompanyGroupController();

companyGroupRouter.post("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.CREATE), controller.createCompanyGroup.bind(controller));
companyGroupRouter.put("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.updateCompanyGroup.bind(controller));
companyGroupRouter.delete("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.DELETE), controller.deleteCompanyGroup.bind(controller));
companyGroupRouter.patch("/:id/reactivate", verifyToken, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.reactivateCompanyGroup.bind(controller));
companyGroupRouter.get("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.getCompanyGroup.bind(controller));
companyGroupRouter.get("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.findCompanyGroups.bind(controller));

export default companyGroupRouter;
