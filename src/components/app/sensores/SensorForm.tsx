import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";

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
  cancelTo?: string;
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

export function SensorForm({
  initialValues,
  submitLabel,
  cancelTo = "/sensores",
  onSubmit,
}: SensorFormProps) {
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

        // Na edição, a propriedade vem do lote que o sensor já tem.
        const loteAtual = listaLotes.find(
          (lote) => lote.id === initialValues?.loteId,
        );
        if (loteAtual) {
          setForm((atual) => ({
            ...atual,
            propriedadeId: String(loteAtual.propriedadeId),
          }));
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

    void carregarListas();

    return () => {
      ativo = false;
    };
    // initialValues só é lido uma vez, na abertura da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function atualizar(campo: keyof SensorFormValores, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function mudarPropriedade(valor: string) {
    setForm((atual) => {
      const loteAindaValido = lotes.some(
        (lote) =>
          String(lote.id) === atual.loteId &&
          String(lote.propriedadeId) === valor,
      );
      return {
        ...atual,
        propriedadeId: valor,
        loteId: valor && !loteAindaValido ? "" : atual.loteId,
      };
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
    if (codigo.length < 1 || codigo.length > 45) {
      novos.codigo = "Informe o código do sensor (até 45 caracteres).";
    }

    const tipo = form.tipo.trim();
    if (tipo.length < 1 || tipo.length > 45) {
      novos.tipo = "Selecione o tipo de sensor.";
    }

    if (form.localizacao.trim().length > 150) {
      novos.localizacao = "A localização deve ter no máximo 150 caracteres.";
    }

    if (!form.dataInstalacao) {
      novos.dataInstalacao = "Informe a data de instalação.";
    } else if (form.dataInstalacao > hojeIso()) {
      novos.dataInstalacao = "A data de instalação não pode ser no futuro.";
    }

    if (!Number.isInteger(Number(form.loteId)) || Number(form.loteId) <= 0) {
      novos.loteId = "Selecione o lote.";
    }

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
        // Ex.: 409 "Já existe um sensor com esse código." (vem também no campo codigo).
        setGeneralError(error.message);
        if (error.campos) {
          setErrors((atual) => ({ ...atual, ...error.campos }));
        }
      } else {
        setGeneralError("Não foi possível salvar o sensor. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  const semLotes = !carregandoListas && !erroListas && lotes.length === 0;

  const loteSelecionado = lotes.find((item) => String(item.id) === form.loteId);
  const propriedadeSelecionada = propriedades.find(
    (item) =>
      String(item.id) ===
      (form.propriedadeId || String(loteSelecionado?.propriedadeId ?? "")),
  );

  const etapaIdentificacaoOk =
    form.codigo.trim().length > 0 && form.tipo.trim().length > 0;
  const etapaInstalacaoOk = form.dataInstalacao.trim().length > 0;
  const etapaVinculoOk = Number(form.loteId) > 0;
  const configuracaoCompleta =
    etapaIdentificacaoOk && etapaInstalacaoOk && etapaVinculoOk;

  return (
    <form onSubmit={handleSubmit} noValidate>
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
            Você ainda não tem lotes cadastrados. Cadastre um lote antes de
            criar um sensor.
          </FeedbackMessage>
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        {/* Coluna esquerda: formulário estruturado */}
        <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
          <div className="space-y-6">
            <div className="border-b border-[#edf2ee] pb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                Especificações do dispositivo
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#68756d]">
                Informe a identificação técnica e o lote onde o sensor está
                instalado.
              </p>
            </div>

            {/* Grupo 1: Identificação técnica */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Identificação técnica
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  id="codigo"
                  rotulo="Código do sensor"
                  obrigatorio
                  erro={errors.codigo}
                >
                  <input
                    id="codigo"
                    name="codigo"
                    type="text"
                    value={form.codigo}
                    onChange={(e) => atualizar("codigo", e.target.value)}
                    aria-invalid={Boolean(errors.codigo)}
                    aria-describedby={
                      errors.codigo ? "codigo-erro" : undefined
                    }
                    placeholder="Ex.: SN-001"
                    className={`${inputClass(Boolean(errors.codigo))} font-mono`}
                  />
                </Campo>

                <Campo
                  id="tipo"
                  rotulo="Tipo de sensor"
                  obrigatorio
                  erro={errors.tipo}
                >
                  <select
                    id="tipo"
                    name="tipo"
                    value={form.tipo}
                    onChange={(e) => atualizar("tipo", e.target.value)}
                    aria-invalid={Boolean(errors.tipo)}
                    aria-describedby={errors.tipo ? "tipo-erro" : undefined}
                    className={inputClass(Boolean(errors.tipo))}
                  >
                    <option value="" disabled>
                      Selecione o tipo
                    </option>

                    {TIPOS_SENSOR.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}

                    {tipoForaDaLista ? (
                      <option value={form.tipo}>
                        {rotuloTipoSensor(form.tipo)}
                      </option>
                    ) : null}
                  </select>
                </Campo>

                <Campo
                  id="localizacao"
                  rotulo="Localização"
                  erro={errors.localizacao}
                  className="sm:col-span-2"
                >
                  <input
                    id="localizacao"
                    name="localizacao"
                    type="text"
                    value={form.localizacao}
                    onChange={(e) => atualizar("localizacao", e.target.value)}
                    aria-invalid={Boolean(errors.localizacao)}
                    aria-describedby={
                      errors.localizacao ? "localizacao-erro" : undefined
                    }
                    placeholder="Ex.: Talhão Norte, ponto 01 (opcional)"
                    className={inputClass(Boolean(errors.localizacao))}
                  />
                </Campo>
              </div>
            </div>

            {/* Grupo 2: Instalação e vínculo */}
            <div className="space-y-4 border-t border-[#edf2ee] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Instalação e vínculo operacional
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  id="dataInstalacao"
                  rotulo="Data de instalação"
                  obrigatorio
                  erro={errors.dataInstalacao}
                >
                  <input
                    id="dataInstalacao"
                    name="dataInstalacao"
                    type="date"
                    max={hojeIso()}
                    value={form.dataInstalacao}
                    onChange={(e) =>
                      atualizar("dataInstalacao", e.target.value)
                    }
                    aria-invalid={Boolean(errors.dataInstalacao)}
                    aria-describedby={
                      errors.dataInstalacao ? "dataInstalacao-erro" : undefined
                    }
                    className={`${inputClass(Boolean(errors.dataInstalacao))} tabular-nums`}
                  />
                </Campo>

                <Campo id="propriedade" rotulo="Propriedade (filtro)">
                  <select
                    id="propriedade"
                    name="propriedade"
                    value={form.propriedadeId}
                    onChange={(e) => mudarPropriedade(e.target.value)}
                    disabled={carregandoListas}
                    className={`${inputClass(false)} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
                  >
                    <option value="">
                      {carregandoListas
                        ? "Carregando..."
                        : "Todas as propriedades"}
                    </option>

                    {propriedades.map((propriedade) => (
                      <option key={propriedade.id} value={propriedade.id}>
                        {propriedade.nome}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo
                  id="lote"
                  rotulo="Lote vinculado"
                  obrigatorio
                  erro={errors.loteId}
                  className="sm:col-span-2"
                >
                  <select
                    id="lote"
                    name="lote"
                    value={form.loteId}
                    onChange={(e) => atualizar("loteId", e.target.value)}
                    disabled={carregandoListas}
                    aria-invalid={Boolean(errors.loteId)}
                    aria-describedby={errors.loteId ? "lote-erro" : undefined}
                    className={`${inputClass(Boolean(errors.loteId))} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
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
            </div>
          </div>
        </section>

        {/* Coluna direita: ficha do dispositivo + ações */}
        <aside>
          <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Ficha do dispositivo
              </p>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  configuracaoCompleta
                    ? "bg-[#edf7f1] text-[#15693E]"
                    : "bg-[#f2f5f3] text-[#5c6b63]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    configuracaoCompleta ? "bg-[#009B4D]" : "bg-[#97a59d]"
                  }`}
                  aria-hidden="true"
                />
                {configuracaoCompleta ? "Pronto para salvar" : "Em preenchimento"}
              </span>
            </div>

            {/* Placa de identificação técnica */}
            <div className="mt-4 rounded-2xl border border-[#dce6e0] bg-gradient-to-br from-[#f7faf8] to-[#eef5f0] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-[#68756d]">
                    Código do hardware
                  </span>
                  <p className="mt-0.5 truncate font-mono text-xl font-bold tracking-tight text-[#18251e]">
                    {form.codigo.trim() || "SN-000"}
                  </p>
                </div>

                <span className="rounded-lg border border-[#d6e3db] bg-white px-2.5 py-1 text-xs font-semibold text-[#15693E]">
                  {form.tipo
                    ? rotuloTipoSensor(form.tipo)
                    : "Tipo não definido"}
                </span>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-[#e1eae4] pt-3 text-xs">
                <span className="text-[#68756d]">Data de instalação</span>
                <span className="font-mono font-semibold tabular-nums text-[#18251e]">
                  {formatarDataPreview(form.dataInstalacao)}
                </span>
              </div>
            </div>

            {/* Grade modular de destino */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-[#e6ede9] bg-[#f8faf9] p-3">
                <p className="text-[11px] font-medium text-[#68756d]">
                  Propriedade
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#18251e]">
                  {propriedadeSelecionada?.nome ?? "Não definida"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e6ede9] bg-[#f8faf9] p-3">
                <p className="text-[11px] font-medium text-[#68756d]">
                  Lote vinculado
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#18251e]">
                  {loteSelecionado?.identificacao ?? "Não selecionado"}
                </p>
              </div>

              <div className="col-span-2 rounded-xl border border-[#e6ede9] bg-[#f8faf9] p-3">
                <p className="text-[11px] font-medium text-[#68756d]">
                  Ponto de instalação em campo
                </p>
                <p className="mt-1 text-sm font-semibold text-[#18251e]">
                  {form.localizacao.trim() || "Localização não especificada"}
                </p>
              </div>
            </div>

            {/* Indicador de etapas preenchidas */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <EtapaPill
                rotulo="Identificação"
                concluida={etapaIdentificacaoOk}
              />
              <EtapaPill rotulo="Instalação" concluida={etapaInstalacaoOk} />
              <EtapaPill rotulo="Vínculo" concluida={etapaVinculoOk} />
            </div>

            {/* Barra de ações */}
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#edf2ee] pt-5 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to={cancelTo}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8e3dc] bg-white px-5 text-sm font-semibold text-[#48574e] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving || carregandoListas}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[#009B4D] px-7 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : submitLabel}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `min-h-12 w-full rounded-xl border bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:bg-white focus:ring-4 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
      : "border-[#dce5df] focus:border-[#009B4D] focus:ring-[#009B4D]/10"
  }`;
}

function formatarDataPreview(isoDate: string) {
  if (!isoDate) return "Não informada";
  const partes = isoDate.split("-");
  if (partes.length !== 3) return isoDate;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function EtapaPill({
  rotulo,
  concluida,
}: {
  rotulo: string;
  concluida: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 text-center transition ${
        concluida
          ? "border-[#cce5d6] bg-[#edf7f1] text-[#15693E]"
          : "border-[#e8efeb] bg-[#fafcfb] text-[#7a8980]"
      }`}
    >
      <span
        className={`mx-auto mb-1 block h-1 w-6 rounded-full ${
          concluida ? "bg-[#009B4D]" : "bg-[#d5dfd9]"
        }`}
        aria-hidden="true"
      />
      <span className="block text-[11px] font-semibold">{rotulo}</span>
    </div>
  );
}

function Campo({
  id,
  rotulo,
  obrigatorio,
  erro,
  className = "",
  children,
}: {
  id: string;
  rotulo: string;
  obrigatorio?: boolean;
  erro?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#2d3b33]"
      >
        {rotulo}

        {obrigatorio ? (
          <span className="ml-1 text-[#009B4D]" aria-hidden="true">
            *
          </span>
        ) : null}

        {obrigatorio ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>

      {children}

      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-red-600">
          {erro}
        </p>
      ) : null}
    </div>
  );
}