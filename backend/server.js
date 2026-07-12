import dotenv from "dotenv";

dotenv.config();

import { configureCloudinary } from "./src/config/cloudinary.js";
configureCloudinary();

import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import seedAttributes from "./src/admin/seed/seedAttributes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./src/socket/socketManager.js";

connectDB().then(() => {
  seedAttributes();
});

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize the socket manager so controllers can emit events
initSocket(io);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (Socket.IO enabled)`);
});