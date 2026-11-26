import casos from '../casos.json'

const TOKEN = 'valesafra:token'

const prefixos = {
  PRODUTOR: 'produtor',
  TECNICO: 'tecnico',
  ADMIN: 'admin',
}

const disponiveis = Cypress.expose(
  'perfisConfigurados'
)

function caso(id, fn) {
  const c = casos.find(
    item => item.id === id
  )

  const executar =
    !c.perfil ||
    disponiveis[c.perfil]

  const registrar = executar
    ? it
    : it.skip

  registrar(
    `${id} | ${c.cenario}`,
    fn
  )
}

function observado(id, message) {
  return cy.task(
    'evidencia',
    {
      id,
      observado: message,
    },
    {
      log: false,
    }
  )
}

function interceptar(
  method,
  pathname,
  alias
) {
  // Somente observa as chamadas reais.
  // Não devolve fixtures ou respostas simuladas.
  cy.intercept({
    method,
    pathname: `/api${pathname}`,
  }).as(alias)
}

function visitarLista(
  url,
  alias,
  pathname = url
) {
  interceptar(
    'GET',
    pathname,
    alias
  )

  cy.visit(url)

  return cy.wait(
    `@${alias}`
  ).then(({ response }) => {
    expect(
      response?.statusCode,
      `GET ${pathname}`
    ).to.eq(200)

    expect(
      response.body,
      'Lista devolvida pela API'
    ).to.be.an('array')

    return response.body
  })
}

function credenciais(perfil) {
  const prefix = prefixos[perfil]

  return cy.env([
    `${prefix}Email`,
    `${prefix}Senha`,
  ]).then(values => ({
    email:
      values[`${prefix}Email`],

    senha:
      values[`${prefix}Senha`],
  }))
}

function entrar(
  perfil = 'PRODUTOR'
) {
  return cy.session(
    [
      perfil,
      Cypress.config('baseUrl'),
    ],

    () => {
      cy.env([
        'apiUrl',
      ]).then(({ apiUrl }) => {
        credenciais(
          perfil
        ).then(({ email, senha }) => {
          cy.request({
            method: 'POST',
            url: `${apiUrl}/auth/login`,
            body: {
              email,
              senha,
            },
            failOnStatusCode: false,
            log: false,
          }).then(({ status, body }) => {
            expect(status).to.eq(200)

            expect(
              body.usuario.perfil
            ).to.eq(perfil)

            expect(
              typeof body.token
            ).to.eq('string')

            cy.visit('/', {
              onBeforeLoad(win) {
                win.sessionStorage.setItem(
                  TOKEN,
                  body.token
                )
              },
            })

            cy.location(
              'pathname'
            ).should(
              'eq',
              '/painel'
            )
          })
        })
      })
    },

    {
      validate() {
        interceptar(
          'GET',
          '/auth/me',
          'validarSessao'
        )

        cy.visit('/painel')

        cy.wait(
          '@validarSessao'
        ).then(({ response }) => {
          expect(
            response.statusCode
          ).to.eq(200)

          expect(
            response.body.usuario.perfil
          ).to.eq(perfil)
        })

        cy.location(
          'pathname'
        ).should(
          'eq',
          '/painel'
        )
      },
    }
  )
}

function api(
  path,
  options = {}
) {
  return cy.window({
    log: false,
  }).then(win => {
    const token =
      win.sessionStorage.getItem(TOKEN)

    return cy.env([
      'apiUrl',
    ]).then(({ apiUrl }) =>
      cy.request({
        url: `${apiUrl}${path}`,

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        failOnStatusCode: false,
        log: false,
        ...options,
      })
    )
  })
}

function primeiro(
  lista,
  mensagem
) {
  expect(
    lista.length,
    mensagem
  ).to.be.greaterThan(0)

  return lista[0]
}

afterEach(function () {
  const id = this.currentTest
    ?.title.match(/CT\d{2}/)?.[0]

  if (
    this.currentTest?.state === 'passed' &&
    id
  ) {
    cy.screenshot(id, {
      capture: 'viewport',
      blackout: [
        'input[type="password"]',
      ],
    })
  }
})

