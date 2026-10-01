import { Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell, PageBreadcrumb } from "@/components/app/AppShell";

export default function NovaCultura() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [variedade, setVariedade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [temperaturaMin, setTemperaturaMin] = useState("");
  const [temperaturaMax, setTemperaturaMax] = useState("");
  const [umidadeMin, setUmidadeMin] = useState("");
  const [umidadeMax, setUmidadeMax] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const resposta = await fetch("http://localhost:3000/api/culturas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome,
        variedade,
        descricao,
        temperaturaMin: Number(temperaturaMin),
        temperaturaMax: Number(temperaturaMax),
        umidadeMin: Number(umidadeMin),
        umidadeMax: Number(umidadeMax),
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao cadastrar cultura:", dados);
      return;
    }

    navigate("/culturas");
  }

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

          <form
            onSubmit={handleSubmit}
            className="border-t border-[#edf1ee] p-5 sm:p-7"
          >
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
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Uva"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
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
                  value={variedade}
                  onChange={(e) => setVariedade(e.target.value)}
                  placeholder="Ex.: Cabernet Sauvignon"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
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
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: Cultura de clima quente, cultivada em..."
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
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
                    value={temperaturaMin}
                    onChange={(e) => setTemperaturaMin(e.target.value)}
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
                    value={temperaturaMax}
                    onChange={(e) => setTemperaturaMax(e.target.value)}
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
                    value={umidadeMin}
                    onChange={(e) => setUmidadeMin(e.target.value)}
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
                    value={umidadeMax}
                    onChange={(e) => setUmidadeMax(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 pr-12 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#75827a]">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#edf1ee] pt-6 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
              >
                <Save size={17} aria-hidden="true" />
                Cadastrar cultura
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
