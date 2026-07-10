import { Router } from "express";
import { StreamingController } from "../controllers/StreamingController";

const router = Router();

router.get(
    "/stream",
    StreamingController.stream
);

export default router;