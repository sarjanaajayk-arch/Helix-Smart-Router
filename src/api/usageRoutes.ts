import { Router, Request, Response } from "express";
import { usageMeter, UsageQueryOptions } from "../services/UsageMeter";
import { helixLogger } from "../config/logger";

export const usageRouter = Router();

// Helper functions to safely extract query and route parameters
const getStringParam = (param: string | string[] | any | undefined): string | undefined => {
  if (Array.isArray(param)) {
    return param.length > 0 ? param[0] : undefined;
  }
  return typeof param === 'string' ? param : undefined;
};

const getNumberParam = (param: string | string[] | any | undefined, defaultValue: number): number => {
  if (!param) {
    return defaultValue;
  }
  const str = Array.isArray(param) ? param[0] : param;
  return typeof str === 'string' ? parseInt(str, 10) : defaultValue;
};

const getDateParam = (param: string | string[] | any | undefined): Date | undefined => {
  if (!param) {
    return undefined;
  }
  const str = Array.isArray(param) ? param[0] : param;
  return typeof str === 'string' ? new Date(str) : undefined;
};

/**
 * GET /v1/usage
 * Get usage records with optional filtering
 */
usageRouter.get("/", async (req: Request, res: Response) => {
  try {
    const options: UsageQueryOptions = {
      apiKeyId: getStringParam(req.query.apiKeyId),
      provider: getStringParam(req.query.provider),
      model: getStringParam(req.query.model),
      startDate: getDateParam(req.query.startDate),
      endDate: getDateParam(req.query.endDate),
      limit: getNumberParam(req.query.limit, 100),
      offset: getNumberParam(req.query.offset, 0)
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
    const apiKeyId = getStringParam(req.query.apiKeyId);
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
    const apiKeyId = getStringParam(req.params.id);
    if (!apiKeyId) {
      return res.status(400).json({ error: "API key ID is required" });
    }
    const options: UsageQueryOptions = {
      apiKeyId,
      provider: getStringParam(req.query.provider),
      model: getStringParam(req.query.model),
      startDate: getDateParam(req.query.startDate),
      endDate: getDateParam(req.query.endDate),
      limit: getNumberParam(req.query.limit, 100),
      offset: getNumberParam(req.query.offset, 0)
    };

    const records = usageMeter.getUsageByApiKey(apiKeyId, options);
    res.json({ records, count: records.length });
  } catch (error) {
    helixLogger.error("Failed to get usage for API key", error);
    res.status(500).json({ error: "Failed to retrieve usage for API key" });
  }
});