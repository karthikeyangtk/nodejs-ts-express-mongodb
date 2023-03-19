import mongoose from "mongoose";
const { model, Schema, Types } = mongoose;

const userSchema = new Schema(
  {
    adminId: { type: Types.ObjectId, ref: "admin" },
    name: String,
    email: { type: String, required: true, index: true, unique: true },
    password: String,
    timeStamps: { type: Number, default: +new Date() },
    activity: {
      lastLoggedIn: Number,
      lastLoggedOut: Number,
    },
    status: Number, /* 1: Active, 0 - In-active */
  },
  { timestamps: true, versionKey: false }
);

export default model("user", userSchema, "user");
