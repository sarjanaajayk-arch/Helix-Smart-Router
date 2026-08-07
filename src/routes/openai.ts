import { Router } from "express";

import { OpenAIController } from "../controllers/OpenAIController";
import { openAIChatValidation } from "../middlewares/validationMiddleware";
import { apiKeyAuthenticationMiddleware } from "../authentication/middleware/apiKeyAuthenticationMiddleware";

const router = Router();

/**
 * OpenAI Compatible Chat Completions
 */
router.post(
    "/v1/chat/completions",
    apiKeyAuthenticationMiddleware,
    openAIChatValidation,
    OpenAIController.chatCompletions
);

/**
 * OpenAI Compatible Models Endpoint
 */
router.get(
    "/v1/models",
    apiKeyAuthenticationMiddleware,
    OpenAIController.listModels
);

export default router;