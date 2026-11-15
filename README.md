# Ovy

Transforme áudios em textos editáveis, organizados e prontos para usar. Micro SaaS de transcrição em português, construído com Next.js, Turso (Drizzle ORM), Auth.js, Replicate (Whisper) e Stripe.

## Stack

- **Next.js 16** (App Router) na Vercel
- **Turso** (libSQL) + **Drizzle ORM**
- **Auth.js v5** — login com Google e magic link (Resend)
- **Replicate** — transcrição via `incredibly-fast-whisper`
- **Stripe** — assinatura do plano Pro

## Desenvolvimento local

```bash
cp .env.example .env.local
# preencha as variáveis
npm install
npm run db:push   # aplica o schema no Turso
npm run dev
```

## Variáveis de ambiente

Veja `.env.example` para a lista completa (Turso, Auth.js, Replicate, Stripe).

## Deploy

Projeto pensado para deploy contínuo na Vercel a partir do GitHub. Configure as variáveis de ambiente no painel da Vercel e aponte o webhook do Stripe para `/api/billing/webhook`.
