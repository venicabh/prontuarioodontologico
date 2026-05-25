
# Migração para Vite React estático (SPA)

## Objetivo
Eliminar TanStack Start, SSR e o worker do Cloudflare. O projeto continua React + TypeScript + Tailwind + Supabase, mas vira uma SPA pura: `npm run build` gera `dist/index.html` + assets, pronta para deploy em Vercel ou Cloudflare Pages sem configuração de servidor.

## O que muda

### Build / config
- Remover `@tanstack/react-start`, `@tanstack/start-*`, `@cloudflare/vite-plugin`, `wrangler`, `@lovable.dev/vite-tanstack-config`.
- Adicionar `@vitejs/plugin-react`.
- Novo `vite.config.ts` mínimo (plugin react + alias `@`).
- Novo `index.html` na raiz (com `<div id="root">` e meta tags básicas).
- Novo `src/main.tsx` como entry (ReactDOM.createRoot + RouterProvider).
- Apagar: `src/server.ts`, `src/start.ts`, `src/lib/error-capture.ts`, `src/lib/error-page.ts`, `wrangler.jsonc`, `supabase/config.toml` permanece (só backend).
- `package.json`: scripts `dev`, `build` (= `vite build`), `preview`.

### Roteamento
- Manter TanStack Router (versão SPA, sem Start) usando o plugin `@tanstack/router-plugin/vite` que continua gerando `routeTree.gen.ts` a partir de `src/routes/`. Isso evita reescrever cada rota.
- `src/router.tsx` cria o router e `main.tsx` faz `<RouterProvider router={...} />`.
- `__root.tsx` perde `shellComponent`, `HeadContent`, `Scripts` e o import `styles.css?url` (CSS passa a ser importado em `main.tsx`). Mantém Outlet, providers, NotFound/Error.
- `head: () => ({...})` continua funcionando para títulos no client.

### Supabase / Auth
- Apagar arquivos server-only: `src/integrations/supabase/auth-middleware.ts`, `client.server.ts`, `auth-attacher.ts`.
- `src/integrations/supabase/client.ts` simplificado: só `import.meta.env.VITE_*`, sem fallback `process.env`.
- `src/hooks/use-auth.tsx` já é client-side puro — mantém.
- Nenhuma rota usa `createServerFn` hoje, então não há lógica de servidor a reescrever. Todas as chamadas Supabase continuam direto do componente com RLS.

### SEO / meta
- Tags básicas vão no `index.html`.
- Tags dinâmicas por rota: usar `react-helmet-async` (pequeno) OU manter `head()` do TanStack Router (que funciona em SPA setando `document.title` etc.). Vou usar a abordagem do próprio router para não adicionar dependência.

### Deploy
- **Vercel**: detecta Vite automaticamente. Adicionar `vercel.json` com rewrite `/* → /index.html` para SPA fallback.
- **Cloudflare Pages**: build command `npm run build`, output `dist`. Adicionar `public/_redirects` com `/* /index.html 200`.

## Estrutura de tarefas
1. Atualizar dependências (remover Start/Cloudflare, adicionar plugin-react).
2. Criar `index.html`, `src/main.tsx`, novo `vite.config.ts`.
3. Reescrever `src/router.tsx` para SPA.
4. Limpar `src/routes/__root.tsx` (sem shell/Scripts).
5. Apagar arquivos server (`server.ts`, `start.ts`, `error-*`, supabase server clients, `auth-attacher`, `auth-middleware`, `wrangler.jsonc`).
6. Simplificar `supabase/client.ts`.
7. Adicionar `vercel.json` e `public/_redirects`.
8. Ajustar `package.json` (scripts + deps).

## O que NÃO muda
- Toda a UI, componentes, formulários, lógica de páginas (`pacientes`, `agenda`, `prontuarios`, `materiais`, etc.).
- Tabelas, migrations e RLS do Supabase.
- Tailwind / design system / shadcn.
- Autenticação (continua via Supabase client no browser).

## Observações
- O backend Lovable Cloud (Supabase) continua funcionando normalmente — a SPA fala direto com ele via `VITE_SUPABASE_*`.
- Tanto Vercel quanto Cloudflare Pages precisam das envs `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` configuradas no painel de cada plataforma.
- Como é SPA pura, não há mais SSR — primeiro carregamento mostra tela em branco até o JS hidratar (comportamento padrão de Vite+React).

Posso seguir?
