import { Router } from "express";
import PersonController from "../controllers/PersonController";
import { verifyToken } from "../middlewares/Authentication";

const personRouter = Router();
const controller = new PersonController();

personRouter.post("/", verifyToken, controller.createPerson.bind(controller));
personRouter.put("/:id", verifyToken, controller.updatePerson.bind(controller));
personRouter.delete("/:id", verifyToken, controller.deletePerson.bind(controller));
personRouter.get("/:id", controller.getPerson.bind(controller));
personRouter.get("/", controller.findPersons.bind(controller));

export default personRouter;
