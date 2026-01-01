import express from "express";
import {
  createQuiz,
  deleteQuiz,
  getAllQuizzes,
  getQuizzesByCategoryName,
  getSingleQuiz,
  updateQuiz,
} from "../controllers/quiz.controller";
import { isLoggedIn } from "../middlewares/isLoggedIn";
import { canAccessQuizCategory } from "../middlewares/canAccessQuizCategory.middleware";
import { isAdmin } from "../middlewares/isAdmin";

const router = express.Router();

router.route("/").post(isLoggedIn, isAdmin, createQuiz).get(getAllQuizzes);

router
  .route("/:id")
  .put(isLoggedIn, isAdmin, updateQuiz)
  .get(isLoggedIn, canAccessQuizCategory, getSingleQuiz)
  .delete(isLoggedIn, isAdmin, deleteQuiz);

router
  .route("/:categoryName")
  .get(isLoggedIn, canAccessQuizCategory, getQuizzesByCategoryName);

export default router;
