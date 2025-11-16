import dotenv from "dotenv";

dotenv.config();

export const serverPort: number = Number(process.env.PORT) || 8000;
export const dbURI: string = process.env.DATABASE_URI ?? "";
