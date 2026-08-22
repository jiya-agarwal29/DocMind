import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is not defined");
    }
    
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}

export async function disconnectDB() {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
    }
}
