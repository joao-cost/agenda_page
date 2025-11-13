import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@lavacar.com";

  const existingAdmin = await prisma.user.findUnique({ where: { login: adminEmail } });

  if (!existingAdmin) {
    const hashed = await hashPassword("admin123");
    await prisma.user.create({
      data: {
        login: adminEmail,
        password: hashed,
        name: "Administrador",
        role: "ADMIN"
      }
    });
    console.log("Admin padrão criado: admin@lavacar.com / admin123");
  }

  const defaultServices = [
    {
      name: "Lavagem Express",
      description: "Limpeza externa rápida com produtos neutros.",
      price: 60,
      durationMin: 30
    },
    {
      name: "Lavagem Completa",
      description: "Interior e exterior com acabamento e hidratação.",
      price: 120,
      durationMin: 90
    },
    {
      name: "Polimento Premium",
      description: "Correção de pintura e proteção com cera premium.",
      price: 280,
      durationMin: 180
    }
  ];

  for (const service of defaultServices) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: {
        ...service,
        price: service.price
      }
    });
  }

  console.log("Serviços padrão garantidos.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


