# ValeSafra — Frontend PWA

Frontend responsivo da plataforma ValeSafra, desenvolvido em React, Vite e TypeScript.

## Principais recursos

- Home responsiva;
- Login (sem cadastro público: as contas são criadas por um administrador, e a recuperação de senha por e-mail ainda não existe);
- área autenticada;
- propriedades, culturas, lotes e sensores: listar, cadastrar, editar e excluir, sempre pela API;
- painel com alertas climáticos, últimas leituras dos sensores e preços de mercado da CONAB;
- botões de criar, editar e excluir só para os perfis ADMIN e PRODUTOR;
- navegação responsiva desktop/tablet/mobile;
- PWA instalável;
- suporte a manifest e Service Worker;
- fallback offline para navegação estática;
- indicação de perda de conexão.

## Rotas

```text
/
/login
/cadastro            (explica como solicitar acesso)
/esqueci-senha       (aviso: recuperação indisponível)
/painel
/propriedades
/propriedades/nova
/propriedades/:id
/propriedades/:id/editar
/culturas
/culturas/nova
/culturas/:id
/culturas/:id/editar
/lotes
/lotes/novo
/lotes/:id/editar
/sensores
/sensores/novo
/sensores/:id/editar
```

Todas as rotas, exceto `/`, `/login`, `/cadastro` e `/esqueci-senha`, exigem autenticação.

## Pré-requisitos

- Node.js 18.18+;
- npm.

## Instalação

```bash
npm install
```

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Configuração local:

```env
VITE_API_URL=http://localhost:3000/api
```

`VITE_API_URL` é o endereço da API (com `/api` no fim); todas as telas usam essa variável, com o token do login. Se ela faltar, o front usa `http://localhost:3000/api` só para desenvolvimento. Para apontar para um backend de teste em outra porta sem mexer no `.env`, crie um `.env.local` (ele não vai para o Git), por exemplo `VITE_API_URL=http://localhost:3001/api`.

## Desenvolvimento

```bash
npm run dev
```

Acesse:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Preview / validação de PWA

```bash
npm run preview
```

Normalmente o Vite disponibiliza:

```text
http://localhost:4173
```

## Como rodar com o backend

1. Suba o backend (`fruticultura-backend`) e confira que ele responde em `http://localhost:<porta>/api/health`.
2. Aponte `VITE_API_URL` para ele (`.env` ou `.env.local`, veja acima) e rode `npm run dev`.
3. Entre com um usuário que já exista no backend. Não há cadastro público: só um administrador cria usuários.

## Backend necessário para operações reais

A API deve estar disponível em `VITE_API_URL` e oferecer (as rotas, exceto o login, exigem `Authorization: Bearer <token>`):

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET    /api/propriedades            (e POST, GET/PUT/DELETE /:id)
GET    /api/culturas                (e POST, GET/PUT/DELETE /:id)
GET    /api/lotes                   (e POST, GET/PUT /:id, DELETE /:id?confirmar=true)
GET    /api/sensores                (e POST, GET/PUT/DELETE /:id)
GET    /api/leituras
GET    /api/alertas
GET    /api/precos?produto=&uf=
```

Observações sobre as telas do painel:

- `GET /api/alertas` pode não existir em versões antigas do backend: nesse caso o painel mostra "Alertas indisponíveis" e o restante continua funcionando.
- Os preços vêm da CONAB (`/api/precos`): só UVA, MANGA, BANANA, GOIABA e MELAO. Sem dados ou com a CONAB fora do ar, a tela mostra "Sem cotação no momento"; com dado antigo, mostra um aviso de "desatualizado". O backend precisa estar numa versão com a leitura real da CONAB (versões antigas devolviam preços inventados).
- Leituras e alertas com mais de 60 minutos aparecem com o aviso "leitura com mais de 60 min".

## PWA e offline

A interface pode ser instalada como aplicativo em navegadores compatíveis. Em produção, publique o frontend em HTTPS.

Operações que alteram dados — login, cadastro, criação, edição e exclusão — não são executadas offline. Essa decisão evita conflitos e inconsistências sem uma estratégia explícita de sincronização.

## Segurança

O token de sessão é mantido no `sessionStorage`. Não coloque segredos ou credenciais reais em variáveis `VITE_*`, pois elas ficam acessíveis no bundle do navegador.
