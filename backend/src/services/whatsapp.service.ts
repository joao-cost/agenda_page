import axios from "axios";
import { env } from "../config/env";
import { getEvolutionSettings } from "./settings.service";

interface WhatsAppMessagePayload {
  to: string;
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  messaging_product?: string;
  type?: string;
  text?: {
    body: string;
  };
}

export async function sendWhatsAppNotification(payload: WhatsAppMessagePayload) {
  const settings = await getEvolutionSettings();
  const apiUrl = settings?.domain || env.whatsappApiUrl;
  const apiToken = settings?.token || env.whatsappApiToken;

  if (!apiUrl || !apiToken || apiToken === "coloque_seu_token") {
    console.warn("[WhatsApp] Credenciais não configuradas. Notificação não enviada.");
    return;
  }

  try {
    await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar notificação:", error);
  }
}

export async function notifyNewAppointment({
  clientName,
  serviceName,
  dateTime,
  phone
}: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  phone: string;
}) {
  const message = `Novo agendamento 🚗\nCliente: ${clientName}\nServiço: ${serviceName}\nQuando: ${dateTime}`;

  await sendWhatsAppNotification({
    messaging_product: "whatsapp",
    to: env.whatsappDefaultRecipient || phone,
    type: "text",
    text: {
      body: message
    }
  });
}

export async function notifyStatusChange({
  clientName,
  serviceName,
  dateTime,
  phone,
  status
}: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  phone: string;
  status: string;
}) {
  const message = `Atualização do seu agendamento 🚗\nServiço: ${serviceName}\nStatus: ${status}\nQuando: ${dateTime}`;

  await sendWhatsAppNotification({
    messaging_product: "whatsapp",
    to: env.whatsappDefaultRecipient || phone,
    type: "text",
    text: {
      body: message
    }
  });
}

export async function notifyPaymentStatusChange({
  clientName,
  serviceName,
  dateTime,
  phone,
  status
}: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  phone: string;
  status: "PENDENTE" | "PAGO";
}) {
  const message =
    status === "PAGO"
      ? `Pagamento confirmado ✅\n${serviceName} - ${dateTime}\nObrigado, ${clientName}!`
      : `Pagamento marcado como pendente ⚠️\n${serviceName} - ${dateTime}\nEntre em contato se precisar de suporte.`;

  await sendWhatsAppNotification({
    messaging_product: "whatsapp",
    to: env.whatsappDefaultRecipient || phone,
    type: "text",
    text: {
      body: message
    }
  });
}

