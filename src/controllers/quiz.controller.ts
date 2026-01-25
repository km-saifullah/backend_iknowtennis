import { NextFunction, Request, Response } from "express";
import Quiz from "../models/quiz.model";
import QuizCategory from "../models/quizCategory.model";
import { AppError } from "../utils/AppError";

// create quiz
export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quizCategory, quizzes } = req.body;

    if (!quizCategory || !Array.isArray(quizzes) || quizzes.length === 0) {
      throw new AppError("Missing required fields or quizzes array", 400);
    }

    const category = await QuizCategory.findById(quizCategory);
    if (!category) throw new AppError("Quiz category not found", 404);

    const validatedQuizzes = [];

    for (const quiz of quizzes) {
      const {
        quizQuestion,
        quizOptions,
        quizAnswer,
        quizAnswerExplanation,
        quizPoint,
      } = quiz;

      if (!quizQuestion || !quizOptions || !quizAnswer) {
        throw new AppError("Missing required fields in quiz", 400);
      }

      const existingQuiz = await Quiz.findOne({ quizQuestion, quizCategory });
      if (existingQuiz) {
        throw new AppError(
          `Quiz question "${quizQuestion}" already exists`,
          400,
        );
      }

      validatedQuizzes.push({
        quizCategory: category._id,
        quizQuestion,
        quizOptions,
        quizAnswer,
        quizAnswerExplanation,
        quizPoint: quizPoint || 0,
        isActive: quiz.isActive !== undefined ? quiz.isActive : true,
      });
    }

    const createdQuizzes = await Quiz.insertMany(validatedQuizzes);

    await QuizCategory.findByIdAndUpdate(
      quizCategory,
      {
        $inc: {
          currentQuizCount: createdQuizzes.length,
          currentQuizPoints: createdQuizzes.reduce(
            (acc, q) => acc + q.quizPoint,
            0,
          ),
        },
        $push: { quizzes: { $each: createdQuizzes.map((q) => q._id) } },
      },
      { new: true },
    );

    return res.status(201).json({
      status: true,
      statusCode: 201,
      message: `${createdQuizzes.length} quizzes created successfully`,
      data: createdQuizzes,
    });
  } catch (err) {
    next(err);
  }
};

// update quiz
export const updateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id);
    if (!quiz) throw new AppError("Quiz not found", 404);

    const quizCategory = await QuizCategory.findById(quiz.quizCategory);
    if (!quizCategory) throw new AppError("Quiz category not found", 404);

    if (req.body.quizPoint !== undefined) {
      const newPoint = Number(req.body.quizPoint);
      const pointDifference = newPoint - quiz.quizPoint;

      if (quizCategory.quizPoint + pointDifference > quizCategory.quizPoint) {
        throw new AppError("Quiz point limit exceeded", 400);
      }

      quizCategory.quizPoint += pointDifference;
      quiz.quizPoint = newPoint;
    }

    quiz.quizQuestion = req.body.quizQuestion ?? quiz.quizQuestion;
    quiz.quizOptions = req.body.quizOptions ?? quiz.quizOptions;
    quiz.quizAnswer = req.body.quizAnswer ?? quiz.quizAnswer;
    quiz.quizAnswerExplanation =
      req.body.quizAnswerExplanation ?? quiz.quizAnswerExplanation;

    await quiz.save();
    await quizCategory.save();

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

// get all quizes
export const getAllQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = 1,
      limit = 10,
      quizQuestion,
      categoryName,
      sortPoint,
    } = req.query;

    const query: any = {};

    if (quizQuestion) {
      query.quizQuestion = {
        $regex: quizQuestion,
        $options: "i",
      };
    }

    if (categoryName) {
      const category = await QuizCategory.findOne({
        quizCategoryName: { $regex: categoryName, $options: "i" },
      });

      if (!category) {
        return res.status(200).json({
          status: true,
          statusCode: 200,
          message: "No quizzes found",
          data: [],
        });
      }

      query.quizCategory = category._id;
    }

    let sort: any = { createdAt: -1 };
    if (sortPoint === "asc") sort = { quizPoint: 1 };
    if (sortPoint === "desc") sort = { quizPoint: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const quizzes = await Quiz.find(query)
      .populate("quizCategory", "quizCategoryName")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Quiz.countDocuments(query);

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Quizzes fetched successfully",
      data: quizzes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// get single quiz
export const getSingleQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id).populate(
      "quizCategory",
      "quizCategoryName quizPoint quizCount",
    );

    if (!quiz) throw new AppError("Quiz not found", 404);

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Quiz fetched successfully",
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

// get quizzes by quiz category name
export const getQuizzesByCategoryName = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { categoryName } = req.params;

    const category = await QuizCategory.findOne({
      quizCategoryName: { $regex: categoryName, $options: "i" },
    });

    if (!category) throw new AppError("Quiz category not found", 404);

    const quizzes = await Quiz.find({
      quizCategory: category._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Quizzes fetched successfully",
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

// delete quiz
export const deleteQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id);
    if (!quiz) throw new AppError("Quiz not found", 404);

    await QuizCategory.findByIdAndUpdate(quiz.quizCategory, {
      $inc: {
        currentQuizCount: -1,
        currentQuizPoints: -quiz.quizPoint,
      },
      $pull: {
        quizzes: quiz._id,
      },
    });

    await quiz.deleteOne();

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
