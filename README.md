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
VITE_ARTEMIS_API_URL=http://localhost:5000
```

2. Instale as dependências:

```
npm install
```

3. Aplique as migrações novas em `supabase/migrations` ao projeto Supabase antes de usar os recursos correspondentes.
   - Aplique `supabase/migrations/20261015_curated_exercise_library.sql` para atualizar o catálogo de exercícios. A migração mantém os IDs existentes quando encontra correspondências, preserva vídeos/imagens já cadastrados e desativa (sem excluir) exercícios fora da seleção inicial.
   - Aplique `supabase/migrations/20261017_exercise_catalog_display_fields.sql` para atualizar as colunas do catálogo.
   - Se `20261018_artemis_monetization.sql` foi aplicada, aplique depois `supabase/migrations/20261020_artemis_free_access.sql` para remover o limite da Artemis e desativar as políticas antigas de planos/assinaturas. Em instalações novas, use o `schema.sql` atualizado.
4. Para cadastrar vídeos de exercícios:
   - Aplique `supabase/migrations/20261014_exercise_video_storage.sql`.
   - No painel do Supabase, abra **Storage**, entre no bucket público `exercise-videos` e envie um arquivo MP4.
   - Copie a URL pública do arquivo e preencha a coluna `video_url` do exercício correspondente em **Table Editor > exercises**.
   - O vídeo será exibido automaticamente no catálogo **Movimentos** do site. Vídeos desse bucket são públicos; não envie conteúdo privado.

5. Inicie o app:

```
npm run dev
```

## Configuração da API da Artemis

O backend fica em `motionfit/api` e exige o arquivo `.env` com a chave do Gemini:

```
GEMINI_API_KEY=sua_chave
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_publica_anon
ARTEMIS_CORS_ORIGINS=https://seu-dominio.com
```

O backend valida cada bearer token via Supabase Auth. A Artemis e os demais recursos do sistema são gratuitos, sem planos, assinatura ou limite de interações por usuário. A API não precisa de uma chave `service_role`.

No desenvolvimento local, o backend usa `SUPABASE_URL` e `SUPABASE_ANON_KEY` do `api/.env`. Se não estiverem definidos, ele reutiliza `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do `.env` da raiz do projeto.

Para desenvolver sem compartilhar segredos, use os arquivos `.env.example` como modelo. No backend, configure `ARTEMIS_CORS_ORIGINS` com as origens exatas do frontend (separadas por vírgulas); a configuração padrão permite apenas localhost.

Testes focados do backend (sem chamar Gemini ou Supabase reais): `cd api` e `python -m unittest discover -s tests -v`.

## Scripts

- `npm run dev` — inicia o Vite em modo de desenvolvimento
- `npm run build` — gera a build de produção
- `npm run preview` — serve a build localmente

## Observações

- A API da Artemis não deve ser chamada no desenvolvimento local sem a chave correta configurada.
- Dados e tabelas de assinaturas antigos podem permanecer no Supabase por compatibilidade, mas não são usados pelo aplicativo.
