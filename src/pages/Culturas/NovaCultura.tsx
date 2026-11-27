import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AppShell, PageBreadcrumb } from "@/components/app/AppShell";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { podeEscrever } from "@/lib/permissoes";
import { ApiError } from "@/services/api";
import { culturaService } from "@/services/culturaService";

import { ErroCampo } from "./ErroCampo";
import {
  CULTURA_VAZIA,
  validarCultura,
  type CulturaErros,
  type CulturaFormValores,
} from "./validarCultura";

export default function NovaCultura() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [valores, setValores] = useState<CulturaFormValores>(CULTURA_VAZIA);
  const [erros, setErros] = useState<CulturaErros>({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizar(campo: keyof CulturaFormValores, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroGeral("");

    const { erros: errosLocais, payload } = validarCultura(valores);
    setErros(errosLocais);
    if (!payload) return;

    setSalvando(true);

    try {
      await culturaService.criar(payload);
      navigate("/culturas");
    } catch (error) {
      if (error instanceof ApiError) {
        setErroGeral(error.message);
        if (error.campos) setErros(error.campos as CulturaErros);
      } else {
        setErroGeral("Não foi possível cadastrar a cultura. Tente novamente.");
      }
    } finally {
      setSalvando(false);
    }
  }

  const podeCadastrar = podeEscrever(usuario?.perfil);

  const faixaTemp = calcularFaixaPreview(
    valores.temperaturaMin,
    valores.temperaturaMax,
    50,
  );
  const faixaUmid = calcularFaixaPreview(
    valores.umidadeMin,
    valores.umidadeMax,
    100,
  );

  return (
    <AppShell section="culturas">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: "Culturas", to: "/culturas" },
            { label: "Nova cultura" },
          ]}
        />

        {/* Cabeçalho padronizado */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar nova cultura
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Cadastre uma nova cultura e defina suas faixas ideais de
              temperatura e umidade.
            </p>
          </div>
        </section>

        {!podeCadastrar ? (
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
            <FeedbackMessage variant="info">
              Seu perfil não tem permissão para cadastrar culturas.
            </FeedbackMessage>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {erroGeral ? (
              <div className="mb-5">
                <FeedbackMessage variant="error">{erroGeral}</FeedbackMessage>
              </div>
            ) : null}

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
              {/* Coluna esquerda: dados da cultura */}
              <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
                <div className="space-y-6">
                  <div className="border-b border-[#edf2ee] pb-5">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                      Especificações agronômicas
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#68756d]">
                      Informe a identificação da espécie e os intervalos
                      climáticos recomendados para cultivo.
                    </p>
                  </div>

                  {/* Grupo 1: Identificação */}
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                      Identificação da cultivar
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="nome"
                          className="mb-2 block text-sm font-semibold text-[#2d3b33]"
                        >
                          Nome da cultura
                          <span
                            className="ml-1 text-[#009B4D]"
                            aria-hidden="true"
                          >
                            *
                          </span>
                          <span className="sr-only"> (obrigatório)</span>
                        </label>

                        <input
                          id="nome"
                          name="nome"
                          type="text"
                          value={valores.nome}
                          onChange={(e) => atualizar("nome", e.target.value)}
                          aria-invalid={Boolean(erros.nome)}
                          placeholder="Ex.: Uva"
                          className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:bg-white focus:ring-4 focus:ring-[#009B4D]/10"
                        />
                        <ErroCampo id="nome" mensagem={erros.nome} />
                      </div>

                      <div>
                        <label
                          htmlFor="variedade"
                          className="mb-2 block text-sm font-semibold text-[#2d3b33]"
                        >
                          Variedade
                        </label>

                        <input
                          id="variedade"
                          name="variedade"
                          type="text"
                          value={valores.variedade}
                          onChange={(e) =>
                            atualizar("variedade", e.target.value)
                          }
                          aria-invalid={Boolean(erros.variedade)}
                          placeholder="Ex.: Cabernet Sauvignon"
                          className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:bg-white focus:ring-4 focus:ring-[#009B4D]/10"
                        />
                        <ErroCampo id="variedade" mensagem={erros.variedade} />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="descricao"
                        className="mb-2 block text-sm font-semibold text-[#2d3b33]"
                      >
                        Descrição e manejo
                      </label>

                      <textarea
                        id="descricao"
                        name="descricao"
                        value={valores.descricao}
                        onChange={(e) => atualizar("descricao", e.target.value)}
                        aria-invalid={Boolean(erros.descricao)}
                        placeholder="Ex.: Cultivar adaptada ao semiárido irrigado, exigente em insolação durante a maturação..."
                        rows={4}
                        className="w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm leading-6 text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:bg-white focus:ring-4 focus:ring-[#009B4D]/10"
                      />
                      <ErroCampo id="descricao" mensagem={erros.descricao} />
                    </div>
                  </div>

                  {/* Grupo 2: Parâmetros climáticos */}
                  <div className="space-y-4 border-t border-[#edf2ee] pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                        Parâmetros climáticos de referência
                      </p>
                      <span className="text-xs text-[#68756d]">
                        Base para alertas dos sensores
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Bloco Temperatura */}
                      <div className="rounded-2xl border border-[#e6ede9] bg-[#f8faf9] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-2 border-b border-[#e8efeb] pb-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full bg-[#E5A72C]"
                              aria-hidden="true"
                            />
                            <p className="text-sm font-semibold text-[#18251e]">
                              Faixa térmica ideal
                            </p>
                          </div>

                          <span className="rounded-md border border-[#e1e7e3] bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-[#5c6b63]">
                            °C
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="temperaturaMin"
                              className="mb-1.5 block text-xs font-semibold text-[#48574e]"
                            >
                              Mínima
                              <span
                                className="ml-1 text-[#009B4D]"
                                aria-hidden="true"
                              >
                                *
                              </span>
                            </label>

                            <div className="relative">
                              <input
                                id="temperaturaMin"
                                name="temperaturaMin"
                                type="number"
                                step="0.01"
                                value={valores.temperaturaMin}
                                onChange={(e) =>
                                  atualizar("temperaturaMin", e.target.value)
                                }
                                aria-invalid={Boolean(erros.temperaturaMin)}
                                placeholder="18"
                                className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white pl-3.5 pr-11 text-sm font-medium tabular-nums text-[#18251e] outline-none transition placeholder:text-[#98a49d] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                              />
                              <span className="pointer-events-none absolute inset-y-2 right-0 flex w-9 items-center justify-center border-l border-[#edf2ee] text-xs font-semibold text-[#6e7c74]">
                                °C
                              </span>
                            </div>
                            <ErroCampo
                              id="temperaturaMin"
                              mensagem={erros.temperaturaMin}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="temperaturaMax"
                              className="mb-1.5 block text-xs font-semibold text-[#48574e]"
                            >
                              Máxima
                              <span
                                className="ml-1 text-[#009B4D]"
                                aria-hidden="true"
                              >
                                *
                              </span>
                            </label>

                            <div className="relative">
                              <input
                                id="temperaturaMax"
                                name="temperaturaMax"
                                type="number"
                                step="0.01"
                                value={valores.temperaturaMax}
                                onChange={(e) =>
                                  atualizar("temperaturaMax", e.target.value)
                                }
                                aria-invalid={Boolean(erros.temperaturaMax)}
                                placeholder="32"
                                className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white pl-3.5 pr-11 text-sm font-medium tabular-nums text-[#18251e] outline-none transition placeholder:text-[#98a49d] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                              />
                              <span className="pointer-events-none absolute inset-y-2 right-0 flex w-9 items-center justify-center border-l border-[#edf2ee] text-xs font-semibold text-[#6e7c74]">
                                °C
                              </span>
                            </div>
                            <ErroCampo
                              id="temperaturaMax"
                              mensagem={erros.temperaturaMax}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bloco Umidade */}
                      <div className="rounded-2xl border border-[#e6ede9] bg-[#f8faf9] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-2 border-b border-[#e8efeb] pb-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full bg-[#39BCE5]"
                              aria-hidden="true"
                            />
                            <p className="text-sm font-semibold text-[#18251e]">
                              Umidade relativa
                            </p>
                          </div>

                          <span className="rounded-md border border-[#e1e7e3] bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-[#5c6b63]">
                            0–100%
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="umidadeMin"
                              className="mb-1.5 block text-xs font-semibold text-[#48574e]"
                            >
                              Mínima
                              <span
                                className="ml-1 text-[#009B4D]"
                                aria-hidden="true"
                              >
                                *
                              </span>
                            </label>

                            <div className="relative">
                              <input
                                id="umidadeMin"
                                name="umidadeMin"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={valores.umidadeMin}
                                onChange={(e) =>
                                  atualizar("umidadeMin", e.target.value)
                                }
                                aria-invalid={Boolean(erros.umidadeMin)}
                                placeholder="50"
                                className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white pl-3.5 pr-11 text-sm font-medium tabular-nums text-[#18251e] outline-none transition placeholder:text-[#98a49d] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                              />
                              <span className="pointer-events-none absolute inset-y-2 right-0 flex w-9 items-center justify-center border-l border-[#edf2ee] text-xs font-semibold text-[#6e7c74]">
                                %
                              </span>
                            </div>
                            <ErroCampo
                              id="umidadeMin"
                              mensagem={erros.umidadeMin}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="umidadeMax"
                              className="mb-1.5 block text-xs font-semibold text-[#48574e]"
                            >
                              Máxima
                              <span
                                className="ml-1 text-[#009B4D]"
                                aria-hidden="true"
                              >
                                *
                              </span>
                            </label>

                            <div className="relative">
                              <input
                                id="umidadeMax"
                                name="umidadeMax"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={valores.umidadeMax}
                                onChange={(e) =>
                                  atualizar("umidadeMax", e.target.value)
                                }
                                aria-invalid={Boolean(erros.umidadeMax)}
                                placeholder="80"
                                className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white pl-3.5 pr-11 text-sm font-medium tabular-nums text-[#18251e] outline-none transition placeholder:text-[#98a49d] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                              />
                              <span className="pointer-events-none absolute inset-y-2 right-0 flex w-9 items-center justify-center border-l border-[#edf2ee] text-xs font-semibold text-[#6e7c74]">
                                %
                              </span>
                            </div>
                            <ErroCampo
                              id="umidadeMax"
                              mensagem={erros.umidadeMax}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Coluna direita: prévia dos parâmetros + ações */}
              <aside>
                <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6">
                  <div className="border-b border-[#edf2ee] pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                        Resumo do perfil climático
                      </h2>
                      <span className="rounded-full bg-[#edf7f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#15693E]">
                        Prévia
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-6 text-[#68756d]">
                      {valores.nome.trim()
                        ? `${valores.nome.trim()}${valores.variedade.trim() ? ` · ${valores.variedade.trim()}` : ""}`
                        : "Preencha os dados ao lado para visualizar a faixa operacional."}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* Prévia Temperatura */}
                    <div className="rounded-2xl border border-[#e6ede9] bg-[#f8faf9] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#76847c]">
                          Temperatura ideal
                        </span>
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#18251e]">
                          {faixaTemp
                            ? `${faixaTemp.min} °C a ${faixaTemp.max} °C`
                            : "Não definida"}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-amber-100/80">
                          {faixaTemp ? (
                            <span
                              style={faixaTemp.style}
                              className="absolute top-0 bottom-0 rounded-full bg-[#E5A72C] transition-all"
                            />
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex justify-between text-[11px] font-medium text-[#7a8980]">
                          <span>0 °C</span>
                          <span>25 °C</span>
                          <span>50 °C</span>
                        </div>
                      </div>
                    </div>

                    {/* Prévia Umidade */}
                    <div className="rounded-2xl border border-[#e6ede9] bg-[#f8faf9] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#76847c]">
                          Umidade relativa
                        </span>
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#18251e]">
                          {faixaUmid
                            ? `${faixaUmid.min}% a ${faixaUmid.max}%`
                            : "Não definida"}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-sky-100/80">
                          {faixaUmid ? (
                            <span
                              style={faixaUmid.style}
                              className="absolute top-0 bottom-0 rounded-full bg-[#39BCE5] transition-all"
                            />
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex justify-between text-[11px] font-medium text-[#7a8980]">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Nota operacional com espaço para vetor ilustrativo */}
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#e3ebe6] bg-[#f6f9f7] p-4 text-center sm:flex-row sm:text-left">
                      <img
                        src="/assets/Seeding-bro.svg"
                        alt=""
                        aria-hidden="true"
                        className="h-24 w-28 shrink-0 select-none object-contain"
                      />

                      <div className="min-w-0 flex-1 text-xs leading-5 text-[#56645c]">
                        <p className="text-sm font-semibold text-[#23322a]">
                          Monitoramento automático de lotes
                        </p>
                        <p className="mt-1">
                          Sempre que a leitura de um sensor vinculado a esta
                          cultura ultrapassar os limites mínimo ou máximo
                          cadastrados, o sistema registrará um alerta
                          operacional.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barra de ações */}
                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#edf2ee] pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                      to="/culturas"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8e3dc] bg-white px-5 text-sm font-semibold text-[#48574e] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                    >
                      Cancelar
                    </Link>

                    <button
                      type="submit"
                      disabled={salvando}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#009B4D] px-7 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      {salvando ? "Salvando..." : "Cadastrar cultura"}
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}

function calcularFaixaPreview(
  minStr: string,
  maxStr: string,
  escalaMax: number,
) {
  const min = Number(minStr);
  const max = Number(maxStr);
  const valido =
    minStr.trim() !== "" &&
    maxStr.trim() !== "" &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    max >= min;

  if (!valido) return null;

  const inicio = Math.max(0, Math.min(100, (min / escalaMax) * 100));
  const fim = Math.max(inicio + 6, Math.min(100, (max / escalaMax) * 100));

  return {
    min,
    max,
    style: {
      left: `${inicio}%`,
      width: `${fim - inicio}%`,
    },
  };
}