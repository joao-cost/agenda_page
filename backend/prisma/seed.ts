import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Limpar todos os dados (em ordem de dependência)
  console.log("🗑️  Limpando dados existentes...");
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.integrationSetting.deleteMany();
  await prisma.generalSettings.deleteMany();
  console.log("✅ Dados limpos!\n");

  // Criar usuário admin
  console.log("👤 Criando usuário administrador...");
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.create({
    data: {
      login: "admin@lavacar.com",
      password: adminPassword,
      name: "Administrador",
      role: "ADMIN"
    }
  });
  console.log("✅ Admin criado: admin@lavacar.com / admin123\n");

  // Criar serviços
  console.log("🔧 Criando serviços...");
  const services = [
    {
      name: "Lavagem Express",
      description: "Limpeza externa rápida com produtos neutros. Ideal para manutenção semanal.",
      price: 60.00,
      durationMin: 30
    },
    {
      name: "Lavagem Completa",
      description: "Interior e exterior com acabamento e hidratação. Inclui aspirador e limpeza de estofados.",
      price: 120.00,
      durationMin: 90
    },
    {
      name: "Polimento Premium",
      description: "Correção de pintura e proteção com cera premium. Remove riscos leves e protege a pintura.",
      price: 280.00,
      durationMin: 180
    },
    {
      name: "Lavagem Simples",
      description: "Lavagem básica externa com água e sabão neutro.",
      price: 40.00,
      durationMin: 20
    },
    {
      name: "Lavagem + Enceramento",
      description: "Lavagem completa com enceramento para proteção da pintura.",
      price: 150.00,
      durationMin: 120
    }
  ];

  const createdServices = [];
  for (const service of services) {
    const created = await prisma.service.create({
      data: service
    });
    createdServices.push(created);
    console.log(`  ✓ ${created.name} - R$ ${created.price.toFixed(2)}`);
  }
  console.log(`✅ ${createdServices.length} serviços criados!\n`);

  // Criar clientes
  console.log("👥 Criando clientes...");
  const clients = [
    {
      name: "João Silva",
      phone: "66991234567",
      vehicle: "Honda Civic 2020",
      plate: "ABC1234",
      notes: "Cliente preferencial, sempre agendar com antecedência.",
      approved: true
    },
    {
      name: "Maria Santos",
      phone: "66992345678",
      vehicle: "Toyota Corolla 2021",
      plate: "XYZ5678",
      notes: "Prefere horários da manhã.",
      approved: true
    },
    {
      name: "Pedro Oliveira",
      phone: "66993456789",
      vehicle: "Volkswagen Gol 2019",
      plate: "DEF9012",
      approved: true
    },
    {
      name: "Ana Costa",
      phone: "66994567890",
      vehicle: "Fiat Uno 2018",
      plate: "GHI3456",
      notes: "Cliente novo, aguardando aprovação.",
      approved: false
    },
    {
      name: "Carlos Ferreira",
      phone: "66995678901",
      vehicle: "Chevrolet Onix 2022",
      plate: "JKL7890",
      approved: true
    }
  ];

  const createdClients = [];
  for (const client of clients) {
    const created = await prisma.client.create({
      data: client
    });
    createdClients.push(created);
    console.log(`  ✓ ${created.name} - ${created.vehicle} (${created.plate || "Sem placa"})`);
  }
  console.log(`✅ ${createdClients.length} clientes criados!\n`);

  // Criar configurações gerais
  console.log("⚙️  Criando configurações gerais...");
  const generalSettings = await prisma.generalSettings.create({
    data: {
      id: "default",
      multiWasher: false,
      workStartHour: 8,
      workEndHour: 18,
      workDays: "1,2,3,4,5,6", // Segunda a Sábado
      closedDates: JSON.stringify([]),
      maxConcurrentBookings: 1,
      washers: JSON.stringify([]),
      adminPhone: "66991234567" // Telefone do admin para notificações
    }
  });
  console.log("✅ Configurações gerais criadas!");
  console.log(`  - Horário de funcionamento: ${generalSettings.workStartHour}h às ${generalSettings.workEndHour}h`);
  console.log(`  - Dias de trabalho: Segunda a Sábado`);
  console.log(`  - Multi-lavador: ${generalSettings.multiWasher ? "Habilitado" : "Desabilitado"}\n`);

  // Criar alguns agendamentos de exemplo
  console.log("📅 Criando agendamentos de exemplo...");
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(14, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  const appointments = [
    {
      clientId: createdClients[0].id,
      serviceId: createdServices[0].id, // Lavagem Express
      date: tomorrow,
      status: "AGENDADO" as const,
      notes: "Cliente solicitou atenção especial nos vidros."
    },
    {
      clientId: createdClients[1].id,
      serviceId: createdServices[1].id, // Lavagem Completa
      date: dayAfterTomorrow,
      status: "AGENDADO" as const
    },
    {
      clientId: createdClients[2].id,
      serviceId: createdServices[2].id, // Polimento Premium
      date: nextWeek,
      status: "AGENDADO" as const,
      notes: "Primeira vez fazendo polimento."
    }
  ];

  const createdAppointments = [];
  for (const apt of appointments) {
    const appointment = await prisma.appointment.create({
      data: apt
    });

    // Criar pagamento para cada agendamento
    const service = createdServices.find(s => s.id === apt.serviceId);
    if (service) {
      await prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: service.price,
          status: "PENDENTE"
        }
      });
    }

    createdAppointments.push(appointment);
    const client = createdClients.find(c => c.id === apt.clientId);
    const serviceName = createdServices.find(s => s.id === apt.serviceId)?.name;
    console.log(`  ✓ ${client?.name} - ${serviceName} - ${apt.date.toLocaleString("pt-BR")}`);
  }
  console.log(`✅ ${createdAppointments.length} agendamentos criados!\n`);

  console.log("🎉 Seed concluído com sucesso!");
  console.log("\n📊 Resumo:");
  console.log(`  - 1 usuário administrador`);
  console.log(`  - ${createdServices.length} serviços`);
  console.log(`  - ${createdClients.length} clientes`);
  console.log(`  - ${createdAppointments.length} agendamentos`);
  console.log(`  - 1 configuração geral`);
  console.log("\n🔑 Credenciais de acesso:");
  console.log("   Login: admin@lavacar.com");
  console.log("   Senha: admin123\n");
}

main()
  .catch((error) => {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
