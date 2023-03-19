import express from "express";
import { body } from "express-validator";
import userRoutes from "./user/route";
import adminRoutes from "./admin/route";
import { signIn, signOut } from "./admin/controller";
import { jwtVerify } from "../utills/helper";

const routes = express.Router();

/* Admin routes start */
routes.use("/add", adminRoutes);

routes.post(
  "/sign",
  body("email").not().isEmpty().withMessage("Email is required."),
  body("password").not().isEmpty().withMessage("Password is required."),
  signIn
);

routes.post("/signOut", jwtVerify, signOut);
/* Admin routes end */

/* User routes */
routes.use("/user", userRoutes);

export default routes;
