import express from "express";
import { defaultAdmin } from "./controller";

const adminRoutes = express.Router();

adminRoutes.post("/default/admin", defaultAdmin);

export default adminRoutes;
