import express from "express";
import authRouter from "./authRoute.js";
import transportRouter from "./transportRoute.js";
import pickingRouter from "./pickingRoute.js";

const router = express.Router();
router.stack = [...router.stack, ...authRouter, ...transportRouter, ...pickingRouter];

export default router;
