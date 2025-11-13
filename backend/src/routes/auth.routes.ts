import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { ensureAuthenticated } from "../middlewares/auth";

const authRoutes = Router();

authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.get("/me", ensureAuthenticated(), authController.me);

export { authRoutes };


