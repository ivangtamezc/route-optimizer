import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MapArea from "./components/MapArea";
import MetricsCard from "./components/MetricsCard";
import ComparisonPanel from "./components/ComparisonPanel";

export default function App() {
  const defaultCenter = { lat: 25.6866, lng: -100.3161 };

  const [modeAdd, setModeAdd] = useState("stop");
  const [origin, setOrigin] = useState(defaultCenter);
  const [stops, setStops] = useState([]);
  const [orderedStops, setOrderedStops] = useState([defaultCenter]);
  const [routeLine, setRouteLine] = useState([]);
  const [metrics, setMetrics] = useState({ distance_m: 0, duration_s: 0 });
  const [comparison, setComparison] = useState(null);

  const [simSpeed, setSimSpeed] = useState(25);
  const speedRef = useRef(simSpeed);
  useEffect(() => {
    speedRef.current = simSpeed;
  }, [simSpeed]);

  const [vehiclePos, setVehiclePos] = useState(defaultCenter);
  const [isSimulating, setIsSimulating] = useState(false);
  const rafRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

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

      // Fetch comparison data
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

  return (
    <div className="relative font-sans text-slate-900 bg-slate-100 h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar
          modeAdd={modeAdd}
          setModeAdd={setModeAdd}
          optimizeByTime={optimizeByTime}
          isSimulating={isSimulating}
          startSim={startSim}
          stopSim={stopSim}
          stops={stops}
          removeStop={removeStop}
        />

        <div className="flex-1 flex justify-center items-start p-6 md:p-8 h-full">
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-[1000px] h-full overflow-hidden">
            <MapArea
              defaultCenter={defaultCenter}
              origin={origin}
              stops={stops}
              routeLine={routeLine}
              vehiclePos={vehiclePos}
              isSimulating={isSimulating}
              onAdd={onMapClickAdd}
            />
            <MetricsCard
              distance_m={metrics.distance_m}
              duration_s={metrics.duration_s}
              avg_kmh={metrics.duration_s > 0 ? (metrics.distance_m / metrics.duration_s) * 3.6 : 0}
            />
            <ComparisonPanel results={comparison} />
          </div>
        </div>
      </div>
    </div>
  );
}