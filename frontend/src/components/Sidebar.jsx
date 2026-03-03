
import React from "react";
import { FaDownload } from "react-icons/fa";

export default function Sidebar({
  modeAdd,
  setModeAdd,
  optimizeByTime,
  isSimulating,
  startSim,
  stopSim,
  stops,
  removeStop,
  vehicleType,
  setVehicleType,
  hasRoute,
  onDownload,
}) {
  return (
    <aside className="relative w-[260px] min-w-[260px] flex-shrink-0 h-full overflow-y-auto bg-slate-100 border-r border-gray-200 p-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Tipo de vehículo
        </label>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white p-2"
        >
          <option>Camión</option>
          <option>Van</option>
          <option>Eléctrico</option>
        </select>
      </div>

      <div className="flex flex-col space-y-3 mb-6">
        <button
          onClick={optimizeByTime}
          className="w-full bg-green-500 text-white py-3 rounded-xl text-center hover:bg-green-600 transition"
        >
          Optimizar Ruta
        </button>

        {!isSimulating ? (
          <button
            onClick={startSim}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-center hover:bg-blue-700 transition"
          >
            Simular
          </button>
        ) : (
          <button
            onClick={stopSim}
            className="w-full bg-red-500 text-white py-3 rounded-xl text-center hover:bg-red-600 transition"
          >
            Detener Simulación
          </button>
        )}

        {/* Download button */}
        <button
          onClick={hasRoute ? onDownload : undefined}
          disabled={!hasRoute}
          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl transition ${
            hasRoute
              ? "bg-slate-700 text-white hover:bg-slate-800 cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <FaDownload className="text-sm" />
          <span>Descargar</span>
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Paradas</h2>
        <ol className="space-y-4">
          {stops.map((s, i) => (
            <li key={i} className="flex items-start space-x-3">
              <div className="mt-1 w-6 h-6 bg-blue-600 text-white flex items-center justify-center rounded-full text-xs">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Parada {i + 1}</p>
                <p className="text-xs text-gray-500">
                  {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                </p>
              </div>
              <button
                onClick={() => removeStop(i)}
                className="text-gray-400 hover:text-red-500 transition"
                title="Eliminar"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
