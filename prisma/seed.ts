import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { createPasswordHash } from "@/core/utils/security";
import { env } from "@/env";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { DateTime } from "luxon";

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
const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "dev" ? ["warn", "error"] : ["error"],
});

async function main() {
  console.log("🌱 Starting seed process...");

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "murilo@ankatech.com.br" },
  });

  if (existingAdmin) {
    console.log("⚠️  Admin user already exists, skipping creation...");
    return;
  }

  // Create password hash for the admin user
  const passwordHash = await createPasswordHash("password");

  // Create the admin user
  const adminUser = await prisma.user.create({
    data: {
      name: "Murilo Viana",
      email: "murilo@ankatech.com.br",
      role: UserRole.ADMIN,
      passwordHash,
      isActive: true,
      emailVerifiedAt: DateTime.utc().toJSDate(), // Mark email as verified for admin user
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log(`📧 Email: ${adminUser.email}`);
  console.log(`👤 Name: ${adminUser.name}`);
  console.log(`🔑 Role: ${adminUser.role}`);
  console.log(`🆔 ID: ${adminUser.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed process failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
  });
