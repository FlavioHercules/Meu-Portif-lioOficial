# MotionFit

Aplicativo de treino e bem-estar com autenticação, rotina personalizada, IA e integração com Supabase.

## Requisitos

- Node.js 18+
- npm
- Supabase configurado
- Python 3.11+ para a API da Artemis

## Configuração do frontend

1. Crie um arquivo `.env` na pasta `motionfit` com:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

2. Instale as dependências:

```
npm install
```

3. Inicie o app:

```
npm run dev
```

## Configuração da API da Artemis

O backend fica em `motionfit/api` e exige o arquivo `.env` com a chave do Gemini:

```
GEMINI_API_KEY=sua_chave
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite
```

## Scripts

- `npm run dev` — inicia o Vite em modo de desenvolvimento
- `npm run build` — gera a build de produção
- `npm run preview` — serve a build localmente

## Observações

- A API da Artemis não deve ser chamada no desenvolvimento local sem a chave correta configurada.
- O fluxo de assinatura é controlado com política de RLS; pagamentos reais exigem integração externa.
