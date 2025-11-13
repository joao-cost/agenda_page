import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`🚗 Lavacar API rodando na porta ${env.port}`);
});


