import { Request, Response, NextFunction } from "express";
import { isValidEmail } from "../utils/email.validators";
import { AppError } from "../utils/AppError";
import { User } from "../models/user.model";
import { sendEmail } from "../utils/sendEmail";
import { generatePasswordResetEmail } from "../utils/emailTemplate";

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    fullName: string;
    email: string;
    avatar: null;
    role: string;
  };
}

// signup user
// POST /api/v1/auth/signup
export const signupUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    if (!fullName || !email || !password)
      throw new AppError("Please enter all required fields", 400);

    if (!isValidEmail(email)) throw new AppError("Invalid email format", 400);

    if (password !== confirmPassword)
      throw new AppError("Passwords are must be same", 400);

    if (password.length < 6)
      throw new AppError("Password must be at least 6 characters", 400);

    const existingUser = await User.findOne({ email });

    if (existingUser) throw new AppError("User already registered", 400);

    const newUser = new User({
      fullName,
      email,
      phone,
      password,
    });

    await newUser.save();

    return res.status(201).json({
      status: true,
      statusCode: 201,
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// login user
// POST /api/v1/auth/login
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Please provide email and password", 400);
    }

    const user = await User.findOne({ email: email });
    if (!user) throw new AppError("User not found", 400);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError("Invalid email and password", 400);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Login successful",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || null,
        role: user.role,
        token: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// forgot password
// POST /api/v1/auth/forgot-password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const htmlContent = generatePasswordResetEmail(otp);

    await sendEmail(user.email, "Your Password Reset OTP", htmlContent);

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "OTP sent to email",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// resend otp
// POST /api/v1/auth/resend-otp
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    if (user.otpExpire && user.otpExpire > new Date()) {
      const remaining = Math.ceil(
        (user.otpExpire.getTime() - Date.now()) / 1000
      );
      return res.status(429).json({
        status: false,
        statusCode: 429,
        message: `Please wait ${remaining} seconds before requesting another OTP`,
        data: null,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    const htmlContent = generatePasswordResetEmail(otp);

    await sendEmail(user.email, "Your New OTP", htmlContent);

    const token = {
      accessToken: user.generateAccessToken(),
      refreshToken: user.generateRefreshToken(),
    };
    user.refreshToken = token.refreshToken;
    user.save();

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "OTP re-sent successfully",
      data: [user, token],
    });
  } catch (error) {
    next(error);
  }
};

// verify otp
// POST /api/v1/auth/verify-otp
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) throw new AppError("Email and OTP required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    if (user.otp !== otp) throw new AppError("Invalid OTP", 400);
    if (user.otpExpire && user.otpExpire < new Date())
      throw new AppError("OTP expired", 400);

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "OTP verified successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// reset password
// POST /api/v1/auth/reset-password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword)
      throw new AppError("All fields are required", 400);

    if (password !== confirmPassword)
      throw new AppError("Passwords must match", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    if (!user.otp || !user.otpExpire || user.otpExpire < new Date()) {
      throw new AppError("OTP expired or not verified", 400);
    }

    user.password = password;
    user.otp = undefined;
    user.otpExpire = undefined;

    await user.save();
    return res.status(200).json({
      status: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

// logour user
// POST /api/v1/auth/logout
export const logoutUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("Logout attempt failed without a valid user ID", 400);
    } else {
      const user = await User.findById(userId);

      if (user) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Logout successful",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// change password
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError("All fields are required", 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError("New password and confirm password must match", 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError(
        "New password must be different from current password",
        400
      );
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError("Current password is incorrect", 401);
    }

    user.password = newPassword;
    user.refreshToken = undefined;

    await user.save();

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    next(error);
  }
};

// reset refresh token from access token
export const resetRefreshTokenFromAccessToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("Access Denied, Please login", 401);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Refresh token reset successfully",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || null,
        role: user.role,
        token: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
