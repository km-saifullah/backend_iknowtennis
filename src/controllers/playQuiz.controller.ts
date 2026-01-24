import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { redisClient } from "../config/redis";
import Quiz from "../models/quiz.model";
import { QuizAttempt } from "../models/quizAttempt.model";
import { AppError } from "../utils/AppError";
import QuizCategory from "../models/quizCategory.model";
import { updateLeaderboardRealtime } from "../services/leaderboard.service";
import { User } from "../models/user.model";
import { getRandomJoke } from "./joke.controller";
import Joke from "../models/joke.model";

interface SubmitAnswerDTO {
  questionId: string;
  selectedOption: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

// get a random tennis joke
const fetchRandomJoke = async () => {
  try {
    const joke = await Joke.aggregate([{ $sample: { size: 1 } }]);
    if (!joke || joke.length === 0) throw new AppError("No jokes found", 404);
    return joke[0];
  } catch (error) {
    throw new AppError("Error fetching random joke", 500);
  }
};

// get quiz questions
export const startQuiz = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("Invalid quiz category", 400);
    }

    const category = await QuizCategory.findById(categoryId);
    if (!category) {
      throw new AppError("Quiz category not found", 404);
    }

    const cacheKey = `quiz:start:${categoryId}`;

    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        res.status(200).json(JSON.parse(cached));
        return;
      }
    }

    const questions = await Quiz.find({
      quizCategory: categoryId,
      isActive: true,
    }).select("-quizAnswer");

    const response = {
      status: true,
      statusCode: 200,
      message: "Category and qustions fetched successfully",
      data: {
        category: {
          id: category._id,
          name: category.quizCategoryName,
          totalTime: category.quizTotalTime,
          totalQuestions: questions.length,
        },
        questions,
      },
    };

    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// submit quiz
// export const submitQuiz = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { categoryId, answers, timeTakenSeconds } = req.body as {
//       categoryId: string;
//       answers: SubmitAnswerDTO[];
//       timeTakenSeconds?: number;
//     };

//     if (!categoryId || !answers?.length) {
//       throw new AppError("Invalid submission data", 400);
//     }

//     let totalScore = 0;
//     let correctAnswers = 0;

//     const resultAnswers = [];

//     for (const ans of answers) {
//       const question = await Quiz.findById(ans.questionId);
//       if (!question) continue;

//       const isCorrect = question.quizAnswer === ans.selectedOption;
//       const point = isCorrect ? question.quizPoint : 0;

//       if (isCorrect) {
//         totalScore += point;
//         correctAnswers++;
//       }

//       resultAnswers.push({
//         question: question._id,
//         selectedOption: ans.selectedOption,
//         correctOption: question.quizAnswer,
//         isCorrect,
//         point,
//       });
//     }

//     const attempt = await QuizAttempt.create({
//       user: req.user!._id,
//       category: categoryId,
//       answers: resultAnswers,
//       totalScore,
//       correctAnswers,
//       totalQuestions: resultAnswers.length,
//       timeTakenSeconds:
//         typeof timeTakenSeconds === "number" ? timeTakenSeconds : null,
//     });

//     await updateLeaderboardRealtime(req.user!._id.toString(), totalScore);

//     res.status(201).json({
//       status: true,
//       statusCode: 201,
//       message: "Quiz submitted successfully",
//       data: {
//         attemptId: attempt._id,
//         totalScore,
//         correctAnswers,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const submitQuiz = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId, selectedOption, questionId } = req.body;

    if (!categoryId || !selectedOption || !questionId) {
      throw new AppError("Invalid submission data", 400);
    }

    const question = await Quiz.findById(questionId);
    if (!question) throw new AppError("Question not found", 404);

    const isCorrect = question.quizAnswer === selectedOption;
    const point = isCorrect ? question.quizPoint : 0;

    const answer = {
      questionId,
      selectedOption,
      isCorrect,
      point,
    };

    const totalQuestions = await Quiz.countDocuments({
      quizCategory: categoryId,
    });

    const attempt = await QuizAttempt.findOneAndUpdate(
      {
        user: req.user!._id,
        category: categoryId,
      },
      {
        $push: { answers: answer },
        $inc: {
          totalScore: point,
          correctAnswers: isCorrect ? 1 : 0,
        },
        $set: { totalQuestions },
      },
      { upsert: true, new: true }
    );

    await updateLeaderboardRealtime(
      req.user!._id.toString(),
      attempt.totalScore
    );

    const totalAnsweredQuestions = attempt.answers.length;

    if (totalAnsweredQuestions === totalQuestions) {
      const joke = await fetchRandomJoke();

      res.status(200).json({
        status: true,
        message: "Answer submitted successfully, here's a joke:",
        data: {
          isCorrect,
          correctAnswer: question.quizAnswer,
          attemptId: attempt._id,
          joke: joke.text,
          jokeImageUrl: joke.imageUrl,
        },
      });
    }

    res.status(200).json({
      status: true,
      message: "Answer submitted successfully",
      data: {
        isCorrect,
        correctAnswer: question.quizAnswer,
        attemptId: attempt._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get quiz result
export const getQuizResult = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await QuizAttempt.findById(req.params.attemptId).populate(
      "answers.question",
      "quizQuestion quizOptions"
    );

    if (!result) {
      throw new AppError("Result not found", 404);
    }

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Fetch quiz result successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//  get the performance
export const getPerformance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await QuizAttempt.aggregate([
      { $match: { user: req.user!._id } },
      {
        $group: {
          _id: null,
          totalScore: { $sum: "$totalScore" },
          quizzesPlayed: { $sum: 1 },
          correctAnswers: { $sum: "$correctAnswers" },
        },
      },
    ]);

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Fetch performance successfully",
      data: stats[0] || {
        totalScore: 0,
        quizzesPlayed: 0,
        correctAnswers: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get leaderboard
export const getLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      throw new AppError("Leaderboard unavailable", 503);
    }

    const raw = await redisClient.zRangeWithScores("leaderboard:all", 0, 9, {
      REV: true,
    });

    const userIds = raw.map((u) => u.value);

    const users = await User.find({ _id: { $in: userIds } })
      .select("fullName email avatar role")
      .lean();

    const leaderboard = raw.map((entry, index) => {
      const user = users.find((u) => u._id.toString() === entry.value);

      return {
        rank: index + 1,
        userId: entry.value,
        fullName: user?.fullName,
        email: user?.email,
        avatar: user?.avatar,
        role: user?.role,
        totalScore: entry.score,
      };
    });

    res.status(200).json({
      status: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};