describe(
  'ValeSafra — main — API real e interface',

  () => {
    caso('CT01', () => {
      cy.visit('/painel')

      cy.location(
        'pathname'
      ).should('eq', '/')

      cy.get(
        '#login-email'
      ).should('be.visible')

      cy.contains(
        'h1',
        'Entrar no ValeSafra'
      ).should('be.visible')

      observado(
        'CT01',
        'Painel sem sessão redirecionou para /; formulário de login visível.'
      )
    })

    caso('CT02', () => {
      let chamadas = 0

      cy.intercept({
        method: 'POST',
        pathname: '/api/auth/login',
      }, () => {
        chamadas++
      })

      cy.visit('/')

      cy.contains(
        'button',
        /^Entrar$/
      ).click()

      cy.contains(
        '[role="alert"]',
        'Preencha e-mail e senha para continuar.'
      ).should('be.visible')

      cy.then(() =>
        expect(
          chamadas,
          'POSTs de login'
        ).to.eq(0)
      )

      observado(
        'CT02',
        'Campos vazios bloqueados pela interface; nenhum POST de login enviado.'
      )
    })

    caso('CT03', () => {
      interceptar(
        'POST',
        '/auth/login',
        'loginInvalido'
      )

      cy.visit('/')

      credenciais(
        'PRODUTOR'
      ).then(({ email }) => {
        cy.get(
          '#login-email'
        ).type(email, {
          log: false,
        })

        cy.get(
          '#login-senha'
        ).type(
          'senha-propositalmente-incorreta-cypress',
          {
            log: false,
          }
        )
      })

      cy.contains(
        'button',
        /^Entrar$/
      ).click()

      cy.wait(
        '@loginInvalido'
      ).its(
        'response.statusCode'
      ).should('eq', 401)

      cy.get(
        '[role="alert"]'
      )
        .should('be.visible')
        .and('not.be.empty')

      cy.location(
        'pathname'
      ).should('eq', '/')

      observado(
        'CT03',
        'Login real rejeitado com HTTP 401; erro exibido e usuário permaneceu no login.'
      )
    })

    caso('CT04', () => {
      interceptar(
        'POST',
        '/auth/login',
        'loginValido'
      )

      cy.visit('/')

      credenciais(
        'PRODUTOR'
      ).then(({ email, senha }) => {
        cy.get(
          '#login-email'
        ).type(email, {
          log: false,
        })

        cy.get(
          '#login-senha'
        ).type(senha, {
          log: false,
        })
      })

      cy.contains(
        'button',
        /^Entrar$/
      ).click()

      cy.wait(
        '@loginValido'
      ).then(({ response }) => {
        expect(
          response.statusCode
        ).to.eq(200)

        expect(
          response.body.usuario.perfil
        ).to.eq('PRODUTOR')
      })

      cy.location(
        'pathname'
      ).should(
        'eq',
        '/painel'
      )

      cy.contains(
        'h1',
        'Olá,'
      ).should('be.visible')

      cy.window({
        log: false,
      }).then(win => {
        expect(
          Boolean(
            win.sessionStorage.getItem(TOKEN)
          )
        ).to.eq(true)
      })

      observado(
        'CT04',
        'Login 200; perfil PRODUTOR; token armazenado e painel do produtor exibido.'
      )
    })

    caso('CT05', () => {
      entrar()

      cy.visit('/painel')

      interceptar(
        'GET',
        '/auth/me',
        'sessao'
      )

      cy.reload()

      cy.wait(
        '@sessao'
      ).its(
        'response.statusCode'
      ).should('eq', 200)

      cy.location(
        'pathname'
      ).should(
        'eq',
        '/painel'
      )

      cy.contains(
        'h1',
        'Olá,'
      ).should('be.visible')

      observado(
        'CT05',
        'GET /auth/me 200 após recarregamento; sessão mantida.'
      )
    })

    caso('CT06', () => {
      entrar()

      visitarLista(
        '/propriedades',
        'propriedades'
      ).then(lista => {
        const item = primeiro(
          lista,
          'Pré-condição: produtor possui propriedade cadastrada'
        )

        cy.get(
          'input[type="search"]'
        )
          .clear()
          .type(item.nome)

        cy.contains(
          item.nome
        ).should('be.visible')

        observado(
          'CT06',
          `GET /propriedades 200; ${lista.length} registros. Propriedade ID ${item.id} encontrada na interface.`
        )
      })
    })

    caso('CT07', () => {
      entrar()

      visitarLista(
        '/propriedades',
        'propriedades'
      )

      cy.get(
        'input[type="search"]'
      ).type(
        'cypress-termo-inexistente-7b84c2'
      )

      cy.contains(
        'Nenhuma propriedade encontrada'
      ).should('be.visible')

      observado(
        'CT07',
        'Busca sem correspondência exibiu estado vazio, sem erro de API.'
      )
    })

    caso('CT08', () => {
      entrar()

      visitarLista(
        '/propriedades',
        'propriedades'
      ).then(lista => {
        const item = primeiro(
          lista,
          'Pré-condição: propriedade para abrir edição'
        )

        cy.get(
          'input[type="search"]'
        ).type(item.nome)

        interceptar(
          'GET',
          `/propriedades/${item.id}`,
          'propriedadeDetalhe'
        )

        cy.get(
          `a[href="/propriedades/${item.id}/editar"]`
        )
          .filter(':visible')
          .first()
          .click()

        cy.location(
          'pathname'
        ).should(
          'eq',
          `/propriedades/${item.id}/editar`
        )

        cy.wait(
          '@propriedadeDetalhe'
        ).its(
          'response.statusCode'
        ).should('eq', 200)

        cy.get(
          'input[id$="-nome"]'
        ).should(
          'have.value',
          item.nome
        )

        observado(
          'CT08',
          `Link abriu /propriedades/${item.id}/editar e formulário corresponde à propriedade. Nenhum PUT enviado.`
        )
      })
    })

    caso('CT09', () => {
      entrar()

      let chamadas = 0

      cy.intercept({
        method: 'POST',
        pathname: '/api/propriedades',
      }, () => {
        chamadas++
      })

      cy.visit(
        '/propriedades/nova'
      )

      cy.contains(
        'button',
        'Cadastrar propriedade'
      ).click()

      cy.contains(
        'Informe um nome com pelo menos 3 caracteres.'
      ).should('be.visible')

      cy.contains(
        'Informe uma área maior que zero.'
      ).should('be.visible')

      cy.contains(
        'Informe a cidade.'
      ).should('be.visible')

      cy.then(() =>
        expect(chamadas).to.eq(0)
      )

      observado(
        'CT09',
        'Nome, área e cidade inválidos sinalizados; nenhum POST de cadastro enviado.'
      )
    })

    caso('CT10', () => {
      entrar()

      interceptar(
        'GET',
        '/propriedades',
        'propriedadesDoLote'
      )

      visitarLista(
        '/lotes',
        'lotes'
      ).then(lista => {
        const lote = primeiro(
          lista,
          'Pré-condição: produtor possui lote cadastrado'
        )

        cy.wait(
          '@propriedadesDoLote'
        ).its(
          'response.statusCode'
        ).should('eq', 200)

        cy.get(
          'select[aria-label="Filtrar por propriedade"]'
        )
          .select(
            String(lote.propriedadeId)
          )
          .should(
            'have.value',
            String(lote.propriedadeId)
          )

        cy.get(
          'input[aria-label="Buscar lote, fazenda ou cultura"]'
        ).type(lote.identificacao)

        cy.contains(
          lote.identificacao
        ).should('be.visible')

        observado(
          'CT10',
          `GET /lotes 200; filtro selecionou propriedade ${lote.propriedadeId} e lote ${lote.id} ficou visível.`
        )
      })
    })

    caso('CT11', () => {
      entrar()

      visitarLista(
        '/sensores',
        'sensores'
      ).then(lista => {
        const sensor = primeiro(
          lista,
          'Pré-condição: produtor possui sensor cadastrado'
        )

        cy.get(
          'input[aria-label="Buscar sensor por código, lote ou localização"]'
        ).type(sensor.codigo)

        cy.contains(
          sensor.codigo
        ).should('be.visible')

        observado(
          'CT11',
          `GET /sensores 200; sensor ${sensor.id}, código ${sensor.codigo}, encontrado na interface.`
        )
      })
    })

    caso('CT12', () => {
      entrar()

      visitarLista(
        '/sensores',
        'sensores'
      ).then(lista => {
        const sensor = primeiro(
          lista,
          'Pré-condição: sensor para consultar leituras'
        )

        api(
          `/sensores/${sensor.id}/leituras?periodo=24h`
        ).then(({ status, body }) => {
          expect(status).to.eq(200)

          expect(
            body.periodoSelecionado
          ).to.eq('24h')

          expect(
            body.leituras
          ).to.be.an('array')

          expect(
            body.estatisticas.totalLeituras
          )
            .to.be.a('number')
            .and.at.least(0)

          expect(
            body.paginacao
          ).to.have.keys(
            'pagina',
            'limite',
            'total',
            'totalPaginas'
          )

          if (
            body.estatisticas.totalLeituras === 0
          ) {
            expect(
              body.leituras
            ).to.have.length(0)

            for (const campo of [
              'temperaturaMedia',
              'temperaturaMin',
              'temperaturaMax',
              'umidadeMedia',
              'umidadeMin',
              'umidadeMax',
            ]) {
              expect(
                body.estatisticas[campo]
              ).to.eq(null)
            }
          }

          observado(
            'CT12',
            `Sensor ${sensor.id}: HTTP 200, período 24h, ${body.estatisticas.totalLeituras} leituras. Zero leituras não comprova ingestão recente. Este caso verifica a API.`
          )
        })
      })
    })

    caso('CT13', () => {
      entrar()

      cy.visit('/usuarios')

      cy.contains(
        '[role="alert"]',
        'Acesso restrito. Esta área é exclusiva para administradores.'
      ).should('be.visible')

      api(
        '/usuarios'
      ).its('status').should(
        'eq',
        403
      )

      observado(
        'CT13',
        'Interface restringiu área de usuários; API real negou consulta com HTTP 403.'
      )
    })

    caso('CT14', () => {
      entrar()

      cy.visit('/painel')

      api('/sensores/config', {
        method: 'POST',
        body: {},
      })
        .its('status')
        .should('eq', 403)

      observado(
        'CT14',
        'POST /sensores/config como produtor retornou 403 antes da validação.'
      )
    })

    caso('CT15', () => {
      entrar()

      cy.visit('/painel')

      interceptar(
        'POST',
        '/auth/logout',
        'logout'
      )

      cy.get(
        'button[aria-label="Abrir menu da conta"]'
      ).click()

      cy.contains(
        'button',
        /^Sair$/
      )
        .filter(':visible')
        .click()

      cy.wait(
        '@logout'
      ).its(
        'response.statusCode'
      ).should('eq', 204)

      cy.location(
        'pathname'
      ).should('eq', '/')

      cy.window({
        log: false,
      }).then(win => {
        expect(
          win.sessionStorage.getItem(TOKEN)
        ).to.eq(null)
      })

      cy.visit('/painel')

      cy.location(
        'pathname'
      ).should('eq', '/')

      observado(
        'CT15',
        'Logout 204; token removido e acesso posterior ao painel redirecionou ao login.'
      )
    })

    caso('CT16', () => {
      entrar('TECNICO')

      for (const route of [
        '/propriedades',
        '/lotes',
      ]) {
        visitarLista(
          route,
          route.slice(1)
        )

        const criar =
          route === '/lotes'
            ? '/lotes/novo'
            : '/propriedades/nova'

        cy.get(
          `a[href="${criar}"]`
        ).should('not.exist')

        cy.get(
          `a[href^="${route}/"][href$="/editar"]`
        ).should('not.exist')

        cy.contains(
          'button',
          /Excluir/
        ).should('not.exist')
      }

      observado(
        'CT16',
        'Consultas 200, sem controles de criar, editar ou excluir para técnico.'
      )
    })

    caso('CT17', () => {
      entrar('TECNICO')

      cy.visit(
        '/sensores/config'
      )

      cy.contains(
        'h1',
        'Configuração IoT'
      ).should('be.visible')

      cy.contains(
        'button',
        'Validar configuração'
      ).click()

      cy.contains(
        'Informe um ID de canal numérico válido.'
      ).should('be.visible')

      observado(
        'CT17',
        'Validação local detectou canal vazio. Não comprova integração externa ou gravação ThingSpeak.'
      )
    })

    caso('CT18', () => {
      entrar('ADMIN')

      visitarLista(
        '/usuarios',
        'usuarios'
      )

      cy.contains(
        'h1',
        'Usuários'
      ).should('be.visible')

      cy.get(
        '[role="tablist"][aria-label="Filtrar por perfil"]'
      ).should('be.visible')

      observado(
        'CT18',
        'GET /usuarios 200 como ADMIN; listagem e filtros por perfil visíveis.'
      )
    })

    caso('CT19', () => {
      entrar('ADMIN')

      let chamadas = 0

      cy.intercept({
        method: 'POST',
        pathname: '/api/usuarios',
      }, () => {
        chamadas++
      })

      cy.visit(
        '/usuarios/novo'
      )

      cy.contains(
        'button',
        'Cadastrar usuário'
      ).click()

      cy.contains(
        'O nome é obrigatório.'
      ).should('be.visible')

      cy.contains(
        'O e-mail é obrigatório.'
      ).should('be.visible')

      cy.contains(
        'A senha inicial é obrigatória.'
      ).should('be.visible')

      cy.then(() =>
        expect(chamadas).to.eq(0)
      )

      observado(
        'CT19',
        'Cadastro vazio sinalizado sem POST /usuarios; nenhum usuário criado.'
      )
    })

    caso('CT20', () => {
      entrar()

      cy.visit(
        '/sensores/config'
      )

      cy.get(
        'body'
      ).should($body => {
        const pathname =
          $body[0]
            .ownerDocument
            .defaultView
            .location
            .pathname

        const redirect =
          pathname === '/painel'

        const restrito =
          /acesso restrito|sem permissão/i
            .test($body.text())

        const formulario =
          $body.text().includes(
            'Validar configuração'
          )

        expect(
          redirect ||
          (restrito && !formulario),
          'Produtor não deve acessar formulário IoT pelo endereço direto'
        ).to.eq(true)
      })

      observado(
        'CT20',
        'Acesso direto do produtor à configuração IoT bloqueado pela interface.'
      )
    })
  }
)