"use client";

import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

type Place = {
  latitude: number;
  longitude: number;
  name?: string;
  distanceMeters: number;
};

export default function NearbyMap({
  latitude,
  longitude,
  places,
}: {
  latitude: number;
  longitude: number;
  places: Place[];
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      scrollWheelZoom={false}
      className="h-56 w-full rounded-2xl"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={[latitude, longitude]} radius={200} pathOptions={{ color: "#2dd4bf", fillOpacity: 0.08 }} />
      <CircleMarker center={[latitude, longitude]} radius={9} pathOptions={{ color: "#2dd4bf", fillColor: "#2dd4bf", fillOpacity: 1 }}>
        <Popup>You are here</Popup>
      </CircleMarker>
      {places.map((place) => (
        <CircleMarker
          key={`${place.latitude}-${place.longitude}`}
          center={[place.latitude, place.longitude]}
          radius={8}
          pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.9 }}
        >
          <Popup>{place.name ?? "Wine shop"} · {place.distanceMeters}m</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
