import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.handler";
import authRouter from "./routes/auth.routes";
import quizCategoryRouter from "./routes/quizCategory.routes";
import subscriptionPlanRouter from "./routes/subscription.routes";
import quizRouter from "./routes/quiz.routes";
import userRoouter from "./routes/user.routes";
import playQuizRouter from "./routes/playQuiz.routes";
import quizStatsRouter from "./routes/quizStats.routes";
import adminDashboardRouter from "./routes/dashboard.routes";
import jokeRouter from "./routes/joke.routes";

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

// play quiz routes
app.use("/api/v1/play-quiz", playQuizRouter);

// quiz attempt stats routes
app.use("/api/v1/quiz-stats", quizStatsRouter);

// joke routes
app.use("/api/v1/joke", jokeRouter);

// admin dashboard routes
app.use("/api/v1/dashboard", adminDashboardRouter);

// global error handler
app.use(errorHandler);

export default app;
