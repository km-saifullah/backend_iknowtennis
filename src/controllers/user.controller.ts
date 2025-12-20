import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import cloudinaryUpload from "../utils/cloudinaryUpload";
import cloudinaryDelete from "../utils/cloudinaryDelete";
import { AuthenticatedRequest } from "../middlewares/isLoggedIn";
import { User } from "../models/user.model";

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

    user.fullName = fullName

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

//  get all users
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      throw new AppError("Unauthorized access", 401);
    }

    if (loggedInUser.role !== "admin") {
      throw new AppError("Access denied", 403);
    }

    const users = await User.find()
      .select("-password -refreshToken -otp -otpExpire")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// get specific user 
export const getSingleUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const loggedInUser = req.user;
    const { id } = req.params;

    if (!loggedInUser) {
      throw new AppError("Unauthorized access", 401);
    }

    const user = await User.findById(id).select(
      "-password -refreshToken -otp -otpExpire"
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};