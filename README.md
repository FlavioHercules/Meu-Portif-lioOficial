# MotionFit

Aplicativo de treino e bem-estar com autenticação, rotina personalizada, IA e integração com Supabase.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- npm
- Supabase configurado
- Python 3.11+ para a API da Artemis

## Configuração do frontend

1. Informe estas variáveis no `.env` local lido pelo Vite. Neste checkout, `vite.config.js` define `envDir: '..'`, então o arquivo fica um nível acima da raiz do repositório:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_anon
```

Em desenvolvimento, a Artemis usa `http://localhost:5000` por padrão. Para apontar para outra API local, `VITE_ARTEMIS_API_URL` pode ser definida somente no ambiente local. Em produção, o frontend usa `/perguntas` no mesmo domínio; **não** configure `VITE_ARTEMIS_API_URL` na Vercel.

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

O backend Flask fica em `api/Artemis.py`. Em desenvolvimento, crie `api/.env`:

```
GEMINI_API_KEY=sua_chave_do_gemini
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_publica_anon
```

`GEMINI_MODEL` acima corresponde ao modelo já configurado no projeto; não use um modelo diferente sem confirmar sua disponibilidade na conta Gemini. O backend valida cada bearer token via Supabase Auth. A Artemis e os demais recursos do sistema são gratuitos, sem planos, assinatura ou limite de interações por usuário. A API não precisa de uma chave `service_role`.

O backend usa primeiro `SUPABASE_URL` e `SUPABASE_ANON_KEY` do `api/.env`. No desenvolvimento local, se não estiverem definidos, reutiliza as configurações `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existentes.

## Deploy na Vercel

Configure o projeto Vercel apontando para a raiz deste repositório, com o preset **Vite**, comando de build `npm run build` e diretório de saída `dist`. `api/index.py`, `requirements.txt` e `vercel.json` conectam o Flask ao runtime Python e encaminham `/perguntas` e `/acesso` para a função. O restante das rotas e dos arquivos estáticos continua sob responsabilidade do Vite/Vercel.

Cadastre na Vercel, nos ambientes **Production** e **Preview**:

- `GEMINI_API_KEY`: chave do Gemini; fica somente no backend, nunca em uma variável `VITE_`.
- `GEMINI_MODEL`: o mesmo modelo atualmente usado pelo projeto (`gemini-3.8-flash`) ou o modelo efetivamente configurado para sua conta.
- `SUPABASE_URL` e `SUPABASE_ANON_KEY`: necessários para validar as sessões no backend. Use a chave pública/anon do mesmo projeto Supabase do frontend, não uma `service_role`.
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: necessárias para o frontend e a autenticação Supabase.

`GEMINI_FALLBACK_MODELS` e `ARTEMIS_CORS_ORIGINS` são opcionais. A configuração CORS já permite o domínio de produção e previews atuais do projeto; adicione `ARTEMIS_CORS_ORIGINS` apenas para outras origens, separadas por vírgulas. Como a chamada de produção é same-origin, normalmente CORS não participa da requisição. Não configure `VITE_ARTEMIS_API_URL` na Vercel.

O arquivo `api/.env` continua compatível para desenvolvimento local e não deve ser enviado ao repositório. A função usa até 300 segundos, limite máximo atual também no plano Hobby; o Gemini e seus fallbacks ainda podem exceder esse limite em indisponibilidades prolongadas.

## Testes locais

Na raiz do projeto, instale as dependências do frontend e gere a build:

```
npm install
npm run build
```

Para executar os testes do backend (sem chamar Gemini ou Supabase reais):

```
cd api
python -m unittest discover -s tests -v
```

Para iniciar a API localmente no Windows:

```
cd api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ..\requirements.txt
python Artemis.py
```

Em outro terminal, na raiz do repositório, execute `npm run dev`. Para validar também o roteamento local da Vercel, use `npx vercel dev` na raiz com as variáveis de ambiente configuradas.

## Scripts

- `npm run dev` — inicia o Vite em modo de desenvolvimento
- `npm run build` — gera a build de produção
- `npm run preview` — serve a build localmente

## Observações

- A API da Artemis não deve ser chamada no desenvolvimento local sem a chave correta configurada.
- Dados e tabelas de assinaturas antigos podem permanecer no Supabase por compatibilidade, mas não são usados pelo aplicativo.
