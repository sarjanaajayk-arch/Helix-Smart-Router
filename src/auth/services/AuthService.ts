import { v4 as uuidv4 } from "uuid";

import { User } from "../models/User";
import { UserRepository } from "../repositories/UserRepository";
import { PasswordService } from "./PasswordService";
import { JWTService } from "./JWTService";

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository
    ) {}

    /**
     * Register a new user.
     */
    async register(
        email: string,
        password: string,
        fullName: string
    ) {
        // Check if email already exists
        const existingUser =
            await this.userRepository.findByEmail(email);

        if (existingUser) {
            throw new Error("Email already exists.");
        }

        // Hash password
        const passwordHash =
            await PasswordService.hashPassword(password);

        // Create user
        const user: User = {
            id: uuidv4(),
            email,
            passwordHash,
            fullName,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            emailVerified: false,
        };

        // Save user
        const savedUser =
            await this.userRepository.create(user);

        // Generate tokens
        const accessToken =
            JWTService.generateAccessToken({
                userId: savedUser.id,
                email: savedUser.email,
            });

        const refreshToken =
            JWTService.generateRefreshToken({
                userId: savedUser.id,
                email: savedUser.email,
            });

        return {
            user: {
                id: savedUser.id,
                email: savedUser.email,
                fullName: savedUser.fullName,
                emailVerified: savedUser.emailVerified,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Login an existing user.
     */
    async login(
        email: string,
        password: string
    ) {
        const user =
            await this.userRepository.findByEmail(email);

        if (!user) {
            throw new Error("Invalid email or password.");
        }

        const validPassword =
            await PasswordService.verifyPassword(
                password,
                user.passwordHash
            );

        if (!validPassword) {
            throw new Error("Invalid email or password.");
        }

        const accessToken =
            JWTService.generateAccessToken({
                userId: user.id,
                email: user.email,
            });

        const refreshToken =
            JWTService.generateRefreshToken({
                userId: user.id,
                email: user.email,
            });

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                emailVerified: user.emailVerified,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Get current authenticated user.
     */
    async getCurrentUser(userId: string) {
        const user =
            await this.userRepository.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
        };
    }
}