const {
  defineConfig,
} = require('cypress');

const {
  config: loadEnv,
} = require('dotenv');

const path = require('node:path');

const {
  createReport,
} = require('./cypress/report.cjs');

loadEnv({
  path: '.env.cypress.local',
  quiet: true,
});

const runId = new Date()
  .toISOString()
  .replace(/[:.]/g, '-');

const dir = path.resolve(
  'cypress/resultados',
  runId
);

const roles = {
  PRODUTOR: 'produtor',
  TECNICO: 'tecnico',
  ADMIN: 'admin',
};

const env = {};
const perfis = {};

for (const [
  perfil,
  prefix,
] of Object.entries(roles)) {
  env[`${prefix}Email`] =
    process.env[`E2E_${perfil}_EMAIL`] ||
    '';

  env[`${prefix}Senha`] =
    process.env[`E2E_${perfil}_SENHA`] ||
    '';

  perfis[perfil] = Boolean(
    env[`${prefix}Email`] &&
    env[`${prefix}Senha`]
  );
}

const apiUrl = (
  process.env.E2E_API_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '');

env.apiUrl = apiUrl;

module.exports = defineConfig({
  viewportWidth: 1440,
  viewportHeight: 1000,

  defaultCommandTimeout: 15000,
  requestTimeout: 20000,
  responseTimeout: 45000,

  retries: 0,

  video:
    process.env.E2E_VIDEO === 'true',

  screenshotsFolder: path.join(
    dir,
    'screenshots'
  ),

  videosFolder: path.join(
    dir,
    'videos'
  ),

  trashAssetsBeforeRuns: false,
  screenshotOnRunFailure: true,

  env,

  expose: {
    perfisConfigurados: perfis,
  },

  e2e: {
    baseUrl:
      process.env.CYPRESS_BASE_URL ||
      'http://localhost:5173',

    specPattern:
      'cypress/e2e/**/*.cy.js',

    supportFile: false,

    setupNodeEvents(on, config) {
      const secrets = Object.entries(env)
        .filter(([key]) =>
          key.endsWith('Senha')
        )
        .map(([, value]) => value);

      const report = createReport({
        root: config.projectRoot,
        dir,
        baseUrl: config.baseUrl,
        apiUrl,
        perfis,
        secrets,
      });

      on(
        'before:run',
        () => report.start()
      );

      on('task', {
        evidencia: payload =>
          report.observation(payload),
      });

      on(
        'after:screenshot',
        details =>
          report.screenshot(details)
      );

      on(
        'after:spec',
        (spec, result) =>
          report.spec(spec, result)
      );

      on(
        'after:run',
        result =>
          report.finish(result)
      );

      return config;
    },
  },
});