import { Router } from "express";
import SectorController from "../controllers/SectorController";

const sectorRouter = Router();
const controller = new SectorController();

sectorRouter.post("/", controller.createSector.bind(controller));
sectorRouter.put("/:id", controller.updateSector.bind(controller));
sectorRouter.delete("/:id", controller.deleteSector.bind(controller));
sectorRouter.get("/:id", controller.getSector.bind(controller));
sectorRouter.get("/", controller.findSectors.bind(controller));

export default sectorRouter;
