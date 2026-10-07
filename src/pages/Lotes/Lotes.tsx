import { MapPin, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/app/AppShell";

export default function Lotes() {
  const lotes = [
    {
      id: 1,
      identificacao: "Lote 01",
      propriedade: "Fazenda São José",
      cultura: "Manga",
      area: "12,5 ha",
      dataPlantacao: "12/03/2026",
      situacao: "Em produção",
    },
    {
      id: 2,
      identificacao: "Lote 02",
      propriedade: "Fazenda São José",
      cultura: "Uva",
      area: "8,2 ha",
      dataPlantacao: "25/02/2026",
      situacao: "Em produção",
    },
    {
      id: 3,
      identificacao: "Lote 03",
      propriedade: "Fazenda Boa Vista",
      cultura: "Goiaba",
      area: "6,8 ha",
      dataPlantacao: "08/04/2026",
      situacao: "Em preparação",
    },
  ];

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

            <Link
              to="/lotes/novo"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
            >
              <Plus size={18} aria-hidden="true" />
              Adicionar lote
            </Link>
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

            <p className="mt-1 text-sm text-[#718078]">
              {lotes.length}{" "}
              {lotes.length === 1 ? "lote cadastrado" : "lotes cadastrados"}
            </p>
          </div>

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
                        Propriedade: {lote.propriedade}
                      </p>

                      <p className="mt-1 text-sm text-[#66746c]">
                        Cultura: {lote.cultura}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#66746c]">
                        <span>Área: {lote.area}</span>
                        <span>Plantio: {lote.dataPlantacao}</span>
                      </div>

                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          lote.situacao === "Em produção"
                            ? "bg-[#edf7f1] text-[#15693E]"
                            : "bg-[#FFF9E8] text-[#9A7000]"
                        }`}
                      >
                        {lote.situacao}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D9A31A] bg-white px-4 text-sm font-semibold text-[#9A7000] transition hover:bg-[#FFF9E8]"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#42C78A] bg-white px-4 text-sm font-semibold text-[#0B8A51] transition hover:bg-[#EFFCF5]"
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
