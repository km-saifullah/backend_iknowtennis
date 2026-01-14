import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import Joke from "../models/joke.model";
import cloudinaryUpload from "../utils/cloudinaryUpload";

// upload joke
export const uploadJoke = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text } = req.body;
    const imageFile = req.file;

    if (!text || !imageFile) {
      throw new AppError("Both joke and image are required", 400);
    }

    const { url: imageUrl } = await cloudinaryUpload(imageFile.path);

    const newJoke = await Joke.create({
      text,
      imageUrl,
    });

    return res.status(201).json({
      status: true,
      statusCode: 201,
      message: "Joke uploaded successfully",
      data: newJoke,
    });
  } catch (error) {
    next(error);
  }
};

// get random joke
export const getRandomJoke = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const joke = await Joke.aggregate([{ $sample: { size: 1 } }]);

    if (!joke || joke.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No jokes found in the database",
      });
    }

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Here is a joke for you!",
      data: {
        joke: joke[0].text,
        imageUrl: joke[0].imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// edit joke
export const editJoke = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, imageUrl } = req.body;

    if (!text) {
      throw new AppError("Joke text is required", 400);
    }

    const joke = await Joke.findById(id);
    if (!joke) {
      throw new AppError("Joke not found", 404);
    }

    joke.text = text;
    if (imageUrl) {
      joke.imageUrl = imageUrl;
    }

    await joke.save();

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Joke updated successfully",
      data: joke,
    });
  } catch (error) {
    next(error);
  }
};

// delete joke
export const deleteJoke = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const joke = await Joke.findById(id);
    if (!joke) {
      throw new AppError("Joke not found", 404);
    }

    await Joke.deleteOne({ _id: id });

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Joke deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

//  get all jokes
export const getAllJokes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jokes = await Joke.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalJokes = await Joke.countDocuments();

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Fetched jokes successfully",
      data: {
        jokes,
        pagination: {
          total: totalJokes,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalJokes / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
