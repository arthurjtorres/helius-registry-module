import { Router } from "express";
import EmployeeController from "../controllers/EmployeeController";
import { verifyToken } from "../middlewares/Authentication";

const employeeRouter = Router();
const controller = new EmployeeController();

employeeRouter.post("/", verifyToken, controller.createEmployee.bind(controller));
employeeRouter.put("/:id", verifyToken, controller.updateEmployee.bind(controller));
employeeRouter.delete("/:id", verifyToken, controller.deleteEmployee.bind(controller));
employeeRouter.get("/:id", controller.getEmployee.bind(controller));
employeeRouter.get("/", controller.findEmployees.bind(controller));
employeeRouter.post("/bulk", controller.bulkInsert.bind(controller));

export default employeeRouter;
