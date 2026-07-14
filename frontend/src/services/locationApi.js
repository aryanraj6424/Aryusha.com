// services/locationApi.js

/**
 * Reverse-geocode a coordinate pair to a human-readable address.
 * Queries the backend location proxy endpoint.
 * @returns {{ formatted: string, postcode: string, city: string }}
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
        formatted: item.display_name || "Current Location",
        postcode: item.address?.postcode || "",
        city:
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.county ||
          "",
        state: item.address?.state || "",
        road:
          item.address?.road ||
          item.address?.suburb ||
          item.address?.neighbourhood ||
          item.address?.city_district ||
          "",
      };
    }
    return { formatted: "Current Location", postcode: "", city: "", state: "", road: "" };
  } catch (err) {
    console.error("Reverse geocoding failed via proxy:", err);
    return { formatted: "Current Location", postcode: "", city: "", state: "", road: "" };
  }
};

/**
 * Autocomplete location search using the backend location proxy endpoint.
 * @returns {Array} Array of GeoJSON feature-like objects with a `properties` key.
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
          place_id: item.place_id,
          formatted: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          postcode: item.address?.postcode || "",
          city:
            item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.county ||
            "",
          state: item.address?.state || "",
          road:
            item.address?.road ||
            item.address?.suburb ||
            item.address?.neighbourhood ||
            item.address?.city_district ||
            "",
        },
      }));
    }
    return [];
  } catch (err) {
    console.error("Location search failed via proxy:", err);
    return [];
  }
};