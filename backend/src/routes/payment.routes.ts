import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth";
import { paymentController } from "../controllers/payment.controller";

const paymentRoutes = Router();

paymentRoutes.use(ensureAuthenticated({ adminOnly: true }));

paymentRoutes.patch("/:id/status", paymentController.updateStatus);

export { paymentRoutes };



