# ValeSafra — Frontend PWA

Frontend responsivo da plataforma ValeSafra, desenvolvido em React, Vite e TypeScript.

## Principais recursos

- Home responsiva;
- Login;
- Cadastro de produtor;
- Recuperação e redefinição de senha;
- área autenticada;
- listagem de propriedades;
- cadastro, detalhes, edição e exclusão lógica de propriedades;
- navegação responsiva desktop/tablet/mobile;
- PWA instalável;
- suporte a manifest e Service Worker;
- fallback offline para navegação estática;
- indicação de perda de conexão.

## Rotas

```text
/
/login
/cadastro
/esqueci-senha
/redefinir-senha
/propriedades
/propriedades/nova
/propriedades/:id
/propriedades/:id/editar
```

As rotas de propriedades exigem autenticação.

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

## Backend necessário para operações reais

Para autenticação e CRUD, a API deve estar disponível em `VITE_API_URL` e oferecer:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/esqueci-senha
POST /api/auth/redefinir-senha
POST /api/usuarios
GET    /api/propriedades
POST   /api/propriedades
GET    /api/propriedades/:id
PUT    /api/propriedades/:id
DELETE /api/propriedades/:id
```

## PWA e offline

A interface pode ser instalada como aplicativo em navegadores compatíveis. Em produção, publique o frontend em HTTPS.

Operações que alteram dados — login, cadastro, criação, edição e exclusão — não são executadas offline. Essa decisão evita conflitos e inconsistências sem uma estratégia explícita de sincronização.

## Segurança

O token de sessão é mantido no `sessionStorage`. Não coloque segredos ou credenciais reais em variáveis `VITE_*`, pois elas ficam acessíveis no bundle do navegador.
