import { LoaderCircle, RotateCcw } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
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

interface MunicipioItem {
  nome: string;
  uf: string;
  nomeNormalizado: string;
}

let cacheMunicipiosBrasil: MunicipioItem[] | null = null;
let promessaMunicipiosBrasil: Promise<MunicipioItem[]> | null = null;

function normalizarTexto(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function carregarMunicipiosBrasil(): Promise<MunicipioItem[]> {
  if (cacheMunicipiosBrasil) return cacheMunicipiosBrasil;
  if (promessaMunicipiosBrasil) return promessaMunicipiosBrasil;

  promessaMunicipiosBrasil = fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
    {
      headers: { Accept: "application/json" },
    },
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Falha ao consultar municípios no IBGE.");
      }
      return response.json();
    })
    .then(
      (
        dados: Array<{
          nome?: string;
          microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } } | null;
          "regiao-imediata"?: {
            "regiao-intermediaria"?: { UF?: { sigla?: string } };
          } | null;
        }>,
      ) => {
        const lista: MunicipioItem[] = [];

        if (Array.isArray(dados)) {
          for (const item of dados) {
            const nome = String(item?.nome ?? "").trim();
            const uf = String(
              item?.microrregiao?.mesorregiao?.UF?.sigla ??
                item?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF
                  ?.sigla ??
                "",
            )
              .trim()
              .toUpperCase();

            if (nome && UFS.includes(uf)) {
              lista.push({
                nome,
                uf,
                nomeNormalizado: normalizarTexto(nome),
              });
            }
          }
        }

        lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        cacheMunicipiosBrasil = lista;
        return lista;
      },
    )
    .catch((error) => {
      promessaMunicipiosBrasil = null;
      throw error;
    });

  return promessaMunicipiosBrasil;
}

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
  cancelTo?: string;
  onSubmit: (payload: PropriedadePayload) => Promise<void>;
}

