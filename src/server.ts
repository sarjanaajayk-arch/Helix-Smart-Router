import express from "express";
import cors from "cors";
import { database } from "./database/Database";
import authRoutes from "./auth/routes/AuthRoutes";
import { env } from "./config/env";
import { helixLogger } from "./config/logger";
import organizationRoutes from "./organizations/routes/OrganizationRoutes";
import {
    providerManager,
    smartRouter,
} from "./container/AppContainer";
import { TaskType } from "./types/TaskType";
import { PROVIDERS } from "./orchestrator/ProviderRegistry";
import { HealthMonitor } from "./orchestrator/HealthMonitor";

import metricsRoutes from "./routes/metricsRoutes";
import streamRoutes from "./routes/streamRoutes";
import openaiRoutes from "./routes/openai";
import dashboardRoutes from "./routes/dashboardRoutes";
import readyRoutes from "./routes/readyRoutes";
import { createProviderCredentialsRoutes } from "./byok/routes/providerCredentialsRoutes";
import { byokContainer } from "./integrations/byok/ByokContainer";

import { ProviderCredentialsController } from "./byok/controllers/ProviderCredentialsController";
import { requestIdMiddleware } from "./middlewares/requestIdMiddleware";
import { requestLoggingMiddleware } from "./middlewares/requestLoggingMiddleware";
import { authMiddleware, configureAuth } from "./middlewares/authMiddleware";
import {
    rateLimitMiddleware,
    configureRateLimit,
} from "./middlewares/rateLimitMiddleware";


const app = express();
app.use((req, _res, next) => {
    
    next();
});
/* --------------------------------- */
/* Core Services */
/* --------------------------------- */


/* --------------------------------- */
/* BYOK Services */
/* --------------------------------- */

const providerCredentialsController =
    new ProviderCredentialsController(
        byokContainer.credentialsService
    );

const providerCredentialsRoutes =
    createProviderCredentialsRoutes(
        providerCredentialsController
    );

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
    apiKeys:
        process.env.API_KEYS
            ?.split(",")
            .map((key) => key.trim()) ?? [],
});

/* --------------------------------- */
/* Middleware */
/* --------------------------------- */

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/organizations", organizationRoutes);


console.log("✅ Organizations route mounted");

app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);

/* --------------------------------- */
/* Rate Limiting */
/* --------------------------------- */

configureRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

app.use(rateLimitMiddleware);

/* --------------------------------- */
/* Authentication */
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


app.use("/byok", providerCredentialsRoutes);


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
/* AI Test (Development Only) */
/* --------------------------------- */

if (env.NODE_ENV !== "production") {
    app.get("/api/test", async (_, res) => {
        try {
            const response = await smartRouter.route({
                prompt: `Write a production-ready TypeScript implementation of an LRU Cache.
Explain the algorithm, time complexity, and include unit tests.`,
                taskType: TaskType.CHAT,
            });

            res.status(200).json(response);
        } catch (error) {
            helixLogger.error("Failed to process AI test request", error);

            res.status(500).json({
                error: "Failed to process AI request.",
            });
        }
    });
}
/* --------------------------------- */
/* Start Server */
/* --------------------------------- */

let server: ReturnType<typeof app.listen>;

async function startServer(): Promise<void> {
    try {
        await database.query("SELECT NOW()");
        helixLogger.info("✅ PostgreSQL connection verified");

        server = app.listen(env.PORT, () => {
            helixLogger.info(
                `🚀 Helix Server running on http://localhost:${env.PORT}`
            );
        });

        

        server.on("close", () => {
            console.log("❌ SERVER CLOSED");
        });

    } catch (error) {
        console.error("❌ Failed to connect to PostgreSQL");
        console.error(error);
        process.exit(1);
    }
}





startServer();
