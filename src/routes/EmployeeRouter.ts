import { Router } from "express";
import EmployeeController from "../controllers/EmployeeController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const employeeRouter = Router();
const controller = new EmployeeController();

employeeRouter.post("/", verifyToken, checkPermission("FUNCIONARIOS", PermissionEnum.CREATE), controller.createEmployee.bind(controller));
employeeRouter.put("/:id", verifyToken, checkPermission("FUNCIONARIOS", PermissionEnum.UPDATE), controller.updateEmployee.bind(controller));
employeeRouter.delete("/:id", verifyToken, checkPermission("FUNCIONARIOS", PermissionEnum.DELETE), controller.deleteEmployee.bind(controller));
employeeRouter.patch("/:id/reactivate", verifyToken, checkPermission("FUNCIONARIOS", PermissionEnum.UPDATE), controller.reactivateEmployee.bind(controller));
employeeRouter.get("/:id", verifyToken, checkPermission("FUNCIONARIOS", PermissionEnum.READ), controller.getEmployee.bind(controller));
employeeRouter.get("/", verifyToken, checkPermission("FUNCIONARIOS", PermissionEnum.READ), controller.findEmployees.bind(controller));
employeeRouter.post("/bulk", verifyToken, checkPermission("FUNCIONARIOS", PermissionEnum.CREATE), controller.bulkInsert.bind(controller));

export default employeeRouter;
