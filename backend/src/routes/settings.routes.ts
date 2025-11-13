import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth";
import { settingsController } from "../controllers/settings.controller";

const settingsRoutes = Router();

settingsRoutes.use(ensureAuthenticated({ adminOnly: true }));

settingsRoutes.get("/evolution", settingsController.getEvolution);
settingsRoutes.put("/evolution", settingsController.updateEvolution);

export { settingsRoutes };



