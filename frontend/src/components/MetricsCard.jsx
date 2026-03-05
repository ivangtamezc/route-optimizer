
import React from "react";
import { FaTruck } from "react-icons/fa";

const AUTONOMIA_KM = 450;

function formatDuration(sec) {
  if (!sec) return "0 min";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h > 0 ? h + "h " : ""}${m}min`;
}

function BatteryIndicator({ distance_m }) {
  const distancia_km = distance_m / 1000;
  const bateria_usada = (distancia_km / AUTONOMIA_KM) * 100;
  const bateria_restante = Math.max(0, 100 - bateria_usada);
  const km_disponibles = (bateria_restante * AUTONOMIA_KM) / 100;

  const excede = bateria_usada > 100;

  let color = "#16a34a"; // green
  if (bateria_restante <= 20) color = "#dc2626";       // red
  else if (bateria_restante <= 50) color = "#eab308";  // yellow

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs font-semibold text-slate-700 mb-1">🔋 Batería estimada</p>

      {excede ? (
        <p className="text-xs font-medium" style={{ color: "#dc2626" }}>
          ⚠️ Ruta excede autonomía del camión (450 km)
        </p>
      ) : (
        <>
          {/* Battery bar */}
          <div className="flex items-center space-x-1">
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${bateria_restante}%`, backgroundColor: color }}
              />
            </div>
            {/* Battery tip */}
            <div
              className="w-1.5 h-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color }}>
            {bateria_restante.toFixed(0)}% restante · {km_disponibles.toFixed(0)} km disponibles
          </p>
        </>
      )}
    </div>
  );
}

export default function MetricsCard({ distance_m, duration_s, avg_kmh }) {
  const hasRoute = distance_m > 0;

  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white bg-opacity-80 backdrop-blur-md rounded-xl p-3 shadow-lg w-52 text-xs">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FaTruck className="text-blue-600" />
          <span>
            <strong>Duración:</strong> {formatDuration(duration_s)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span>📏</span>
          <span>
            <strong>Distancia:</strong> {(distance_m / 1000).toFixed(2)} km
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span>⚡</span>
          <span>
            <strong>Vel. Promedio:</strong> {avg_kmh.toFixed(1)} km/h
          </span>
        </div>
      </div>

      {hasRoute && <BatteryIndicator distance_m={distance_m} />}
    </div>
  );
}
