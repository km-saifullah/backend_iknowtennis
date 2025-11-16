import { Request, Response, NextFunction } from "express";
import { isValidEmail } from "../utils/email.validators";
import { AppError } from "../utils/AppError";
import { User } from "../models/user.model";

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
// POST /api/v1/login
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
      accessToken,
      refreshToken,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || null,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// logour user
// POST /api/v1/logout
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