export function PropertyForm({
  initialValues,
  submitLabel,
  cancelTo = "/propriedades",
  onSubmit,
}: PropertyFormProps) {
  const formId = useId();
  const [form, setForm] = useState({
    nome: String(initialValues?.nome ?? ""),
    area: String(initialValues?.area ?? ""),
    cidade: String(initialValues?.cidade ?? ""),
    uf: String(initialValues?.uf ?? ""),
    latitude: String(initialValues?.latitude ?? ""),
    longitude: String(initialValues?.longitude ?? ""),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [saving, setSaving] = useState(false);

  const [todosMunicipios, setTodosMunicipios] = useState<MunicipioItem[]>(
    () => cacheMunicipiosBrasil ?? [],
  );
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(
    () => !cacheMunicipiosBrasil,
  );
  const [ibgeIndisponivel, setIbgeIndisponivel] = useState(false);
  const [erroValidacaoCidade, setErroValidacaoCidade] = useState("");

  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
  const cidadeContainerRef = useRef<HTMLDivElement>(null);

  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const [ajusteManual, setAjusteManual] = useState(false);

  const ultimaBuscaRef = useRef(
    initialValues?.cidade && initialValues?.uf
      ? `${normalizarTexto(String(initialValues.cidade))}|${String(initialValues.uf)}`
      : "",
  );
  const coordenadasCidadeRef = useRef<{ lat: string; lon: string } | null>(
    initialValues?.latitude && initialValues?.longitude
      ? {
          lat: String(initialValues.latitude),
          lon: String(initialValues.longitude),
        }
      : null,
  );

  useEffect(() => {
    const cidadeInicial = String(initialValues?.cidade ?? "");
    const ufInicial = String(initialValues?.uf ?? "");
    const latInicial = String(initialValues?.latitude ?? "");
    const lonInicial = String(initialValues?.longitude ?? "");

    ultimaBuscaRef.current =
      cidadeInicial.trim() && ufInicial
        ? `${normalizarTexto(cidadeInicial)}|${ufInicial}`
        : "";
    coordenadasCidadeRef.current =
      latInicial && lonInicial ? { lat: latInicial, lon: lonInicial } : null;
    setAjusteManual(false);
    setErroValidacaoCidade("");
    setErroLocalizacao("");
    setDropdownAberto(false);

    setForm({
      nome: String(initialValues?.nome ?? ""),
      area: String(initialValues?.area ?? ""),
      cidade: cidadeInicial,
      uf: ufInicial,
      latitude: latInicial,
      longitude: lonInicial,
    });
  }, [initialValues]);

  // Carrega a base nacional de municípios do IBGE uma única vez
  useEffect(() => {
    if (cacheMunicipiosBrasil) {
      setTodosMunicipios(cacheMunicipiosBrasil);
      setCarregandoMunicipios(false);
      return;
    }

    let ativo = true;
    setCarregandoMunicipios(true);

    carregarMunicipiosBrasil()
      .then((lista) => {
        if (!ativo) return;
        setTodosMunicipios(lista);
        setIbgeIndisponivel(false);
      })
      .catch(() => {
        if (!ativo) return;
        setIbgeIndisponivel(true);
      })
      .finally(() => {
        if (ativo) setCarregandoMunicipios(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Fecha a lista ao clicar fora do campo de cidade
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        cidadeContainerRef.current &&
        !cidadeContainerRef.current.contains(event.target as Node)
      ) {
        setDropdownAberto(false);
        setIndiceAtivo(-1);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Sugestões filtradas conforme digitação (respeita a UF se já estiver selecionada)
  const sugestoesCidades = useMemo(() => {
    const termo = normalizarTexto(form.cidade);
    if (termo.length < 2 || todosMunicipios.length === 0) return [];

    const base = form.uf
      ? todosMunicipios.filter((item) => item.uf === form.uf)
      : todosMunicipios;

    const comecaCom: MunicipioItem[] = [];
    const contem: MunicipioItem[] = [];

    for (const item of base) {
      if (item.nomeNormalizado.startsWith(termo)) {
        comecaCom.push(item);
      } else if (item.nomeNormalizado.includes(termo)) {
        contem.push(item);
      }
    }

    return [...comecaCom, ...contem].slice(0, 10);
  }, [form.cidade, form.uf, todosMunicipios]);

  // Verifica se o par Cidade + UF é oficialmente válido
  const municipioOficial = useMemo(() => {
    const alvo = normalizarTexto(form.cidade);
    if (!alvo || !form.uf || todosMunicipios.length === 0) return undefined;
    return todosMunicipios.find(
      (item) => item.uf === form.uf && item.nomeNormalizado === alvo,
    );
  }, [form.cidade, form.uf, todosMunicipios]);

  // Valida a combinação Cidade + UF e busca coordenadas somente quando válida
  useEffect(() => {
    const cidadeLimpa = form.cidade.trim();

    if (!cidadeLimpa || !form.uf) {
      setErroValidacaoCidade("");
      setErroLocalizacao("");
      return;
    }

    if (carregandoMunicipios) return;

    if (!ibgeIndisponivel && todosMunicipios.length > 0) {
      if (!municipioOficial) {
        if (ultimaBuscaRef.current !== "") {
          ultimaBuscaRef.current = "";
          coordenadasCidadeRef.current = null;
          setAjusteManual(false);
          setForm((current) =>
            current.latitude || current.longitude
              ? { ...current, latitude: "", longitude: "" }
              : current,
          );
        }

        if (cidadeLimpa.length < 2) {
          setErroValidacaoCidade("");
          return;
        }

        const timerAviso = window.setTimeout(() => {
          setErroValidacaoCidade(
            `O município "${cidadeLimpa}" não pertence à UF ${form.uf}.`,
          );
        }, 550);

        return () => window.clearTimeout(timerAviso);
      }

      setErroValidacaoCidade("");
      setErrors((current) => {
        if (!current.cidade) return current;
        const { cidade: _removido, ...restante } = current;
        return restante;
      });
    }

    const nomeParaBusca = municipioOficial?.nome ?? cidadeLimpa;
    const chaveAtual = `${normalizarTexto(nomeParaBusca)}|${form.uf}`;

    if (chaveAtual === ultimaBuscaRef.current) return;
    if (!municipioOficial && cidadeLimpa.length < 3) return;

    const controller = new AbortController();

    const timerBusca = window.setTimeout(async () => {
      ultimaBuscaRef.current = chaveAtual;
      setBuscandoLocalizacao(true);
      setErroLocalizacao("");

      try {
        const params = new URLSearchParams({
          city: nomeParaBusca,
          state: form.uf,
          country: "Brazil",
          countrycodes: "br",
          addressdetails: "1",
          format: "jsonv2",
          limit: "5",
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Não foi possível consultar a localização.");
        }

        const resultados: Array<{
          lat: string;
          lon: string;
          address?: Record<string, string>;
        }> = await response.json();

        const correspondente = Array.isArray(resultados)
          ? resultados.find(
              (item) =>
                item.address?.["ISO3166-2-lvl4"]?.toUpperCase() ===
                `BR-${form.uf}`,
            )
          : undefined;

        if (!correspondente) {
          coordenadasCidadeRef.current = null;
          setForm((current) => ({
            ...current,
            latitude: "",
            longitude: "",
          }));

          if (ibgeIndisponivel) {
            setErroValidacaoCidade(
              `Não foi possível confirmar "${cidadeLimpa}" na UF ${form.uf}.`,
            );
          } else {
            setErroLocalizacao(
              "Coordenadas exatas indisponíveis no mapa, mas o município foi validado.",
            );
          }
          return;
        }

        const lat = String(correspondente.lat);
        const lon = String(correspondente.lon);

        setErroValidacaoCidade("");
        coordenadasCidadeRef.current = { lat, lon };
        setAjusteManual(false);
        setForm((current) => ({
          ...current,
          latitude: lat,
          longitude: lon,
        }));
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setErroLocalizacao(
          "Não foi possível atualizar o mapa agora, mas você ainda pode salvar o cadastro.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setBuscandoLocalizacao(false);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timerBusca);
      controller.abort();
    };
  }, [
    form.cidade,
    form.uf,
    municipioOficial,
    todosMunicipios.length,
    carregandoMunicipios,
    ibgeIndisponivel,
  ]);

  function selecionarMunicipio(item: MunicipioItem) {
    setDropdownAberto(false);
    setIndiceAtivo(-1);
    setErroValidacaoCidade("");
    setErroLocalizacao("");
    setErrors((current) => {
      if (!current.cidade && !current.uf) return current;
      const { cidade: _c, uf: _u, ...restante } = current;
      return restante;
    });
    setForm((current) => ({
      ...current,
      cidade: item.nome,
      uf: item.uf,
    }));
  }

  function handleUfChange(novaUf: string) {
    ultimaBuscaRef.current = "";
    coordenadasCidadeRef.current = null;
    setAjusteManual(false);
    setErroValidacaoCidade("");
    setErroLocalizacao("");
    setErrors((current) => {
      if (!current.cidade && !current.uf) return current;
      const { cidade: _c, uf: _u, ...restante } = current;
      return restante;
    });
    setForm((current) => ({
      ...current,
      uf: novaUf,
      latitude: "",
      longitude: "",
    }));
  }

  function handleCidadeChange(novaCidade: string) {
    const limpa = novaCidade.trim();
    setIndiceAtivo(-1);

    if (!limpa) {
      ultimaBuscaRef.current = "";
      coordenadasCidadeRef.current = null;
      setAjusteManual(false);
      setErroValidacaoCidade("");
      setErroLocalizacao("");
      setDropdownAberto(false);
      setForm((current) => ({
        ...current,
        cidade: novaCidade,
        latitude: "",
        longitude: "",
      }));
      return;
    }

    setDropdownAberto(limpa.length >= 2);
    setForm((current) => ({
      ...current,
      cidade: novaCidade,
    }));
  }

  function handleCidadeBlur() {
    window.setTimeout(() => {
      setDropdownAberto(false);
      setIndiceAtivo(-1);

      const alvo = normalizarTexto(form.cidade);
      if (!alvo || todosMunicipios.length === 0) return;

      // Se a UF já está definida, apenas padroniza a grafia oficial
      if (form.uf && municipioOficial && form.cidade !== municipioOficial.nome) {
        setForm((current) => ({
          ...current,
          cidade: municipioOficial.nome,
        }));
        return;
      }

      // Se a UF ainda está vazia e há um único município exato no Brasil, preenche automaticamente
      if (!form.uf) {
        const correspondenciasExatas = todosMunicipios.filter(
          (item) => item.nomeNormalizado === alvo,
        );
        if (correspondenciasExatas.length === 1) {
          selecionarMunicipio(correspondenciasExatas[0]);
        }
      }
    }, 120);
  }

  function handleCidadeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!dropdownAberto || sugestoesCidades.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndiceAtivo((prev) =>
        prev < sugestoesCidades.length - 1 ? prev + 1 : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndiceAtivo((prev) =>
        prev > 0 ? prev - 1 : sugestoesCidades.length - 1,
      );
    } else if (event.key === "Enter" && indiceAtivo >= 0) {
      event.preventDefault();
      selecionarMunicipio(sugestoesCidades[indiceAtivo]);
    } else if (event.key === "Escape") {
      setDropdownAberto(false);
      setIndiceAtivo(-1);
    }
  }

  function handleMapPinChange(lat: number, lng: number) {
    if (!municipioOficial && !ibgeIndisponivel) return;
    setAjusteManual(true);
    setErroLocalizacao("");
    setForm((current) => ({
      ...current,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  }

  function handleResetToCity() {
    if (!coordenadasCidadeRef.current) return;
    setAjusteManual(false);
    setForm((current) => ({
      ...current,
      latitude: coordenadasCidadeRef.current!.lat,
      longitude: coordenadasCidadeRef.current!.lon,
    }));
  }

  function validate() {
    const next: Record<string, string> = {};
    const area = Number(form.area);
    const cidadeLimpa = form.cidade.trim();

    if (form.nome.trim().length < 3)
      next.nome = "Informe um nome com pelo menos 3 caracteres.";
    if (!Number.isFinite(area) || area <= 0)
      next.area = "Informe uma área maior que zero.";

    if (!cidadeLimpa) {
      next.cidade = "Informe a cidade.";
    } else if (carregandoMunicipios) {
      next.cidade = "Aguarde o carregamento da base de municípios.";
    } else if (
      !ibgeIndisponivel &&
      todosMunicipios.length > 0 &&
      form.uf &&
      !municipioOficial
    ) {
      next.cidade = `O município "${cidadeLimpa}" não pertence à UF ${form.uf}.`;
    } else if (erroValidacaoCidade) {
      next.cidade = erroValidacaoCidade;
    }

    if (!form.uf || !UFS.includes(form.uf)) {
      next.uf = "Selecione a UF.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setGeneralError("");
    if (!validate()) return;

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const temCoordenadasValidas =
      form.latitude.trim() !== "" &&
      form.longitude.trim() !== "" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !(lat === 0 && lng === 0);

    setSaving(true);
    try {
      await onSubmit({
        nome: form.nome.trim(),
        area: Number(form.area),
        cidade: municipioOficial?.nome ?? form.cidade.trim(),
        uf: form.uf,
        latitude: temCoordenadasValidas ? lat : undefined,
        longitude: temCoordenadasValidas ? lng : undefined,
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
    municipiosList: `${formId}-municipios-list`,
  };

  const erroCidadeExibido = errors.cidade || erroValidacaoCidade;

  const latNumero = Number(form.latitude);
  const lngNumero = Number(form.longitude);
  const coordenadasAtivas =
    form.latitude.trim() !== "" &&
    form.longitude.trim() !== "" &&
    Number.isFinite(latNumero) &&
    Number.isFinite(lngNumero) &&
    !(latNumero === 0 && lngNumero === 0);

  const mostrarDropdownCidades =
    dropdownAberto &&
    form.cidade.trim().length >= 2 &&
    todosMunicipios.length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{generalError}</FeedbackMessage>
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(440px,1.12fr)]">
        {/* Coluna esquerda: dados da propriedade */}
        <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
          <div className="space-y-6">
            <div className="border-b border-[#edf2ee] pb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                Dados da unidade produtiva
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#68756d]">
                Preencha a identificação e o município para georreferenciar a
                propriedade.
              </p>
            </div>

            {/* Grupo 1: Identificação e área */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Identificação e dimensão
              </p>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
                <Field
                  label="Nome da propriedade"
                  required
                  error={errors.nome}
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
                    placeholder="Ex.: Fazenda Vale Verde"
                    autoComplete="organization"
                  />
                </Field>

                <Field
                  label="Área total"
                  required
                  error={errors.area}
                  htmlFor={fields.area}
                >
                  <div className="relative">
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
                      className="input-propriedade pr-12"
                      aria-invalid={Boolean(errors.area)}
                      aria-describedby={
                        errors.area ? `${fields.area}-error` : undefined
                      }
                      placeholder="25.5"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-[#6e7c74]">
                      ha
                    </span>
                  </div>
                </Field>
              </div>
            </div>

            {/* Grupo 2: Localização + autocomplete inteligente */}
            <div className="space-y-4 border-t border-[#edf2ee] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                  Localização geográfica
                </p>

                {buscandoLocalizacao ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15693E]">
                    <LoaderCircle
                      size={13}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Localizando no mapa...
                  </span>
                ) : coordenadasAtivas ? (
                  <span className="rounded-full bg-[#edf7f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#15693E]">
                    {ajusteManual
                      ? "Ponto ajustado no mapa"
                      : `${municipioOficial?.nome ?? form.cidade.trim()} - ${form.uf} · Validado`}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_124px]">
                <Field
                  label="Cidade"
                  required
                  error={erroCidadeExibido}
                  htmlFor={fields.cidade}
                >
                  <div ref={cidadeContainerRef} className="relative">
                    <input
                      id={fields.cidade}
                      role="combobox"
                      aria-expanded={mostrarDropdownCidades}
                      aria-controls={fields.municipiosList}
                      aria-autocomplete="list"
                      aria-activedescendant={
                        indiceAtivo >= 0
                          ? `${fields.municipiosList}-opt-${indiceAtivo}`
                          : undefined
                      }
                      value={form.cidade}
                      onFocus={() => {
                        if (form.cidade.trim().length >= 2) {
                          setDropdownAberto(true);
                        }
                      }}
                      onChange={(event) => handleCidadeChange(event.target.value)}
                      onKeyDown={handleCidadeKeyDown}
                      onBlur={handleCidadeBlur}
                      className="input-propriedade"
                      aria-invalid={Boolean(erroCidadeExibido)}
                      aria-describedby={
                        erroCidadeExibido ? `${fields.cidade}-error` : undefined
                      }
                      placeholder="Ex.: Petrolina"
                      autoComplete="off"
                    />

                    {mostrarDropdownCidades ? (
                      <div
                        id={fields.municipiosList}
                        role="listbox"
                        aria-label="Municípios encontrados"
                        className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-[#dce5df] bg-white p-1.5 shadow-[0_14px_34px_rgba(24,37,30,0.12)]"
                      >
                        <div className="px-3 py-1.5 text-[11px] font-medium text-[#76847c]">
                          {form.uf
                            ? `Municípios em ${form.uf}`
                            : "Selecione o município (a UF será preenchida automaticamente)"}
                        </div>

                        {sugestoesCidades.length > 0 ? (
                          sugestoesCidades.map((item, idx) => {
                            const ativo = idx === indiceAtivo;
                            return (
                              <button
                                key={`${item.nome}-${item.uf}`}
                                id={`${fields.municipiosList}-opt-${idx}`}
                                type="button"
                                role="option"
                                aria-selected={ativo}
                                onMouseEnter={() => setIndiceAtivo(idx)}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  selecionarMunicipio(item);
                                }}
                                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition cursor-pointer ${
                                  ativo
                                    ? "bg-[#edf7f1] font-semibold text-[#15693E]"
                                    : "text-[#23322a] hover:bg-[#f4f8f5]"
                                }`}
                              >
                                <span className="truncate">{item.nome}</span>
                                <span
                                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                    ativo
                                      ? "bg-[#d6eee0] text-[#15693E]"
                                      : "bg-[#f1f5f3] text-[#5c6b63]"
                                  }`}
                                >
                                  {item.uf}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-3 py-2.5 text-xs text-[#68756d]">
                            {form.uf
                              ? `Nenhum município encontrado em ${form.uf} para "${form.cidade.trim()}".`
                              : `Nenhum município encontrado para "${form.cidade.trim()}".`}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </Field>

                <Field label="UF" required error={errors.uf} htmlFor={fields.uf}>
                  <select
                    id={fields.uf}
                    value={form.uf}
                    onChange={(event) => handleUfChange(event.target.value)}
                    className="input-propriedade"
                    aria-invalid={Boolean(errors.uf)}
                    aria-describedby={
                      errors.uf ? `${fields.uf}-error` : undefined
                    }
                  >
                    <option value="">UF</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {erroLocalizacao && !erroCidadeExibido ? (
                <p className="text-xs leading-5 text-amber-700">
                  {erroLocalizacao}
                </p>
              ) : null}

              {/* Informativo textual de coordenadas (sem aparência de input) */}
              <div aria-live="polite" className="text-xs text-[#68756d]">
                {coordenadasAtivas ? (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>Coordenadas vinculadas:</span>
                    <span className="font-mono font-semibold tabular-nums text-[#15693E]">
                      Lat {latNumero.toFixed(6)} · Long {lngNumero.toFixed(6)}
                    </span>
                  </p>
                ) : form.uf ? (
                  <p>
                    Mapa centralizado em {form.uf}. Latitude e longitude são
                    definidas automaticamente ao escolher um município válido.
                  </p>
                ) : (
                  <p>
                    Digite o nome da cidade para filtrar e preencher a UF
                    automaticamente.
                  </p>
                )}
              </div>
            </div>

            {/* Nota de apoio operacional com vetor ilustrativo */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#e3ebe6] bg-[#f6f9f7] p-4 text-center sm:flex-row sm:gap-5 sm:p-5 sm:text-left">
              <img
                src="/assets/Location-search.svg"
                alt=""
                aria-hidden="true"
                className="h-24 w-28 shrink-0 select-none object-contain sm:h-28 sm:w-32"
              />

              <div className="min-w-0 flex-1 text-xs leading-5 text-[#56645c]">
                <p className="text-sm font-semibold text-[#23322a]">
                  Georreferenciamento automático e ajuste fino
                </p>
                <p className="mt-1">
                  As coordenadas são usadas nos alertas climáticos e no cálculo
                  de rotas logísticas. Após localizar a cidade, você pode clicar
                  no mapa ou arrastar o pino para marcar o talhão exato.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coluna direita: card do mapa + rodapé com ações */}
        <aside>
          <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                Localização no mapa
              </h2>
              <p className="mt-0.5 text-sm leading-6 text-[#68756d]">
                {municipioOficial
                  ? `${municipioOficial.nome} - ${form.uf}`
                  : form.uf
                    ? `Estado: ${form.uf} · selecione o município para aproximar`
                    : "Região Nordeste · digite a cidade ao lado para localizar"}
              </p>
            </div>

            <PropertyLocationPreview
              latitude={form.latitude}
              longitude={form.longitude}
              cidade={municipioOficial?.nome ?? form.cidade}
              uf={form.uf}
              buscandoLocalizacao={buscandoLocalizacao}
              onLocationChange={
                municipioOficial || ibgeIndisponivel
                  ? handleMapPinChange
                  : undefined
              }
              className="h-[560px] sm:h-[660px] lg:h-[740px]"
            />

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#68756d]">
              <span>
                {municipioOficial
                  ? "Clique em qualquer ponto do mapa ou arraste o marcador para refinar a posição."
                  : "Escolha um município na lista ao lado para habilitar o marcador no mapa."}
              </span>

              {ajusteManual && coordenadasCidadeRef.current ? (
                <button
                  type="button"
                  onClick={handleResetToCity}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#15693E] transition hover:text-[#009B4D] cursor-pointer"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  Centralizar na cidade
                </button>
              ) : null}
            </div>

            {/* Barra de ações integrada ao card */}
            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#edf2ee] pt-5 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to={cancelTo}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8e3dc] bg-white px-5 text-sm font-semibold text-[#48574e] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#009B4D] px-7 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
        className="mb-2 block text-sm font-semibold text-[#2d3b33]"
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
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}