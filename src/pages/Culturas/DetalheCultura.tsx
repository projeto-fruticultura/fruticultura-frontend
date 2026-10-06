import { useEffect, useState } from "react";
import { ArrowLeft, Droplets, Leaf, Pencil, Thermometer } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AppShell, PageBreadcrumb } from "@/components/app/AppShell";
import { culturaService } from "@/services/culturaService";
import type { Cultura } from "@/types/api";

export default function DetalheCultura() {
  const { id } = useParams();

  const [cultura, setCultura] = useState<Cultura | null>(null);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarCultura() {
      try {
        const dados = await culturaService.buscarPorId(Number(id));

        setCultura(dados);
        setCarregando(false);
      } catch (error) {
        console.error("Erro ao buscar cultura:", error);
        setErro(true);
        setCarregando(false);
      }
    }

    carregarCultura();
  }, [id]);

  if (carregando) {
    return (
      <AppShell section="culturas">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#68756d]">Carregando cultura...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (erro) {
    return (
      <AppShell section="culturas">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
              <Leaf size={26} />
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-[#18251e]">
              Cultura não encontrada
            </h1>

            <p className="mt-2 text-sm text-[#68756d]">
              A cultura solicitada não está disponível.
            </p>

            <Link
              to="/culturas"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white transition hover:bg-[#008844]"
            >
              <ArrowLeft size={17} />
              Voltar para culturas
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!cultura) {
    return null;
  }

  return (
    <AppShell section="culturas">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageBreadcrumb
          items={[
            {
              label: "Culturas",
              to: "/culturas",
            },
            {
              label: cultura.nome,
            },
          ]}
        />

        <section className="overflow-hidden rounded-[26px] border border-[#dfe7e2] bg-white shadow-sm">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#f1f9f4_0%,#ffffff_65%)] px-5 py-7 sm:px-7 lg:px-8">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#009B4D]/5"
              aria-hidden="true"
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#009B4D] text-white shadow-[0_10px_25px_rgba(0,155,77,.18)]">
                  <Leaf size={27} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#009B4D]">
                      Cultura
                    </p>

                    <span className="inline-flex items-center rounded-full bg-[#eaf8f0] px-3 py-1 text-[11px] font-bold text-[#16804d]">
                      Ativa
                    </span>
                  </div>

                  <h1 className="mt-2 text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-[-0.045em] text-[#17231d]">
                    {cultura.nome}
                  </h1>

                  {cultura.variedade && (
                    <p className="mt-1 text-sm font-medium text-[#68756d]">
                      Variedade: {cultura.variedade}
                    </p>
                  )}

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#68756d]">
                    Visualização dos parâmetros e informações cadastradas para
                    esta cultura.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  to="/culturas"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce5df] bg-white px-5 text-sm font-semibold text-[#425147] transition hover:bg-[#f3f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                >
                  <ArrowLeft size={17} />
                  Voltar
                </Link>

                <Link
                  to={`/culturas/${cultura.id}/editar`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,155,77,.14)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
                >
                  <Pencil size={17} />
                  Editar cultura
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#829087]">
              Identificação
            </p>

            <p className="mt-2 text-xl font-semibold text-[#202d25]">
              #{String(cultura.id).padStart(3, "0")}
            </p>

            <p className="mt-1 text-sm text-[#718078]">Código da cultura</p>
          </article>

          <article className="rounded-2xl border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#829087]">
              Temperatura
            </p>

            <p className="mt-2 text-xl font-semibold text-[#202d25]">
              {cultura.temperaturaMin}° – {cultura.temperaturaMax}°C
            </p>

            <p className="mt-1 text-sm text-[#718078]">Faixa recomendada</p>
          </article>

          <article className="rounded-2xl border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#829087]">
              Umidade
            </p>

            <p className="mt-2 text-xl font-semibold text-[#202d25]">
              {cultura.umidadeMin}% – {cultura.umidadeMax}%
            </p>

            <p className="mt-1 text-sm text-[#718078]">Faixa recomendada</p>
          </article>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="flex flex-col gap-1 border-b border-[#edf1ee] pb-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#18251e]">
              Parâmetros de cultivo
            </h2>

            <p className="text-sm text-[#718078]">
              Condições recomendadas para o desenvolvimento da cultura.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {/* Temperatura */}
            <article className="overflow-hidden rounded-2xl border border-[#eee8d7] bg-[#fffdf8]">
              <div className="flex items-center gap-3 border-b border-[#eee8d7] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3d6] text-[#c38b0a]">
                  <Thermometer size={20} />
                </div>

                <div>
                  <h3 className="font-semibold text-[#29352e]">Temperatura</h3>

                  <p className="text-xs text-[#7c857f]">Faixa ideal</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#202d25]">
                      {cultura.temperaturaMin}°C
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#879189]">
                      Mínima
                    </p>
                  </div>

                  <div className="h-px flex-1 bg-[#e6dfcd]" />

                  <div className="text-right">
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#202d25]">
                      {cultura.temperaturaMax}°C
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#879189]">
                      Máxima
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between text-[11px] font-medium text-[#8b938e]">
                    <span>Frio</span>
                    <span>Ideal</span>
                    <span>Quente</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0eadb]">
                    <div className="h-full w-[68%] rounded-full bg-[#e3a72d]" />
                  </div>
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-[#dceef3] bg-[#fafdfe]">
              <div className="flex items-center gap-3 border-b border-[#dceef3] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f7fb] text-[#249fc3]">
                  <Droplets size={20} />
                </div>

                <div>
                  <h3 className="font-semibold text-[#29352e]">Umidade</h3>

                  <p className="text-xs text-[#7c857f]">Faixa ideal</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#202d25]">
                      {cultura.umidadeMin}%
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#879189]">
                      Mínima
                    </p>
                  </div>

                  <div className="h-px flex-1 bg-[#dcecf0]" />

                  <div className="text-right">
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#202d25]">
                      {cultura.umidadeMax}%
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#879189]">
                      Máxima
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between text-[11px] font-medium text-[#8b938e]">
                    <span>Baixa</span>
                    <span>Ideal</span>
                    <span>Alta</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5f3f7]">
                    <div className="h-full w-[72%] rounded-full bg-[#35b6dc]" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="border-b border-[#edf1ee] pb-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#18251e]">
              Informações da cultura
            </h2>

            <p className="mt-1 text-sm text-[#718078]">
              Dados gerais do cadastro.
            </p>
          </div>

          <dl className="mt-5 divide-y divide-[#edf1ee]">
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-[#75827a]">
                Nome da cultura
              </dt>

              <dd className="text-sm font-semibold text-[#29362f]">
                {cultura.nome}
              </dd>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-[#75827a]">
                Identificador
              </dt>

              <dd className="text-sm font-semibold text-[#29362f]">
                CULT-{String(cultura.id).padStart(3, "0")}
              </dd>
            </div>

            <div className="flex flex-col gap-1 py-4">
              <dt className="text-sm font-medium text-[#75827a]">Descrição</dt>

              <dd className="text-sm leading-6 text-[#29362f]">
                {cultura.descricao || "Nenhuma descrição cadastrada."}
              </dd>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-[#75827a]">Status</dt>

              <dd>
                <span className="inline-flex rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#16804d]">
                  Ativa
                </span>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}
