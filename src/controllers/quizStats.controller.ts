import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";
import { QuizAttempt } from "../models/quizAttempt.model";
import { redisClient } from "../config/redis";
import QuizCategory from "../models/quizCategory.model";
import SubscriptionPlan from "../models/subscription.model";
import { AuthenticatedRequest } from "../middlewares/isLoggedIn";
import { User } from "../models/user.model";

const percent = (correct: number, total: number) => {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
};

const formatDuration = (seconds: number | null | undefined) => {
  if (typeof seconds !== "number" || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const safePercent = (a: number, b: number) => {
  if (!b) return 0;
  return Math.round((a / b) * 100);
};

const getMotivationMessage = (rank: number | null) => {
  if (rank === null) return "Play quizzes to get ranked";
  if (rank === 1) return "Outstanding! You are #1";
  if (rank <= 3) return "Outstanding! You are one of the top performers";
  if (rank <= 10) return "Great job! You're in the top 10";
  return "Keep going! You can climb the leaderboard";
};

// quiz attempt summary
export const getAttemptSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attemptId } = req.params;
    console.log("userID", req.user?._id);

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new AppError("Invalid attempt id", 400);
    }

    const attempt = await QuizAttempt.findById(attemptId)
      .populate("category", "quizCategoryName quizTotalTime quizCategoryImage")
      .lean();

    console.log(attempt);

    if (!attempt) throw new AppError("Result not found", 404);

    const attemptUserId = String(attempt.user);
    const reqUserId = String(req.user?._id);

    if (!reqUserId || attemptUserId !== reqUserId) {
      throw new AppError("Access Denied", 403);
    }

    const incorrectAnswers =
      (attempt.totalQuestions || 0) - (attempt.correctAnswers || 0);
    const accuracy = percent(
      attempt.correctAnswers || 0,
      attempt.totalQuestions || 0
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Attempt summary fetched successfully",
      data: {
        attemptId: attempt._id,
        category: attempt.category,
        totalQuestions: attempt.totalQuestions || 0,
        correctAnswers: attempt.correctAnswers || 0,
        incorrectAnswers: incorrectAnswers < 0 ? 0 : incorrectAnswers,
        totalScore: attempt.totalScore || 0,
        accuracyPercent: accuracy,
        timeTakenSeconds: (attempt as any).timeTakenSeconds ?? null,
        timeTakenFormatted: formatDuration(
          (attempt as any).timeTakenSeconds ?? null
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

//  get user overall stats
export const getUserOverviewStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?._id) throw new AppError("Access Denied, Please login", 401);

    const userObjectId = req.user._id;
    const userIdStr = String(req.user._id);

    const stats = await QuizAttempt.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: "$user",
          quizzesPlayed: { $sum: 1 },
          totalScore: { $sum: "$totalScore" },
          totalCorrect: { $sum: "$correctAnswers" },
          totalQuestions: { $sum: "$totalQuestions" },
          bestScore: { $max: "$totalScore" },
          avgScore: { $avg: "$totalScore" },
          lastPlayedAt: { $max: "$createdAt" },
        },
      },
    ]);

    const s = stats[0] || {
      quizzesPlayed: 0,
      totalScore: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      bestScore: 0,
      avgScore: 0,
      lastPlayedAt: null,
    };

    let leaderboard = {
      totalScore: null as number | null,
      rank: null as number | null,
    };

    if (redisClient.isOpen) {
      const score = await redisClient.zScore("leaderboard:all", userIdStr);
      const rank0 = await redisClient.zRevRank("leaderboard:all", userIdStr);

      leaderboard = {
        totalScore: typeof score === "number" ? score : null,
        rank: typeof rank0 === "number" ? rank0 + 1 : null,
      };
    }

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Overview stats fetched successfully",
      data: {
        quizzesPlayed: s.quizzesPlayed,
        totalScore: s.totalScore,
        bestScore: s.bestScore,
        averageScore: Math.round((s.avgScore || 0) * 100) / 100,
        totalCorrect: s.totalCorrect,
        totalQuestionsAnswered: s.totalQuestions,
        lastPlayedAt: s.lastPlayedAt,
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

// category wise stats for an user
export const getUserCategoryStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Access Denied, Please login", 401);

    const rows = await QuizAttempt.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
      {
        $group: {
          _id: "$category",
          quizzesPlayed: { $sum: 1 },
          totalScore: { $sum: "$totalScore" },
          totalCorrect: { $sum: "$correctAnswers" },
          totalQuestions: { $sum: "$totalQuestions" },
          bestScore: { $max: "$totalScore" },
          avgScore: { $avg: "$totalScore" },
          lastPlayedAt: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "quizcategories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          categoryId: "$_id",
          quizzesPlayed: 1,
          totalScore: 1,
          bestScore: 1,
          averageScore: { $round: ["$avgScore", 2] },
          totalCorrect: 1,
          totalQuestions: 1,
          lastPlayedAt: 1,
          category: {
            _id: "$category._id",
            quizCategoryName: "$category.quizCategoryName",
            quizCategoryImage: "$category.quizCategoryImage",
            quizTotalTime: "$category.quizTotalTime",
          },
        },
      },
      { $sort: { totalScore: -1 } },
    ]);

    const data = rows.map((r: any) => {
      const incorrect = (r.totalQuestions || 0) - (r.totalCorrect || 0);
      return {
        ...r,
        totalIncorrect: incorrect < 0 ? 0 : incorrect,
        accuracyPercent: percent(r.totalCorrect || 0, r.totalQuestions || 0),
      };
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Category stats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// recent quiz attempt data
export const getUserRecentAttempts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Access Denied, Please login", 401);

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const attempts = await QuizAttempt.find({ user: userId })
      .populate("category", "quizCategoryName quizCategoryImage")
      .select(
        "totalScore correctAnswers totalQuestions timeTakenSeconds createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = attempts.map((a: any) => {
      const incorrect = (a.totalQuestions || 0) - (a.correctAnswers || 0);
      return {
        attemptId: a._id,
        category: a.category,
        totalScore: a.totalScore || 0,
        correctAnswers: a.correctAnswers || 0,
        incorrectAnswers: incorrect < 0 ? 0 : incorrect,
        totalQuestions: a.totalQuestions || 0,
        accuracyPercent: percent(a.correctAnswers || 0, a.totalQuestions || 0),
        timeTakenSeconds: a.timeTakenSeconds ?? null,
        timeTakenFormatted: formatDuration(a.timeTakenSeconds ?? null),
        createdAt: a.createdAt,
      };
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Recent quiz attempts fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// get leaderboard summary
export const getLeaderboardSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?._id) throw new AppError("Access Denied, Please login", 401);

    const userObjectId = req.user._id;
    const userIdStr = String(req.user._id);

    const [attemptAgg, distinctCategories] = await Promise.all([
      QuizAttempt.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: "$user",
            quizzesPlayed: { $sum: 1 },
            totalCorrect: { $sum: "$correctAnswers" },
            totalQuestions: { $sum: "$totalQuestions" },
          },
        },
      ]),
      QuizAttempt.distinct("category", { user: userObjectId }),
    ]);

    const attemptStats = attemptAgg[0] || {
      quizzesPlayed: 0,
      totalCorrect: 0,
      totalQuestions: 0,
    };

    const categoriesPlayed = distinctCategories.length;

    let totalCategoriesAvailable = 0;

    if (req.user?.subscription?.isActive && req.user?.subscription?.plan) {
      const plan = await SubscriptionPlan.findById(req.user.subscription.plan)
        .select("allowedQuizCategories")
        .lean();

      totalCategoriesAvailable = plan?.allowedQuizCategories?.length || 0;
    } else {
      totalCategoriesAvailable = await QuizCategory.countDocuments();
    }

    const pendingCategories = Math.max(
      totalCategoriesAvailable - categoriesPlayed,
      0
    );

    const completedPercent = safePercent(
      categoriesPlayed,
      totalCategoriesAvailable || categoriesPlayed || 1
    );
    const pendingPercent = 100 - completedPercent;

    let points: number | null = null;
    let rank: number | null = null;

    if (redisClient.isOpen) {
      const score = await redisClient.zScore("leaderboard:all", userIdStr);
      const r0 = await redisClient.zRevRank("leaderboard:all", userIdStr);
      points = typeof score === "number" ? score : 0;
      rank = typeof r0 === "number" ? r0 + 1 : null;
    } else {
      points = null;
      rank = null;
    }

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Leaderboard summary fetched successfully",
      data: {
        quizzesPlayed: attemptStats.quizzesPlayed || 0,
        points,
        yourPosition: rank,
        message: getMotivationMessage(rank),
        performance: {
          accuracyPercent: safePercent(
            attemptStats.totalCorrect || 0,
            attemptStats.totalQuestions || 0
          ),
        },
        categoryProgress: {
          totalCategoriesAvailable,
          completedCategories: categoriesPlayed,
          pendingCategories,
          completedPercent,
          pendingPercent,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// get full leaderboard list
export const getLeaderboardFullList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!redisClient.isOpen) throw new AppError("Leaderboard unavailable", 503);

    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const raw = await redisClient.zRangeWithScores(
      "leaderboard:all",
      start,
      end,
      { REV: true }
    );

    const userIds = raw.map((r) => r.value);

    const users = await User.find({ _id: { $in: userIds } })
      .select("fullName email avatar role")
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const list = raw.map((entry, i) => {
      const u = userMap.get(entry.value);
      return {
        rank: start + i + 1,
        userId: entry.value,
        fullName: u?.fullName || null,
        email: u?.email || null,
        avatar: u?.avatar || null,
        role: u?.role || null,
        points: entry.score,
      };
    });

    const topRaw = await redisClient.zRangeWithScores("leaderboard:all", 0, 2, {
      REV: true,
    });
    const topIds = topRaw.map((r) => r.value);

    const topUsers = await User.find({ _id: { $in: topIds } })
      .select("fullName avatar")
      .lean();
    const topMap = new Map(topUsers.map((u) => [String(u._id), u]));

    const top3 = topRaw.map((entry, idx) => {
      const u = topMap.get(entry.value);
      return {
        rank: idx + 1,
        userId: entry.value,
        fullName: u?.fullName || null,
        avatar: u?.avatar || null,
        points: entry.score,
      };
    });

    let me: any = null;
    if (req.user?._id) {
      const meId = String(req.user._id);
      const score = await redisClient.zScore("leaderboard:all", meId);
      const r0 = await redisClient.zRevRank("leaderboard:all", meId);
      me = {
        userId: meId,
        rank: typeof r0 === "number" ? r0 + 1 : null,
        points: typeof score === "number" ? score : 0,
      };
    }

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Leaderboard list fetched successfully",
      data: {
        page,
        limit,
        top3,
        list,
        me,
      },
    });
  } catch (error) {
    next(error);
  }
};
