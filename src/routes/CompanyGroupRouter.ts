import { Router } from "express";
import CompanyGroupController from "../controllers/CompanyGroupController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission, onlySystemUser } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const companyGroupRouter = Router();
const controller = new CompanyGroupController();

companyGroupRouter.post("/", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.CREATE), controller.createCompanyGroup.bind(controller));
companyGroupRouter.put("/:id", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.updateCompanyGroup.bind(controller));
companyGroupRouter.delete("/:id", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.DELETE), controller.deleteCompanyGroup.bind(controller));
companyGroupRouter.patch("/:id/reactivate", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.reactivateCompanyGroup.bind(controller));
companyGroupRouter.get("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.getCompanyGroup.bind(controller));
companyGroupRouter.get("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.findCompanyGroups.bind(controller));

export default companyGroupRouter;
