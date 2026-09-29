# ForgeOps Frontend

Dashboard do ForgeOps — plataforma de monitoramento e observabilidade de APIs.
SPA React + TypeScript + Vite + TanStack Query, com tema dark estilo DevOps/SaaS,
servida por nginx com proxy same-origin `/api` para o backend.

> Este repositório é a metade frontend do projeto ForgeOps. O backend (FastAPI) vive em
> [`forgeops-backend`](https://github.com/OWNER/forgeops-backend); os dois stacks compartilham
> a rede Docker `forgeops`.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18, TypeScript 5, Vite 5 |
| Dados | TanStack Query (React Query), axios |
| Gráficos | Recharts |
| Ícones | lucide-react |
| Qualidade | ESLint (flat config), TypeScript strict, Vitest |
| Deploy | Docker (nginx), Caddy (TLS), GitHub Actions |

## Requisitos

- Node.js 20+ e npm
- Backend rodando localmente (ver [`forgeops-backend`](https://github.com/OWNER/forgeops-backend))

## Executar localmente

```bash
# 1. configure as variáveis de ambiente (nunca commite .env)
cp .env.example .env

# 2. dependências
npm ci

# 3. desenvolvimento com hot reload (http://localhost:3000)
npm run dev
```

O dev server do Vite usa o proxy configurado em `VITE_DEV_PROXY_TARGET` para encaminhar
`/api/*` ao backend (padrão `http://localhost:8000`). Sem `.env`, o `npm run dev` falha
com uma mensagem explicando o que falta.

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000, com proxy `/api`) |
| `npm run build` | Type check (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint (flat config, zero problemas) |
| `npm test` | Testes unitários (Vitest) |

## Variáveis de ambiente

O arquivo [`.env.example`](.env.example) documenta todas as variáveis:

| Variável | Onde vale | Descrição |
|----------|-----------|-----------|
| `VITE_API_URL` | build + runtime | **Base URL da API** embutida no bundle. Padrão same-origin `/api` (encaminhado pelo proxy do Vite em dev e pelo nginx no container). Uso cross-origin: `https://api.exemplo.com` |
| `VITE_DEV_PROXY_TARGET` | apenas `npm run dev` | Destino do proxy `/api` no dev server (ex.: `http://localhost:8000`) |

Não há URLs de API hardcoded no código: `src/services/api.ts` falha com mensagem clara
se `VITE_API_URL` não estiver definida.

- **Dev**: valores vêm do `.env` (carregado automaticamente pelo Vite).
- **Docker**: `VITE_API_URL` é build-arg do Dockerfile (`--build-arg VITE_API_URL=...`),
  com default `/api` compatível com o `nginx.conf` deste repositório.
- **CI/CD**: valor vem da repository variable `VITE_API_URL` (default `/api`).

## Testes e qualidade

```bash
npm run lint   # ESLint
npm test       # Vitest (12 testes em src/lib/format)
npm run build  # TypeScript strict + Vite build
```

## Docker

```bash
# uma única vez por máquina (rede compartilhada com o backend)
docker network inspect forgeops >/dev/null 2>&1 || docker network create forgeops

docker compose up -d --build     # nginx em http://localhost:80
```

O `nginx.conf` embutido serve o SPA (`try_files ... /index.html`) e encaminha
`/api/*` para `backend:8000` na rede compartilhada — o backend precisa estar no ar
(stack do [`forgeops-backend`](https://github.com/OWNER/forgeops-backend)).

### Produção (TLS)

```bash
cp .env.example .env.prod
# edite: DOMAIN=seu-dominio.example  (e FRONTEND_IMAGE se usar imagem do GHCR)

docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
```

O overlay remove as portas públicas do nginx e sobe o **Caddy**, que obtém certificado
Let's Encrypt automaticamente para `$DOMAIN` e reverse-proxy para o container nginx
(leia mais em [`deploy/Caddyfile`](deploy/Caddyfile)).

## CI (GitHub Actions)

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), em cada push/PR para `main`:

| Job | O que faz |
|-----|-----------|
| `lint` | `npm ci` + `npm run lint` |
| `test` | `npm ci` + `npm test` (Vitest) |
| `build` | `npm ci` + `npm run build` (tsc + Vite) com `VITE_API_URL` |
| `compose-validate` | `docker compose config` (base + overlay com Caddy) |
| `docker-build` | Build da imagem nginx (sem push, com build-arg) |

## CD (GitHub Actions)

Workflow [`.github/workflows/cd.yml`](.github/workflows/cd.yml):

1. **Publish** (sempre, em push para `main` ou tag `v*.*.*`):
   build (com `VITE_API_URL` da repository variable) e push da imagem para
   `ghcr.io/<owner>/forgeops-frontend` com tags `sha-<commit>`, `latest` e `<versão>`.
2. **Deploy** (somente quando a repo variable `DEPLOY_ENABLED=true`):
   sincroniza `docker-compose.yml`, `docker-compose.prod.yml` e `deploy/` via SSH,
   garante a rede `forgeops`, baixa a imagem publicada exata (`sha-<commit>`)
   e derruba/religa o stack (nginx + Caddy).

### Configuração (secrets e variables)

| Nome | Tipo | Conteúdo |
|------|------|----------|
| `DEPLOY_ENABLED` | repository **variable** | `true` para ativar o deploy |
| `VITE_API_URL` | repository **variable** | Base URL da API no build (padrão `/api`) |
| `DEPLOY_HOST` | secret | Host/IP do servidor |
| `DEPLOY_USER` | secret | Usuário SSH |
| `DEPLOY_SSH_KEY` | secret | Chave SSH privada (sem passphrase) |
| `DEPLOY_PATH` | secret | Diretório do stack no servidor (ex.: `/opt/forgeops-frontend`) |
| `DEPLOY_PORT` | secret (opcional) | Porta SSH (padrão `22`) |

### Provisionamento único do servidor

```bash
# rede compartilhada com o backend
docker network inspect forgeops >/dev/null 2>&1 || docker network create forgeops

# diretório do stack + ambiente (fora do git)
mkdir -p /opt/forgeops-frontend
$EDITOR /opt/forgeops-frontend/.env.prod   # DOMAIN, FRONTEND_IMAGE (GHCR), VITE_API_URL
```

> O backend deve estar implantado primeiro (ou ao mesmo tempo): o nginx do frontend
> resolve `backend:8000` pela rede `forgeops`.

## Arquitetura do runtime

```
Caddy (TLS, $DOMAIN) ──▶ nginx (container frontend)
                           ├── /        → SPA estática (dist/)
                           └── /api/*   → backend:8000 (rede forgeops)
```

## Estrutura do repositório

```
├── src/                  # aplicação React (components, pages, hooks, services)
├── deploy/Caddyfile      # TLS/HTTPS do domínio (overlay de produção)
├── .github/workflows/    # ci.yml e cd.yml
├── docker-compose.yml    # stack local (nginx)
├── docker-compose.prod.yml  # overlay: Caddy TLS + portas internas
├── Dockerfile            # build multi-stage (node → nginx) com ARG VITE_API_URL
├── nginx.conf            # SPA + proxy /api
├── eslint.config.js      # ESLint flat config
├── vite.config.ts        # dev server + proxy (VITE_DEV_PROXY_TARGET)
└── .env.example          # VITE_API_URL, VITE_DEV_PROXY_TARGET
```

## Licença

MIT
