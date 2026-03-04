
import React, { useState } from "react";

const SCENARIOS = [50, 100, 250, 500];
const META = 500;

// Constants
const OPEX_DIESEL_TOTAL  = 427_590_000;
const OPEX_ELEC_TOTAL    = 208_405_216;
const CAPEX_TOTAL        = 984_900_000;
const CAPEX_PER_TRUCK    = 1_774_800;
const CO2_SAVED_PER_KM   = 0.35 * 2.68 - 1.3 * 0.385; // kg/km
const KM_PER_TRUCK_YEAR  = 65_700;

function calcScenario(n) {
  const capex       = n * CAPEX_PER_TRUCK + (n / META) * (CAPEX_TOTAL - META * CAPEX_PER_TRUCK);
  const ahorroAnual = n * (OPEX_DIESEL_TOTAL - OPEX_ELEC_TOTAL) / META;
  const co2TonYear  = (n * KM_PER_TRUCK_YEAR * CO2_SAVED_PER_KM) / 1000;
  const treesYear   = (co2TonYear * 1000) / 21;
  const payback     = capex / ahorroAnual;
  return { capex, ahorroAnual, co2TonYear, treesYear, payback };
}

const fmt = (n) => Math.round(n).toLocaleString("es-MX");

export default function ScenariosPage() {
  const [selected, setSelected] = useState(500);
  const s = calcScenario(selected);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">🔢 Análisis de Escenarios</h1>

      {/* ── Selector de escenario ── */}
      <div>
        <p className="text-sm text-slate-500 mb-3">Selecciona el número de camiones a electrificar:</p>
        <div className="flex space-x-3">
          {SCENARIOS.map((n) => (
            <button
              key={n}
              onClick={() => setSelected(n)}
              className={`relative flex-1 py-5 rounded-2xl text-center font-bold text-lg transition shadow ${
                selected === n
                  ? "bg-green-500 text-white scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {n}
              {n === META && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-700 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                  Meta Actual
                </span>
              )}
              <div className="text-xs font-normal opacity-70 mt-1">camiones</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Métricas del escenario ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: "💰", label: "CAPEX requerido",          value: `$${fmt(s.capex)} MXN`,          color: "bg-slate-800 text-white" },
          { icon: "📉", label: "Ahorro anual OPEX",         value: `$${fmt(s.ahorroAnual)} MXN`,    color: "bg-green-600 text-white" },
          { icon: "⏱️", label: "Payback",                   value: `${s.payback.toFixed(2)} años`,  color: "bg-amber-500 text-white" },
          { icon: "🌿", label: "CO₂ evitado / año",         value: `${s.co2TonYear.toFixed(1)} ton`,color: "bg-emerald-600 text-white" },
          { icon: "🌳", label: "Árboles equivalentes / año",value: `${fmt(s.treesYear)}`,            color: "bg-emerald-800 text-white" },
        ].map((m) => (
          <div key={m.label} className={`${m.color} rounded-2xl p-5 shadow`}>
            <div className="text-3xl mb-1">{m.icon}</div>
            <div className="text-xs opacity-80 mb-1">{m.label}</div>
            <div className="text-xl font-bold leading-tight">{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── Sub-escenarios ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Sub-escenarios para {selected} camiones</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Optimista */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">📈</span>
              <h3 className="text-lg font-bold text-green-800">Escenario Optimista</h3>
            </div>
            <ul className="space-y-3">
              {[
                ["TIR",     "13.11%"],
                ["VPN",     "$435,174,645 MXN"],
                ["Payback", "6.77 años"],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between border-b border-green-100 pb-2">
                  <span className="text-slate-600 text-sm">{k}</span>
                  <span className="font-bold text-green-700">{v}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Supone precio diesel +5% anual, electricidad estable, mayor utilización de flota.
            </p>
          </div>

          {/* Pesimista */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">📉</span>
              <h3 className="text-lg font-bold text-red-800">Escenario Pesimista</h3>
            </div>
            <ul className="space-y-3">
              {[
                ["TIR",     "9.47%"],
                ["VPN",     "$104,665,929 MXN"],
                ["Payback", "6.51 años"],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between border-b border-red-100 pb-2">
                  <span className="text-slate-600 text-sm">{k}</span>
                  <span className="font-bold text-red-700">{v}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Supone precio diesel estable, electricidad +3% anual, menor utilización de flota.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
