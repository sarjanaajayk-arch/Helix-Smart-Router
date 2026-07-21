import { Router } from "express";
import { ReadyController } from "../controllers/ReadyController";

const router = Router();

router.get("/", ReadyController.getReadiness);

// Add a GET /ready/liveness alias for Kubernetes or other orchestrators
router.get("/liveness", ReadyController.getLiveness);

export default router;