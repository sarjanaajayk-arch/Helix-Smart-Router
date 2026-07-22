import { Router, Request, Response } from "express";
import { usageMeter, UsageQueryOptions } from "../services/UsageMeter";
import { helixLogger } from "../config/logger";

export const usageRouter = Router();

/**
 * GET /v1/usage
 * Get usage records with optional filtering
 */
usageRouter.get("/", async (req: Request, res: Response) => {
    try {
        const options: UsageQueryOptions = {
            apiKeyId: req.query.apiKeyId as string,
            provider: req.query.provider as string,
            model: req.query.model as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const records = usageMeter.getUsage(options);
        res.json({ records, count: records.length });
    } catch (error) {
        helixLogger.error("Failed to get usage records", error);
        res.status(500).json({ error: "Failed to retrieve usage records" });
    }
});

/**
 * GET /v1/usage/summary
 * Get usage summary (overall or for specific API key)
 */
usageRouter.get("/summary", async (req: Request, res: Response) => {
    try {
        const apiKeyId = req.query.apiKeyId as string | undefined;
        const summary = usageMeter.getSummary(apiKeyId);
        res.json(summary);
    } catch (error) {
        helixLogger.error("Failed to get usage summary", error);
        res.status(500).json({ error: "Failed to retrieve usage summary" });
    }
});

/**
 * GET /v1/usage/apikey/:id
 * Get usage records for a specific API key
 */
usageRouter.get("/apikey/:id", async (req: Request, res: Response) => {
    try {
        const apiKeyId = req.params.id;
        const options: UsageQueryOptions = {
            apiKeyId,
            provider: req.query.provider as string,
            model: req.query.model as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const records = usageMeter.getUsageByApiKey(apiKeyId, options);
        res.json({ records, count: records.length });
    } catch (error) {
        helixLogger.error("Failed to get usage for API key", error);
        res.status(500).json({ error: "Failed to retrieve usage for API key" });
    }
});
