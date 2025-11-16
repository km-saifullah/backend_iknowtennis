import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.handler";

const app = express();

// global middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(errorHandler);

// home route
app.get("/", (req: Request, res: Response) => {
  return res.send("<h3>Server is running.....!</h3>");
});

export default app;
