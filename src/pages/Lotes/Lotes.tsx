import { MapPin, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { formatarData } from "@/lib/formatar";
import { podeEscrever } from "@/lib/permissoes";
import { ApiError } from "@/services/api";
import { loteService } from "@/services/loteService";
import { propriedadeService } from "@/services/propriedadeService";
import type { Lote, PropriedadeResumo } from "@/types/api";

import { rotuloSituacao } from "./situacoes";

export default function Lotes() {
  const { usuario } = useAuth();
  const podeEditar = podeEscrever(usuario?.perfil);

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroExclusao, setErroExclusao] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        // As propriedades so dao o nome; se falharem, o lote aparece com "Propriedade #id".
        const [listaLotes, listaPropriedades] = await Promise.all([
          loteService.listar(),
          propriedadeService.listar().catch(() => [] as PropriedadeResumo[]),
        ]);
        if (!ativo) return;
        setLotes(listaLotes);
        setPropriedades(listaPropriedades);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar os lotes.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  function nomeDaPropriedade(propriedadeId: number) {
    return (
      propriedades.find((propriedade) => propriedade.id === propriedadeId)
        ?.nome ?? `Propriedade #${propriedadeId}`
    );
  }

  async function excluirLote(lote: Lote) {
    setErroExclusao("");

    const confirmarExclusao = window.confirm(
      `Tem certeza que deseja excluir o lote "${lote.identificacao}"?`,
    );
    if (!confirmarExclusao) return;

    try {
      try {
        await loteService.remover(lote.id);
      } catch (error) {
        // 409: o lote tem sensores ativos. Mostra quantos serao desativados e so repete se a pessoa confirmar.
        if (error instanceof ApiError && error.status === 409) {
          const total = Number(error.dados?.totalSensores ?? 0);
          const continuar = window.confirm(
            `O lote "${lote.identificacao}" tem ${total} sensor(es) ativo(s). ` +
              `Se continuar, o lote e esse(s) sensor(es) serão desativados. Deseja continuar?`,
          );
          if (!continuar) return;
          await loteService.remover(lote.id, true);
        } else {
          throw error;
        }
      }

      setLotes((atuais) => atuais.filter((item) => item.id !== lote.id));
    } catch (error) {
      setErroExclusao(
        error instanceof ApiError
          ? error.message
          : "Não foi possível excluir o lote.",
      );
    }
  }

  return (
    <AppShell section="lotes">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Lotes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre e gerencie os lotes de cultivo das propriedades.
              </p>
            </div>

            {podeEditar ? (
              <Link
                to="/lotes/novo"
                className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
              >
                <Plus size={18} aria-hidden="true" />
                Adicionar lote
              </Link>
            ) : null}
          </div>
        </section>

        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="lotes-list-title"
        >
          <div className="border-b border-[#edf1ee] pb-5">
            <h2
              id="lotes-list-title"
              className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
            >
              Lotes cadastrados
            </h2>

            {!carregando && !erro ? (
              <p className="mt-1 text-sm text-[#718078]">
                {lotes.length}{" "}
                {lotes.length === 1 ? "lote cadastrado" : "lotes cadastrados"}
              </p>
            ) : null}
          </div>

          {erroExclusao ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">{erroExclusao}</FeedbackMessage>
            </div>
          ) : null}

          {carregando ? (
            <p className="mt-5 text-sm text-[#68756d]" role="status">
              Carregando lotes...
            </p>
          ) : erro ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            </div>
          ) : lotes.length === 0 ? (
            <p className="mt-5 text-sm text-[#68756d]">
              Nenhum lote para mostrar. Quando você cadastrar um lote em uma de
              suas propriedades, ele aparece aqui.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {lotes.map((lote) => (
                <article
                  key={lote.id}
                  className="rounded-2xl border border-[#dfe6e1] bg-white p-4 transition hover:border-[#c7d7cd] hover:shadow-[0_12px_28px_rgba(31,41,51,.06)] sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                        <MapPin size={21} aria-hidden="true" />
                      </span>

                      <div>
                        <h3 className="text-base font-semibold text-[#202d25] sm:text-lg">
                          {lote.identificacao}
                        </h3>

                        <p className="mt-1 text-sm text-[#66746c]">
                          Propriedade: {nomeDaPropriedade(lote.propriedadeId)}
                        </p>

                        <p className="mt-1 text-sm text-[#66746c]">
                          Cultura: {lote.cultura.nome}
                          {lote.cultura.variedade
                            ? ` (${lote.cultura.variedade})`
                            : ""}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#66746c]">
                          <span>Área: {lote.area} ha</span>
                          <span>Plantio: {formatarData(lote.dataPlantacao)}</span>
                          <span>
                            Sensores ativos: {lote.totalSensores}
                          </span>
                        </div>

                        <span
                          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            lote.situacao === "EM_PRODUCAO"
                              ? "bg-[#edf7f1] text-[#15693E]"
                              : "bg-[#FFF9E8] text-[#9A7000]"
                          }`}
                        >
                          {rotuloSituacao(lote.situacao)}
                        </span>
                      </div>
                    </div>

                    {podeEditar ? (
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <Link
                          to={`/lotes/${lote.id}/editar`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D9A31A] bg-white px-4 text-sm font-semibold text-[#9A7000] transition hover:bg-[#FFF9E8]"
                        >
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => excluirLote(lote)}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#E57373] bg-white px-4 text-sm font-semibold text-[#C62828] transition hover:bg-[#FFF5F5] cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    ) : null}
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
