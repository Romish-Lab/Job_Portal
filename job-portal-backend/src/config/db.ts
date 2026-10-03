import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI as string;
    if (!uri) throw new Error("MONGO_URI is not defined in .env");

    const conn = await mongoose.connect(uri);
   console.log(`MongoDB connected: ${conn.connection.host} / database "${conn.connection.name}"`); console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
