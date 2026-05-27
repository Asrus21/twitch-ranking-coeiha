# asrus.app — Twitch Ponto

Next.js + Vercel KV + integração com widget StreamElements.

- Site no domínio `asrus.app/twitch/coeiha`
- API `POST /api/ponto` recebe o ponto do widget e armazena no KV
- Ranking ao vivo, modo claro/escuro, PT/EN
- Status da Twitch ao vivo embedado

## Setup rápido

### 1. Subir o projeto no GitHub

```bash
git init
git add .
git commit -m "init"
git remote add origin <seu-repo>
git push -u origin main
```

### 2. Importar no Vercel

1. Acesse https://vercel.com/new
2. Importe o repositório
3. Deploy (vai falhar a primeira vez por falta de KV — normal)

### 3. Criar o Vercel KV

1. No dashboard do projeto na Vercel → aba **Storage** → **Create Database**
2. Escolha **KV** (Redis)
3. Conecte ao projeto. Isso popula automaticamente `KV_REST_API_URL` e `KV_REST_API_TOKEN` nas env vars.

### 4. Configurar env vars

Em **Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `ADMIN_PASSWORD` | senha forte que **só você** sabe — usada pra resetar o ranking |
| `WIDGET_KEY` | string aleatória qualquer (gera em https://1password.com/password-generator) |
| `TWITCH_CLIENT_ID` | Client ID do seu app em https://dev.twitch.tv/console/apps |
| `TWITCH_CLIENT_SECRET` | Client Secret do mesmo app |

> Pra criar app na Twitch: dev.twitch.tv/console → Register Your Application → OAuth Redirect URL pode ser `http://localhost`, Category: **Application Integration**. Depois copie Client ID e gere Secret.

### 5. Redeploy

Aba **Deployments** → "..." no último deploy → **Redeploy**. Agora vai funcionar.

### 6. Apontar `asrus.app` pro projeto

Em **Settings → Domains** adicione `asrus.app` e siga as instruções de DNS.

A rota `/twitch/coeiha` já estará acessível em `https://asrus.app/twitch/coeiha`.

### 7. Atualizar o widget no StreamElements

Na pasta `widget/`:

- `widget.html` → painel HTML
- `widget.css` → painel CSS  
- `widget.js` → painel JS — **EDITE 2 LINHAS NO TOPO**:
  ```js
  const API_URL = 'https://asrus.app/api/ponto';
  const WIDGET_KEY = 'cole_aqui_o_mesmo_valor_da_env_var_WIDGET_KEY';
  ```
- `fields.json` → painel FIELDS

### 8. Adicionar logo do canal

Coloque um PNG/JPG quadrado em `public/logo.png` (ou troque o `src` em `components/Header.tsx`).

## Como funciona

- Quando alguém digita `!ponto` no chat:
  1. Widget mostra o overlay na OBS (igual antes)
  2. Widget envia `POST` pra `/api/ponto` com `username`, `displayName`, `avatar`
  3. API armazena no KV (ranking é sorted-set Redis — operação atômica e rápida)
  4. Site recarrega ranking a cada 15s automaticamente
- Reset: no site, clique em **Admin** → digite a senha → confirma. Apaga tudo e marca o timestamp do reset.

## Dev local

```bash
npm install
cp .env.example .env.local
# preencha as vars
npm run dev
```

Pra rodar com KV local, instale Redis ou use o [Upstash Redis](https://upstash.com) (compatível com `@vercel/kv`).

## Custos

- Vercel Hobby: grátis
- Vercel KV grátis: 30k commands/dia + 256MB — mais que suficiente
- Twitch API: grátis

## Estrutura

```
app/
  page.tsx                    # redirect to /twitch/coeiha
  layout.tsx
  globals.css
  twitch/coeiha/page.tsx      # main page
  api/
    ponto/route.ts            # POST - register a !ponto
    ranking/route.ts          # GET - ranking + meta
    reset/route.ts            # POST - admin reset
    twitch-status/route.ts    # GET - is the channel live?
components/
  AppProvider.tsx             # theme + i18n context
  Header.tsx                  # logo, nav, theme/lang toggle
  Hero.tsx
  About.tsx
  Ranking.tsx                 # podium + table + admin modal
  Live.tsx                    # Twitch embed
  Footer.tsx
lib/
  i18n.ts                     # PT/EN translations
  kv.ts                       # KV helper functions
widget/
  widget.html / .css / .js / fields.json   # SE widget panels
```
