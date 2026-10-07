import { LoaderCircle, Save } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { ApiError } from "@/services/api";
import type { PropriedadePayload } from "@/types/api";
import { PropertyLocationPreview } from "./PropertyLocationPreview";

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export interface PropertyFormInitialValues {
  nome?: string;
  area?: string | number;
  cidade?: string;
  uf?: string;
  latitude?: string | number;
  longitude?: string | number;
}

interface PropertyFormProps {
  initialValues?: PropertyFormInitialValues;
  submitLabel: string;
  onSubmit: (payload: PropriedadePayload) => Promise<void>;
}

export function PropertyForm({
  initialValues,
  submitLabel,
  onSubmit,
}: PropertyFormProps) {
  const formId = useId();
  const [form, setForm] = useState({
    nome: String(initialValues?.nome ?? ""),
    area: String(initialValues?.area ?? ""),
    cidade: String(initialValues?.cidade ?? ""),
    uf: String(initialValues?.uf ?? "PE"),
    latitude: String(initialValues?.latitude ?? ""),
    longitude: String(initialValues?.longitude ?? ""),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [saving, setSaving] = useState(false);

  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState("");

  useEffect(() => {
    setForm({
      nome: String(initialValues?.nome ?? ""),
      area: String(initialValues?.area ?? ""),
      cidade: String(initialValues?.cidade ?? ""),
      uf: String(initialValues?.uf ?? "PE"),
      latitude: String(initialValues?.latitude ?? ""),
      longitude: String(initialValues?.longitude ?? ""),
    });
  }, [initialValues]);

  async function buscarLocalizacao(cidade: string, uf: string) {
    if (!cidade.trim() || !uf) return;

    setBuscandoLocalizacao(true);
    setErroLocalizacao("");

    try {
      const params = new URLSearchParams({
        city: cidade.trim(),
        state: uf,
        country: "Brazil",
        countrycodes: "br",
        format: "jsonv2",
        limit: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Não foi possível consultar a localização.");
      }

      const resultados = await response.json();

      if (!Array.isArray(resultados) || resultados.length === 0) {
        setErroLocalizacao(
          "Não foi possível encontrar essa cidade. Confira os dados informados.",
        );
        return;
      }

      const resultado = resultados[0];

      setForm((current) => ({
        ...current,
        latitude: resultado.lat,
        longitude: resultado.lon,
      }));
    } catch {
      setErroLocalizacao(
        "Não foi possível localizar a cidade. Tente novamente.",
      );
    } finally {
      setBuscandoLocalizacao(false);
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    const area = Number(form.area);
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (form.nome.trim().length < 3)
      next.nome = "Informe um nome com pelo menos 3 caracteres.";
    if (!Number.isFinite(area) || area <= 0)
      next.area = "Informe uma área maior que zero.";
    if (!form.cidade.trim()) next.cidade = "Informe a cidade.";
    if (!UFS.includes(form.uf)) next.uf = "Selecione uma UF válida.";
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
      next.latitude = "Informe uma latitude entre -90 e 90.";
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
      next.longitude = "Informe uma longitude entre -180 e 180.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setGeneralError("");
    if (!validate()) return;

    setSaving(true);
    try {
      await onSubmit({
        nome: form.nome.trim(),
        area: Number(form.area),
        cidade: form.cidade.trim(),
        uf: form.uf,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setGeneralError(error.message);
        if (error.campos)
          setErrors((current) => ({ ...current, ...error.campos }));
      } else {
        setGeneralError(
          "Não foi possível salvar a propriedade. Tente novamente.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const fields = {
    nome: `${formId}-nome`,
    area: `${formId}-area`,
    cidade: `${formId}-cidade`,
    uf: `${formId}-uf`,
    latitude: `${formId}-latitude`,
    longitude: `${formId}-longitude`,
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{generalError}</FeedbackMessage>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                Dados da propriedade
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#6a776f]">
                Informe os dados básicos utilizados no cadastro e na
                identificação da propriedade.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nome da propriedade"
                required
                error={errors.nome}
                className="sm:col-span-2"
                htmlFor={fields.nome}
              >
                <input
                  id={fields.nome}
                  value={form.nome}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nome: event.target.value,
                    }))
                  }
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.nome)}
                  aria-describedby={
                    errors.nome ? `${fields.nome}-error` : undefined
                  }
                  autoComplete="organization"
                />
              </Field>

              <Field
                label="Área (ha)"
                required
                error={errors.area}
                htmlFor={fields.area}
              >
                <input
                  id={fields.area}
                  inputMode="decimal"
                  value={form.area}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      area: event.target.value,
                    }))
                  }
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.area)}
                  aria-describedby={
                    errors.area ? `${fields.area}-error` : undefined
                  }
                  placeholder="Ex.: 25.5"
                />
              </Field>

              <Field label="UF" required error={errors.uf} htmlFor={fields.uf}>
                <select
                  id={fields.uf}
                  value={form.uf}
                  onChange={(event) => {
                    const novaUf = event.target.value;

                    setForm((current) => ({
                      ...current,
                      uf: novaUf,
                    }));

                    if (form.cidade.trim() && novaUf) {
                      void buscarLocalizacao(form.cidade, novaUf);
                    }
                  }}
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.uf)}
                  aria-describedby={
                    errors.uf ? `${fields.uf}-error` : undefined
                  }
                >
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                Localização
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#6a776f]">
                Use cidade e coordenadas geográficas para identificar a posição
                da propriedade.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 ">
              <Field
                label="Cidade"
                required
                error={errors.cidade}
                className="sm:col-span-2"
                htmlFor={fields.cidade}
              >
                <input
                  id={fields.cidade}
                  value={form.cidade}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cidade: event.target.value,
                    }))
                  }
                  className="input-propriedade focus:border-[#CD1C18] focus:ring-4 focus:ring-[#CD1C18]/10 border-l-[5px] border-l-[#CD1C18]"
                  aria-invalid={Boolean(errors.cidade)}
                  aria-describedby={
                    errors.cidade ? `${fields.cidade}-error` : undefined
                  }
                  autoComplete="address-level2"
                />
              </Field>

              <Field
                label="Latitude"
                required
                error={errors.latitude}
                htmlFor={fields.latitude}
              >
                <input
                  id={fields.latitude}
                  inputMode="decimal"
                  value={form.latitude}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      latitude: event.target.value,
                    }))
                  }
                  className="input-propriedade focus:border-[#CD1C18] focus:ring-4 focus:ring-[#CD1C18]/10 border-l-[5px] border-l-[#CD1C18]"
                  aria-invalid={Boolean(errors.latitude)}
                  aria-describedby={
                    errors.latitude ? `${fields.latitude}-error` : undefined
                  }
                  placeholder="Ex.: -8.047562"
                />
              </Field>

              <Field
                label="Longitude"
                required
                error={errors.longitude}
                htmlFor={fields.longitude}
              >
                <input
                  id={fields.longitude}
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      longitude: event.target.value,
                    }))
                  }
                  className="input-propriedade focus:border-[#CD1C18] focus:ring-4 focus:ring-[#CD1C18]/10 border-l-[5px] border-l-[#CD1C18]"
                  aria-invalid={Boolean(errors.longitude)}
                  aria-describedby={
                    errors.longitude ? `${fields.longitude}-error` : undefined
                  }
                  placeholder="Ex.: -34.877003"
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
              Localização da propriedade
            </h2>
            <p className="mt-1 mb-5 text-sm leading-6 text-[#6a776f]">
              Confira a prévia com os dados informados antes de salvar.
            </p>
            <PropertyLocationPreview
              latitude={form.latitude}
              longitude={form.longitude}
              cidade={form.cidade}
              uf={form.uf}
            />
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end xl:flex-col-reverse">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save size={18} aria-hidden="true" />
              )}
              {saving ? "Salvando..." : submitLabel}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-[#334139]"
      >
        {label}
        {required ? (
          <span className="ml-1 text-[#009B4D]" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
