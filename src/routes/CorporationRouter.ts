import { Router } from "express";
import CorporationController from "../controllers/CorporationController";

const corporationRouter = Router();
const controller = new CorporationController();

corporationRouter.post("/", controller.createCorporation.bind(controller));
corporationRouter.put("/:id", controller.updateCorporation.bind(controller));
corporationRouter.delete("/:id", controller.deleteCorporation.bind(controller));
corporationRouter.get("/:id", controller.getCorporation.bind(controller));
corporationRouter.get("/", controller.findCorporations.bind(controller));

export default corporationRouter;
