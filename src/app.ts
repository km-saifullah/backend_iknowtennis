import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.handler";
import authRouter from "./routes/auth.routes";
import quizCategoryRouter from "./routes/quizCategory.routes";
import subscriptionPlanRouter from "./routes/subscription.routes";
import quizRouter from "./routes/quiz.routes";
import userRoouter from "./routes/user.routes";

const app = express();

// global middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
app.use(cors({ origin: "*" }));

// home route
app.get("/", (req: Request, res: Response) => {
  return res.send("<h3>Server is running.....!</h3>");
});

// auth routes
app.use("/api/v1/auth", authRouter);

// quiz category routes
app.use("/api/v1/quiz-categories", quizCategoryRouter);

// subscription plan routes
app.use("/api/v1/subscription-plan", subscriptionPlanRouter);

// quiz routes
app.use("/api/v1/quiz", quizRouter);

// user routes
app.use("/api/v1/user", userRoouter);

// global error handler
app.use(errorHandler);

export default app;
