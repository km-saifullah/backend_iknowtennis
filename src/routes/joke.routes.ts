import { Router } from "express";
import {
  deleteJoke,
  editJoke,
  getAllJokes,
  getRandomJoke,
  uploadJoke,
} from "../controllers/joke.controller";
import { isLoggedIn } from "../middlewares/isLoggedIn";
import { uploadSingle } from "../utils/upload";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router
  .route("/")
  .post(isLoggedIn, isAdmin, uploadSingle("jokeImage"), uploadJoke)
  .get(isLoggedIn, isAdmin, getAllJokes);

router
  .route("/:id")
  .put(isLoggedIn, isAdmin, uploadSingle("jokeImage"), editJoke)
  .delete(isLoggedIn, isAdmin, deleteJoke);

router.route("/random-joke").get(isLoggedIn, getRandomJoke);

export default router;
