import { Request, Response } from "express";
import { MetricsManager } from "../metrics/MetricsManager";

export class MetricsController {

    static getMetrics(
        req: Request,
        res: Response
    ): void {

        res.json(
            MetricsManager.getMetrics()
        );

    }

}