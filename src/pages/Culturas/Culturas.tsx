import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppShell } from '@/components/app/AppShell'

export default function Culturas() {
  const culturas = [
    {
      id: 1,
      nome: 'Uva Vitória',
      temperatura: '18 °C – 32 °C',
      umidade: '50% – 80%',
    },
    {
      id: 2,
      nome: 'Manga Palmer',
      temperatura: '18 °C – 32 °C',
      umidade: '50% – 80%',
    },
  ]

  return (
    <AppShell section="cultures">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">

        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Cultura
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre e gerencie as culturas utilizadas na produção.
              </p>
            </div>

            <Link
              to="/culturas/nova"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
            >
              <Plus size={18} aria-hidden="true" />
              Adicionar cultura
            </Link>

          </div>
        </section>

        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="culturas-list-title"
        >
          <div className="border-b border-[#edf1ee] pb-5">
            <h2
              id="culturas-list-title"
              className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
            >
              Culturas cadastradas
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {culturas.map((cultura) => (
              <article
                key={cultura.id}
                className="rounded-2xl border border-[#dfe6e1] bg-white p-4 transition hover:border-[#c7d7cd] hover:shadow-[0_12px_28px_rgba(31,41,51,.06)] sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div className="min-w-0">

                    <h3 className="text-base font-semibold text-[#202d25] sm:text-lg">
                      {cultura.nome}
                    </h3>

                    <div className="mt-2 space-y-2 text-sm">

                      <p className="border-l-[3px] border-[#E5A72C] pl-2 font-medium text-[#202d25]">
                        Temperatura: {cultura.temperatura}
                      </p>

                      <p className="border-l-[3px] border-[#39BCE5] pl-2 font-medium text-[#202d25]">
                        Umidade: {cultura.umidade}
                      </p>

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
  )
}