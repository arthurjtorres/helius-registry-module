import { Router } from "express";
import CompanyController from "../controllers/CompanyController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const companyRouter = Router();
const controller = new CompanyController();

companyRouter.post("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.CREATE), controller.createCompany.bind(controller));
companyRouter.put("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.updateCompany.bind(controller));
companyRouter.delete("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.DELETE), controller.deleteCompany.bind(controller));
companyRouter.patch("/:id/reactivate", verifyToken, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.reactivateCompany.bind(controller));
companyRouter.get("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.getCompany.bind(controller));
companyRouter.get("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.findCompanies.bind(controller));

export default companyRouter;
