import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { cancelPendingAppointments } from "./jobs/cancelPendingAppointments";

const app = createApp();
const server = createServer(app);

server.listen(env.port, () => {
  console.log(`🚗 Lavacar API rodando na porta ${env.port}`);
});

// Job para cancelar agendamentos não realizados do dia anterior
// Executa diariamente às 01:00
function scheduleDailyJob() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(1, 0, 0, 0); // 01:00

  const msUntilTomorrow = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    // Executar imediatamente na primeira vez
    cancelPendingAppointments().catch(console.error);

    // Depois executar a cada 24 horas
    setInterval(() => {
      cancelPendingAppointments().catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 horas
  }, msUntilTomorrow);

  console.log(`[Job] Agendado para executar diariamente às 01:00. Próxima execução: ${tomorrow.toLocaleString()}`);
}

// Iniciar o job
scheduleDailyJob();


