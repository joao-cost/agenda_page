import axios from "axios";
import { format, parseISO } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
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
  const instance = settings?.session;

  if (!apiUrl || !apiToken || apiToken === "coloque_seu_token") {
    console.warn("[WhatsApp] Credenciais não configuradas. Notificação não enviada.");
    return;
  }

  if (!instance) {
    console.warn("[WhatsApp] Nome da instância (session) não configurado. Notificação não enviada.");
    return;
  }

  // Construir a URL completa com o endpoint da Evolution API
  const baseUrl = apiUrl.replace(/\/$/, ""); // Remove barra final se existir
  const endpoint = `/message/sendText/${instance}`;
  const fullUrl = `${baseUrl}${endpoint}`;

  // Formatar o número de telefone (remover caracteres especiais e garantir formato internacional)
  const formatPhoneNumber = (phone: string): string => {
    // Remove espaços, parênteses, hífens e outros caracteres
    let cleaned = phone.replace(/[\s\(\)\-]/g, "");
    // Remove o + se existir
    cleaned = cleaned.replace(/^\+/, "");
    // Se começar com 0, remove (assumindo que é número brasileiro)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    // Se não começar com código do país (55 para Brasil), adiciona
    // Verifica se tem 10 ou 11 dígitos (número brasileiro sem código do país)
    if (!cleaned.startsWith("55") && (cleaned.length === 10 || cleaned.length === 11)) {
      cleaned = "55" + cleaned;
    }
    return cleaned;
  };

  // Formatar o payload no formato correto da Evolution API
  const evolutionPayload = {
    number: formatPhoneNumber(payload.to),
    text: payload.text?.body || ""
  };

  try {
    await axios.post(fullUrl, evolutionPayload, {
      headers: {
        apikey: apiToken,
        "Content-Type": "application/json"
      }
    });
    console.log("[WhatsApp] Notificação enviada com sucesso");
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar notificação:", error);
    throw error;
  }
}

function formatDateTime(dateTime: string | Date): string {
  let date: Date;
  
  if (typeof dateTime === "string") {
    // Tentar parse ISO primeiro
    try {
      date = parseISO(dateTime);
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        // Se não for ISO válido, tentar como Date string
        date = new Date(dateTime);
      }
    } catch {
      date = new Date(dateTime);
    }
  } else {
    date = dateTime;
  }
  
  // Verificar se a data é válida
  if (isNaN(date.getTime())) {
    console.error("[WhatsApp] Data inválida recebida:", dateTime);
    return "Data inválida";
  }
  
  const dayOfWeek = format(date, "EEEE", { locale: ptBR });
  const day = format(date, "dd 'de' MMMM", { locale: ptBR });
  const time = format(date, "HH:mm");
  return `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}, ${day} às ${time}h`;
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    AGENDADO: "Agendado",
    LAVANDO: "Em lavagem",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado"
  };
  return statusMap[status] || status;
}

export async function notifyNewAppointment({
  clientName,
  serviceName,
  dateTime,
  phone,
  adminPhone
}: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  phone: string;
  adminPhone?: string;
}) {
  const formattedDate = formatDateTime(dateTime);
  
  const clientMessage = `🚗 *Agendamento Confirmado!*

Olá, *${clientName}*!

Seu agendamento foi confirmado com sucesso:

📋 *Serviço:* ${serviceName}
📅 *Data e Horário:* ${formattedDate}

_Estamos ansiosos para atendê-lo!_

Em caso de dúvidas, entre em contato conosco.`;

  // Enviar para o cliente
  await sendWhatsAppNotification({
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: {
      body: clientMessage
    }
  });

  // Enviar para o administrador após 30 segundos (se configurado)
  if (adminPhone) {
    setTimeout(async () => {
      const adminMessage = `📋 *Novo Agendamento Criado*

*Cliente:* ${clientName}
*Serviço:* ${serviceName}
*Data e Horário:* ${formattedDate}

_Novo agendamento foi criado no sistema._`;

      await sendWhatsAppNotification({
        messaging_product: "whatsapp",
        to: adminPhone,
        type: "text",
        text: {
          body: adminMessage
        }
      });
    }, 30000); // 30 segundos
  }
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
  const formattedDate = formatDateTime(dateTime);
  const statusLabel = getStatusLabel(status);
  
  let statusEmoji = "📋";
  let statusMessage = "";
  
  switch (status) {
    case "LAVANDO":
      statusEmoji = "🧼";
      statusMessage = "Seu veículo está sendo lavado agora!";
      break;
    case "ENTREGUE":
      statusEmoji = "✅";
      statusMessage = "Seu veículo está pronto para retirada!";
      break;
    case "CANCELADO":
      statusEmoji = "❌";
      statusMessage = "Seu agendamento foi cancelado.";
      break;
    default:
      statusMessage = "Status do seu agendamento foi atualizado.";
  }
  
  const message = `${statusEmoji} *Atualização do Agendamento*

Olá, *${clientName}*!

${statusMessage}

📋 *Serviço:* ${serviceName}
📊 *Status:* ${statusLabel}
📅 *Data:* ${formattedDate}

_Obrigado por escolher nossos serviços!_`;

  await sendWhatsAppNotification({
    messaging_product: "whatsapp",
    to: env.whatsappDefaultRecipient || phone,
    type: "text",
    text: {
      body: message
    }
  });
}

export async function notifyCancellation({
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
  const formattedDate = formatDateTime(dateTime);
  
  const message = `❌ *Agendamento Cancelado*

Olá, *${clientName}*!

Infelizmente seu agendamento foi cancelado:

📋 *Serviço:* ${serviceName}
📅 *Data:* ${formattedDate}

_Motivo: Agendamento não realizado no prazo._

Se desejar reagendar, entre em contato conosco.`;

  await sendWhatsAppNotification({
    messaging_product: "whatsapp",
    to: phone,
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
  dateTime: string | Date;
  phone: string;
  status: "PENDENTE" | "PAGO";
}) {
  const formattedDate = formatDateTime(dateTime);
  
  const message =
    status === "PAGO"
      ? `✅ *Pagamento Confirmado!*

Olá, *${clientName}*!

Seu pagamento foi confirmado com sucesso:

📋 *Serviço:* ${serviceName}
📅 *Data:* ${formattedDate}

_Muito obrigado pela confiança em nossos serviços!_

Esperamos vê-lo novamente em breve! 🚗✨`
      : `⚠️ *Pagamento Pendente*

Olá, *${clientName}*!

Lembramos que seu pagamento está pendente:

📋 *Serviço:* ${serviceName}
📅 *Data:* ${formattedDate}

Por favor, entre em contato conosco para regularizar o pagamento.

_Estamos à disposição para ajudar!_`;

  await sendWhatsAppNotification({
    messaging_product: "whatsapp",
    to: env.whatsappDefaultRecipient || phone,
    type: "text",
    text: {
      body: message
    }
  });
}

