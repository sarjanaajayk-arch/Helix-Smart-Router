import { providerManager } from "./providers/ProviderManager";
import express from "express";
import { logger } from "./config/logger";
import cors from "cors";
import { SmartRouter } from "./orchestrator/SmartRouter";
import { TaskType } from "./types/TaskType";

import { env } from "./config/env";

const app = express();
const smartRouter = new SmartRouter(providerManager);

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    message: "🚀 Helix API is running",
    version: "1.0.0",
    status: "OK",
  });
});

app.get("/health", (_, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.get("/api/test", async (_, res) => {
  try {
    const response = await smartRouter.route({
      prompt: "Introduce yourself as Helix AI in one short paragraph.",
      taskType: TaskType.CHAT,
    });

    res.json(response);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to process AI request.",
    });
  }
});

app.listen(env.PORT, () => {
 logger.info(`🚀 Helix Server running on http://localhost:${env.PORT}`);
});