import { Router } from "express";
import EmployeeController from "../controllers/EmployeeController";

const employeeRouter = Router();
const controller = new EmployeeController();

employeeRouter.post("/", controller.createEmployee.bind(controller));
employeeRouter.put("/:id", controller.updateEmployee.bind(controller));
employeeRouter.delete("/:id", controller.deleteEmployee.bind(controller));
employeeRouter.get("/:id", controller.getEmployee.bind(controller));
employeeRouter.get("/", controller.findEmployees.bind(controller));
employeeRouter.post("/bulk", controller.bulkInsert.bind(controller));

export default employeeRouter;
