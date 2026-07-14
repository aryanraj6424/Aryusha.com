// import express from "express";
// import axios from "axios";

// const router = express.Router();

// router.get("/search", async (req, res) => {
//   try {
//     const { text } = req.query;

//     if (!text) {
//       return res.status(400).json({
//         message: "Search text is required",
//       });
//     }

//     const response = await axios.get(
//       "https://geoapify-address-autocomplete1.p.rapidapi.com/address-auto-complete.php",
//       {
//         params: {
//           text,
//           type: "street",
//           limit: 8,
//           filter: "countrycode:in",
//         },
//         headers: {
//           "x-rapidapi-key": process.env.RAPID_API_KEY,
//           "x-rapidapi-host":
//             "geoapify-address-autocomplete1.p.rapidapi.com",
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     res.json(response.data);
//   } catch (error) {
//     console.log(
//       "RapidAPI Error:",
//       error.response?.data || error.message
//     );

//     res.status(500).json({
//       message: "Failed to fetch addresses",
//       error: error.response?.data,
//     });
//   }
// });

// export default router;

import express from "express";
import axios from "axios";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Search Address
|--------------------------------------------------------------------------
*/

router.get("/search", async (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Search text is required",
      });
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: text,
          format: "json",
          addressdetails: 1,
          limit: 8,
        },
        headers: {
          "User-Agent": "QuickCart",
        },
      }
    );

    res.status(200).json({
      success: true,
      results: response.data,
    });

  } catch (error) {
    console.error("Location Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
});

router.get("/reverse", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon,
          format: "json",
          addressdetails: 1,
        },
        headers: {
          "User-Agent": "QuickCart",
        },
      }
    );

    res.status(200).json({
      success: true,
      result: response.data,
    });

  } catch (error) {
    console.error("Reverse Geocoding Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to reverse geocode coordinates",
    });
  }
});

export default router;