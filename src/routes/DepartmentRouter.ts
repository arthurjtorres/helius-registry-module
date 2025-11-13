import { Router } from "express";
import DepartmentController from "../controllers/DepartmentController";

const departmentRouter = Router();
const controller = new DepartmentController();

departmentRouter.post("/", controller.createDepartment.bind(controller));
departmentRouter.put("/:id", controller.updateDepartment.bind(controller));
departmentRouter.delete("/:id", controller.deleteDepartment.bind(controller));
departmentRouter.get("/:id", controller.getDepartment.bind(controller));
departmentRouter.get("/", controller.findDepartments.bind(controller));

export default departmentRouter;
