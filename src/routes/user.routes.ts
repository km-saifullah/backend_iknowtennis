import { Router } from "express";
import { getSingleUser, updateUserProfile } from "../controllers/user.controller";
import { isLoggedIn } from "../middlewares/isLoggedIn";
import { uploadSingle } from "../utils/upload";

const router = Router();

router
  .route("/profile")
  .put(isLoggedIn, uploadSingle("avatar"), updateUserProfile);

router.route("/:id").get(isLoggedIn, getSingleUser)

export default router;
