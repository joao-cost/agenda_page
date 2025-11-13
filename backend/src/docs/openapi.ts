export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Lavacar API",
    version: "1.0.0",
    description: "API para gerenciamento de agendamentos de lavagem e estética automotiva."
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Desenvolvimento"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["login", "password"],
        properties: {
          login: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "phone", "vehicle", "email", "password"],
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          vehicle: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 }
        }
      },
      AppointmentStatusUpdate: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["AGENDADO", "LAVANDO", "ENTREGUE"] }
        }
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Cadastrar novo cliente",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          "201": { description: "Cliente registrado com sucesso" },
          "400": { description: "Dados inválidos" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": { description: "Login efetuado" },
          "401": { description: "Credenciais inválidas" }
        }
      }
    },
    "/appointments": {
      get: {
        summary: "Listar agendamentos",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "date",
            in: "query",
            required: false,
            description: "Filtrar por data (YYYY-MM-DD)",
            schema: { type: "string", format: "date" }
          }
        ],
        responses: {
          "200": { description: "Lista de agendamentos" }
        }
      },
      post: {
        summary: "Criar agendamento",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serviceId", "clientId", "date"],
                properties: {
                  serviceId: { type: "string" },
                  clientId: { type: "string" },
                  date: { type: "string", format: "date-time" },
                  notes: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Agendamento criado" }
        }
      }
    },
    "/appointments/{id}/status": {
      patch: {
        summary: "Atualizar status de agendamento",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AppointmentStatusUpdate" }
            }
          }
        },
        responses: {
          "200": { description: "Agendamento atualizado" },
          "403": { description: "Acesso negado" }
        }
      }
    },
    "/clients": {
      get: {
        summary: "Listar clientes",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Clientes retornados" } }
      },
      post: {
        summary: "Cadastrar cliente",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "vehicle"],
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  vehicle: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Cliente criado" } }
      }
    },
    "/services": {
      get: {
        summary: "Listar serviços disponíveis",
        responses: { "200": { description: "Serviços retornados" } }
      }
    },
    "/reports/daily": {
      get: {
        summary: "Resumo diário",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "date",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" }
          }
        ],
        responses: { "200": { description: "Resumo gerado" } }
      }
    },
    "/reports/monthly": {
      get: {
        summary: "Resumo mensal",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "month",
            in: "query",
            required: true,
            schema: { type: "string", example: "2025-01" }
          }
        ],
        responses: { "200": { description: "Resumo gerado" } }
      }
    }
  }
};


