import { Request, Response } from "express";
import { MetricsManager } from "../metrics/MetricsManager";
import { HealthMonitor } from "../orchestrator/HealthMonitor";
import { ProviderType } from "../types/ProviderType";

export class ReadyController {

 static getReadiness(
 req: Request,
 res: Response
 ): void {
 const metrics = MetricsManager.getMetrics();

 // Provider health status
 const providers = Object.values(ProviderType);
 const providerStatus = providers.reduce(
 (acc, provider) => {
 acc[provider] = {
 healthy: HealthMonitor.isHealthy(provider),
 };
 return acc;
 },
 {} as Record<ProviderType, { healthy: boolean }>
 );

 // Determine overall status
 const allHealthy = Object.values(
 providerStatus
 ).every((status) => status.healthy);

 const response = {
 status: allHealthy ? "ok" : "degraded",
 providers: providerStatus,
 metrics: {
 uptime: process.uptime(),
 totalRequests: metrics.totalRequests,
 successfulRequests: metrics.successfulRequests,
 failedRequests: metrics.failedRequests,
 retryCount: metrics.retryCount,
 failoverCount: metrics.failoverCount,
 averageLatency: metrics.averageLatency,
 },
 };

 res.json(response);
 }

 static getLiveness(
 req: Request,
 res: Response
 ): void {
 // Kubernetes-style liveness: always 200 if running
 res.json({ status: "alive" });
 }

}