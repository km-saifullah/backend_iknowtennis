import express from "express";
import {
  loginUser,
  logoutUser,
  signupUser,
} from "../controllers/auth.controller";
import { isLoggedIn } from "../middlewares/isLoggedIn";

const router = express.Router();

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isLoggedIn, logoutUser);

export default router;
