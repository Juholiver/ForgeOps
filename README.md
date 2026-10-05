# ForgeOps Frontend

Dashboard do ForgeOps — plataforma de monitoramento e observabilidade de APIs.
SPA React + TypeScript + Vite + TanStack Query, com tema dark estilo DevOps/SaaS.

**SPA autenticada via Google:** o app consome a API do backend
[`ForgeOps-BackEnd`](https://github.com/Juholiver/ForgeOps-BackEnd)
(REST + JWT). O login é exclusivamente **Google OAuth 2.0** — o backend
redireciona o callback para `/auth/callback` com os tokens, que ficam salvos no
`localStorage` (`access_token` / `refresh_token`). Todos os dados de monitores,
checks e incidentes vêm da API, isolados por usuário no backend.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18, TypeScript 5, Vite 5 |
| Dados | TanStack Query (React Query) sobre a API REST + axios |
| Auth | Google OAuth 2.0 (redirect), JWT access+refresh |
| Gráficos | Recharts |
| Ícones | lucide-react |
| Qualidade | ESLint (flat config), TypeScript strict, Vitest + Testing Library (jsdom) |
| Deploy | Vercel (site estático), GitHub Actions |

## Requisitos

- Node.js 20+ e npm
- Backend rodando (veja o repositório do backend) com
  `CORS_ORIGINS` incluindo `http://localhost:3000`
- Credenciais Google OAuth no backend (Etapa "Autenticação" do README do backend)

## Executar localmente

```bash
npm ci                # dependências
cp .env.example .env  # VITE_API_URL=http://localhost:8000
npm run dev           # hot reload em http://localhost:3000
```

Acesse `http://localhost:3000` — sem sessão você é redirecionado para
`/login`; o botão "Entrar com Google" inicia o fluxo no backend.

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Type check (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint (flat config, zero problemas) |
| `npm test` | Testes unitários (Vitest + Testing Library) |

## Variáveis de ambiente

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `VITE_API_URL` | `http://localhost:8000` | Base URL da API (obrigatória; o build falha em runtime sem ela) |

Defina em `.env` (local, copie de `.env.example`) ou nas env vars do Vercel.

## Autenticação

- **`/login`** (pública): botão "Entrar com Google" → `GET {VITE_API_URL}/auth/google`
  no backend → consentimento Google → `/auth/callback`.
- **`/auth/callback`** (pública): lê `?access_token&refresh_token` da URL,
  grava no `localStorage` e entra no dashboard. Sem tokens → volta para
  `/login?error=oauth`.
- **Rotas protegidas** (`/`, `/monitors`, `/monitors/:id`, `/incidents`):
  `ProtectedRoute` mostra loading enquanto valida a sessão via `GET /auth/me`
  e redireciona para `/login` se não houver usuário.
- **Sessão**: no reload o `AuthContext` recupera o `access_token` e valida com
  `/auth/me`. Em `401` o interceptor tenta `POST /auth/refresh` uma vez e, se
  falhar, limpa os tokens e envia para `/login`.
- **Logout**: menu do usuário (canto superior direito) → "Sair da conta".

## Testes e qualidade

```bash
npm run lint   # ESLint
npm test       # Vitest (18 testes: format + fluxos de auth em jsdom)
npm run build  # TypeScript strict + Vite build
```

Os testes de auth cobrem: rota protegida sem sessão → `/login`, recuperação de
sessão via `/auth/me`, callback com/sem tokens, erro do Google e logout.

## CI (GitHub Actions)

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), em cada push/PR para `main`:

| Job | O que faz |
|-----|-----------|
| `lint` | `npm ci` + `npm run lint` |
| `test` | `npm ci` + `npm test` (Vitest) |
| `build` | `npm ci` + `npm run build` (tsc + Vite) |

## Deploy (Vercel)

1. Importe o repositório no Vercel (framework detectado: Vite).
2. Configure a env var **`VITE_API_URL`** com a URL pública do backend
   (build-time — sem ela o app exibe erro de configuração).
3. No backend, inclua a URL da Vercel em `CORS_ORIGINS` e em
   `FRONTEND_URL` (o callback do OAuth redireciona para
   `https://<vercel>/auth/callback`).
4. O [`vercel.json`](vercel.json) aponta todas as rotas para `index.html`
   (fallback de SPA), então deep links como `/monitors/:id` funcionam direto.

## Estrutura do repositório

```
├── src/
│   ├── components/       # Layout (shell), ProtectedRoute, cards, badges, modal
│   ├── context/          # AuthContext (sessão Google + /auth/me)
│   ├── hooks/            # React Query sobre a API REST
│   ├── lib/              # format (funções puras)
│   ├── pages/            # Dashboard, Monitores, Detalhe, Incidentes, Login, AuthCallback
│   ├── services/         # api.ts (axios + interceptors JWT)
│   ├── test/             # setup do Vitest + testes de auth
│   ├── types/            # interfaces compartilhadas
│   ├── App.tsx           # rotas públicas/privadas
│   └── main.tsx          # entry point
├── .github/workflows/    # ci.yml
├── vercel.json           # fallback de SPA
├── eslint.config.js      # ESLint flat config
└── vite.config.ts        # dev server + config do Vitest
```

## Licença

MIT
