import { Router } from "express";
import DepartmentController from "../controllers/DepartmentController";
import { verifyToken } from "../middlewares/Authentication";

const departmentRouter = Router();
const controller = new DepartmentController();

departmentRouter.post("/", verifyToken, controller.createDepartment.bind(controller));
departmentRouter.put("/:id", verifyToken, controller.updateDepartment.bind(controller));
departmentRouter.delete("/:id", verifyToken, controller.deleteDepartment.bind(controller));
departmentRouter.get("/:id", controller.getDepartment.bind(controller));
departmentRouter.get("/", controller.findDepartments.bind(controller));

export default departmentRouter;
