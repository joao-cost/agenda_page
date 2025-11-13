# Lavacar Detailing – Sistema de Agendamentos

Aplicação full-stack composta por landing page institucional e painel de agendamentos para serviços de lavagem e estética automotiva.

## Visão Geral
- **Frontend**: React + Vite, TailwindCSS, Zustand, React Router.
- **Backend**: Node.js (Express), Prisma + PostgreSQL, JWT, integrações com WhatsApp Cloud.
- **Infra**: Docker Compose orquestra frontend, backend e banco.

## Requisitos
- Node.js 18+ e npm 9+ (para execução local sem Docker)
- Docker e Docker Compose (opcional, recomendável para desenvolvimento)
- Banco PostgreSQL (utilize o serviço do Docker ou instância própria)

## Primeiros Passos

1. **Instale dependências** (raiz do projeto):
   ```bash
   npm install
   npm --workspace frontend install
   npm --workspace backend install
   ```

2. **Configure variáveis de ambiente**:
   - Copie `backend/.env.example` para `backend/.env` e ajuste `DATABASE_URL`, `JWT_SECRET` e credenciais da API do WhatsApp (opcional).
   - Copie `frontend/.env.example` para `frontend/.env` e defina `VITE_API_URL` (ex.: `http://localhost:3000`).

3. **Banco de dados**:
   ```bash
   npm --workspace backend run prisma:generate
   npm --workspace backend run prisma:migrate
   npm --workspace backend run db:seed
   ```

## Executando com Docker
```bash
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api
- Documentação Swagger: http://localhost:3000/api/docs
- PostgreSQL: porta 5432 (credenciais em `docker-compose.yml`)

## Executando sem Docker
Em terminais separados ou usando scripts:
```bash
npm run dev:backend
npm run dev:frontend
```

## Scripts Úteis
| Comando | Descrição |
| --- | --- |
| `npm run dev` | Executa frontend e backend juntos (necessita `npm install` na raiz) |
| `npm run lint` | Roda linters em ambos workspaces |
| `npm run test` | Executa testes frontend + backend |
| `npm run build` | Gera builds de produção |
| `npm --workspace backend run prisma:migrate` | Cria/aplica migrations |
| `npm --workspace backend run db:seed` | Popular dados iniciais (admin + serviços) |

## Acesso Inicial
- **Administrador**: `admin@lavacar.com` / `admin123` (criado via seed)
- **Painel Admin**: `/dashboard`
- **Landing + Agendamento**: `/` e `/agendar`

## Estrutura
```
frontend/   -> SPA institucional + painel
backend/    -> API REST Express + Prisma
docker-compose.yml
README.md
```

## Integração WhatsApp
A notificação de novos agendamentos usa WhatsApp Cloud (Meta) ou provedores compatíveis.
Defina `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN` e `WHATSAPP_DEFAULT_RECIPIENT` no `.env`. Se omitidos, as notificações são apenas registradas em log.

## Testes
- Frontend: Vitest + `@testing-library/jest-dom`
- Backend: Vitest (ambiente Node)

Execute `npm run test` para rodar a suíte completa ou utilize `npm --workspace frontend run test` e `npm --workspace backend run test` separadamente.

## Deploy
- Gere imagens com `docker-compose build`
- Configure variáveis e banco (PostgreSQL) na infra escolhida (Render, Hetzner, etc.)
- Ajuste `CLIENT_BASE_URL` na API para refletir o domínio do frontend

---
Projeto acadêmico desenvolvido para demonstrar fluxo completo de agendamento automotivo com interface moderna e integrações reais.

