import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("@/core/lib/prisma/client", () => {
  return {
    default: {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-0000-0000-000000000000",
          name: "Test",
          email: "test@example.com",
          role: "ADMIN",
          isActive: true,
        }),
      },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    },
  };
});

import { app } from "@/app";

describe("health e2e", () => {
  beforeAll(async () => {
    // fastify instance is created in app.ts, no listen needed for inject
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health should return 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toEqual({ status: true, message: "Server is running" });
  });
});
