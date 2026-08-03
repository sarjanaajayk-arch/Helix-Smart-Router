import { User } from "../models/User";

export interface UserRepository {
    /**
     * Create a new user.
     */
    create(user: User): Promise<User>;

    /**
     * Find a user by ID.
     */
    findById(id: string): Promise<User | null>;

    /**
     * Find a user by email.
     */
    findByEmail(email: string): Promise<User | null>;

    /**
     * Update an existing user.
     */
    update(user: User): Promise<User>;

    /**
     * Delete a user.
     */
    delete(id: string): Promise<void>;

    /**
     * Check if an email already exists.
     */
    existsByEmail(email: string): Promise<boolean>;
}