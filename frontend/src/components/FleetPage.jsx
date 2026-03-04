
import React from "react";

const START_DATE = new Date("2025-01-01");
const TRUCKS_ELECTRIC = 47;
const TRUCKS_IN_PROGRESS = 23;
const TRUCKS_DIESEL = 430;
const TRUCKS_TOTAL = 500;

// CO2 factor: diesel - electric (kg/km)
const CO2_DIESEL_PER_KM  = 0.35 * 2.68;   // 0.938 kg/km
const CO2_ELEC_PER_KM    = 1.3  * 0.385;  // 0.5005 kg/km
const CO2_SAVED_PER_KM   = CO2_DIESEL_PER_KM - CO2_ELEC_PER_KM; // 0.4375 kg/km
const KM_PER_TRUCK_YEAR  = 65_700;
const DIESEL_PRICE_PER_L = 24.50;
const DIESEL_L_PER_KM    = 0.35;
const ELEC_KWH_PER_KM    = 1.3;

const CEDIS = [
  { name: "CEDIS Topo Chico",      elec: 18, prog: 8,  diesel: 174, total: 200 },
  { name: "CEDIS Guadalupe",       elec: 15, prog: 9,  diesel: 141, total: 165 },
  { name: "CEDIS San Pedro G.G.",  elec: 14, prog: 6,  diesel: 115, total: 135 },
];

function daysSince(date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FleetPage() {
  const days = daysSince(START_DATE);
  const fraction = days / 365;

  const co2SavedKg   = TRUCKS_ELECTRIC * KM_PER_TRUCK_YEAR * fraction * CO2_SAVED_PER_KM;
  const co2SavedTon  = co2SavedKg / 1000;
  const treesEquiv   = co2SavedKg / 21;
  const fuelSavedMXN = TRUCKS_ELECTRIC * KM_PER_TRUCK_YEAR * fraction * DIESEL_L_PER_KM * DIESEL_PRICE_PER_L;
  const kwhConsumed  = TRUCKS_ELECTRIC * KM_PER_TRUCK_YEAR * fraction * ELEC_KWH_PER_KM;

  const pct = ((TRUCKS_ELECTRIC / TRUCKS_TOTAL) * 100).toFixed(1);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">🚛 Estado de la Flota</h1>

      {/* ── Sección 1: Barra de progreso grande ── */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-sm text-slate-500">Progreso de electrificación</p>
            <p className="text-2xl font-bold text-slate-900">
              {TRUCKS_ELECTRIC} de {TRUCKS_TOTAL} camiones electrificados
            </p>
          </div>
          <span className="text-3xl font-bold text-green-600">{pct}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden">
          <div
            className="bg-green-500 h-5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0</span>
          <span>Meta: {TRUCKS_TOTAL}</span>
        </div>
      </div>

      {/* ── Sección 2: 4 tarjetas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🎯", label: "Meta",              value: TRUCKS_TOTAL,       color: "bg-slate-800 text-white" },
          { icon: "✅", label: "Eléctricos activos", value: TRUCKS_ELECTRIC,   color: "bg-green-600 text-white" },
          { icon: "🔄", label: "En proceso",         value: TRUCKS_IN_PROGRESS, color: "bg-blue-600 text-white" },
          { icon: "🚛", label: "Diesel restantes",   value: TRUCKS_DIESEL,     color: "bg-slate-400 text-white" },
        ].map((c) => (
          <div key={c.label} className={`${c.color} rounded-2xl p-5 shadow text-center`}>
            <div className="text-3xl mb-1">{c.icon}</div>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="text-xs opacity-80 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Sección 3: Tabla CEDIS ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Avance por CEDIS</h2>
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-left">
              <tr>
                {["CEDIS","Eléctricos","En proceso","Diesel","Total","% Avance"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CEDIS.map((row) => {
                const rowPct = ((row.elec / row.total) * 100).toFixed(1);
                return (
                  <tr key={row.name} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{row.elec}</td>
                    <td className="px-4 py-3 text-blue-600">{row.prog}</td>
                    <td className="px-4 py-3 text-slate-500">{row.diesel}</td>
                    <td className="px-4 py-3">{row.total}</td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${rowPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-10">{rowPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sección 4: Métricas ESG acumuladas ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Métricas ESG Acumuladas</h2>
        <p className="text-xs text-slate-500 mb-4">
          Desde el 1 de enero 2025 — {days} días transcurridos
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🌿", label: "CO₂ evitado",          value: `${co2SavedTon.toFixed(1)} ton`,                color: "bg-green-600 text-white" },
            { icon: "🌳", label: "Árboles equivalentes",  value: `${Math.round(treesEquiv).toLocaleString("es-MX")}`, color: "bg-emerald-700 text-white" },
            { icon: "💰", label: "Ahorro en combustible", value: `$${Math.round(fuelSavedMXN).toLocaleString("es-MX")} MXN`, color: "bg-amber-500 text-white" },
            { icon: "⚡", label: "kWh limpios consumidos",value: `${Math.round(kwhConsumed).toLocaleString("es-MX")} kWh`, color: "bg-blue-600 text-white" },
          ].map((m) => (
            <div key={m.label} className={`${m.color} rounded-2xl p-5 shadow`}>
              <div className="text-3xl mb-1">{m.icon}</div>
              <div className="text-xs opacity-80 mb-1">{m.label}</div>
              <div className="text-xl font-bold leading-tight">{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
