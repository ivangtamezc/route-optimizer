
import React from "react";
import { FaUserCircle, FaBell } from "react-icons/fa";

const TABS = [
  { id: "optimizador", label: "🗺️ Optimizador" },
  { id: "financiero",  label: "📊 Financiero" },
  { id: "flota",       label: "🚛 Flota" },
  { id: "escenarios",  label: "🔢 Escenarios" },
];

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-24 bg-white shadow-lg z-50 flex flex-col">
      {/* Top row */}
      <div className="flex items-center justify-between px-6 h-14 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">⚡</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              EnerRoute Solutions
            </h1>
            <p className="text-xs text-gray-500">
              Plataforma Inteligente de Optimización Logística
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <FaBell className="text-gray-600 text-xl cursor-pointer" />
          <FaUserCircle className="text-gray-600 text-2xl cursor-pointer" />
        </div>
      </div>

      {/* Tabs row */}
      <div className="flex items-center px-4 h-10 border-t border-gray-100 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium mr-1 transition ${
              activeTab === tab.id
                ? "bg-green-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
