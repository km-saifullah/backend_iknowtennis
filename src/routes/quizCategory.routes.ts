import express from "express";
import {
  createQuizCategory,
  deleteQuizCategory,
  getAllQuizCategories,
  getSingleQuizCategory,
  updateQuizCategory,
} from "../controllers/quizCategory.controller";
import { uploadSingle } from "../utils/upload";
import { isLoggedIn } from "../middlewares/isLoggedIn";
import { canAccessQuizCategory } from "../middlewares/canAccessQuizCategory.middleware";
import { isAdmin } from "../middlewares/isAdmin";

const router = express.Router();

router
  .route("/")
  .post(
    isLoggedIn,
    isAdmin,
    uploadSingle("quizCategoryImage"),
    createQuizCategory
  )
  .get(getAllQuizCategories);
router
  .route("/:id")
  .put(
    isLoggedIn,
    isAdmin,
    uploadSingle("quizCategoryImage"),
    updateQuizCategory
  )
  .get(isLoggedIn, canAccessQuizCategory, getSingleQuizCategory)
  .delete(isLoggedIn, isAdmin, deleteQuizCategory);

export default router;
