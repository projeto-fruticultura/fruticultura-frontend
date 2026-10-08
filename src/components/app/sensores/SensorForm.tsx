import { LoaderCircle, Save } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { hojeIso } from "@/lib/formatar";
import { rotuloTipoSensor, TIPOS_SENSOR } from "@/pages/Sensores/tiposSensor";
import { ApiError } from "@/services/api";
import { loteService } from "@/services/loteService";
import { propriedadeService } from "@/services/propriedadeService";
import type { Lote, PropriedadeResumo, SensorPayload } from "@/types/api";

export type { SensorPayload };

export interface SensorFormInitialValues {
  codigo?: string;
  tipo?: string;
  localizacao?: string | null;
  dataInstalacao?: string;
  loteId?: number;
}

interface SensorFormProps {
  initialValues?: SensorFormInitialValues;
  submitLabel: string;
  onSubmit: (payload: SensorPayload) => Promise<void>;
}

interface SensorFormValores {
  codigo: string;
  tipo: string;
  localizacao: string;
  dataInstalacao: string;
  propriedadeId: string;
  loteId: string;
}

const CAMPO =
  "mt-2 min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10";

export function SensorForm({ initialValues, submitLabel, onSubmit }: SensorFormProps) {
  const [form, setForm] = useState<SensorFormValores>(() => ({
    codigo: initialValues?.codigo ?? "",
    tipo: initialValues?.tipo ?? "",
    localizacao: initialValues?.localizacao ?? "",
    dataInstalacao: initialValues?.dataInstalacao ?? hojeIso(),
    propriedadeId: "",
    loteId: initialValues?.loteId ? String(initialValues.loteId) : "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [saving, setSaving] = useState(false);

  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [carregandoListas, setCarregandoListas] = useState(true);
  const [erroListas, setErroListas] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarListas() {
      try {
        const [listaPropriedades, listaLotes] = await Promise.all([
          propriedadeService.listar(),
          loteService.listar(),
        ]);
        if (!ativo) return;
        setPropriedades(listaPropriedades);
        setLotes(listaLotes);

        // Na edicao, a propriedade vem do lote que o sensor ja tem.
        const loteAtual = listaLotes.find((lote) => lote.id === initialValues?.loteId);
        if (loteAtual) {
          setForm((atual) => ({ ...atual, propriedadeId: String(loteAtual.propriedadeId) }));
        }
      } catch (error) {
        if (ativo) {
          setErroListas(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar as propriedades e os lotes.",
          );
        }
      } finally {
        if (ativo) setCarregandoListas(false);
      }
    }

    carregarListas();

    return () => {
      ativo = false;
    };
    // initialValues so e lido uma vez, na abertura da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function atualizar(campo: keyof SensorFormValores, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function mudarPropriedade(valor: string) {
    setForm((atual) => {
      const loteAindaValido = lotes.some(
        (lote) => String(lote.id) === atual.loteId && String(lote.propriedadeId) === valor,
      );
      return { ...atual, propriedadeId: valor, loteId: valor && !loteAindaValido ? "" : atual.loteId };
    });
  }

  const lotesVisiveis = form.propriedadeId
    ? lotes.filter((lote) => String(lote.propriedadeId) === form.propriedadeId)
    : lotes;

  const tipoForaDaLista =
    form.tipo !== "" && !TIPOS_SENSOR.some((tipo) => tipo.value === form.tipo);

  function validar() {
    const novos: Record<string, string> = {};

    const codigo = form.codigo.trim();
    if (codigo.length < 1 || codigo.length > 45) novos.codigo = "Informe o código do sensor (até 45 caracteres).";

    const tipo = form.tipo.trim();
    if (tipo.length < 1 || tipo.length > 45) novos.tipo = "Selecione o tipo de sensor.";

    if (form.localizacao.trim().length > 150) novos.localizacao = "A localização deve ter no máximo 150 caracteres.";

    if (!form.dataInstalacao) novos.dataInstalacao = "Informe a data de instalação.";
    else if (form.dataInstalacao > hojeIso()) novos.dataInstalacao = "A data de instalação não pode ser no futuro.";

    if (!Number.isInteger(Number(form.loteId)) || Number(form.loteId) <= 0) novos.loteId = "Selecione o lote.";

    setErrors(novos);
    return Object.keys(novos).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setGeneralError("");

    if (!validar()) return;

    setSaving(true);

    try {
      await onSubmit({
        codigo: form.codigo.trim(),
        tipo: form.tipo.trim(),
        localizacao: form.localizacao.trim() || null,
        dataInstalacao: form.dataInstalacao,
        loteId: Number(form.loteId),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        // Ex.: 409 "Já existe um sensor com esse código." (vem tambem no campo codigo).
        setGeneralError(error.message);
        if (error.campos) setErrors((atual) => ({ ...atual, ...error.campos }));
      } else {
        setGeneralError("Não foi possível salvar o sensor. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  const semLotes = !carregandoListas && !erroListas && lotes.length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="border-t border-[#edf1ee] p-5 sm:p-7">
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{generalError}</FeedbackMessage>
        </div>
      ) : null}

      {erroListas ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{erroListas}</FeedbackMessage>
        </div>
      ) : null}

      {semLotes ? (
        <div className="mb-5">
          <FeedbackMessage variant="info">
            Você ainda não tem lotes cadastrados. Cadastre um lote antes de criar um sensor.
          </FeedbackMessage>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="codigo" rotulo="Código do sensor" erro={errors.codigo}>
          <input
            id="codigo"
            name="codigo"
            type="text"
            value={form.codigo}
            onChange={(e) => atualizar("codigo", e.target.value)}
            aria-invalid={Boolean(errors.codigo)}
            placeholder="Ex.: SN-001"
            className={CAMPO}
          />
        </Campo>

        <Campo id="tipo" rotulo="Tipo de sensor" erro={errors.tipo}>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={(e) => atualizar("tipo", e.target.value)}
            aria-invalid={Boolean(errors.tipo)}
            className={CAMPO}
          >
            <option value="" disabled>
              Selecione o tipo
            </option>

            {TIPOS_SENSOR.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}

            {tipoForaDaLista ? <option value={form.tipo}>{rotuloTipoSensor(form.tipo)}</option> : null}
          </select>
        </Campo>

        <Campo id="localizacao" rotulo="Localização (opcional)" erro={errors.localizacao} className="sm:col-span-2">
          <input
            id="localizacao"
            name="localizacao"
            type="text"
            value={form.localizacao}
            onChange={(e) => atualizar("localizacao", e.target.value)}
            aria-invalid={Boolean(errors.localizacao)}
            placeholder="Ex.: Lote 1, ponto 1"
            className={CAMPO}
          />
        </Campo>

        <Campo id="dataInstalacao" rotulo="Data de instalação" erro={errors.dataInstalacao}>
          <input
            id="dataInstalacao"
            name="dataInstalacao"
            type="date"
            max={hojeIso()}
            value={form.dataInstalacao}
            onChange={(e) => atualizar("dataInstalacao", e.target.value)}
            aria-invalid={Boolean(errors.dataInstalacao)}
            className={CAMPO}
          />
        </Campo>

        <Campo id="propriedade" rotulo="Propriedade (filtra os lotes)">
          <select
            id="propriedade"
            name="propriedade"
            value={form.propriedadeId}
            onChange={(e) => mudarPropriedade(e.target.value)}
            disabled={carregandoListas}
            className={CAMPO}
          >
            <option value="">{carregandoListas ? "Carregando..." : "Todas as propriedades"}</option>

            {propriedades.map((propriedade) => (
              <option key={propriedade.id} value={propriedade.id}>
                {propriedade.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="lote" rotulo="Lote" erro={errors.loteId} className="sm:col-span-2">
          <select
            id="lote"
            name="lote"
            value={form.loteId}
            onChange={(e) => atualizar("loteId", e.target.value)}
            disabled={carregandoListas}
            aria-invalid={Boolean(errors.loteId)}
            className={CAMPO}
          >
            <option value="" disabled>
              {carregandoListas ? "Carregando..." : "Selecione o lote"}
            </option>

            {lotesVisiveis.map((lote) => (
              <option key={lote.id} value={lote.id}>
                {lote.identificacao}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#edf1ee] pt-6 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={saving || carregandoListas}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <Save size={17} aria-hidden="true" />
          )}
          {saving ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  className = "",
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-[#28372f]">
        {rotulo}
      </label>

      {children}

      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
