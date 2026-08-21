// customer/hooks/useLocation.js

import { useEffect, useState } from "react";

export default function useLocation() {
  const [location, setLocation] = useState(() => {
    const savedLocation = localStorage.getItem("userLocation");

    return savedLocation
      ? JSON.parse(savedLocation)
      : {
          city: "Select Location",
          address: "",
          latitude: null,
          longitude: null,
        };
  });

  const saveLocation = (locationData) => {
    setLocation(locationData);

    localStorage.setItem(
      "userLocation",
      JSON.stringify(locationData)
    );
  };

  const getCurrentCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Geolocation is not supported by this browser."
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code !== 1) {
            navigator.geolocation.getCurrentPosition(
              (pos2) => {
                resolve({
                  latitude: pos2.coords.latitude,
                  longitude: pos2.coords.longitude,
                });
              },
              (err2) => reject(err2),
              { enableHighAccuracy: false, timeout: 8000, maximumAge: Infinity }
            );
            return;
          }
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    });
  };

  return {
    location,
    saveLocation,
    getCurrentCoordinates,
  };
}