export interface User {
    /**
     * Unique identifier (UUID)
     */
    id: string;

    /**
     * User email address
     */
    email: string;

    /**
     * Bcrypt password hash
     */
    passwordHash: string;

    /**
     * Display name
     */
    fullName: string;

    /**
     * Account creation timestamp
     */
    createdAt: Date;

    /**
     * Last update timestamp
     */
    updatedAt: Date;

    /**
     * Whether the account is active
     */
    isActive: boolean;

    /**
     * Whether the user's email has been verified
     */
    emailVerified: boolean;
}