import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PropertyLocationPreviewProps {
  latitude?: string | number;
  longitude?: string | number;
  cidade?: string;
  uf?: string;
  buscandoLocalizacao?: boolean;
}

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapCenter({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], 13, {
      animate: true,
    });
  }, [map, latitude, longitude]);

  return null;
}

export function PropertyLocationPreview({
  latitude,
  longitude,
  cidade,
  uf,
  buscandoLocalizacao = false,
}: PropertyLocationPreviewProps) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  const hasCoordinates =
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;

  const localizacao =
    cidade || uf
      ? `${cidade || "Localização"}${cidade && uf ? " - " : ""}${uf || ""}`
      : "Propriedade";

  if (!hasCoordinates) {
    return (
      <div className="grid min-h-[270px] place-items-center rounded-2xl border border-[#dce5df] bg-[#eef2ef] px-5 text-center">
        <div>
          {buscandoLocalizacao ? (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dce5df] border-t-[#009B4D]" />

              <p className="mt-4 text-sm font-semibold text-[#2e3e35]">
                Localizando propriedade...
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6e7b73]">
                Buscando as coordenadas de {cidade} - {uf}.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#2e3e35]">
                Prévia da localização
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6e7b73]">
                Informe uma cidade e uma UF para localizar a propriedade no
                mapa.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-[270px] overflow-hidden rounded-2xl border border-[#dce5df]">
      <MapContainer
        center={[parsedLatitude, parsedLongitude]}
        zoom={13}
        scrollWheelZoom={false}
        style={{
          height: "270px",
          width: "100%",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
        />

        <MapCenter
          latitude={parsedLatitude}
          longitude={parsedLongitude}
        />

        <Marker
          position={[parsedLatitude, parsedLongitude]}
          icon={markerIcon}
        >
          <Popup>
            <strong>{localizacao}</strong>
            <br />
            Lat. {parsedLatitude.toFixed(6)}
            <br />
            Long. {parsedLongitude.toFixed(6)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}