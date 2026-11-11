import { Router } from "express";
import PersonController from "../controllers/PersonController";
import { verifyToken } from "../middlewares/Authentication";

const personRouter = Router();
const controller = new PersonController();

personRouter.post("/", verifyToken, controller.createPerson.bind(controller));
personRouter.put("/:id", verifyToken, controller.updatePerson.bind(controller));
personRouter.delete("/:id", verifyToken, controller.deletePerson.bind(controller));
personRouter.patch("/:id/reactivate", verifyToken, controller.reactivatePerson.bind(controller));
personRouter.get("/:id", verifyToken, controller.getPerson.bind(controller));
personRouter.get("/", verifyToken, controller.findPersons.bind(controller));

export default personRouter;
