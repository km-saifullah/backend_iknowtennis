import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { accessSecret, refreshSecret } from "../config/index";

export interface IUser extends mongoose.Document {
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  avatarPublicId?: string;
  password: string;
  role: "user" | "admin";
  otp?: string;
  otpExpire?: Date;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IUserModelStatic extends mongoose.Model<IUser> {
  verifyAccessToken(token: string): Promise<IUser | null>;
  verifyRefreshToken(token: string): Promise<IUser | null>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    avatarPublicId: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    role: { type: String, default: "user" },
    otp: { type: String },
    otpExpire: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// password hash
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

// generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    accessSecret,
    { expiresIn: "3d" }
  );
};

// generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    refreshSecret,
    { expiresIn: "90d" }
  );
};

// verify access token
userSchema.statics.verifyAccessToken = async function (token: string) {
  try {
    const decoded: any = jwt.verify(token, accessSecret);
    return await this.findById(decoded.id);
  } catch (err) {
    return null;
  }
};

// verify refresh token
userSchema.statics.verifyRefreshToken = async function (token: string) {
  try {
    const decoded: any = jwt.verify(token, refreshSecret);
    const user = await this.findById(decoded.id);
    if (!user || user.refreshToken !== token) return null;
    return user;
  } catch (err) {
    return null;
  }
};

export const User = mongoose.model<IUser>("User", userSchema);
