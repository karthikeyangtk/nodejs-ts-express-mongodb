import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config";
import adminSchema from "./schema/admin";

export type TypeObjectId = mongoose.Types.ObjectId;

export const isValidObjectId = (e: string | TypeObjectId) =>
  mongoose.isValidObjectId(e);

export const ObjectId = (e: string | TypeObjectId) =>
  new mongoose.Types.ObjectId(e);

export const encrypt = (password: string) =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(8));

export const isValidPassword = (entered: string, encrypted: string) =>
  bcrypt.compareSync(entered, encrypted);

export const jwtsign = (_id = "", email = "") => {
  try {
    return jwt.sign({ _id, email }, config.SECRET_KEY, { expiresIn: "8h" });
  } catch (error) {
    console.error(`error in jwtsign ${error}`);
    return false;
  }
};

export const unAuthorisedMessage = {
  status: "00",
  message: "Unauthorised access",
};

export const jwtVerify = (req: Request, res: Response, next: NextFunction) => {
  const token = req?.headers?.authorization || "";
  try {
    jwt.verify(token, config.SECRET_KEY, async (err, decode) => {
      if (err && !decode) {
        return res.status(401).json(unAuthorisedMessage);
      }
      if (decode?.["exp"] && +new Date(decode?.["exp"] * 1000) < +new Date()) {
        return res.status(401).json(unAuthorisedMessage);
      }
      if (decode?.["_id"]) {
        const loginUser = await adminSchema.findOne({
          _id: ObjectId(decode["_id"]),
        });
        if (loginUser && loginUser._id) {
          req.params.loginId = `${loginUser._id}`;
          req.params.userName = loginUser.name || "";
          req.params.userEmail = loginUser.email;
          next();
        } else {
          return res.status(401).json(unAuthorisedMessage);
        }
      } else {
        return res.status(401).json(unAuthorisedMessage);
      }
    });
  } catch (error) {
    return res.status(401).json(unAuthorisedMessage);
  }
};
