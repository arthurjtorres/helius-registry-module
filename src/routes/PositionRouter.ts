import { Router } from "express";
import PositionController from "../controllers/PositionController";

const positionRouter = Router();
const controller = new PositionController();

positionRouter.post("/", controller.createPosition.bind(controller));
positionRouter.put("/:id", controller.updatePosition.bind(controller));
positionRouter.delete("/:id", controller.deletePosition.bind(controller));
positionRouter.get("/:id", controller.getPosition.bind(controller));
positionRouter.get("/", controller.findPositions.bind(controller));

export default positionRouter;
