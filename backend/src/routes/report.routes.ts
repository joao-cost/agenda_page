import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { ensureAuthenticated } from "../middlewares/auth";

const reportRoutes = Router();

reportRoutes.use(ensureAuthenticated({ adminOnly: true }));

reportRoutes.get("/daily", reportController.daily);
reportRoutes.get("/monthly", reportController.monthly);
reportRoutes.get("/pending", reportController.pending);

export { reportRoutes };


