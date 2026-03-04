import { Router } from "express";
import SectorController from "../controllers/SectorController";
import { verifyToken } from "../middlewares/Authentication";

const sectorRouter = Router();
const controller = new SectorController();

sectorRouter.post("/", verifyToken, controller.createSector.bind(controller));
sectorRouter.put("/:id", verifyToken, controller.updateSector.bind(controller));
sectorRouter.delete("/:id", verifyToken, controller.deleteSector.bind(controller));
sectorRouter.get("/:id", controller.getSector.bind(controller));
sectorRouter.get("/", controller.findSectors.bind(controller));

export default sectorRouter;
