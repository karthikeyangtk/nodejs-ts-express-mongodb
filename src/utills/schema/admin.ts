import mongoose from "mongoose";
const { model, Schema } = mongoose;

const userSchema = new Schema(
  {
    name: String,
    email: { type: String, required: true, index: true, unique: true },
    password: String,
    timeStamps: { type: Number, default: +new Date() },
    activity: {
      lastLoggedIn: Number,
      lastLoggedOut: Number,
    },
    isDefault: Number, /* Can't delete the default admin */
  },
  { timestamps: true, versionKey: false }
);

export default model("admin", userSchema, "admin");
