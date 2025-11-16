import { Request, Response, NextFunction } from "express";
import {
  User as UserModel,
  IUser,
  IUserModelStatic,
} from "../models/user.model";
import { AppError } from "../utils/AppError";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const User = UserModel as IUserModelStatic;

export const isLoggedIn = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Access Denied, Please login", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = await User.verifyAccessToken(token);

    if (!user) {
      return next(new AppError("Invalid or expired token, Please login", 401));
    }

    req.user = user;

    next();
  } catch (error) {
    return next(new AppError("Authentication failed", 401));
  }
};
