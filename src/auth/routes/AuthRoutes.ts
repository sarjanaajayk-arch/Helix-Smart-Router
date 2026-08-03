import { Router } from "express";
import { jwtAuthMiddleware } from "../middleware/AuthMiddleware";
import { AuthController } from "../controllers/AuthController";
import { AuthService } from "../services/AuthService";
import { PostgreSQLUserRepository } from "../repositories/PostgreSQLUserRepository";


import { database } from "../../database/Database";
console.log("🚀 AUTH ROUTES LOADED");
const router = Router();

const userRepository = new PostgreSQLUserRepository(database);
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// Public Routes
router.post(
    "/register",
    authController.register
);

router.post(
    "/login",
    authController.login
);

// Protected Route
router.get(
    "/me",
    jwtAuthMiddleware,
    authController.me
);

export default router;