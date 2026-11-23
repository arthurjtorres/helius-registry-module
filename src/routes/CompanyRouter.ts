import { Router } from "express";
import CompanyController from "../controllers/CompanyController";
import { verifyToken, allowServiceToken } from "../middlewares/Authentication";
import { checkPermission, onlySystemUser } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const companyRouter = Router();
const controller = new CompanyController();

companyRouter.post("/", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.CREATE), controller.createCompany.bind(controller));
companyRouter.put("/:id", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.updateCompany.bind(controller));
companyRouter.delete("/:id", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.DELETE), controller.deleteCompany.bind(controller));
companyRouter.patch("/:id/reactivate", verifyToken, onlySystemUser, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.reactivateCompany.bind(controller));
// Consulta por IDs via POST: usuário com EMPRESAS:READ ou token de serviço (T09)
companyRouter.post("/lookup", allowServiceToken, verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.lookupCompanies.bind(controller));
companyRouter.get("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.getCompany.bind(controller));
companyRouter.get("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.findCompanies.bind(controller));

export default companyRouter;
