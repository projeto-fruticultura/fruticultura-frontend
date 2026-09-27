# ValeSafra Frontend

Frontend web da plataforma **ValeSafra**, desenvolvido com React, TypeScript e Vite.

Esta versão contém a refatoração visual mais recente do projeto, com foco em comportamento de aplicação web, responsividade, acessibilidade e consistência de UX/UI.

## Tecnologias

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React
- Context API para autenticação

## Implementações disponíveis

- Home pública responsiva;
- Login integrado à API;
- Cadastro de produtor;
- Recuperação de senha;
- Redefinição de senha;
- Persistência de sessão/token;
- Rotas protegidas;
- CRUD de propriedades;
- mensagens de erro, sucesso e loading;
- estados de botão desabilitado/carregando;
- exibição e ocultação de senha;
- layout adaptável para desktop, notebook, tablet e smartphone.

## Melhorias visuais mais recentes

A interface deixou de reproduzir rigidamente os screenshots iniciais e passou a seguir um comportamento de site web responsivo.

Foram implementados:

- aproveitamento integral do viewport;
- remoção das antigas lacunas pretas externas;
- containers fluidos e limites de largura adequados;
- uso de Grid e Flexbox responsivos;
- AuthLayout redesenhado;
- melhor hierarquia de títulos, textos e ações;
- formulários com labels, feedback e foco visível;
- Home pública com hero e cards de recursos;
- página de Propriedades adaptada para desktop e mobile;
- tabela em telas grandes e cards em telas menores;
- modal de propriedades responsivo;
- melhor tratamento de imagens e backgrounds;
- footer simplificado, removendo o antigo bloco branco que aparecia no rodapé;
- melhorias de acessibilidade e navegação por teclado.

## Rotas

```text
/                         Home pública
/login                    Login
/cadastro                 Cadastro
/esqueci-senha            Recuperação de senha
/redefinir-senha?token=   Redefinição de senha
/propriedades             CRUD autenticado de propriedades
```

## Como executar apenas o Frontend

No terminal do VS Code, dentro desta pasta:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Normalmente o Vite será iniciado em:

```text
http://localhost:5173
```

## Conferir somente as telas

Para inspeção visual das páginas públicas, o Backend não precisa estar em execução.

Abra:

```text
http://localhost:5173/
http://localhost:5173/login
http://localhost:5173/cadastro
http://localhost:5173/esqueci-senha
http://localhost:5173/redefinir-senha?token=teste
```

> A rota `/propriedades` é protegida e depende de autenticação válida.

## Configuração da API

Arquivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Quando o Backend estiver ativo em `localhost:3000`, o Frontend utilizará essa URL para autenticação, cadastro, recuperação de senha e CRUD de propriedades.

## Scripts

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

## Estrutura principal

```text
src/
├── components/
│   ├── auth/
│   └── ui/
├── context/
├── pages/
│   ├── Auth/
│   ├── Home/
│   └── Propriedades/
├── routes/
├── services/
├── types/
├── App.tsx
├── index.css
└── main.tsx
```

## Observações

- Não há `node_modules` no pacote. Execute `npm install` após extrair.
- Para testar apenas as telas públicas, não é necessário PostgreSQL.
- Para testar login, cadastro e CRUD, utilize o pacote completo com Backend configurado.
