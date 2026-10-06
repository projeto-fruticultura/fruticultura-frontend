import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";

import { AppShell, PageBreadcrumb } from "@/components/app/AppShell";

export default function NovoSensor() {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [dataInstalacao, setDataInstalacao] = useState("");
  const [loteId, setLoteId] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!loteId || !loteId.startsWith("lote-")) {
      console.warn("Cadastro aguardando a API de lotes.");
      return;
    }

    const payload = {
      codigo,
      tipo,
      localizacao,
      dataInstalacao,
      loteId: Number(loteId.replace("lote-", "")),
    };

    console.log(payload);
  }

  return (
    <AppShell section="sensores">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageBreadcrumb
          items={[
            { label: "Sensores", to: "/sensores" },
            { label: "Adicionar novo sensor" },
          ]}
        />

        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.5rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar novo sensor
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Cadastre um novo sensor para realizar o monitoramento da produção.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-[#edf1ee] p-5 sm:p-7"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="codigo"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Código do sensor
                </label>

                <input
                  id="codigo"
                  name="codigo"
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ex.: SN-001"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="tipo"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Tipo de sensor
                </label>

                <select
                  id="tipo"
                  name="tipo"
                  defaultValue=""
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                >
                  <option value="" disabled>
                    Selecione o tipo
                  </option>

                  <option value="temperatura">Temperatura</option>

                  <option value="umidade">Umidade</option>

                  <option value="temperatura-umidade">
                    Temperatura e umidade
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="localizacao"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Localização
                </label>

                <input
                  id="localizacao"
                  name="localizacao"
                  type="text"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  placeholder="Ex.: Lote 01 - setor norte"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="dataInstalacao"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Data de instalação
                </label>

                <input
                  id="dataInstalacao"
                  name="dataInstalacao"
                  type="date"
                  value={dataInstalacao}
                  onChange={(e) => setDataInstalacao(e.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="propriedade"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Propriedade
                </label>

                <select
                  id="propriedade"
                  name="propriedade"
                  defaultValue=""
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                >
                  <option value="" disabled>
                    Selecione a propriedade
                  </option>

                  <option value="propriedade-1">Propriedade principal</option>

                  <option value="propriedade-2">Propriedade secundária</option>

                  <option value="propriedade-3">Fazenda Experimental</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="lote"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Lote
                </label>

                <select
                  id="lote"
                  name="lote"
                  value={loteId}
                  onChange={(e) => setLoteId(e.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                >
                  <option value="" disabled>
                    Selecione o lote
                  </option>

                  <option value="lote-1">Lote 01</option>

                  <option value="lote-2">Lote 02</option>

                  <option value="lote-3">Lote 03</option>

                  <option value="lote-4">Lote 04</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#edf1ee] pt-6 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
              >
                <Save size={17} aria-hidden="true" />
                Cadastrar Sensor
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
