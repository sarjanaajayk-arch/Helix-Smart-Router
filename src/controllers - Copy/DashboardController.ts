import { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService";

export class DashboardController {
    static getDashboard(_: Request, res: Response): void {
        const dashboard = DashboardService.getDashboard();
        res.status(200).json(dashboard);
    }

    static getProviders(_: Request, res: Response): void {
        const dashboard = DashboardService.getDashboard();
        res.status(200).json({
            providers: dashboard.providers,
        });
    }

    static getModels(_: Request, res: Response): void {
        res.status(200).json({
            models: DashboardService.getModels(),
        });
    }

    static getStatistics(_: Request, res: Response): void {
        const dashboard = DashboardService.getDashboard();
        res.status(200).json({
            summary: dashboard.summary,
            metrics: dashboard.metrics,
        });
    }

    static getHealth(_: Request, res: Response): void {
        const health = DashboardService.getHealth();
        res.status(200).json(health);
    }
}