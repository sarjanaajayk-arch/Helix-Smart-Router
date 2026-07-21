import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { helixLogger } from "./config/logger";

import { ProviderManager } from "./providers/ProviderManager";
import { SmartRouter } from "./orchestrator/SmartRouter";
import { TaskType } from "./types/TaskType";
import { PROVIDERS } from "./orchestrator/ProviderRegistry";
import { HealthMonitor } from "./orchestrator/HealthMonitor";

import metricsRoutes from "./routes/metricsRoutes";
import streamRoutes from "./routes/streamRoutes";
import openaiRoutes from "./routes/openai";
import dashboardRoutes from "./routes/dashboardRoutes";
import readyRoutes from "./routes/readyRoutes";

import { requestIdMiddleware } from "./middlewares/requestIdMiddleware";
import { requestLoggingMiddleware } from "./middlewares/requestLoggingMiddleware";
import { authMiddleware, optionalAuthMiddleware, configureAuth } from "./middlewares/authMiddleware";
import { rateLimitMiddleware, configureRateLimit } from "./middlewares/rateLimitMiddleware";

const app = express();

/* --------------------------------- */
/* Core Services */
/* --------------------------------- */

const providerManager = new ProviderManager();
const smartRouter = new SmartRouter(providerManager);

/* --------------------------------- */
/* Health Monitor Initialization */
/* --------------------------------- */

HealthMonitor.initialize(
 PROVIDERS.map((provider) => provider.provider)
);

/* --------------------------------- */
/* Auth Configuration */
/* --------------------------------- */

configureAuth({
 apiKeys: process.env.API_KEYS?.split(",").map((k) => k.trim()) ?? [],
});

/* --------------------------------- */
/* Middleware */
/* --------------------------------- */

app.use(cors());
app.use(express.json());

app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);

/* --------------------------------- */
/* Rate Limit Middleware */
/* --------------------------------- */

configureRateLimit({
 windowMs: 15 * 60 * 1000, // 15 minutes
 max: 100, // limit each API key/IP to 100 requests per window
});

app.use(rateLimitMiddleware);

/* --------------------------------- */
/* Auth Middleware */
/* --------------------------------- */

app.use(authMiddleware);

/* --------------------------------- */
/* Routes */
/* --------------------------------- */

app.use("/metrics", metricsRoutes);
app.use("/chat", streamRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/ready", readyRoutes);
app.use("/", openaiRoutes);

/* --------------------------------- */
/* Root */
/* --------------------------------- */

app.get("/", (_, res) => {
 res.status(200).json({
 message: "🚀 Helix API is running",
 version: "1.0.0",
 status: "OK",
 });
});

/* --------------------------------- */
/* Health */
/* --------------------------------- */

app.get("/health", (_, res) => {
 res.status(200).json({
 status: "healthy",
 uptime: process.uptime(),
 timestamp: new Date().toISOString(),
 environment: env.NODE_ENV,
 });
});

/* --------------------------------- */
/* AI Test */
/* --------------------------------- */

app.get("/api/test", async (_, res) => {
 try {
 const response = await smartRouter.route({
 prompt: `Write a production-ready TypeScript implementation of an LRU Cache.
Explain the algorithm, time complexity, and include unit tests.`,
 taskType: TaskType.CHAT,
 });

 res.status(200).json(response);

 } catch (error) {
 console.error("========== API TEST ERROR ==========");
 console.error(error);

 if (error instanceof Error) {
 console.error(error.stack);
 }

 helixLogger.error("Failed to process AI request", error);

 res.status(500).json({
 error: "Failed to process AI request.",
 });
 }
});

/* --------------------------------- */
/* Start Server */
/* --------------------------------- */

app.listen(env.PORT, () => {
 helixLogger.info(
 `🚀 Helix Server running on http://localhost:${env.PORT}`
 );
});