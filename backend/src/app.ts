import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { routes } from "./routes";
import { openApiDocument } from "./docs/openapi";

export function createApp() {
  const app = express();

  const allowedOrigins = env.clientBaseUrl.split(",").map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Origin não permitido"), false);
      },
      credentials: true
    })
  );
  app.use(express.json());
  app.use(helmet());
  app.use(morgan("dev"));

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get("/health", (_, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", routes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Erro interno no servidor" });
  });

  return app;
}

