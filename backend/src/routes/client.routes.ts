import { Router } from "express";
import { clientController } from "../controllers/client.controller";
import { ensureAuthenticated } from "../middlewares/auth";

const clientRoutes = Router();

clientRoutes.use(ensureAuthenticated({ adminOnly: true }));

clientRoutes.get("/", clientController.list);
clientRoutes.post("/", clientController.create);
clientRoutes.put("/:id", clientController.update);

export { clientRoutes };


