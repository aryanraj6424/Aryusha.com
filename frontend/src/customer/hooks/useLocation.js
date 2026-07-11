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
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
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