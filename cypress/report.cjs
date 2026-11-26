const fs = require('node:fs');
const path = require('node:path');
const {
  execFileSync,
} = require('node:child_process');

const casos = require('./casos.json');

function html(value) {
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return String(value ?? '').replace(
    /[&<>"']/g,
    character => replacements[character]
  );
}

function csv(value) {
  return (
    '"' +
    String(value ?? '').replace(/"/g, '""') +
    '"'
  );
}

function sanitize(value, secrets = []) {
  let text = String(value ?? '');

  for (const secret of secrets.filter(Boolean)) {
    text = text
      .split(secret)
      .join('[OCULTO]');
  }

  return text
    .replace(
      /Bearer\s+\S+/gi,
      'Bearer [OCULTO]'
    )
    .replace(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      '[JWT OCULTO]'
    );
}

function status(state) {
  if (state === 'passed') return 'APROVADO';
  if (state === 'failed') return 'REPROVADO';

  return 'NAO_EXECUTADO';
}

function createReport({
  root,
  dir,
  baseUrl,
  apiUrl,
  perfis,
  secrets = [],
}) {
  let commit = 'não identificado';
  let arvoreComAlteracoes = null;

  try {
    commit = execFileSync(
      'git',
      ['rev-parse', 'HEAD'],
      {
        cwd: root,
        encoding: 'utf8',
      }
    ).trim();
  } catch {}

  try {
    arvoreComAlteracoes = Boolean(
      execFileSync(
        'git',
        ['status', '--porcelain'],
        {
          cwd: root,
          encoding: 'utf8',
        }
      ).trim()
    );
  } catch {}

  const metadata = {
    iniciadoEm: new Date().toISOString(),
    frontendCommit: commit,
    arvoreComAlteracoes,
    referenciaImplementacaoFrontend: '9487cd9',
    referenciaCodigoBackend: 'faeaf6c',
    versaoBackendImplantado:
      'Não informada por /health; a referência de código não prova a versão implantada.',
    baseUrl,
    apiUrl,
    fusoApresentacao: 'America/Sao_Paulo',
    mocks: false,
    limite:
      'Consultas reais, login/logout e validações locais. ' +
      'Sem cadastrar, editar ou excluir registros. ' +
      'CT14 espera bloqueio 403 antes de qualquer gravação.',
  };

  const rows = casos.map(c => ({
    ...c,
    status: 'NAO_EXECUTADO',

    observado:
      perfis[c.perfil] || !c.perfil
        ? 'Caso ainda não executado.'
        : 'Credenciais deste perfil não configuradas.',

    duracaoMs: null,
    evidencias: [],
  }));

  const byId = id =>
    rows.find(row => row.id === id);

  function write() {
    fs.mkdirSync(dir, {
      recursive: true,
    });

    const columns = [
      'id',
      'funcionalidade',
      'cenario',
      'perfil',
      'entrada',
      'esperado',
      'observado',
      'status',
      'duracaoMs',
    ];

    fs.writeFileSync(
      path.join(dir, 'resultados.json'),
      JSON.stringify(
        {
          metadata,
          casos: rows,
        },
        null,
        2
      )
    );

    const csvLines = [
      columns.map(csv).join(';'),

      ...rows.map(row =>
        columns
          .map(column => csv(row[column]))
          .join(';')
      ),
    ];

    fs.writeFileSync(
      path.join(dir, 'resultados.csv'),
      '\ufeff' + csvLines.join('\n')
    );

    const totals = rows.reduce(
      (acc, row) => {
        acc[row.status] =
          (acc[row.status] || 0) + 1;

        return acc;
      },
      {}
    );

    const content = rows.map(row => {
      const links = row.evidencias
        .map(
          file =>
            `<a href="${html(file)}">Captura</a>`
        )
        .join('<br>');

      return `
        <tr>
          <td>${row.id}</td>
          <td>
            ${html(row.cenario)}
            <br>
            <small>${html(row.perfil || 'Público')}</small>
          </td>
          <td>${html(row.entrada)}</td>
          <td>${html(row.esperado)}</td>
          <td>${html(row.observado)}</td>
          <td class="${row.status}">${row.status}</td>
          <td>${links}</td>
        </tr>
      `;
    }).join('');

    const inicioLocal = new Date(
      metadata.iniciadoEm
    ).toLocaleString(
      'pt-BR',
      {
        timeZone: 'America/Sao_Paulo',
      }
    );

    fs.writeFileSync(
      path.join(dir, 'relatorio.html'),
      `<!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>ValeSafra — testes Cypress</title>
        <style>
          body {
            font: 15px system-ui;
            margin: 28px;
            color: #18372b;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          td, th {
            padding: 10px;
            border: 1px solid #ccd9d1;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #e9f3ed;
          }

          .APROVADO {
            color: #127331;
          }

          .REPROVADO {
            color: #b51e24;
          }

          .NAO_EXECUTADO {
            color: #81570c;
          }

          small {
            color: #52635a;
          }

          code {
            overflow-wrap: anywhere;
          }
        </style>
      </head>
      <body>
        <h1>ValeSafra — resultados de testes</h1>

        <p>
          Início: ${html(inicioLocal)} — Brasília.
        </p>

        <p>
          Aprovados: ${totals.APROVADO || 0}
          · Reprovados: ${totals.REPROVADO || 0}
          · Não executados: ${totals.NAO_EXECUTADO || 0}
        </p>

        <p>
          Frontend: <code>${html(commit)}</code><br>
          URL: ${html(baseUrl)}<br>
          API: ${html(apiUrl)}
        </p>

        <p>${html(metadata.limite)}</p>

        <p>
          ${html(metadata.versaoBackendImplantado)}
          Ausência de medições não comprova ingestão recente.
          Não executado não equivale a aprovado.
        </p>

        <table>
          <thead>
            <tr>
              <th>Caso</th>
              <th>Cenário</th>
              <th>Entrada</th>
              <th>Esperado</th>
              <th>Obtido</th>
              <th>Resultado</th>
              <th>Evidência</th>
            </tr>
          </thead>
          <tbody>${content}</tbody>
        </table>
      </body>
      </html>`
    );
  }

  return {
    start() {
      write();
    },

    observation({
      id,
      observado,
    }) {
      const row = byId(id);

      if (row) {
        row.observado = sanitize(
          observado,
          secrets
        );
      }

      return null;
    },

    screenshot(details) {
      const id = (
        details.name || details.path
      ).match(/CT\d{2}/)?.[0];

      const row = byId(id);

      if (!row) return;

      const file = path
        .relative(dir, details.path)
        .split(path.sep)
        .join('/');

      if (!row.evidencias.includes(file)) {
        row.evidencias.push(file);
      }
    },

    spec(_spec, result) {
      for (const test of result?.tests || []) {
        const id = test.title
          .join(' ')
          .match(/CT\d{2}/)?.[0];

        const row = byId(id);

        if (!row) continue;

        row.status = status(test.state);

        row.duracaoMs =
          test.duration ??
          (test.attempts || []).reduce(
            (total, attempt) =>
              total +
              (attempt.wallClockDuration || 0),
            0
          );

        const failure =
          test.displayError ||
          test.attempts?.at(-1)?.error?.message;

        if (failure) {
          row.observado = sanitize(
            failure,
            secrets
          ).slice(0, 1500);
        } else if (
          test.state === 'passed' &&
          row.observado === 'Caso ainda não executado.'
        ) {
          row.observado =
            'Todas as verificações deste cenário passaram nesta execução.';
        }
      }

      write();
    },

    finish(result) {
      metadata.finalizadoEm =
        new Date().toISOString();

      metadata.cypress =
        result?.cypressVersion ||
        'não informado';

      metadata.browser =
        result?.browserName ||
        'não informado';

      if (result?.message) {
        metadata.erroExecucao = sanitize(
          result.message,
          secrets
        );
      }

      write();

      console.log(
        `Relatório local: ${path.join(dir, 'relatorio.html')}`
      );
    },
  };
}

module.exports = {
  createReport,
  sanitize,
  status,
  html,
};