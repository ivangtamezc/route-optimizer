
import React from "react";

const AUTONOMIA_KM = 450;

export default function BatteryCard({ distance_m }) {
  if (!distance_m || distance_m <= 0) return null;

  const distancia_km = distance_m / 1000;
  const bateria_usada = (distancia_km / AUTONOMIA_KM) * 100;
  const bateria_restante = Math.max(0, 100 - bateria_usada);
  const km_disponibles = (bateria_restante * AUTONOMIA_KM) / 100;
  const excede = bateria_usada > 100;

  let color = "#16a34a";
  if (bateria_restante <= 20) color = "#dc2626";
  else if (bateria_restante <= 50) color = "#eab308";

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white bg-opacity-80 backdrop-blur-md rounded-xl p-2 shadow-lg w-44 text-xs">
      <p className="font-semibold text-slate-700 mb-1">🔋 Batería estimada</p>

      {excede ? (
        <p className="font-medium" style={{ color: "#dc2626" }}>
          ⚠️ Excede autonomía (450 km)
        </p>
      ) : (
        <>
          <div className="flex items-center space-x-1 mb-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${bateria_restante}%`, backgroundColor: color }}
              />
            </div>
            <div
              className="w-1 h-1.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          </div>
          <p style={{ color }}>
            {bateria_restante.toFixed(0)}% restante · {km_disponibles.toFixed(0)} km disponibles
          </p>
        </>
      )}
    </div>
  );
}
