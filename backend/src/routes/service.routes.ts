import { Router } from "express";
import { serviceController } from "../controllers/service.controller";
import { ensureAuthenticated } from "../middlewares/auth";

const serviceRoutes = Router();

serviceRoutes.get("/", serviceController.list);
serviceRoutes.post("/", ensureAuthenticated({ adminOnly: true }), serviceController.create);
serviceRoutes.put("/:id", ensureAuthenticated({ adminOnly: true }), serviceController.update);
serviceRoutes.delete("/:id", ensureAuthenticated({ adminOnly: true }), serviceController.remove);

export { serviceRoutes };


