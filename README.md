# ForgeOps Frontend

Dashboard do ForgeOps — plataforma de monitoramento e observabilidade de APIs.
SPA React + TypeScript + Vite + TanStack Query, com tema dark estilo DevOps/SaaS.

**Arquitetura 100% client-side:** não há backend. Todos os dados (monitores,
checks, incidentes) vivem no `localStorage` do navegador, os health checks são
executados pelo próprio browser e a aplicação é hospedada como site estático
(Vercel).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18, TypeScript 5, Vite 5 |
| Dados | TanStack Query (React Query) + `localStorage` |
| Gráficos | Recharts |
| Ícones | lucide-react |
| Qualidade | ESLint (flat config), TypeScript strict, Vitest |
| Deploy | Vercel (site estático), GitHub Actions |

## Requisitos

- Node.js 20+ e npm

Nada mais: sem backend, sem variáveis de ambiente, sem Docker.

## Executar localmente

```bash
npm ci        # dependências
npm run dev   # hot reload em http://localhost:3000
```

Na primeira carga a aplicação semeia o `localStorage` com dados de exemplo
(3 monitores, ~1 semana de checks e incidentes derivados). Para recomeçar do
zero, limpe os dados do site no navegador ou execute `resetDatabase()` no
console.

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Type check (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint (flat config, zero problemas) |
| `npm test` | Testes unitários (Vitest) |

## Variáveis de ambiente

Nenhuma. O app não chama nenhuma API própria — a remoção de `VITE_API_URL` /
`VITE_DEV_PROXY_TARGET` é intencional.

## Como os dados funcionam

- **Persistência**: tudo em `localStorage` sob a chave `forgeops.db.v1`
  (schema versionado `version: 1`; dados corrompidos ou de outra versão
  disparam novo seed). O limite de ~5MB é administrado com poda automática do
  histórico (máx. 5.000 checks).
- **Seed**: 3 monitores de exemplo com ~1 semana de histórico gerado
  deterministicamente em relação ao momento da primeira visita.
- **Health checks**: `src/lib/healthCheck.ts` usa `fetch` do navegador com
  timeout configurado no monitor. Como o browser não lê status de respostas
  bloqueadas por CORS, uma segunda tentativa em modo `no-cors` confirma se o
  host está no ar (status HTTP fica `null` nesse caso). Sites inacessíveis
  (DNS/conexão) são classificados como `down`.
- **Verificação automática**: enquanto a aba estiver aberta, um loop de 30s
  (`src/hooks/useAutoChecks.ts`) executa os monitores ativos cujo intervalo
  venceu — ou seja, os checks só acontecem com a aplicação aberta.
- **Incidentes**: abrem na primeira falha e são resolvidos automaticamente
  quando o monitor volta ao ar (`src/lib/stats.ts`).

## Testes e qualidade

```bash
npm run lint   # ESLint
npm test       # Vitest (35 testes: format, stats e storage)
npm run build  # TypeScript strict + Vite build
```

## CI (GitHub Actions)

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), em cada push/PR para `main`:

| Job | O que faz |
|-----|-----------|
| `lint` | `npm ci` + `npm run lint` |
| `test` | `npm ci` + `npm test` (Vitest) |
| `build` | `npm ci` + `npm run build` (tsc + Vite) |

## Deploy (Vercel)

1. Importe o repositório no Vercel (framework detectado: Vite).
2. Nenhuma variável de ambiente é necessária.
3. O [`vercel.json`](vercel.json) aponta todas as rotas para `index.html`
   (fallback de SPA), então deep links como `/monitors/:id` funcionam direto.

Alternativa estática: `npm run build` e publique a pasta `dist/` em qualquer
host estático.

## Estrutura do repositório

```
├── src/
│   ├── components/       # Layout (shell), cards, badges, modal
│   ├── hooks/            # React Query sobre o storage local
│   ├── lib/              # stats (funções puras), healthCheck, format
│   ├── pages/            # Dashboard, Monitores, Detalhe, Incidentes
│   ├── services/         # storage.ts (localStorage + seed)
│   ├── types/            # interfaces compartilhadas
│   ├── App.tsx           # rotas
│   └── main.tsx          # entry point
├── .github/workflows/    # ci.yml
├── vercel.json           # fallback de SPA
├── eslint.config.js      # ESLint flat config
└── vite.config.ts        # dev server
```

## Licença

MIT
