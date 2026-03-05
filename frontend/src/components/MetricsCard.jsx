
import React from "react";
import { FaTruck } from "react-icons/fa";

function formatDuration(sec) {
  if (!sec) return "0 min";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h > 0 ? h + "h " : ""}${m}min`;
}

export default function MetricsCard({ distance_m, duration_s, avg_kmh }) {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white bg-opacity-80 backdrop-blur-md rounded-xl p-4 shadow-lg w-60 space-y-2 text-sm">
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
  );
}
