import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon paths in React / Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

/**
 * Reusable map component that renders store location pin and service area circle range.
 * Shared between Admin panel (editable) and Vendor panel (read-only).
 */
export default function CoverageMap({
  latitude,
  longitude,
  radiusKm = 5,
  isEditable = false,
  onLocationChange,
  height = "h-96"
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    const lat = Number(latitude) || 20.5937; // Default to India center
    const lng = Number(longitude) || 78.9629;
    const radius = Number(radiusKm) || 5;

    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      markerRef.current = L.marker([lat, lng], {
        draggable: isEditable
      }).addTo(mapInstanceRef.current);

      circleRef.current = L.circle([lat, lng], {
        radius: radius * 1000, // convert KM to meters
        color: isEditable ? "#16a34a" : "#8b5cf6", // Green for editable, Purple for read-only
        fillColor: isEditable ? "#bbf7d0" : "#ddd6fe",
        fillOpacity: 0.35
      }).addTo(mapInstanceRef.current);

      markerRef.current.on("dragend", (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        if (onLocationChange) {
          onLocationChange(position.lat, position.lng);
        }
      });
    } else {
      const latlng = L.latLng(lat, lng);
      mapInstanceRef.current.setView(latlng);
      markerRef.current.setLatLng(latlng);
      circleRef.current.setLatLng(latlng);
      circleRef.current.setRadius(radius * 1000);

      if (isEditable) {
        markerRef.current.dragging.enable();
      } else {
        markerRef.current.dragging.disable();
      }
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [latitude, longitude, radiusKm, isEditable, onLocationChange]);

  // Handle map click location updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const onMapClick = (e) => {
      if (isEditable && onLocationChange) {
        const { lat, lng } = e.latlng;
        onLocationChange(lat, lng);
      }
    };

    mapInstanceRef.current.on("click", onMapClick);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("click", onMapClick);
      }
    };
  }, [isEditable, onLocationChange]);

  // Cleanup map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`${height} w-full rounded-2xl border border-slate-200 overflow-hidden relative z-0 shadow-sm`}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
