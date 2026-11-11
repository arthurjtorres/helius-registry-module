import { Router } from "express";
import DepartmentController from "../controllers/DepartmentController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const departmentRouter = Router();
const controller = new DepartmentController();

departmentRouter.post("/", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.CREATE), controller.createDepartment.bind(controller));
departmentRouter.put("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.UPDATE), controller.updateDepartment.bind(controller));
departmentRouter.delete("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.DELETE), controller.deleteDepartment.bind(controller));
departmentRouter.patch("/:id/reactivate", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.UPDATE), controller.reactivateDepartment.bind(controller));
departmentRouter.get("/:id", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.READ), controller.getDepartment.bind(controller));
departmentRouter.get("/", verifyToken, checkPermission("ORGANOGRAMA", PermissionEnum.READ), controller.findDepartments.bind(controller));

export default departmentRouter;
