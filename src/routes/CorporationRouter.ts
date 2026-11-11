import { Router } from "express";
import CorporationController from "../controllers/CorporationController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const corporationRouter = Router();
const controller = new CorporationController();

corporationRouter.post("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.CREATE), controller.createCorporation.bind(controller));
corporationRouter.put("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.updateCorporation.bind(controller));
corporationRouter.delete("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.DELETE), controller.deleteCorporation.bind(controller));
corporationRouter.patch("/:id/reactivate", verifyToken, checkPermission("EMPRESAS", PermissionEnum.UPDATE), controller.reactivateCorporation.bind(controller));
corporationRouter.get("/:id", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.getCorporation.bind(controller));
corporationRouter.get("/", verifyToken, checkPermission("EMPRESAS", PermissionEnum.READ), controller.findCorporations.bind(controller));

export default corporationRouter;
