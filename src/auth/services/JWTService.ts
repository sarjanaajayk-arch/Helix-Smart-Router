import jwt from "jsonwebtoken";

export interface JwtPayload {
    userId: string;
    email: string;
}

export class JWTService {
    /**
     * TODO:
     * Move these to env.ts later.
     */
    private static readonly ACCESS_TOKEN_SECRET =
        process.env.JWT_ACCESS_SECRET || "helix-access-secret";

    private static readonly REFRESH_TOKEN_SECRET =
        process.env.JWT_REFRESH_SECRET || "helix-refresh-secret";

    private static readonly ACCESS_TOKEN_EXPIRES_IN = "15m";

    private static readonly REFRESH_TOKEN_EXPIRES_IN = "7d";

    /**
     * Generate an access token.
     */
    static generateAccessToken(payload: JwtPayload): string {
        return jwt.sign(
            payload,
            this.ACCESS_TOKEN_SECRET,
            {
                expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
            }
        );
    }

    /**
     * Generate a refresh token.
     */
    static generateRefreshToken(payload: JwtPayload): string {
        return jwt.sign(
            payload,
            this.REFRESH_TOKEN_SECRET,
            {
                expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
            }
        );
    }

    /**
     * Verify an access token.
     */
    static verifyAccessToken(token: string): JwtPayload {
        return jwt.verify(
            token,
            this.ACCESS_TOKEN_SECRET
        ) as JwtPayload;
    }

    /**
     * Verify a refresh token.
     */
    static verifyRefreshToken(token: string): JwtPayload {
        return jwt.verify(
            token,
            this.REFRESH_TOKEN_SECRET
        ) as JwtPayload;
    }
}