import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.handler";
import authRouter from "./routes/auth.routes";

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

// global error handler
app.use(errorHandler);

export default app;
