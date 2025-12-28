import express from "express";
import {
  changePassword,
  forgotPassword,
  loginUser,
  logoutUser,
  resendOtp,
  resetPassword,
  resetRefreshTokenFromAccessToken,
  signupUser,
  verifyOtp,
} from "../controllers/auth.controller";
import { isLoggedIn } from "../middlewares/isLoggedIn";

const router = express.Router();

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/resend-otp").post(resendOtp);
router.route("/verify-otp").post(verifyOtp);
router.route("/reset-password").post(resetPassword);
router.route("/change-password").patch(isLoggedIn, changePassword);
router
  .route("/reset-refresh-token")
  .post(isLoggedIn, resetRefreshTokenFromAccessToken);
router.route("/logout").post(isLoggedIn, logoutUser);

export default router;
