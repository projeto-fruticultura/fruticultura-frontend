# PI Vale do São Francisco — Frontend/PWA

Frontend da plataforma de monitoramento climático e logístico da fruticultura do Vale do São Francisco.

## Sobre o projeto

Este repositório contém a interface utilizada por produtores, analistas e administradores para cadastrar, consultar e visualizar informações sobre propriedades, culturas, lotes, sensores e condições climáticas.

O frontend será publicado no Netlify e consumirá exclusivamente a API REST do backend.

## Objetivo

Desenvolver uma aplicação web responsiva capaz de:

- autenticar usuários;
- cadastrar produtores, propriedades, culturas e lotes;
- cadastrar e consultar sensores;
- apresentar leituras de temperatura e umidade;
- exibir dados meteorológicos da NASA POWER;
- apresentar gráficos, filtros, indicadores e alertas;
- funcionar adequadamente em computadores e dispositivos móveis.

## Arquitetura

```text
Usuário
   ↓
Frontend/PWA no Netlify
   ↓ HTTPS/REST/JSON
Backend/API REST no Render
   ↓
PostgreSQL no Render
```

O frontend não acessará diretamente:

- o banco PostgreSQL;
- a NASA POWER API;
- o simulador Wokwi;
- os sensores;
- credenciais ou regras internas do sistema.

Todas essas comunicações serão intermediadas pelo backend.

## Tecnologias

- React;
- Vite;
- JavaScript ou TypeScript;
- React Router;
- Recharts;
- Fetch API ou Axios;
- HTML;
- CSS;
- Netlify;
- Git e GitHub.

## Funcionalidades planejadas

### Autenticação

- login;
- logout;
- armazenamento do token de autenticação;
- proteção de rotas;
- direcionamento conforme o perfil do usuário.

### Cadastros

- usuários;
- produtores ou empresas;
- propriedades;
- culturas;
- lotes;
- sensores;
- dados de mercado;
- informações logísticas.

### Monitoramento climático

- consulta das leituras dos sensores;
- consulta dos dados meteorológicos da NASA;
- temperatura atual;
- umidade atual;
- médias por período;
- quantidade de sensores ativos;
- histórico de leituras;
- filtros por propriedade, cultura, lote, sensor e período;
- alertas climáticos.

### Dashboard

- indicadores climáticos;
- gráficos de temperatura;
- gráficos de umidade;
- situação dos sensores;
- alertas;
- comparação entre períodos;
- visualização responsiva.

## Estrutura planejada

```text
src/
├── assets/
├── components/
├── contexts/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── styles/
├── tests/
├── App.tsx
└── main.tsx
```

## Responsáveis principais

- **Integrante 1:** frontend, componentes, páginas e responsividade;
- **Integrante 2:** dashboard, gráficos, filtros e integração com a API.

Os demais integrantes também deverão:

- implementar componentes;
- corrigir defeitos;
- revisar pull requests;
- executar testes;
- ajudar na integração;
- atualizar a documentação.

## Pré-requisitos

- Node.js;
- npm;
- Git;
- backend em execução ou publicado.

## Instalação

```bash
git clone URL_DO_REPOSITORIO
cd pi-vale-frontend
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Não publique o arquivo `.env` no GitHub.

## Execução local

```bash
npm run dev
```

Após iniciar, acesse o endereço apresentado no terminal.

## Build

```bash
npm run build
```

## Testes

```bash
npm test
```

O comando poderá ser ajustado após a definição da ferramenta de testes.

## Deploy

O frontend será publicado no Netlify.

No ambiente publicado, a variável `VITE_API_BASE_URL` deverá apontar para o endereço do backend hospedado no Render.

## Padrão de contribuição

1. Criar uma branch para a tarefa.
2. Implementar e testar a alteração.
3. Fazer commits objetivos.
4. Enviar a branch ao GitHub.
5. Abrir um pull request.
6. Solicitar revisão de outro integrante.
7. Integrar somente após a validação.

## Status

Projeto em fase inicial de desenvolvimento.
