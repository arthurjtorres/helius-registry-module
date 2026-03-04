import { Router } from "express";
import CorporationController from "../controllers/CorporationController";
import { verifyToken } from "../middlewares/Authentication";

const corporationRouter = Router();
const controller = new CorporationController();

corporationRouter.post("/", verifyToken, controller.createCorporation.bind(controller));
corporationRouter.put("/:id", verifyToken, controller.updateCorporation.bind(controller));
corporationRouter.delete("/:id", verifyToken, controller.deleteCorporation.bind(controller));
corporationRouter.get("/:id", controller.getCorporation.bind(controller));
corporationRouter.get("/", controller.findCorporations.bind(controller));

export default corporationRouter;
