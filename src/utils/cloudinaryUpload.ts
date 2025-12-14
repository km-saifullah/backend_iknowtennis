import cloudinary from "cloudinary";
import fs from "fs";
import { AppError } from "./AppError";
import {
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryCloudName,
} from "../config";

cloudinary.v2.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
});

export interface CloudinaryResponse {
  url: string;
  publicId: string;
}

const cloudinaryUpload = async (
  localFilePath: string
): Promise<CloudinaryResponse> => {
  try {
    const result = await cloudinary.v2.uploader.upload(localFilePath, {
      folder: "quiz-category",
      resource_type: "image",
    });

    fs.unlinkSync(localFilePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw new AppError("Cloudinary upload failed", 500);
  }
};

export default cloudinaryUpload;
