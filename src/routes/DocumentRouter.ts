import { Router } from "express";
import DocumentController from "../controllers/DocumentController";
import { verifyToken } from "../middlewares/Authentication";

const documentRouter = Router();
const controller = new DocumentController();

documentRouter.post("/", verifyToken, controller.createDocument.bind(controller));
documentRouter.put("/:id", verifyToken, controller.updateDocument.bind(controller));
documentRouter.delete("/:id", verifyToken, controller.deleteDocument.bind(controller));
documentRouter.get("/:id", controller.getDocument.bind(controller));
documentRouter.get("/", controller.findDocuments.bind(controller));

export default documentRouter;
