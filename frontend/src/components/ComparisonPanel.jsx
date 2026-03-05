import React from "react";

export default function ComparisonPanel({ results }) {
  if (!results) return null;
  const {
    diesel_cost,
    diesel_co2,
    electric_cost,
    electric_co2,
    cost_savings,
    co2_reduction,
    percent_savings,
    trees_equivalent,
  } = results;

  return (
<div className="absolute bottom-[185px] left-4 z-[1000] bg-white p-3 rounded shadow-lg w-52 space-y-3">
      <h2 className="text-sm font-bold">Comparación Diesel vs Eléctrico</h2>
      <div className="flex space-x-4">
        <div className="flex-1 bg-gray-100 p-3 rounded">
          <h3 className="font-semibold text-gray-700 mb-2">Camión Diesel</h3>
          <p>Costo: ${diesel_cost.toFixed(2)} MXN</p>
          <p>Emisiones: {diesel_co2.toFixed(2)} kg CO₂</p>
        </div>
        <div className="flex-1 bg-green-100 p-3 rounded">
          <h3 className="font-semibold text-green-700 mb-2">Camión Eléctrico</h3>
          <p>Costo: ${electric_cost.toFixed(2)} MXN</p>
          <p>Emisiones: {electric_co2.toFixed(2)} kg CO₂</p>
        </div>
      </div>
      <div className="bg-blue-100 p-3 rounded">
        <h3 className="font-semibold text-blue-700 mb-2">Ahorro Total</h3>
        <p>💰 ${cost_savings.toFixed(2)} MXN ({percent_savings.toFixed(1)}%)</p>
        <p>🌿 {co2_reduction.toFixed(2)} kg CO₂</p>
        <p>🌍 {trees_equivalent.toFixed(2)} árboles/año</p>
      </div>
    </div>
  );
}