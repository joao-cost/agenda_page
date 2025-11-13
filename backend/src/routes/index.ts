import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { serviceRoutes } from "./service.routes";
import { clientRoutes } from "./client.routes";
import { appointmentRoutes } from "./appointment.routes";
import { reportRoutes } from "./report.routes";
import { settingsRoutes } from "./settings.routes";
import { paymentRoutes } from "./payment.routes";
import { contactRoutes } from "./contact.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Lavacar API" });
});

router.use("/auth", authRoutes);
router.use("/services", serviceRoutes);
router.use("/clients", clientRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/reports", reportRoutes);
router.use("/settings", settingsRoutes);
router.use("/payments", paymentRoutes);
router.use("/contact", contactRoutes);

export const routes = router;

