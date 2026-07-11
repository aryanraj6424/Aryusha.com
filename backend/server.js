// import express from "express";
// import dotenv from "dotenv";
// import connectDB from "./src/config/db.js";

// dotenv.config();

// connectDB();

// const app = express();

// app.use(express.json());

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });


import dotenv from "dotenv";

dotenv.config();

import { configureCloudinary } from "./src/config/cloudinary.js";
configureCloudinary();

import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import seedAttributes from "./src/admin/seed/seedAttributes.js";

connectDB().then(() => {
  seedAttributes();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});