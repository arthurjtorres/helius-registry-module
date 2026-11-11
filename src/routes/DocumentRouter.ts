import { Router } from "express";
import DocumentController from "../controllers/DocumentController";
import { verifyToken } from "../middlewares/Authentication";
import { checkPermission } from "../middlewares/CheckPermission";
import { PermissionEnum } from "../database/models/enums/PermissionEnum";

const documentRouter = Router();
const controller = new DocumentController();

documentRouter.post("/", verifyToken, checkPermission("DOCUMENTOS", PermissionEnum.CREATE), controller.createDocument.bind(controller));
documentRouter.put("/:id", verifyToken, checkPermission("DOCUMENTOS", PermissionEnum.UPDATE), controller.updateDocument.bind(controller));
documentRouter.delete("/:id", verifyToken, checkPermission("DOCUMENTOS", PermissionEnum.DELETE), controller.deleteDocument.bind(controller));
documentRouter.patch("/:id/reactivate", verifyToken, checkPermission("DOCUMENTOS", PermissionEnum.UPDATE), controller.reactivateDocument.bind(controller));
documentRouter.get("/:id", verifyToken, checkPermission("DOCUMENTOS", PermissionEnum.READ, { allowServiceToken: false }), controller.getDocument.bind(controller));
documentRouter.get("/", verifyToken, checkPermission("DOCUMENTOS", PermissionEnum.READ, { allowServiceToken: false }), controller.findDocuments.bind(controller));

export default documentRouter;
