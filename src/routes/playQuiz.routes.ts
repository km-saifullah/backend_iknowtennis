import { Router } from "express";
import { isLoggedIn } from "../middlewares/isLoggedIn";
import {
  getLeaderboard,
  getPerformance,
  getQuizResult,
  startQuiz,
  submitQuiz,
} from "../controllers/playQuiz.controller";
import { hasActiveSubscription } from "../middlewares/hasActiveSubscription.middleware";
import { canAccessQuizCategory } from "../middlewares/canAccessQuizCategory.middleware";

const router = Router();

router.use(isLoggedIn);

router.get("/performance", getPerformance);

router.get("/leaderboard", getLeaderboard);

router.get("/result/:attemptId", isLoggedIn, getQuizResult);

router.post("/submit", isLoggedIn, canAccessQuizCategory, submitQuiz);

router.get(
  "/category/:categoryId",
  isLoggedIn,
  canAccessQuizCategory,
  startQuiz,
);

export default router;
