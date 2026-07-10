import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { logger } from "./config/logger";

import { providerManager } from "./providers/ProviderManager";
import { SmartRouter } from "./orchestrator/SmartRouter";
import { TaskType } from "./types/TaskType";

import metricsRoutes from "./routes/metricsRoutes";
import streamRoutes from "./routes/streamRoutes";

const app = express();
const smartRouter = new SmartRouter(providerManager);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/metrics", metricsRoutes);
app.use("/chat", streamRoutes);

// Root
app.get("/", (_, res) => {
  res.json({
    message: "🚀 Helix API is running",
    version: "1.0.0",
    status: "OK",
  });
});

// Health Check
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Test Endpoint
app.get("/api/test", async (_, res) => {
  try {
    const response = await smartRouter.route({
      prompt: "Introduce yourself as Helix AI in one short paragraph.",
      taskType: TaskType.CHAT,
    });

    res.json(response);
  } catch (error) {
   logger.error(
  `Failed to process AI request. ${
    error instanceof Error ? error.message : String(error)
  }`
);
    res.status(500).json({
      error: "Failed to process AI request.",
    });
  }
});

// Start Server
app.listen(env.PORT, () => {
  logger.info(
    `🚀 Helix Server running on http://localhost:${env.PORT}`
  );
});