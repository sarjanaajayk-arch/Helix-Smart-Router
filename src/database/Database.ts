import "dotenv/config";
import { Pool } from "pg";

export const database = new Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "helix",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD,
});

database.on("connect", () => {
    console.log("✅ PostgreSQL connected");
});

database.on("error", (error) => {
    console.error("❌ PostgreSQL error:", error);
});