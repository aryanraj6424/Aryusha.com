import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // MongoDB Connection URI
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/wanderlustAirbnb";
    console.log("Connecting to MongoDB:", mongoUri.replace(/\/\/.*:.*@/, "//***:***@"));
    
    const conn = await mongoose.connect(mongoUri);

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    
    // Set JWT_SECRET if not already set
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "your_super_secret_jwt_key_change_this_in_production";
      console.log("⚠ Using default JWT_SECRET - change this in production!");
    }
    
    return conn;
  } catch (error) {
    console.error("✗ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;