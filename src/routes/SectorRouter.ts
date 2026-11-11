import { Router } from "express";
import SectorController from "../controllers/SectorController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const sectorRouter = Router();
const controller = new SectorController();

sectorRouter.post("/", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.CREATE), controller.createSector.bind(controller));
sectorRouter.put("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.UPDATE), controller.updateSector.bind(controller));
sectorRouter.delete("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.DELETE), controller.deleteSector.bind(controller));
sectorRouter.patch("/:id/reactivate", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.UPDATE), controller.reactivateSector.bind(controller));
sectorRouter.get("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.READ), controller.getSector.bind(controller));
sectorRouter.get("/", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.READ), controller.findSectors.bind(controller));

export default sectorRouter;
