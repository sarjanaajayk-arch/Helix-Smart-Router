import bcrypt from "bcrypt";

export class PasswordService {
    /**
     * Number of bcrypt salt rounds.
     * Increase with hardware improvements if needed.
     */
    private static readonly SALT_ROUNDS = 12;

    /**
     * Hash a plain text password.
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    /**
     * Verify a plain text password against a bcrypt hash.
     */
    static async verifyPassword(
        password: string,
        passwordHash: string
    ): Promise<boolean> {
        return bcrypt.compare(password, passwordHash);
    }
}