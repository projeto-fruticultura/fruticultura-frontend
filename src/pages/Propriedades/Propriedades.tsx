import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Eye,
  Leaf,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { ApiError } from "@/services/api";
import { propriedadeService } from "@/services/propriedadeService";
import type { PropriedadeResumo } from "@/types/api";

export default function Propriedades() {
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [query, setQuery] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      setPropriedades(await propriedadeService.listar());
    } catch (error) {
      setErro(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar as propriedades.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return propriedades;
    return propriedades.filter((item) =>
      `${item.nome} ${item.cidade} ${item.uf}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [propriedades, query]);

  const totals = useMemo(
    () => ({
      propriedades: propriedades.length,
      lotes: propriedades.reduce((sum, item) => sum + item.totalLotes, 0),
      sensores: propriedades.reduce((sum, item) => sum + item.totalSensores, 0),
    }),
    [propriedades],
  );

  async function remover(item: PropriedadeResumo) {
    const confirmed = window.confirm(
      `Excluir a propriedade “${item.nome}”? Esta ação fará uma exclusão lógica.`,
    );
    if (!confirmed) return;

    setExcluindoId(item.id);
    setErro("");
    setSucesso("");
    try {
      await propriedadeService.remover(item.id);
      setSucesso("Propriedade removida com sucesso.");
      await carregar();
    } catch (error) {
      setErro(
        error instanceof ApiError
          ? error.message
          : "Não foi possível remover a propriedade.",
      );
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#009B4D]">
                Gestão agrícola
              </p>
              <h1 className="mt-2 text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Propriedades
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre, consulte e gerencie as propriedades vinculadas à sua
                produção.
              </p>
            </div>

            <Link
              to="/propriedades/nova"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
            >
              <Plus size={18} aria-hidden="true" />
              Adicionar propriedade
            </Link>
          </div>
        </section>

        <section
          className="mt-5 grid gap-4 sm:grid-cols-3"
          aria-label="Resumo de propriedades"
        >
          <SummaryCard
            label="Propriedades ativas"
            value={totals.propriedades}
          />
          <SummaryCard label="Lotes cadastrados" value={totals.lotes} />
          <SummaryCard label="Sensores vinculados" value={totals.sensores} />
        </section>

        {sucesso ? (
          <div className="mt-5">
            <FeedbackMessage variant="success">{sucesso}</FeedbackMessage>
          </div>
        ) : null}
        {erro ? (
          <div className="mt-5">
            <FeedbackMessage variant="error">{erro}</FeedbackMessage>
          </div>
        ) : null}

        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="properties-list-title"
        >
          <div className="flex flex-col gap-4 border-b border-[#edf1ee] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="properties-list-title"
                className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
              >
                Propriedades cadastradas
              </h2>
              <p className="mt-1 text-sm text-[#718078]">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "propriedade encontrada"
                  : "propriedades encontradas"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block min-w-0 sm:w-[290px]">
                <span className="sr-only">Buscar propriedades</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#819087]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nome ou cidade"
                  className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] pl-10 pr-4 text-sm outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
              </label>
              <button
                type="button"
                onClick={() => void carregar()}
                disabled={carregando}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce5df] bg-white px-4 text-sm font-semibold text-[#425147] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  size={17}
                  className={carregando ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                Atualizar
              </button>
            </div>
          </div>

          {carregando ? (
            <div
              className="grid min-h-[310px] place-items-center"
              role="status"
              aria-live="polite"
            >
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />
                <p className="mt-4 text-sm font-medium text-[#67746c]">
                  Carregando propriedades...
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
                <Leaf size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-[#28372f]">
                Nenhuma propriedade encontrada
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#748078]">
                {query
                  ? "Ajuste o termo de busca ou limpe o filtro."
                  : "Cadastre a primeira propriedade para começar a organizar a produção."}
              </p>
              {!query ? (
                <Link
                  to="/propriedades/nova"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#009B4D] px-4 text-sm font-semibold text-white hover:bg-[#008844]"
                >
                  <Plus size={17} /> Adicionar propriedade
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="group rounded-2xl border border-[#dfe6e1] bg-white p-4 transition hover:border-[#c7d7cd] hover:shadow-[0_12px_28px_rgba(31,41,51,.06)] sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[#202d25] sm:text-lg">
                        {item.nome}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#66746c]">
                        <MapPin size={15} aria-hidden="true" /> {item.cidade} -{" "}
                        {item.uf}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <MetricChip label="Lotes" value={item.totalLotes} />
                        <MetricChip
                          label="Sensores"
                          value={item.totalSensores}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Link
                        to={`/propriedades/${item.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#b9dec8] bg-[#f8fdf9] px-3.5 text-sm font-semibold text-[#0b7c49] transition hover:bg-[#edf8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                      >
                        <Eye size={16} aria-hidden="true" /> Ver detalhes
                      </Link>
                      <Link
                        to={`/culturas/${item.id}/editar`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9A31A] text-[#9A7000] transition hover:bg-[#FFF9E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A31A]"
                        aria-label={`Editar ${item.nome}`}
                      >
                        <Edit3 size={17} aria-hidden="true" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => void remover(item)}
                        disabled={excluindoId === item.id}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        aria-label={`Excluir ${item.nome}`}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e1e7e3] bg-white px-5 py-4 shadow-sm">
      <p className="text-sm text-[#6e7b73]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#15693E]">
        {value}
      </p>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f7f4] px-3 py-1.5 text-xs font-medium text-[#506057]">
      <span
        className="h-1.5 w-1.5 rounded-full bg-[#2ad780]"
        aria-hidden="true"
      />
      {value} {label.toLocaleLowerCase("pt-BR")}
    </span>
  );
}
