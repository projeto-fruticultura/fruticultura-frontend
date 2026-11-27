import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PropertyLocationPreviewProps {
  latitude?: string | number;
  longitude?: string | number;
  cidade?: string;
  uf?: string;
  buscandoLocalizacao?: boolean;
  onLocationChange?: (latitude: number, longitude: number) => void;
  className?: string;
}

const UF_VIEWPORTS: Record<string, { center: [number, number]; zoom: number }> = {
  AC: { center: [-9.0238, -70.812], zoom: 7 },
  AL: { center: [-9.5713, -36.782], zoom: 8 },
  AP: { center: [1.4102, -51.77], zoom: 7 },
  AM: { center: [-3.4168, -65.8561], zoom: 6 },
  BA: { center: [-12.5797, -41.7007], zoom: 6 },
  CE: { center: [-5.4984, -39.3206], zoom: 7 },
  DF: { center: [-15.7998, -47.8645], zoom: 10 },
  ES: { center: [-19.1834, -40.3089], zoom: 8 },
  GO: { center: [-15.827, -49.8362], zoom: 7 },
  MA: { center: [-4.9609, -45.2744], zoom: 6 },
  MT: { center: [-12.6819, -56.9211], zoom: 6 },
  MS: { center: [-20.7722, -54.7852], zoom: 7 },
  MG: { center: [-18.5122, -44.555], zoom: 6 },
  PA: { center: [-3.4168, -52.2166], zoom: 6 },
  PB: { center: [-7.24, -36.782], zoom: 8 },
  PR: { center: [-24.894, -51.55], zoom: 7 },
  PE: { center: [-8.38, -37.86], zoom: 7 },
  PI: { center: [-7.7183, -42.7289], zoom: 6 },
  RJ: { center: [-22.3534, -42.7076], zoom: 8 },
  RN: { center: [-5.8126, -36.593], zoom: 8 },
  RS: { center: [-30.0346, -53.2177], zoom: 7 },
  RO: { center: [-10.83, -63.34], zoom: 7 },
  RR: { center: [2.7376, -62.0751], zoom: 7 },
  SC: { center: [-27.2423, -50.2189], zoom: 7 },
  SP: { center: [-22.1965, -48.7972], zoom: 7 },
  SE: { center: [-10.5741, -37.3857], zoom: 8 },
  TO: { center: [-10.1753, -48.2982], zoom: 7 },
};

const DEFAULT_VIEWPORT = UF_VIEWPORTS.PE;
const PROPERTY_ZOOM = 13;

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
  zoom,
  preserveZoom = false,
}: {
  latitude: number;
  longitude: number;
  zoom: number;
  preserveZoom?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const nextZoom = preserveZoom ? Math.max(map.getZoom(), zoom) : zoom;
    map.setView([latitude, longitude], nextZoom, {
      animate: true,
    });
  }, [map, latitude, longitude, zoom, preserveZoom]);

  return null;
}

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange?: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onLocationChange?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function PropertyLocationPreview({
  latitude,
  longitude,
  cidade,
  uf,
  buscandoLocalizacao = false,
  onLocationChange,
  className = "h-[560px] sm:h-[660px] lg:h-[740px]",
}: PropertyLocationPreviewProps) {
  const latStr = String(latitude ?? "").trim();
  const lngStr = String(longitude ?? "").trim();

  const parsedLatitude = Number(latStr);
  const parsedLongitude = Number(lngStr);

  const hasCoordinates =
    latStr !== "" &&
    lngStr !== "" &&
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    !(parsedLatitude === 0 && parsedLongitude === 0) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;

  const normalizedUf = String(uf ?? "").trim().toUpperCase();
  const stateViewport = UF_VIEWPORTS[normalizedUf] ?? DEFAULT_VIEWPORT;

  const targetLatitude = hasCoordinates
    ? parsedLatitude
    : stateViewport.center[0];
  const targetLongitude = hasCoordinates
    ? parsedLongitude
    : stateViewport.center[1];
  const targetZoom = hasCoordinates ? PROPERTY_ZOOM : stateViewport.zoom;

  const localizacao =
    cidade || uf
      ? `${cidade || "Localização"}${cidade && uf ? " - " : ""}${uf || ""}`
      : "Propriedade";

  const markerEventHandlers = useMemo(
    () => ({
      dragend(event: L.DragEndEvent) {
        const marker = event.target as L.Marker;
        const pos = marker.getLatLng();
        onLocationChange?.(pos.lat, pos.lng);
      },
    }),
    [onLocationChange],
  );

  return (
    <div
      className={`relative z-0 overflow-hidden rounded-2xl border border-[#dce5df] shadow-inner ${className}`}
    >
      {buscandoLocalizacao ? (
        <div className="pointer-events-none absolute top-3 right-3 z-[1000] flex items-center gap-2 rounded-full border border-[#dce5df] bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#2e3e35] shadow-sm backdrop-blur-xs">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#dce5df] border-t-[#009B4D]" />
          <span>
            Buscando{" "}
            {cidade ? `${cidade}${uf ? ` - ${uf}` : ""}` : "localização"}...
          </span>
        </div>
      ) : null}

      <MapContainer
        center={[targetLatitude, targetLongitude]}
        zoom={targetZoom}
        scrollWheelZoom={false}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
        />

        <MapCenter
          latitude={targetLatitude}
          longitude={targetLongitude}
          zoom={targetZoom}
          preserveZoom={hasCoordinates}
        />

        {onLocationChange ? (
          <MapClickHandler onLocationChange={onLocationChange} />
        ) : null}

        {hasCoordinates ? (
          <Marker
            position={[parsedLatitude, parsedLongitude]}
            icon={markerIcon}
            draggable={Boolean(onLocationChange)}
            eventHandlers={onLocationChange ? markerEventHandlers : undefined}
          >
            <Popup>
              <strong>{localizacao}</strong>
              <br />
              Lat. {parsedLatitude.toFixed(6)}
              <br />
              Long. {parsedLongitude.toFixed(6)}
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}