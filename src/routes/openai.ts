import { Router } from "express";
import { OpenAIController } from "../controllers/OpenAIController";
import { openAIChatValidation } from "../middlewares/validationMiddleware";

const router = Router();

router.post("/v1/chat/completions", openAIChatValidation, OpenAIController.chatCompletions);

export default router;