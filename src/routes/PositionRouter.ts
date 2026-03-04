import { Router } from "express";
import PositionController from "../controllers/PositionController";
import { verifyToken } from "../middlewares/Authentication";

const positionRouter = Router();
const controller = new PositionController();

positionRouter.post("/", verifyToken, controller.createPosition.bind(controller));
positionRouter.put("/:id", verifyToken, controller.updatePosition.bind(controller));
positionRouter.delete("/:id", verifyToken, controller.deletePosition.bind(controller));
positionRouter.get("/:id", controller.getPosition.bind(controller));
positionRouter.get("/", controller.findPositions.bind(controller));

export default positionRouter;
