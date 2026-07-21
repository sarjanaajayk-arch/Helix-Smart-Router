import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import cors from "cors";
import { requestIdMiddleware } from "../../src/middlewares/requestIdMiddleware";
import { requestLoggingMiddleware } from "../../src/middlewares/requestLoggingMiddleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);

app.get("/health", (_, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? "development",
    });
});

describe("Health Endpoint", () => {
    it("should return 200 and health status", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("healthy");
        expect(res.body.uptime).toBeDefined();
        expect(res.body.timestamp).toBeDefined();
        expect(res.body.environment).toBeDefined();
    });
});