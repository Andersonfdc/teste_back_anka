import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUser } from "@/modules/user/services/usecase/create-user";
import EditUser from "@/modules/user/services/usecase/edit-user";
import { ChangeUserRole } from "@/modules/user/services/usecase/change-user-role";
import FetchUsers from "@/modules/user/services/usecase/fetch-users";
import ToggleUserStatus from "@/modules/user/services/usecase/toggle-user-status";
import type { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import type { IPasswordResetTokenRepository } from "@/modules/auth/repositories/IPasswordResetTokenRepository";
import EmailService from "@/modules/auth/services/email-service";
import prisma from "@/core/lib/prisma/client";

describe("User usecases (unit)", () => {
  const repo = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateRoleById: vi.fn(),
    toggleActiveById: vi.fn(),
  } as unknown as IUserRepository;

  const tokenRepo = {
    create: vi.fn(),
  } as unknown as IPasswordResetTokenRepository;

  const email = { sendEmail: vi.fn() } as unknown as EmailService;

  beforeEach(() => vi.restoreAllMocks());

  it("create-user creates and optionally sends reset email", async () => {
    const uc = new CreateUser(repo, tokenRepo, email as any);
    (repo.findByEmail as any) = vi.fn().mockResolvedValue(null);
    (repo.create as any) = vi
      .fn()
      .mockResolvedValue({ id: "u1", name: "A", email: "a@b.com" });
    await uc.execute({
      name: "A",
      email: "a@b.com",
      role: "ADMIN",
      passwordConfig: { sendResetEmail: true } as any,
    });
    expect(repo.create).toHaveBeenCalled();
    expect((email as any).sendEmail).toHaveBeenCalled();
  });

  it("edit-user updates and may send reset email", async () => {
    const uc = new EditUser(repo, tokenRepo, email as any);
    (repo.findById as any) = vi
      .fn()
      .mockResolvedValue({
        id: "cur",
        role: "SUPERADMIN",
        name: "X",
        email: "x@b.com",
      });
    (repo.toggleActiveById as any) = vi.fn().mockResolvedValue({});
    vi.spyOn(prisma.user, "update").mockResolvedValue({
      id: "u2",
      name: "New",
      email: "x@b.com",
    } as any);
    await uc.execute({
      currentUserId: "cur",
      targetUserId: "u2",
      toggleStatus: true,
      name: "New",
      passwordConfig: { sendResetEmail: true } as any,
    });
    expect((email as any).sendEmail).toHaveBeenCalled();
  });

  it("change-user-role updates role when allowed", async () => {
    const uc = new ChangeUserRole(repo);
    (repo.findById as any) = vi
      .fn()
      .mockResolvedValueOnce({ id: "rq", role: "SUPERADMIN" })
      .mockResolvedValueOnce({ id: "tg", role: "MEMBER" });
    await uc.execute({
      userId: "rq",
      targetUserId: "tg",
      newRole: "ADMIN" as any,
    });
    expect(repo.updateRoleById).toHaveBeenCalled();
  });

  it("fetch-users returns pagination", async () => {
    const uc = new FetchUsers(repo);
    (repo.findAllWithPagination as any) = vi
      .fn()
      .mockResolvedValue({
        data: [],
        pagination: { total: 0, totalPages: 0, page: 0, limit: 10 },
      });
    const res = await uc.execute({ limit: 10, page: 0 });
    expect(res.pagination.limit).toBe(10);
  });

  it("toggle-user-status toggles when admin", async () => {
    const uc = new ToggleUserStatus(repo);
    (repo.findById as any) = vi.fn().mockResolvedValue({ id: "tg" });
    await uc.execute({ currentUserRole: "ADMIN" as any, targetUserId: "tg" });
    expect(repo.toggleActiveById).toHaveBeenCalled();
  });
});
