import { Router } from "express";
import PositionController from "../controllers/PositionController";
import { verifyToken } from "../middlewares/Authentication";

const positionRouter = Router();
const controller = new PositionController();

positionRouter.post("/", verifyToken, controller.createPosition.bind(controller));
positionRouter.put("/:id", verifyToken, controller.updatePosition.bind(controller));
positionRouter.delete("/:id", verifyToken, controller.deletePosition.bind(controller));
positionRouter.patch("/:id/reactivate", verifyToken, controller.reactivatePosition.bind(controller));
positionRouter.get("/:id", verifyToken, controller.getPosition.bind(controller));
positionRouter.get("/", verifyToken, controller.findPositions.bind(controller));

export default positionRouter;
