import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/env";

// Singleton pattern to ensure only one PrismaClient instance is created
let prisma: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!prisma) {
    // Build connection URL with pool settings
    const connectionUrl = new URL(env.DATABASE_URL);
    connectionUrl.searchParams.set("connection_limit", env.DB_CONNECTION_LIMIT.toString());
    connectionUrl.searchParams.set("pool_timeout", env.DB_POOL_TIMEOUT.toString());

    // Create PostgreSQL connection pool
    const pool = new Pool({
      connectionString: connectionUrl.toString(),
      max: env.DB_CONNECTION_LIMIT,
      connectionTimeoutMillis: env.DB_POOL_TIMEOUT,
    });

    // Create Prisma adapter for PostgreSQL
    const adapter = new PrismaPg(pool);

    // Initialize Prisma Client with adapter
    prisma = new PrismaClient({
      adapter,
      log: env.NODE_ENV === "dev" ? ["warn", "error"] : ["error"],
    });

    // Connect to the database
    prisma.$connect().catch((err: Error) => {
      console.error("Failed to connect to database:", err);
      process.exit(1);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log("Closing database connection...");
      await prisma?.$disconnect();
      process.exit(0);
    };

    process.on("beforeExit", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  }

  return prisma;
};

export default getPrismaClient();
