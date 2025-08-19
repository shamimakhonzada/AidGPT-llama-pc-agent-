import express from "express";
import { runAiCommand } from "../controllers/aiController.js";

const router = express.Router();
router.post("/command", runAiCommand);

export default router;
