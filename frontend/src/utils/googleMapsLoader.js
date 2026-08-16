import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

// Configure Google Maps API Options
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAZiwElX_ByZPzc9MHLLC-E6Jr_Tkk7Kss";

setOptions({
  key: apiKey,
  version: "weekly",
});

let loadPromise = null;

/**
 * Loads the Google Maps JS API libraries using the new functional API (setOptions & importLibrary).
 * Returns a promise resolving to window.google.
 */
export const loadGoogleMaps = () => {
  if (!loadPromise) {
    loadPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("geometry"),
    ]).then(() => window.google);
  }
  return loadPromise;
};
