import { Router } from "express";
import PositionController from "../controllers/PositionController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const positionRouter = Router();
const controller = new PositionController();

positionRouter.post("/", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.CREATE), controller.createPosition.bind(controller));
positionRouter.put("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.UPDATE), controller.updatePosition.bind(controller));
positionRouter.delete("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.DELETE), controller.deletePosition.bind(controller));
positionRouter.patch("/:id/reactivate", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.UPDATE), controller.reactivatePosition.bind(controller));
positionRouter.get("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.READ), controller.getPosition.bind(controller));
positionRouter.get("/", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.READ), controller.findPositions.bind(controller));

export default positionRouter;
