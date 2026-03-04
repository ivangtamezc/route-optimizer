
import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths broken by Vite's asset bundling
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Custom icons using divIcon (no external image needed)
const originIcon = L.divIcon({
  html: '<div style="background-color:green;width:16px;height:16px;border-radius:50%;border:2px solid white;"></div>',
  iconSize: [16, 16],
  className: "",
});

const vehicleIcon = (large = false) =>
  L.divIcon({
    html: `<div style="background-color:red;width:${large ? 24 : 16}px;height:${large ? 24 : 16}px;border-radius:50%;border:2px solid white;"></div>`,
    iconSize: [large ? 24 : 16, large ? 24 : 16],
    className: "",
  });

// Flies the map to new coordinates when centerMap changes
function FlyToHandler({ centerMap }) {
  const map = useMap();
  useEffect(() => {
    if (centerMap) {
      map.setView([centerMap.lat, centerMap.lng], 13, { animate: true });
    }
  }, [centerMap, map]);
  return null;
}

// Click handler that also invalidates size
function ClickHandler({ onAdd }) {
  const map = useMapEvents({
    click(e) {
      console.log("MAP CLICK", e.latlng);
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

export default function MapArea({
  defaultCenter,
  origin,
  stops,
  routeLine,
  vehiclePos,
  isSimulating,
  onAdd,
  centerMap,
}) {
  return (
    <MapContainer
      id="map"
      center={[defaultCenter.lat, defaultCenter.lng]}
      zoom={12}
      className="w-full h-full"
    >
      <ClickHandler onAdd={onAdd} />
      <FlyToHandler centerMap={centerMap} />
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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

      {routeLine.length >= 2 && <Polyline positions={routeLine} />}

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
  );
}
