// import { NextFunction, Response } from "express";
// import mongoose from "mongoose";
// import { User } from "../models/user.model";
// import { AppError } from "../utils/AppError";
// import { AuthenticatedRequest } from "./isLoggedIn";
// import { ISubscriptionPlan } from "../models/subscription.model";

// export const canAccessQuizCategory = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { categoryId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//       throw new AppError("Invalid quiz category id", 400);
//     }

//     const user = await User.findById(req.user!._id).populate(
//       "subscription.plan"
//     );

//     if (
//       !user ||
//       !user.subscription ||
//       !user.subscription.isActive ||
//       !user.subscription.plan
//     ) {
//       throw new AppError("Active subscription required", 403);
//     }

//     if (!(user.subscription.plan as ISubscriptionPlan).allowedQuizCategories) {
//       throw new AppError("Invalid subscription plan data", 500);
//     }

//     const plan = user.subscription.plan as ISubscriptionPlan;

//     const isAllowed = plan.allowedQuizCategories.some((id) =>
//       id.equals(categoryId)
//     );

//     if (!isAllowed) {
//       throw new AppError("This quiz is not included in your plan", 403);
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// };

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

    // supports both params and body
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

    // ✅ PREMIUM = allow all
    if (
      plan?.subscriptionPlanName &&
      String(plan.subscriptionPlanName).toUpperCase() ===
        String(premiumPlanName).toUpperCase()
    ) {
      return next();
    }

    // ✅ FREE (or any non-premium): allow only allowedQuizCategories
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
