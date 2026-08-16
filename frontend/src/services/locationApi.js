// services/locationApi.js

/**
 * Reverse-geocode a coordinate pair to a human-readable address.
 * Queries the backend location proxy endpoint powered by Google Maps Geocoding API.
 * @returns {{ formatted: string, postcode: string, city: string, state: string, road: string }}
 */
export const getAddressFromCoords = async (lat, lng) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/location/reverse?lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    if (data.success && data.result) {
      const item = data.result;
      return {
        formatted: item.formatted || item.display_name || "Current Location",
        postcode: item.postcode || item.address?.postcode || "",
        city:
          item.city ||
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.county ||
          "",
        state: item.state || item.address?.state || "",
        road:
          item.road ||
          item.address?.road ||
          item.address?.suburb ||
          item.address?.neighbourhood ||
          item.address?.city_district ||
          "",
      };
    }
    return { formatted: "Current Location", postcode: "", city: "", state: "", road: "" };
  } catch (err) {
    console.error("Reverse geocoding failed via Google Maps proxy:", err);
    return { formatted: "Current Location", postcode: "", city: "", state: "", road: "" };
  }
};

/**
 * Autocomplete location search using the backend location proxy endpoint powered by Google Maps Geocoding/Places API.
 * @returns {Array} Array of GeoJSON feature-like objects with a `properties` key for backward compatibility.
 */
export const searchLocation = async (text) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/location/search?text=${encodeURIComponent(text)}`
    );
    const data = await res.json();
    if (data.success && Array.isArray(data.results)) {
      return data.results.map((item) => ({
        properties: {
          place_id: item.place_id || Math.random().toString(),
          formatted: item.formatted || item.display_name || "",
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon || item.lng),
          postcode: item.postcode || item.address?.postcode || "",
          city:
            item.city ||
            item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.county ||
            "",
          state: item.state || item.address?.state || "",
          road:
            item.road ||
            item.address?.road ||
            item.address?.suburb ||
            item.address?.neighbourhood ||
            "",
        },
      }));
    }
    return [];
  } catch (err) {
    console.error("Location search failed via Google Maps proxy:", err);
    return [];
  }
};