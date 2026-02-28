import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icons
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
}) {
  return (
    <MapContainer
      id="map"
      center={[defaultCenter.lat, defaultCenter.lng]}
      zoom={12}
      className="w-full h-full"
    >
      <ClickHandler onAdd={onAdd} />
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