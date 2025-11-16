import dotenv from "dotenv";

dotenv.config();

export const serverPort: number = Number(process.env.PORT) || 8000;
export const dbURI: string =
  process.env.DATABASE_URI ?? "mongodb://localhost:27017/iknowtennis";

export const accessSecret: string = process.env.ACCESS_SECRET ?? "";
export const refreshSecret: string = process.env.REFRESH_SECRET ?? "";
