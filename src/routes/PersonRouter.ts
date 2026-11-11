import { Router } from "express";
import PersonController from "../controllers/PersonController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const personRouter = Router();
const controller = new PersonController();

personRouter.post("/", verifyToken, checkPermission("PESSOAS", PermissionEnum.CREATE), controller.createPerson.bind(controller));
personRouter.put("/:id", verifyToken, checkPermission("PESSOAS", PermissionEnum.UPDATE), controller.updatePerson.bind(controller));
personRouter.delete("/:id", verifyToken, checkPermission("PESSOAS", PermissionEnum.DELETE), controller.deletePerson.bind(controller));
personRouter.patch("/:id/reactivate", verifyToken, checkPermission("PESSOAS", PermissionEnum.UPDATE), controller.reactivatePerson.bind(controller));
personRouter.get("/:id", verifyToken, checkPermission("PESSOAS", PermissionEnum.READ), controller.getPerson.bind(controller));
personRouter.get("/", verifyToken, checkPermission("PESSOAS", PermissionEnum.READ), controller.findPersons.bind(controller));

export default personRouter;
