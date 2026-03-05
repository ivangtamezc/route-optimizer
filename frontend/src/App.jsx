
import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MapArea from "./components/MapArea";
import MetricsCard from "./components/MetricsCard";
import ComparisonPanel from "./components/ComparisonPanel";
import BatteryCard from "./components/BatteryCard";
import FinancialPage from "./components/FinancialPage";
import FleetPage from "./components/FleetPage";
import ScenariosPage from "./components/ScenariosPage";

const CEDIS_LIST = [
  { id: "topo_chico", nombre: "CEDIS Topo Chico",     lat: 25.7350, lng: -100.3265, unidades: 200 },
  { id: "guadalupe",  nombre: "CEDIS Guadalupe",       lat: 25.6817, lng: -100.1409, unidades: 165 },
  { id: "san_pedro",  nombre: "CEDIS San Pedro G.G.",  lat: 25.6755, lng: -100.3613, unidades: 135 },
];

export default function App() {
  const defaultCenter = { lat: CEDIS_LIST[0].lat, lng: CEDIS_LIST[0].lng };

  const [modeAdd, setModeAdd] = useState("stop");
  const [origin, setOrigin] = useState(defaultCenter);
  const [stops, setStops] = useState([]);
  const [orderedStops, setOrderedStops] = useState([defaultCenter]);
  const [routeLine, setRouteLine] = useState([]);
  const [metrics, setMetrics] = useState({ distance_m: 0, duration_s: 0 });
  const [comparison, setComparison] = useState(null);
  const [vehicleType, setVehicleType] = useState("Camión");
  const [activeTab, setActiveTab] = useState("optimizador");
  const [selectedCedis, setSelectedCedis] = useState(CEDIS_LIST[0]);
  const [centerMap, setCenterMap] = useState(null);

  const [simSpeed, setSimSpeed] = useState(25);
  const speedRef = useRef(simSpeed);
  useEffect(() => {
    speedRef.current = simSpeed;
  }, [simSpeed]);

  const [vehiclePos, setVehiclePos] = useState(defaultCenter);
  const [isSimulating, setIsSimulating] = useState(false);
  const rafRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  function haversineMeters(a, b) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  useEffect(() => {
    const base = [origin, ...stops];
    setOrderedStops(base);
    setRouteLine([]);
    setMetrics({ distance_m: 0, duration_s: 0 });
    setVehiclePos(origin);
    stopSim();
    setComparison(null);
  }, [origin, stops]);

  function handleCedisChange(cedis) {
    setSelectedCedis(cedis);
    setOrigin({ lat: cedis.lat, lng: cedis.lng });
    setCenterMap({ lat: cedis.lat, lng: cedis.lng });
    setStops([]);
    setRouteLine([]);
    setMetrics({ distance_m: 0, duration_s: 0 });
    setComparison(null);
    stopSim();
  }

  function onMapClickAdd(p) {
    if (modeAdd === "origin") setOrigin(p);
    else setStops((prev) => [...prev, p]);
  }

  function removeStop(i) {
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  }

  function clearAll() {
    setStops([]);
    setOrderedStops([origin]);
    setRouteLine([]);
    setMetrics({ distance_m: 0, duration_s: 0 });
    setVehiclePos(origin);
    stopSim();
    setComparison(null);
  }

  async function optimizeByTime() {
    stopSim();
    if (stops.length === 0) return;

    try {
      const body = {
        origin: [origin.lat, origin.lng],
        stops: stops.map((s) => [s.lat, s.lng]),
        return_to_origin: false,
        time_limit_s: 3,
      };

      const optRes = await fetch(`${API_BASE}/optimize_time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!optRes.ok) throw new Error(await optRes.text());
      const optData = await optRes.json();
      const ordered = optData.ordered_points.map(([lat, lng]) => ({ lat, lng }));
      setOrderedStops(ordered);

      const routeRes = await fetch(`${API_BASE}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: ordered.map((p) => [p.lat, p.lng]) }),
      });
      if (!routeRes.ok) throw new Error(await routeRes.text());
      const routeData = await routeRes.json();
      const line = routeData.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

      setRouteLine(line);
      setMetrics({ distance_m: routeData.distance_m, duration_s: routeData.duration_s });
      setVehiclePos(origin);

      try {
        const compRes = await fetch(`${API_BASE}/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ distance_km: routeData.distance_m / 1000 }),
        });
        if (compRes.ok) {
          const compData = await compRes.json();
          setComparison(compData);
        }
      } catch (err) {
        console.error("Comparison fetch error", err);
      }
    } catch (e) {
      console.error(e);
      alert("Error optimizando ruta");
    }
  }

  function stopSim() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setIsSimulating(false);
  }

  function startSim() {
    if (!routeLine || routeLine.length < 2) return;

    stopSim();
    setIsSimulating(true);
    const pts = routeLine.map(([lat, lng]) => ({ lat, lng }));
    let segIdx = 0;
    let tOnSeg = 0;
    let lastTs = performance.now();

    const step = (ts) => {
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      let remaining = speedRef.current * dt;
      while (remaining > 0 && segIdx < pts.length - 1) {
        const a = pts[segIdx];
        const b = pts[segIdx + 1];
        const segLen = haversineMeters(a, b);
        const left = segLen - tOnSeg;
        const adv = Math.min(left, remaining);

        tOnSeg += adv;
        remaining -= adv;

        const alpha = segLen ? tOnSeg / segLen : 1;
        setVehiclePos({
          lat: a.lat + (b.lat - a.lat) * alpha,
          lng: a.lng + (b.lng - a.lng) * alpha,
        });

        if (tOnSeg >= segLen - 1e-6) {
          segIdx++;
          tOnSeg = 0;
        }
      }

      if (segIdx >= pts.length - 1) {
        setIsSimulating(false);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }

  // -------------------------------------------------------
  // PDF GENERATION
  // -------------------------------------------------------
  function generatePDF() {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("es-MX", {
      hour: "2-digit", minute: "2-digit",
    });

    const distance_km = (metrics.distance_m / 1000).toFixed(2);
    const duration_min = (metrics.duration_s / 60).toFixed(1);
    const avg_kmh = metrics.duration_s > 0
      ? ((metrics.distance_m / metrics.duration_s) * 3.6).toFixed(1)
      : "0.0";

    let y = 18;
    const lh = 8; // line height
    const margin = 14;
    const pageW = 210;

    // ---- Header ----
    doc.setFillColor(34, 197, 94); // green-500
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("EnerRoute Solutions", margin, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Ruta Optimizada", margin, 20);
    doc.text(`${dateStr}  ${timeStr}`, pageW - margin, 20, { align: "right" });

    y = 38;
    doc.setTextColor(30, 41, 59); // slate-800

    // ---- Tipo de vehículo ----
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Tipo de vehículo:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(vehicleType, margin + 42, y);
    y += lh + 4;

    // ---- Métricas ----
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Métricas de la Ruta", margin, y);
    y += lh;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFontSize(10);
    const metricRows = [
      ["Distancia total", `${distance_km} km`],
      ["Duración estimada", `${duration_min} min`],
      ["Velocidad promedio", `${avg_kmh} km/h`],
    ];
    metricRows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 55, y);
      y += lh;
    });

    y += 4;

    // ---- Paradas ----
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Paradas en Orden Optimizado", margin, y);
    y += lh;
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFontSize(10);
    orderedStops.forEach((stop, i) => {
      const label = i === 0 ? "Origen" : `Parada ${i}`;
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${label}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`, margin + 50, y);
      y += lh;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    y += 4;

    // ---- Comparación Diesel vs Eléctrico ----
    if (comparison) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Comparación: Diesel vs Eléctrico", margin, y);
      y += lh;
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      doc.setFontSize(10);

      // Diesel column
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, y, 82, 30, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Camión Diesel", margin + 4, y + 7);
      doc.setFont("helvetica", "normal");
      doc.text(`Costo: $${comparison.diesel_cost.toFixed(2)} MXN`, margin + 4, y + 15);
      doc.text(`CO2: ${comparison.diesel_co2.toFixed(2)} kg`, margin + 4, y + 22);

      // Electric column
      doc.setFillColor(220, 252, 231); // green-100
      doc.rect(margin + 88, y, 82, 30, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Camión Eléctrico", margin + 92, y + 7);
      doc.setFont("helvetica", "normal");
      doc.text(`Costo: $${comparison.electric_cost.toFixed(2)} MXN`, margin + 92, y + 15);
      doc.text(`CO2: ${comparison.electric_co2.toFixed(2)} kg`, margin + 92, y + 22);

      y += 38;

      // Savings section
      doc.setFillColor(219, 234, 254); // blue-100
      doc.rect(margin, y, 170, 36, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Ahorro Total", margin + 4, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Ahorro en costo: $${comparison.cost_savings.toFixed(2)} MXN (${comparison.percent_savings.toFixed(1)}%)`,
        margin + 4, y + 17
      );
      doc.text(
        `Reduccion de CO2: ${comparison.co2_reduction.toFixed(2)} kg`,
        margin + 4, y + 25
      );
      doc.text(
        `Equivalente a ${comparison.trees_equivalent.toFixed(1)} arboles plantados/año`,
        margin + 4, y + 33
      );
    }

    // ---- Footer ----
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `EnerRoute Solutions — Página ${i} de ${pageCount}`,
        pageW / 2, 290, { align: "center" }
      );
    }

    doc.save(`EnerRoute_Reporte_${now.toISOString().slice(0, 10)}.pdf`);
  }

  const hasRoute = routeLine.length >= 2;

  return (
    <div className="relative font-sans text-slate-900 bg-slate-100 h-screen flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden pt-24">
        {activeTab !== "optimizador" && (
          <div className="flex-1 overflow-y-auto">
            {activeTab === "financiero" && <FinancialPage />}
            {activeTab === "flota" && <FleetPage />}
            {activeTab === "escenarios" && <ScenariosPage />}
          </div>
        )}
        {activeTab === "optimizador" && <Sidebar
          modeAdd={modeAdd}
          setModeAdd={setModeAdd}
          optimizeByTime={optimizeByTime}
          isSimulating={isSimulating}
          startSim={startSim}
          stopSim={stopSim}
          stops={stops}
          removeStop={removeStop}
          vehicleType={vehicleType}
          setVehicleType={setVehicleType}
          hasRoute={hasRoute}
          onDownload={generatePDF}
          selectedCedis={selectedCedis}
          onCedisChange={handleCedisChange}
          cedisList={CEDIS_LIST}
        />}

        {activeTab === "optimizador" && <div className="flex-1 flex justify-center items-start p-6 md:p-8 h-full">
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-[1000px] h-full overflow-hidden">
            <MapArea
              defaultCenter={defaultCenter}
              origin={origin}
              stops={stops}
              routeLine={routeLine}
              vehiclePos={vehiclePos}
              isSimulating={isSimulating}
              onAdd={onMapClickAdd}
              centerMap={centerMap}
            />
            <MetricsCard
              distance_m={metrics.distance_m}
              duration_s={metrics.duration_s}
              avg_kmh={metrics.duration_s > 0 ? (metrics.distance_m / metrics.duration_s) * 3.6 : 0}
            />
            <BatteryCard distance_m={metrics.distance_m} />
            <ComparisonPanel results={comparison} />
          </div>
        </div>}
      </div>
    </div>
  );
}
