import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'

export default function NovaCultura() {
  return (
    <AppShell section="culturas">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <PageBreadcrumb
          items={[
            { label: 'Culturas', to: '/culturas' },
            { label: 'Adicionar nova cultura' },
          ]}
        />

        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">

          <div className="border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.5rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar nova cultura
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Cadastre uma nova cultura para utilizar no gerenciamento da produção.
            </p>
          </div>

          <form className="border-t border-[#edf1ee] p-5 sm:p-7">

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
                  placeholder="Ex.: Uva"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="nome"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Variedade da cultura
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Ex.: Cabernet Sauvignon"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="temperaturaMinima"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Temperatura mínima
                </label>

                <div className="relative mt-2">
                  <input
                    id="temperaturaMinima"
                    name="temperaturaMinima"
                    type="number"
                    placeholder="18"
                    className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                    °C
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="temperaturaMaxima"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Temperatura máxima
                </label>

                <div className="relative mt-2">
                  <input
                    id="temperaturaMaxima"
                    name="temperaturaMaxima"
                    type="number"
                    placeholder="32"
                    className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                    °C
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="umidadeMinima"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Umidade mínima
                </label>

                <div className="relative mt-2">
                  <input
                    id="umidadeMinima"
                    name="umidadeMinima"
                    type="number"
                    placeholder="50"
                    min="0"
                    max="100"
                    className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="umidadeMaxima"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Umidade máxima
                </label>

                <div className="relative mt-2">
                  <input
                    id="umidadeMaxima"
                    name="umidadeMaxima"
                    type="number"
                    placeholder="80"
                    min="0"
                    max="100"
                    className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                    %
                  </span>
                </div>
              </div>

            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#edf1ee] pt-6 sm:flex-row sm:justify-end">

              <Link
                to="/culturas"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce5df] bg-white px-5 text-sm font-semibold text-[#425147] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Voltar
              </Link>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
              >
                <Save size={17} aria-hidden="true" />
                Cadastrar
              </button>

            </div>

          </form>

        </section>

      </div>
    </AppShell>
  )
}