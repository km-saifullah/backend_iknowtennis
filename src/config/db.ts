import mongoose from "mongoose";
import { dbURI } from "./index";

export const dbConfig = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("Database connected successfully");
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Database connection error occurred";

    console.error(`DATABASE CONNECTION ERROR: ${errorMessage}`);
    process.exit(1);
  }
};