import { useNavigate } from "react-router-dom";

import { AppShell, PageBreadcrumb } from "@/components/app/AppShell";
import { SensorForm, type SensorPayload } from "@/components/app/sensores/SensorForm";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { podeEscrever } from "@/lib/permissoes";
import { sensorService } from "@/services/sensorService";

export default function NovoSensor() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  async function handleSubmit(payload: SensorPayload) {
    // Erros (inclusive o 409 de codigo repetido) sobem para o SensorForm, que mostra a mensagem.
    await sensorService.criar(payload);
    navigate("/sensores", { replace: true });
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

          {podeEscrever(usuario?.perfil) ? (
            <SensorForm submitLabel="Cadastrar Sensor" onSubmit={handleSubmit} />
          ) : (
            <div className="border-t border-[#edf1ee] p-5 sm:p-7">
              <FeedbackMessage variant="info">
                Seu perfil não tem permissão para cadastrar sensores.
              </FeedbackMessage>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
