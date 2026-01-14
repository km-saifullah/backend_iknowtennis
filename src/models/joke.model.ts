import mongoose from "mongoose";

export interface IJoke extends mongoose.Document {
  text: string;
  imageUrl: string;
  createdAt: Date;
}

const jokeSchema = new mongoose.Schema<IJoke>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Joke = mongoose.model<IJoke>("Joke", jokeSchema);

export default Joke;
