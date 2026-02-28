import React from "react";
import { FaUserCircle, FaBell } from "react-icons/fa";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-lg flex items-center justify-between px-6 z-50">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">⚡</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            EnerRoute Solutions
          </h1>
          <p className="text-sm text-gray-500">
            Plataforma Inteligente de Optimización Logística
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <FaBell className="text-gray-600 text-xl cursor-pointer" />
        <FaUserCircle className="text-gray-600 text-2xl cursor-pointer" />
      </div>
    </header>
  );
}