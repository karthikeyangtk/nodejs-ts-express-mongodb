import { Request, Response } from "express";
import mongoose from "mongoose";
import { validationResult } from "express-validator";
import adminSchema from "../../utills/schema/admin";
import {
  encrypt,
  isValidObjectId,
  isValidPassword,
  jwtsign,
  ObjectId,
} from "../../utills/helper";

type Activity = {
  lastLoggedIn: Number,
  lastLoggedOut: Number,
};

type AdminSchema = {
  name: string,
  email: string,
  password?: string,
  timeStamps?: number,
  activity?: Activity,
  isDefault: number,
  _id?: mongoose.Types.ObjectId,
};

export const defaultAdmin = async (req: Request, res: Response) => {
  try {
    const admin: AdminSchema = {
      name: "Admin",
      email: "admintest@yopmail.com",
      password: encrypt("TestAdmin@123"),
      timeStamps: +new Date(),
      isDefault: 1,
    };
    const getAdmin = await adminSchema.find({ email: admin.email }, { _id: 1 });
    if (getAdmin?.length > 0) {
      return res
        .status(200)
        .json({ status: "0", message: "Default admin already added" });
    }
    const addAdmin = await adminSchema.create(admin);
    if (addAdmin?._id) {
      return res
        .status(200)
        .json({ status: "1", message: "Default administrator added successfully" });
    } else {
      return res
        .status(200)
        .json({ status: "0", message: "Default admin not added" });
    }
  } catch (error) {
    console.error(`error in defaultAdmin ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { email = "", password = "" } = req.body || {};

    const getUser = await adminSchema.findOne(
      { email: `${email}`.toLowerCase() },
      { _id: 1, password: 1, email: 1 }
    );
    if (getUser?._id) {
      if (isValidPassword(password, getUser?.password || "")) {
        await adminSchema.updateOne(
          { _id: getUser._id },
          { "activity.lastLoggedIn": +new Date() }
        );
        return res.status(200).json({
          status: "1",
          message: "Login successfully",
          token: jwtsign(`${getUser._id}`, getUser.email),
        });
      } else {
        return res
          .status(200)
          .json({ status: "0", message: "Invalid password" });
      }
    } else {
      return res.status(200).json({ status: "0", message: "Invalid email" });
    }
  } catch (error) {
    console.error(`Error in signIn ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};

export const signOut = async (req: Request, res: Response) => {
  try {
    const { loginId: _id } = req.params || {};
    if (!isValidObjectId(_id)) {
      return res
        .status(200)
        .json({ status: "0", message: "Id is not a valid id" });
    }
    const signOut = await adminSchema.updateOne(
      { _id: ObjectId(_id) },
      { "activity.lastLoggedOut": +new Date() }
    );
    if (signOut?.modifiedCount > 0) {
      return res
        .status(200)
        .json({ status: "1", message: "Signed out successfully" });
    } else {
      return res
        .status(200)
        .json({ status: "0", message: "User not signed out" });
    }
  } catch (error) {
    console.error(`Error in signOut ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};
