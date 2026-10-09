import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppShell, PageBreadcrumb } from "@/components/app/AppShell";
import { SensorForm, type SensorPayload } from "@/components/app/sensores/SensorForm";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { podeEscrever } from "@/lib/permissoes";
import { ApiError } from "@/services/api";
import { sensorService } from "@/services/sensorService";
import type { Sensor } from "@/types/api";

export default function EditarSensor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const sensorId = Number(id);
  const idValido = Number.isInteger(sensorId) && sensorId > 0;

  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [carregando, setCarregando] = useState(idValido);
  const [erro, setErro] = useState(idValido ? "" : "Identificador de sensor inválido.");

  useEffect(() => {
    if (!idValido) return;

    let ativo = true;

    async function carregarSensor() {
      try {
        const dados = await sensorService.buscarPorId(sensorId);
        if (ativo) setSensor(dados);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar o sensor.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarSensor();

    return () => {
      ativo = false;
    };
  }, [sensorId, idValido]);

  async function handleSubmit(payload: SensorPayload) {
    await sensorService.atualizar(sensorId, payload);
    navigate("/sensores", { replace: true });
  }

  return (
    <AppShell section="sensores">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageBreadcrumb
          items={[
            { label: "Sensores", to: "/sensores" },
            { label: sensor?.codigo || "Sensor" },
            { label: "Editar" },
          ]}
        />

        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.5rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Editar sensor
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Atualize as informações de {sensor?.codigo || "seu sensor"} e salve as alterações.
            </p>
          </div>

          <div className="border-t border-[#edf1ee]">
            {carregando ? (
              <p className="p-5 text-sm text-[#68756d] sm:p-7" role="status">
                Carregando sensor...
              </p>
            ) : erro ? (
              <div className="p-5 sm:p-7">
                <FeedbackMessage variant="error">{erro}</FeedbackMessage>
              </div>
            ) : !podeEscrever(usuario?.perfil) ? (
              <div className="p-5 sm:p-7">
                <FeedbackMessage variant="info">
                  Seu perfil não tem permissão para editar sensores.
                </FeedbackMessage>
              </div>
            ) : sensor ? (
              <SensorForm
                submitLabel="Salvar alterações"
                onSubmit={handleSubmit}
                initialValues={{
                  codigo: sensor.codigo,
                  tipo: sensor.tipo,
                  localizacao: sensor.localizacao,
                  dataInstalacao: sensor.dataInstalacao,
                  loteId: sensor.loteId,
                }}
              />
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
