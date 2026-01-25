import mongoose from "mongoose";

export interface IQuiz extends mongoose.Document {
  quizCategory: mongoose.Types.ObjectId;
  quizQuestion: string;
  quizOptions: string[];
  quizAnswer: string;
  quizAnswerExplanation: string;
  quizPoint: number;
  isActive: boolean;
}

const quizSchema = new mongoose.Schema<IQuiz>(
  {
    quizCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizCategory",
      required: true,
      index: true,
    },
    quizQuestion: {
      type: String,
      required: true,
      trim: true,
    },
    quizOptions: {
      type: [String],
      required: true,
      validate: {
        validator: function (value: string[]) {
          return value.length >= 2;
        },
        message: "At least two options are required",
      },
    },
    quizAnswer: {
      type: String,
      required: true,
    },
    quizAnswerExplanation: {
      type: String,
    },
    quizPoint: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// check the correct answer must include in the quiz options
quizSchema.pre("save", function (next) {
  if (!this.quizOptions.includes(this.quizAnswer)) {
    return next(new Error("Quiz answer must be one of the quiz options"));
  }
  next();
});

const Quiz = mongoose.model<IQuiz>("Quiz", quizSchema);

export default Quiz;
