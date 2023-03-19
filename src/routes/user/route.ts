import express from "express";
import { body } from "express-validator";
import {
  addUpdateUser,
  getList,
  deleteUser,
  getUser,
  dashboard,
} from "../user/controller";
import { jwtVerify } from "../../utills/helper";

const userRoutes = express.Router();

userRoutes.post(
  "/add",
  body("email").isEmail().withMessage("Email is required."),
  body("name")
    .isLength({ min: 3 })
    .withMessage("Name should have a minimum of 3 characters."),
  body("status").not().isEmpty().withMessage("Status is required."),
  jwtVerify,
  addUpdateUser
);

userRoutes.get("/edit/:id", jwtVerify, getUser);

userRoutes.get("/dashboard", jwtVerify, dashboard);

userRoutes.get("/list", jwtVerify, getList);

userRoutes.delete(
  "/delete",
  body("_id").not().isEmpty().withMessage("ID is required."),
  jwtVerify,
  deleteUser
);

export default userRoutes;
