import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/user.model";
import { AppError } from "../utils/AppError";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError("Unauthorized access", 401));
  }

  if (req.user.role !== "admin") {
    return next(new AppError("Forbidden! Requires admin privileges", 403));
  }
  next();
};
