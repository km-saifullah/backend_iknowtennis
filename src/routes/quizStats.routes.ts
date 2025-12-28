import { Router } from "express";
import {
  getAttemptSummary,
  getLeaderboardFullList,
  getLeaderboardSummary,
  getUserCategoryStats,
  getUserOverviewStats,
  getUserRecentAttempts,
} from "../controllers/quizStats.controller";
import { isLoggedIn } from "../middlewares/isLoggedIn";

const router = Router();

router.route("/overview").get(isLoggedIn, getUserOverviewStats);

router.route("/by-category").get(isLoggedIn, getUserCategoryStats);

router.route("/recent").get(isLoggedIn, getUserRecentAttempts);

router.route("/leaderboard-summary").get(isLoggedIn, getLeaderboardSummary);

router.route("/leaderboard-list").get(isLoggedIn, getLeaderboardFullList);

router.route("/attempt/:attemptId").get(isLoggedIn, getAttemptSummary);

export default router;
