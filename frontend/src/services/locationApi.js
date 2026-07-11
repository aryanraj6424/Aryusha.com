// import axios from "axios";

// export const searchAddress = async (text) => {
//   const response = await axios.get(
//     `${import.meta.env.VITE_API_URL}/location/search`,
//     {
//       params: { text },
//     }
//   );

//   return response.data;
// };


export const searchLocation = async (text) => {
  const response = await fetch(
    `https://geoapify-platform.p.rapidapi.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=5`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key":
          import.meta.env.VITE_RAPIDAPI_KEY,
        "x-rapidapi-host":
          "geoapify-platform.p.rapidapi.com",
      },
    }
  );

  return response.json();
};