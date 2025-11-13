import { Router } from "express";
import PersonController from "../controllers/PersonController";

const personRouter = Router();
const controller = new PersonController();

personRouter.post("/", controller.createPerson.bind(controller));
personRouter.put("/:id", controller.updatePerson.bind(controller));
personRouter.delete("/:id", controller.deletePerson.bind(controller));
personRouter.get("/:id", controller.getPerson.bind(controller));
personRouter.get("/", controller.findPersons.bind(controller));

export default personRouter;
