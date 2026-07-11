import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { helixLogger } from "./config/logger";

import { ProviderManager } from "./providers/ProviderManager";
import { SmartRouter } from "./orchestrator/SmartRouter";
import { TaskType } from "./types/TaskType";

import metricsRoutes from "./routes/metricsRoutes";
import streamRoutes from "./routes/streamRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

import { requestIdMiddleware } from "./middlewares/requestIdMiddleware";
import { requestLoggingMiddleware } from "./middlewares/requestLoggingMiddleware";

const app = express();

/* --------------------------------- */
/* Core Services */
/* --------------------------------- */

const providerManager = new ProviderManager();
const smartRouter = new SmartRouter(providerManager);

/* --------------------------------- */
/* Middleware */
/* --------------------------------- */

app.use(cors());
app.use(express.json());

app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);

/* --------------------------------- */
/* Routes */
/* --------------------------------- */

app.use("/metrics", metricsRoutes);
app.use("/chat", streamRoutes);
app.use("/dashboard", dashboardRoutes);

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

        // Return the complete routing response
        res.status(200).json(response);

    } catch (error) {
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