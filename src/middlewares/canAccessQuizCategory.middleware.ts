import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "./isLoggedIn";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { premiumPlanName } from "../config";
import { ISubscriptionPlan } from "../models/subscription.model";

export const canAccessQuizCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?._id) {
      return next(new AppError("Access Denied, Please login", 401));
    }

    const categoryId = req.params.categoryId || req.body.categoryId;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return next(new AppError("Invalid quiz category id", 400));
    }

    const user = await User.findById(req.user._id)
      .populate("subscription.plan")
      .select("subscription")
      .lean();

    if (!user || !user.subscription || !user.subscription.plan) {
      return next(new AppError("Subscription missing", 403));
    }

    const plan = user.subscription.plan as unknown as ISubscriptionPlan;

    if (
      plan?.subscriptionPlanName &&
      String(plan.subscriptionPlanName).toUpperCase() ===
        String(premiumPlanName).toUpperCase()
    ) {
      return next();
    }

    const allowed = (plan.allowedQuizCategories || []).map((id: any) =>
      String(id),
    );

    const isAllowed = allowed.includes(String(categoryId));
    if (!isAllowed) {
      return next(
        new AppError("This category is locked. Please upgrade.", 403),
      );
    }

    return next();
  } catch (err) {
    next(err);
  }
};
