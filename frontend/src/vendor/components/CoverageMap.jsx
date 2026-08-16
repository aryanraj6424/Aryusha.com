import React, { useEffect, useRef } from "react";
import { loadGoogleMaps } from "../../utils/googleMapsLoader";

/**
 * Reusable map component that renders store location pin and service area circle range.
 * Shared between Admin panel (editable) and Vendor panel (read-only).
 * 
 * MIGRATED FROM LEAFLET TO GOOGLE MAPS JS API:
 * - Replaced Leaflet `L.map` and `L.tileLayer` with `google.maps.Map`
 * - Replaced Leaflet `L.marker` with `google.maps.Marker`
 * - Replaced Leaflet `L.circle` with `google.maps.Circle`
 * - Retained identical props, visual styles, drag events, and click behavior
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

    let isMounted = true;

    loadGoogleMaps().then((google) => {
      if (!isMounted || !mapRef.current) return;

      const position = { lat, lng };

      if (!mapInstanceRef.current) {
        // Initialize Google Maps instance (Replaces L.map and L.tileLayer)
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 13,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        // Initialize Google Maps Marker (Replaces L.marker)
        markerRef.current = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          draggable: isEditable,
        });

        // Initialize Google Maps Circle (Replaces L.circle)
        circleRef.current = new google.maps.Circle({
          map: mapInstanceRef.current,
          center: position,
          radius: radius * 1000, // convert KM to meters
          strokeColor: isEditable ? "#16a34a" : "#1c4d2e", // Green for editable, Purple for read-only
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: isEditable ? "#bbf7d0" : "#ddd6fe",
          fillOpacity: 0.35,
        });

        // Handle Marker dragend event (Replaces marker.on("dragend"))
        markerRef.current.addListener("dragend", (event) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          if (onLocationChange) {
            onLocationChange(newLat, newLng);
          }
        });

        // Handle Map click event (Replaces map.on("click"))
        mapInstanceRef.current.addListener("click", (event) => {
          if (isEditable && onLocationChange) {
            const newLat = event.latLng.lat();
            const newLng = event.latLng.lng();
            onLocationChange(newLat, newLng);
          }
        });
      } else {
        // Update existing map, marker, and circle positions on prop changes
        mapInstanceRef.current.setCenter(position);
        markerRef.current.setPosition(position);
        markerRef.current.setDraggable(isEditable);

        circleRef.current.setCenter(position);
        circleRef.current.setRadius(radius * 1000);
        circleRef.current.setOptions({
          strokeColor: isEditable ? "#16a34a" : "#1c4d2e",
          fillColor: isEditable ? "#bbf7d0" : "#ddd6fe",
        });
      }

      // Trigger map resize recalculation
      const timer = setTimeout(() => {
        if (mapInstanceRef.current && google.maps.event) {
          google.maps.event.trigger(mapInstanceRef.current, "resize");
        }
      }, 100);

      return () => clearTimeout(timer);
    }).catch((err) => {
      console.error("Google Maps Load Error in CoverageMap:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, radiusKm, isEditable, onLocationChange]);

  // Clean up references on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      if (mapInstanceRef.current) {
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
