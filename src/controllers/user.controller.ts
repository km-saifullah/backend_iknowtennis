import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import cloudinaryUpload from "../utils/cloudinaryUpload";
import cloudinaryDelete from "../utils/cloudinaryDelete";
import { AuthenticatedRequest } from "../middlewares/isLoggedIn";

// update user profile
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    const { fullName } = req.body;

    if (!user) throw new AppError("Unauthorized access", 401);

    if (fullName) {
      user.fullName = fullName.trim();
    }

    if (req.file) {
      if (user.avatarPublicId) {
        await cloudinaryDelete(user.avatarPublicId);
      }

      const uploadedImage = await cloudinaryUpload(req.file.path);

      user.avatar = uploadedImage.url;
      user.avatarPublicId = uploadedImage.publicId;
    }

    await user.save();

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
