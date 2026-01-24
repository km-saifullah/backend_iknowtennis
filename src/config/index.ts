import dotenv from "dotenv";

dotenv.config();

export const serverPort: number = Number(process.env.PORT) || 8000;
export const dbURI: string =
  process.env.DATABASE_URI ?? "mongodb://localhost:27017/iknowtennis";

export const accessSecret: string = process.env.ACCESS_SECRET ?? "";
export const refreshSecret: string = process.env.REFRESH_SECRET ?? "";

export const smtpHost: string = process.env.SMTP_HOST ?? "gmail";
export const smtpUser: string = process.env.SMTP_USER || "";
export const smtpPass: string = process.env.SMTP_PASS || "";

export const cloudinaryCloudName: string =
  process.env.CLOUDINARY_CLOUD_NAME || "";
export const cloudinaryApiKey: string = process.env.CLOUDINARY_API_KEY || "";
export const cloudinaryApiSecret: string =
  process.env.CLOUDINARY_API_SECRET || "";

export const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
