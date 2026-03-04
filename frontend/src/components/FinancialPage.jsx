
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmt = (n) => n.toLocaleString("es-MX");

// OPEX grows 4% diesel / 2% electric per year
const BASE_DIESEL  = 427_590_000;
const BASE_ELEC    = 208_405_216;
const chartData = [1, 5, 10, 15].map((yr) => ({
  año: `Año ${yr}`,
  Diesel:    Math.round(BASE_DIESEL  * Math.pow(1.04, yr - 1)),
  Eléctrico: Math.round(BASE_ELEC   * Math.pow(1.02, yr - 1)),
}));

export default function FinancialPage() {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">📊 Análisis Financiero</h1>

      {/* ── Sección 1: KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CAPEX Total",  value: "$984,900,000 MXN", icon: "💰", color: "bg-slate-800 text-white" },
          { label: "VPN",          value: "$365,264,145 MXN", icon: "📈", color: "bg-green-600 text-white" },
          { label: "TIR",          value: "12.42%",           icon: "📊", color: "bg-blue-600 text-white" },
          { label: "Payback",      value: "6.93 años",        icon: "⏱️", color: "bg-amber-500 text-white" },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.color} rounded-2xl p-5 shadow`}>
            <div className="text-3xl mb-1">{kpi.icon}</div>
            <div className="text-xs font-medium opacity-80 mb-1">{kpi.label}</div>
            <div className="text-lg font-bold leading-tight">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Sección 2: OPEX ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Comparación OPEX Anual</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Diesel */}
          <div className="bg-slate-100 rounded-2xl p-5 shadow">
            <h3 className="font-bold text-slate-700 mb-3">🛢️ Diesel — $427,590,000/año</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex justify-between"><span>Combustible</span><span className="font-medium">$341,640,000</span></li>
              <li className="flex justify-between"><span>Mantenimiento</span><span className="font-medium">$76,500,000</span></li>
              <li className="flex justify-between"><span>Depreciación</span><span className="font-medium">$9,450,000</span></li>
            </ul>
          </div>

          {/* Eléctrico */}
          <div className="bg-green-50 rounded-2xl p-5 shadow">
            <h3 className="font-bold text-green-700 mb-3">⚡ Eléctrico — $208,405,216/año</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex justify-between"><span>Electricidad</span><span className="font-medium">$94,702,608</span></li>
              <li className="flex justify-between"><span>Mantenimiento</span><span className="font-medium">$18,000,000</span></li>
              <li className="flex justify-between"><span>Software</span><span className="font-medium">$10,000,000</span></li>
              <li className="flex justify-between"><span>Seguros</span><span className="font-medium">$10,000,000</span></li>
              <li className="flex justify-between"><span>Depreciación</span><span className="font-medium">$44,370,000</span></li>
              <li className="flex justify-between"><span>Otros</span><span className="font-medium">$31,332,608</span></li>
            </ul>
          </div>

          {/* Ahorro */}
          <div className="bg-blue-600 text-white rounded-2xl p-5 shadow flex flex-col justify-center items-center text-center">
            <div className="text-4xl mb-2">💸</div>
            <div className="text-sm font-medium opacity-80 mb-1">Ahorro Anual</div>
            <div className="text-2xl font-bold">$219,184,784</div>
            <div className="text-sm opacity-80">MXN / año</div>
            <div className="mt-2 bg-white text-blue-700 rounded-full px-3 py-0.5 text-sm font-bold">51.3% menos</div>
          </div>
        </div>
      </div>

      {/* ── Sección 3: Gráfica ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Proyección OPEX (Diesel 4% vs Eléctrico 2% anual)</h2>
        <div className="bg-white rounded-2xl p-6 shadow">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="año" />
              <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v) => [`$${fmt(v)} MXN`, undefined]} />
              <Legend />
              <Bar dataKey="Diesel"    fill="#94a3b8" radius={[4,4,0,0]} />
              <Bar dataKey="Eléctrico" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Sección 4: Bono Verde ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">🌿 Bono Verde</h2>
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              ["Emisión",    "$1,239,066,250 MXN"],
              ["Tasa",       "8.00% (TIIE 7.30% + 70 pbs)"],
              ["Plazo",      "10 años, pagos semestrales"],
              ["Calificación","AAA Moody's / S&P"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400 text-sm">{k}</span>
                <span className="font-semibold text-sm">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center items-center text-center">
            <div className="text-5xl mb-3">🌍</div>
            <div className="bg-green-500 text-white rounded-full px-4 py-1.5 text-sm font-bold mb-2">
              Alineado a ICMA Green Bond Principles
            </div>
            <p className="text-slate-400 text-xs">
              Instrumento de deuda sostenible para financiar la electrificación de la flota de Arca Continental
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
