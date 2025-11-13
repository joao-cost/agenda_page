import { Router } from "express";
import { appointmentController } from "../controllers/appointment.controller";
import { ensureAuthenticated } from "../middlewares/auth";

const appointmentRoutes = Router();

appointmentRoutes.use(ensureAuthenticated());

appointmentRoutes.get("/availability", appointmentController.availability);
appointmentRoutes.get("/", appointmentController.list);
appointmentRoutes.post("/", appointmentController.create);
appointmentRoutes.patch("/:id", ensureAuthenticated({ adminOnly: true }), appointmentController.update);
appointmentRoutes.patch("/:id/status", ensureAuthenticated({ adminOnly: true }), appointmentController.updateStatus);

export { appointmentRoutes };


