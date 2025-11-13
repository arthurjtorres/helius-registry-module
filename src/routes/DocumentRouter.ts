import { Router } from "express";
import DocumentController from "../controllers/DocumentController";

const documentRouter = Router();
const controller = new DocumentController();

documentRouter.post("/", controller.createDocument.bind(controller));
documentRouter.put("/:id", controller.updateDocument.bind(controller));
documentRouter.delete("/:id", controller.deleteDocument.bind(controller));
documentRouter.get("/:id", controller.getDocument.bind(controller));
documentRouter.get("/", controller.findDocuments.bind(controller));

export default documentRouter;
