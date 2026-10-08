import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        // Erros por campo vindos do backend aparecem no campo certo.
        if (error.campos) setErros(error.campos as CulturaErros);
      } else {
        setErroGeral("Não foi possível cadastrar a cultura. Tente novamente.");
      }
    } finally {
      setSalvando(false);
    }
  }

  const podeCadastrar = podeEscrever(usuario?.perfil);

  return (
    <AppShell section="culturas">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageBreadcrumb
          items={[
            { label: "Culturas", to: "/culturas" },
            { label: "Adicionar nova cultura" },
          ]}
        />

        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.5rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar nova cultura
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Cadastre uma nova cultura para utilizar no gerenciamento da
              produção.
            </p>
          </div>

          {!podeCadastrar ? (
            <div className="border-t border-[#edf1ee] p-5 sm:p-7">
              <FeedbackMessage variant="info">
                Seu perfil não tem permissão para cadastrar culturas.
              </FeedbackMessage>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="border-t border-[#edf1ee] p-5 sm:p-7"
            >
              {erroGeral ? (
                <div className="mb-5">
                  <FeedbackMessage variant="error">{erroGeral}</FeedbackMessage>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="nome"
                    className="text-sm font-semibold text-[#28372f]"
                  >
                    Nome da cultura
                  </label>

                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={valores.nome}
                    onChange={(e) => atualizar("nome", e.target.value)}
                    aria-invalid={Boolean(erros.nome)}
                    placeholder="Ex.: Uva"
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                  />
                  <ErroCampo id="nome" mensagem={erros.nome} />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="variedade"
                    className="text-sm font-semibold text-[#28372f]"
                  >
                    Variedade da cultura
                  </label>

                  <input
                    id="variedade"
                    name="variedade"
                    type="text"
                    value={valores.variedade}
                    onChange={(e) => atualizar("variedade", e.target.value)}
                    aria-invalid={Boolean(erros.variedade)}
                    placeholder="Ex.: Cabernet Sauvignon"
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                  />
                  <ErroCampo id="variedade" mensagem={erros.variedade} />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="descricao"
                    className="text-sm font-semibold text-[#28372f]"
                  >
                    Descrição da cultura
                  </label>

                  <textarea
                    id="descricao"
                    name="descricao"
                    value={valores.descricao}
                    onChange={(e) => atualizar("descricao", e.target.value)}
                    aria-invalid={Boolean(erros.descricao)}
                    placeholder="Ex.: Cultura de clima quente, cultivada em..."
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                  />
                  <ErroCampo id="descricao" mensagem={erros.descricao} />
                </div>

                <div>
                  <label
                    htmlFor="temperaturaMin"
                    className="text-sm font-semibold text-[#28372f]"
                  >
                    Temperatura mínima
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="temperaturaMin"
                      name="temperaturaMin"
                      type="number"
                      step="0.01"
                      value={valores.temperaturaMin}
                      onChange={(e) => atualizar("temperaturaMin", e.target.value)}
                      aria-invalid={Boolean(erros.temperaturaMin)}
                      placeholder="18"
                      className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                      °C
                    </span>
                  </div>
                  <ErroCampo id="temperaturaMin" mensagem={erros.temperaturaMin} />
                </div>

                <div>
                  <label
                    htmlFor="temperaturaMax"
                    className="text-sm font-semibold text-[#28372f]"
                  >
                    Temperatura máxima
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="temperaturaMax"
                      name="temperaturaMax"
                      type="number"
                      step="0.01"
                      value={valores.temperaturaMax}
                      onChange={(e) => atualizar("temperaturaMax", e.target.value)}
                      aria-invalid={Boolean(erros.temperaturaMax)}
                      placeholder="32"
                      className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                      °C
                    </span>
                  </div>
                  <ErroCampo id="temperaturaMax" mensagem={erros.temperaturaMax} />
                </div>

                <div>
                  <label
                    htmlFor="umidadeMin"
                    className="text-sm font-semibold text-[#28372f]"
                  >
                    Umidade mínima
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="umidadeMin"
                      name="umidadeMin"
                      type="number"
                      step="0.01"
                      placeholder="50"
                      min="0"
                      max="100"
                      value={valores.umidadeMin}
                      onChange={(e) => atualizar("umidadeMin", e.target.value)}
                      aria-invalid={Boolean(erros.umidadeMin)}
                      className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                      %
                    </span>
                  </div>
                  <ErroCampo id="umidadeMin" mensagem={erros.umidadeMin} />
                </div>

                <div>
                  <label
                    htmlFor="umidadeMax"
                    className="text-sm font-semibold text-[#28372f]"
                  >
                    Umidade máxima
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="umidadeMax"
                      name="umidadeMax"
                      type="number"
                      step="0.01"
                      placeholder="80"
                      min="0"
                      max="100"
                      value={valores.umidadeMax}
                      onChange={(e) => atualizar("umidadeMax", e.target.value)}
                      aria-invalid={Boolean(erros.umidadeMax)}
                      className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                      %
                    </span>
                  </div>
                  <ErroCampo id="umidadeMax" mensagem={erros.umidadeMax} />
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#edf1ee] pt-6 sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? (
                    <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Save size={17} aria-hidden="true" />
                  )}
                  {salvando ? "Salvando..." : "Cadastrar cultura"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}
