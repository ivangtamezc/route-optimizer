import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

// Fix íconos Leaflet (Vite)
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
});

// Custom icons
const originIcon = L.divIcon({
  html: '<div style="background-color:green;width:16px;height:16px;border-radius:50%;border:2px solid white;"></div>',
  iconSize: [16, 16],
  className: "",
});
const vehicleIcon = (large = false) =>
  L.divIcon({
    html: `<div style="background-color:red;width:${large ? 24 : 16}px;height:${
      large ? 24 : 16
    }px;border-radius:50%;border:2px solid white;"></div>`,
    iconSize: [large ? 24 : 16, large ? 24 : 16],
    className: "",
  });

// API base
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Utils
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
const km = (m) => (m / 1000).toFixed(2);
const minutes = (s) => (s / 60).toFixed(1);

// Click handler
function ClickToAdd({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function App() {
  // Monterrey default
  const defaultCenter = { lat: 25.6866, lng: -100.3161 };

  const [modeAdd, setModeAdd] = useState("stop"); // origin | stop
  const [origin, setOrigin] = useState(defaultCenter);
  const [stops, setStops] = useState([]);

  // Ordered stops after optimization (includes origin at index 0)
  const [orderedStops, setOrderedStops] = useState([defaultCenter]);

  // OSRM route polyline (dense), for drawing + simulation
  const [routeLine, setRouteLine] = useState([]); // [ [lat,lng], ... ]

  // Metrics from OSRM route
  const [metrics, setMetrics] = useState({ distance_m: 0, duration_s: 0 });

  // Simulation
  const [simSpeed, setSimSpeed] = useState(25); // m/s
  const speedRef = useRef(simSpeed);
  useEffect(() => {
    speedRef.current = simSpeed;
  }, [simSpeed]);

  const [vehiclePos, setVehiclePos] = useState(defaultCenter);
  const [isSimulating, setIsSimulating] = useState(false);
  const rafRef = useRef(null);

  // When origin/stops change, reset route state
  useEffect(() => {
    const base = [origin, ...stops];
    setOrderedStops(base);
    setRouteLine([]);
    setMetrics({ distance_m: 0, duration_s: 0 });
    setVehiclePos(origin);
    stopSim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, stops]);

  function onMapClickAdd(p) {
    if (modeAdd === "origin") {
      setOrigin(p);
    } else {
      setStops((prev) => [...prev, p]);
    }
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
  }

  async function optimizeByTime() {
    stopSim();

    // Need at least 1 stop to optimize
    if (stops.length === 0) {
      setOrderedStops([origin]);
      setRouteLine([]);
      setMetrics({ distance_m: 0, duration_s: 0 });
      return;
    }

    // 1) call backend optimize_time
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

    if (!optRes.ok) {
      const txt = await optRes.text();
      throw new Error(`optimize_time failed: ${txt}`);
    }

    const optData = await optRes.json();
    const ordered = optData.ordered_points.map(([lat, lng]) => ({ lat, lng }));
    setOrderedStops(ordered);

    // 2) call backend route for geometry
    const routeRes = await fetch(`${API_BASE}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: ordered.map((p) => [p.lat, p.lng]) }),
    });

    if (!routeRes.ok) {
      const txt = await routeRes.text();
      throw new Error(`route failed: ${txt}`);
    }

    const routeData = await routeRes.json();
    const line = routeData.geometry.coordinates.map(([lon, lat]) => [lat, lon]); // to [lat,lng]

    setRouteLine(line);
    setMetrics({
      distance_m: routeData.distance_m,
      duration_s: routeData.duration_s,
    });
    setVehiclePos(origin);
  }

  function stopSim() {
    setIsSimulating(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
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
      const dt = Math.max(0, (ts - lastTs) / 1000);
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

        const alpha = segLen === 0 ? 1 : tOnSeg / segLen;
        const lat = a.lat + (b.lat - a.lat) * alpha;
        const lng = a.lng + (b.lng - a.lng) * alpha;
        setVehiclePos({ lat, lng });

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

  const mapLine = useMemo(() => routeLine, [routeLine]);

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <h2 style={{ marginTop: 0 }}>Route Optimizer</h2>

        <div style={styles.card}>
          <div style={styles.rowBetween}>
            <span style={{ fontWeight: 600 }}>Modo click</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  ...styles.btn,
                  ...(modeAdd === "origin" ? styles.btnActive : {}),
                }}
                onClick={() => setModeAdd("origin")}
              >
                Poner Origen
              </button>
              <button
                style={{
                  ...styles.btn,
                  ...(modeAdd === "stop" ? styles.btnActive : {}),
                }}
                onClick={() => setModeAdd("stop")}
              >
                Agregar Parada
              </button>
            </div>
          </div>
          <div style={styles.small}>
            Haz click en el mapa para{" "}
            {modeAdd === "origin" ? "mover el origen" : "agregar paradas"}.
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.rowBetween}>
            <strong>Origen</strong>
            <span style={styles.small}>
              {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <strong>Paradas ({stops.length})</strong>
            <div style={{ marginTop: 8, maxHeight: 220, overflow: "auto" }}>
              {stops.length === 0 ? (
                <div style={styles.small}>No hay paradas aún.</div>
              ) : (
                stops.map((s, i) => (
                  <div key={i} style={styles.stopRow}>
                    <span style={styles.badge}>{i + 1}</span>
                    <span style={styles.stopText}>
                      {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                    </span>
                    <button
                      style={styles.iconBtn}
                      onClick={() => removeStop(i)}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              style={styles.primaryBtn}
              onClick={() => optimizeByTime().catch((e) => alert(e.message))}
            >
              Optimizar (tiempo)
            </button>
            {!isSimulating ? (
              <button
                style={styles.primaryBtn}
                onClick={startSim}
                disabled={routeLine.length < 2}
              >
                Simular
              </button>
            ) : (
              <button style={styles.dangerBtn} onClick={stopSim}>
                Detener
              </button>
            )}
            <button style={styles.secondaryBtn} onClick={clearAll}>
              Limpiar
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.rowBetween}>
              <span style={styles.small}>Velocidad simulación</span>
              <span style={styles.small}>
                {Math.round(simSpeed * 3.6)} km/h
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={80}
              value={simSpeed}
              onChange={(e) => setSimSpeed(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={styles.card}>
          <strong>Métricas (OSRM)</strong>
          <div style={styles.metricRow}>
            <span>Distancia:</span>
            <span>{km(metrics.distance_m)} km</span>
          </div>
          <div style={styles.metricRow}>
            <span>Duración:</span>
            <span>{minutes(metrics.duration_s)} min</span>
          </div>
          <div style={styles.small}>
            Nota: usando OSRM público (sin Docker). Puede fallar si pones demasiadas paradas.
          </div>
        </div>
      </div>

      <div style={styles.mapWrap}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickToAdd onAdd={onMapClickAdd} />

          <Marker icon={originIcon} position={[origin.lat, origin.lng]}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              Origen
            </Tooltip>
          </Marker>

          {stops.map((s, i) => (
            <Marker key={i} position={[s.lat, s.lng]}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                {i + 1}
              </Tooltip>
            </Marker>
          ))}

          {mapLine.length >= 2 && <Polyline positions={mapLine} />}

          <Marker
            position={[vehiclePos.lat, vehiclePos.lng]}
            icon={vehicleIcon(isSimulating)}
            zIndexOffset={isSimulating ? 1000 : 0}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              Vehículo
            </Tooltip>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    height: "100vh",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  sidebar: {
    padding: 14,
    borderRight: "1px solid #e5e5e5",
    overflow: "auto",
    background: "#fff",
  },
  mapWrap: { height: "100vh" },
  card: {
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  btn: {
    border: "1px solid #ddd",
    background: "#f7f7f7",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: 12,
  },
  btnActive: { background: "#eaeaea", borderColor: "#bbb" },
  primaryBtn: {
    flex: 1,
    border: "1px solid #111",
    background: "#111",
    color: "white",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
  },
  secondaryBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
  },
  dangerBtn: {
    flex: 1,
    border: "1px solid #b00020",
    background: "#b00020",
    color: "white",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
  },
  stopRow: {
    display: "grid",
    gridTemplateColumns: "24px 1fr 32px",
    alignItems: "center",
    gap: 8,
    padding: "6px 0",
    borderBottom: "1px dashed #eee",
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#111",
    color: "white",
    fontSize: 12,
  },
  stopText: { fontSize: 12, opacity: 0.9 },
  iconBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 10,
    cursor: "pointer",
    width: 32,
    height: 28,
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    fontSize: 13,
  },
  small: { fontSize: 12, opacity: 0.7, marginTop: 8 },
};