import { Router } from "express";
import { updateUserProfile } from "../controllers/user.controller";
import { isLoggedIn } from "../middlewares/isLoggedIn";
import { uploadSingle } from "../utils/upload";

const router = Router();

router
  .route("/profile")
  .put(isLoggedIn, uploadSingle("avatar"), updateUserProfile);

export default router;
