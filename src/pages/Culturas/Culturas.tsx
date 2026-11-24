import { AlertDialog } from "@base-ui/react/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Edit3,
  Eye,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sprout,
  Thermometer,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { podeEscrever } from "@/lib/permissoes";
import { ApiError } from "@/services/api";
import { culturaService } from "@/services/culturaService";
import type { Cultura } from "@/types/api";

type ModoExibicao = "cards" | "tabela";

const CARDS_POR_PAGINA = 12;
const LINHAS_POR_PAGINA = 20;

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function calcularFaixaPercentual(min: number, max: number, escalaMax: number) {
  const inicio = Math.max(0, Math.min(100, (min / escalaMax) * 100));
  const fim = Math.max(inicio + 6, Math.min(100, (max / escalaMax) * 100));
  return {
    left: `${inicio}%`,
    width: `${fim - inicio}%`,
  };
}

export default function Culturas() {
  const { usuario } = useAuth();
  const podeEditar = podeEscrever(usuario?.perfil);

  const [culturas, setCulturas] = useState<Cultura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Filtros, modo de exibição e paginação
  const [busca, setBusca] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState<string>("TODAS");
  const [modoExibicao, setModoExibicao] = useState<ModoExibicao>("cards");
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Modal de exclusão e feedbacks
  const [culturaParaExcluir, setCulturaParaExcluir] = useState<Cultura | null>(
    null,
  );
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarCulturas() {
      try {
        const dados = await culturaService.listar();
        if (ativo) setCulturas(dados);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar as culturas.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarCulturas();

    return () => {
      ativo = false;
    };
  }, []);

  // Espécies únicas para abas de filtragem rápida (ex.: Manga, Uva, Goiaba...)
  const especiesDisponiveis = useMemo(() => {
    const mapa = new Map<string, { nome: string; count: number }>();
    for (const c of culturas) {
      const chave = normalizarTexto(c.nome);
      const atual = mapa.get(chave);
      if (atual) {
        atual.count++;
      } else {
        mapa.set(chave, { nome: c.nome.trim(), count: 1 });
      }
    }
    return Array.from(mapa.entries()).map(([chave, info]) => ({
      chave,
      ...info,
    }));
  }, [culturas]);

  // Filtragem
  const culturasFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca);

    return culturas.filter((cultura) => {
      if (
        filtroEspecie !== "TODAS" &&
        normalizarTexto(cultura.nome) !== filtroEspecie
      ) {
        return false;
      }

      if (termo) {
        const texto = normalizarTexto(
          `${cultura.nome} ${cultura.variedade ?? ""}`,
        );
        if (!texto.includes(termo)) return false;
      }

      return true;
    });
  }, [culturas, busca, filtroEspecie]);

  // Paginação
  const itensPorPagina =
    modoExibicao === "tabela" ? LINHAS_POR_PAGINA : CARDS_POR_PAGINA;

  const totalPaginas = Math.max(
    1,
    Math.ceil(culturasFiltradas.length / itensPorPagina),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const culturasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * itensPorPagina;
    return culturasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [culturasFiltradas, paginaSegura, itensPorPagina]);

  function limparFiltros() {
    setBusca("");
    setFiltroEspecie("TODAS");
    setPaginaAtual(1);
  }

  async function confirmarExclusao() {
    if (!culturaParaExcluir || excluindo) return;

    const alvo = culturaParaExcluir;
    setExcluindo(true);
    setErroExclusao("");
    setMensagemSucesso("");

    try {
      await culturaService.remover(alvo.id);
      setCulturas((culturasAtuais) =>
        culturasAtuais.filter((cultura) => cultura.id !== alvo.id),
      );
      setCulturaParaExcluir(null);
      setMensagemSucesso(
        `Cultura "${alvo.nome}${alvo.variedade ? ` (${alvo.variedade})` : ""}" excluída com sucesso.`,
      );
    } catch (error) {
      // Ex.: 409 "Cultura em uso por N lote(s)." quando a cultura tem lotes.
      setErroExclusao(
        error instanceof ApiError
          ? error.message
          : "Não foi possível excluir a cultura.",
      );
      setCulturaParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  const temFiltroAtivo = busca.trim() !== "" || filtroEspecie !== "TODAS";

  return (
    <AppShell section="culturas">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho padronizado */}
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Culturas e Variedades
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre e gerencie as culturas, variedades e suas faixas ideais
                de temperatura e umidade para monitoramento.
              </p>
            </div>

            {podeEditar ? (
              <Link
                to="/culturas/nova"
                className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
              >
                <Plus size={18} aria-hidden="true" />
                Adicionar cultura
              </Link>
            ) : null}
          </div>
        </section>

        {/* Painel principal */}
        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="culturas-list-title"
        >
          {/* Barra superior: Título + Busca + Alternador Cards/Lista */}
          <div className="flex flex-col gap-4 border-b border-[#edf1ee] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                id="culturas-list-title"
                className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
              >
                Catálogo agronômico
              </h2>
              {!carregando && !erro && (
                <p className="mt-0.5 text-sm text-[#718078]">
                  {culturasFiltradas.length}{" "}
                  {culturasFiltradas.length === 1
                    ? "cultura cadastrada"
                    : "culturas cadastradas"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              {/* Busca */}
              <div className="relative min-w-[240px] flex-1 sm:w-64">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a8980]"
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  placeholder="Buscar cultura ou variedade..."
                  aria-label="Buscar cultura ou variedade"
                  className="h-10 w-full rounded-xl border border-[#d9e2db] bg-white pl-9 pr-8 text-sm text-[#1f2d25] placeholder:text-[#86948c] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusca("");
                      setPaginaAtual(1);
                    }}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#7a8980] hover:bg-[#f3f6f4] hover:text-[#1f2d25]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Alternador Cards Agronômicos vs Lista Densa */}
              <div
                role="group"
                aria-label="Modo de exibição das culturas"
                className="inline-flex h-10 self-start rounded-xl bg-[#f3f6f4] p-1 sm:self-auto"
              >
                <button
                  type="button"
                  onClick={() => {
                    setModoExibicao("cards");
                    setPaginaAtual(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                    modoExibicao === "cards"
                      ? "bg-white text-[#18251e] shadow-sm"
                      : "text-[#66746c] hover:text-[#18251e]"
                  }`}
                >
                  <LayoutGrid size={14} />
                  Cards
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoExibicao("tabela");
                    setPaginaAtual(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                    modoExibicao === "tabela"
                      ? "bg-white text-[#18251e] shadow-sm"
                      : "text-[#66746c] hover:text-[#18251e]"
                  }`}
                >
                  <List size={14} />
                  Lista
                </button>
              </div>
            </div>
          </div>

          {/* Pills de filtro rápido por espécie */}
          {!carregando && !erro && especiesDisponiveis.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setFiltroEspecie("TODAS");
                  setPaginaAtual(1);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filtroEspecie === "TODAS"
                    ? "bg-[#009B4D] text-white shadow-sm"
                    : "bg-[#f3f6f4] text-[#5c6a62] hover:bg-[#e7ede9] hover:text-[#18251e]"
                }`}
              >
                <span>Todas</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                    filtroEspecie === "TODAS"
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#5c6a62]"
                  }`}
                >
                  {culturas.length}
                </span>
              </button>

              {especiesDisponiveis.map((esp) => {
                const ativa = filtroEspecie === esp.chave;
                return (
                  <button
                    key={esp.chave}
                    type="button"
                    onClick={() => {
                      setFiltroEspecie(esp.chave);
                      setPaginaAtual(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      ativa
                        ? "bg-[#009B4D] text-white shadow-sm"
                        : "bg-[#f3f6f4] text-[#5c6a62] hover:bg-[#e7ede9] hover:text-[#18251e]"
                    }`}
                  >
                    <span>{esp.nome}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                        ativa
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#5c6a62]"
                      }`}
                    >
                      {esp.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedbacks */}
          {(mensagemSucesso || erroExclusao) && (
            <div className="mt-5 space-y-3">
              {mensagemSucesso && (
                <FeedbackMessage variant="success">
                  {mensagemSucesso}
                </FeedbackMessage>
              )}
              {erroExclusao && (
                <FeedbackMessage variant="error">
                  {erroExclusao}
                </FeedbackMessage>
              )}
            </div>
          )}

          {/* Conteúdo */}
          {carregando ? (
            <div
              className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              role="status"
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-60 animate-pulse rounded-2xl border border-[#edf1ee] bg-[#f9fbfa] p-5"
                />
              ))}
            </div>
          ) : erro ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            </div>
          ) : culturasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
                <Sprout size={22} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-[#1f2d25]">
                Nenhuma cultura encontrada
              </h3>
              <p className="mt-1 max-w-md text-sm text-[#68756d]">
                {temFiltroAtivo
                  ? "Nenhuma cultura ou variedade corresponde aos filtros aplicados."
                  : "Nenhuma cultura cadastrada ainda."}
              </p>
              {temFiltroAtivo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {modoExibicao === "tabela" ? (
                <div className="mt-5 overflow-x-auto rounded-2xl border border-[#edf1ee]">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#edf1ee] bg-[#f9fbfa] text-xs font-semibold uppercase tracking-wider text-[#6e7d74]">
                        <th className="py-3.5 pl-5 pr-4">
                          Cultura / Variedade
                        </th>
                        <th className="px-4 py-3.5">Temperatura Ideal</th>
                        <th className="px-4 py-3.5">Umidade Ideal</th>
                        <th className="py-3.5 pl-4 pr-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1ee] text-sm">
                      {culturasPaginadas.map((cultura) => (
                        <tr
                          key={cultura.id}
                          className="transition-colors hover:bg-[#f7fbf8]"
                        >
                          <td className="py-3.5 pl-5 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                                <Sprout size={17} aria-hidden="true" />
                              </span>
                              <div>
                                <p className="font-semibold text-[#1c2922]">
                                  {cultura.nome}
                                </p>
                                <p className="text-xs text-[#68756d]">
                                  {cultura.variedade
                                    ? `Variedade: ${cultura.variedade}`
                                    : "Variedade padrão"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              <Thermometer
                                size={13}
                                className="text-amber-600"
                              />
                              {cultura.temperaturaMin} °C –{" "}
                              {cultura.temperaturaMax} °C
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200/80 bg-sky-50/70 px-2.5 py-1 text-xs font-semibold text-sky-900">
                              <Droplets size={13} className="text-sky-600" />
                              {cultura.umidadeMin}% – {cultura.umidadeMax}%
                            </span>
                          </td>

                          <td className="py-3.5 pl-4 pr-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2">
                              <Link
                                to={`/culturas/${cultura.id}`}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#42C78A] bg-white px-3 text-xs font-semibold text-[#0B8A51] transition hover:bg-[#EFFCF5]"
                              >
                                <Eye size={14} />
                                Detalhes
                              </Link>

                              {podeEditar ? (
                                <>
                                  <Link
                                    to={`/culturas/${cultura.id}/editar`}
                                    aria-label={`Editar a cultura ${cultura.nome}`}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9A31A] bg-white text-[#9A7000] transition hover:bg-[#FFF9E8]"
                                  >
                                    <Edit3 size={15} aria-hidden="true" />
                                  </Link>

                                  <button
                                    type="button"
                                    aria-label={`Excluir a cultura ${cultura.nome}`}
                                    onClick={() =>
                                      setCulturaParaExcluir(cultura)
                                    }
                                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E57373] bg-white text-[#C62828] transition hover:bg-[#FFF5F5]"
                                  >
                                    <Trash2 size={15} aria-hidden="true" />
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grade Agronômica com Medidores de Clima */
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {culturasPaginadas.map((cultura) => {
                    const faixaTemp = calcularFaixaPercentual(
                      Number(cultura.temperaturaMin),
                      Number(cultura.temperaturaMax),
                      50,
                    );
                    const faixaUmid = calcularFaixaPercentual(
                      Number(cultura.umidadeMin),
                      Number(cultura.umidadeMax),
                      100,
                    );

                    return (
                      <article
                        key={cultura.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#dfe6e1] bg-white p-5 shadow-[0_2px_10px_rgba(24,37,30,.03)] transition hover:border-[#c3d5ca] hover:shadow-[0_12px_28px_rgba(31,41,51,.07)]"
                      >
                        <div>
                          {/* Cabeçalho da Cultura */}
                          <div className="flex items-start gap-3.5">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                              <Sprout size={21} aria-hidden="true" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                                {cultura.nome}
                              </h3>
                              <p className="mt-0.5 truncate text-xs font-medium text-[#68756d]">
                                {cultura.variedade
                                  ? `Variedade: ${cultura.variedade}`
                                  : "Cultivar padrão"}
                              </p>
                            </div>
                          </div>

                          {/* Parâmetros Climáticos Ideais com Régua Autoexplicativa */}
                          <div className="mt-4 space-y-3.5 rounded-xl bg-[#f8faf9] p-3.5">
                            {/* Temperatura */}
                            <div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-[#4b5850]">
                                  <Thermometer
                                    size={14}
                                    className="text-amber-600"
                                  />
                                  Faixa térmica ideal
                                </span>
                                <span className="font-bold text-[#18251e]">
                                  {cultura.temperaturaMin} °C –{" "}
                                  {cultura.temperaturaMax} °C
                                </span>
                              </div>

                              <div
                                title={`Zona ideal: ${cultura.temperaturaMin} °C a ${cultura.temperaturaMax} °C (escala de 0 °C a 50 °C)`}
                                className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-100"
                              >
                                <span
                                  style={faixaTemp}
                                  className="absolute top-0 bottom-0 rounded-full bg-amber-500"
                                />
                              </div>

                              <div className="mt-1 flex justify-between text-[10px] font-medium text-[#86948c]">
                                <span>0 °C</span>
                                <span>25 °C</span>
                                <span>50 °C</span>
                              </div>
                            </div>

                            {/* Umidade */}
                            <div className="border-t border-[#ebf0ed] pt-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-[#4b5850]">
                                  <Droplets
                                    size={14}
                                    className="text-sky-600"
                                  />
                                  Umidade relativa ideal
                                </span>
                                <span className="font-bold text-[#18251e]">
                                  {cultura.umidadeMin}% – {cultura.umidadeMax}%
                                </span>
                              </div>

                              <div
                                title={`Zona ideal: ${cultura.umidadeMin}% a ${cultura.umidadeMax}% (escala de 0% a 100%)`}
                                className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-100"
                              >
                                <span
                                  style={faixaUmid}
                                  className="absolute top-0 bottom-0 rounded-full bg-sky-500"
                                />
                              </div>

                              <div className="mt-1 flex justify-between text-[10px] font-medium text-[#86948c]">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rodapé de Ações */}
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f0f4f1] pt-3.5">
                          <Link
                            to={`/culturas/${cultura.id}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#42C78A] bg-white px-3 text-xs font-semibold text-[#0B8A51] transition hover:bg-[#EFFCF5]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver detalhes
                          </Link>

                          {podeEditar ? (
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/culturas/${cultura.id}/editar`}
                                aria-label={`Editar a cultura ${cultura.nome}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9A31A] bg-white text-[#9A7000] transition hover:bg-[#FFF9E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A31A]"
                              >
                                <Edit3 size={15} aria-hidden="true" />
                              </Link>

                              <button
                                type="button"
                                aria-label={`Excluir a cultura ${cultura.nome}`}
                                onClick={() => setCulturaParaExcluir(cultura)}
                                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E57373] bg-white text-[#C62828] transition hover:bg-[#FFF5F5]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Rodapé com Paginação */}
              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#edf1ee] pt-4 text-xs text-[#68756d] sm:flex-row">
                <p>
                  Mostrando{" "}
                  <strong className="font-semibold text-[#1f2d25]">
                    {(paginaSegura - 1) * itensPorPagina + 1}
                  </strong>{" "}
                  a{" "}
                  <strong className="font-semibold text-[#1f2d25]">
                    {Math.min(
                      paginaSegura * itensPorPagina,
                      culturasFiltradas.length,
                    )}
                  </strong>{" "}
                  de{" "}
                  <strong className="font-semibold text-[#1f2d25]">
                    {culturasFiltradas.length}
                  </strong>{" "}
                  {culturasFiltradas.length === 1 ? "cultura" : "culturas"}
                </p>

                {totalPaginas > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={paginaSegura <= 1}
                      onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                      className="h-8 gap-1 px-2.5 text-xs"
                    >
                      <ChevronLeft size={14} />
                      Anterior
                    </Button>

                    <span className="px-2 font-medium text-[#1f2d25]">
                      Página {paginaSegura} de {totalPaginas}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={paginaSegura >= totalPaginas}
                      onClick={() =>
                        setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                      }
                      className="h-8 gap-1 px-2.5 text-xs"
                    >
                      Próxima
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog.Root
        open={culturaParaExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto && !excluindo) setCulturaParaExcluir(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-2xl">
            <AlertDialog.Title className="text-xl font-semibold text-[#18251e]">
              Confirmar exclusão
            </AlertDialog.Title>

            <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68756d]">
              Tem certeza que deseja excluir a cultura{" "}
              <strong>
                "{culturaParaExcluir?.nome}
                {culturaParaExcluir?.variedade
                  ? ` (${culturaParaExcluir.variedade})`
                  : ""}
                "
              </strong>
              ? Caso existam lotes vinculados, a exclusão será bloqueada.
            </AlertDialog.Description>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={excluindo}
                onClick={() => setCulturaParaExcluir(null)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={excluindo}
                onClick={() => void confirmarExclusao()}
              >
                {excluindo ? "Excluindo..." : "Excluir cultura"}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </AppShell>
  );
}
