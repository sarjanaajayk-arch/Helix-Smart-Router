import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";

const router = Router();

router.get(
    "/",
    DashboardController.getDashboard
);

router.get(
    "/providers",
    DashboardController.getProviders
);

router.get(
    "/models",
    DashboardController.getModels
);

router.get(
    "/health",
    DashboardController.getHealth
);

router.get(
    "/statistics",
    DashboardController.getStatistics
);

export default router;