import { UserRole } from "@prisma/client";
import type { IUserRepository } from "../../repositories/IUserRepository";
import {
  SelfRoleChangeError,
  UserNotFoundError,
  UserRoleChangeError,
} from "@/modules/auth/errors";

export type ChangeUserRoleProps = {
  userId: string;
  targetUserId: string;
  newRole: UserRole;
};

export class ChangeUserRole {
  constructor(private userRepository: IUserRepository) {}

  public async execute(data: ChangeUserRoleProps) {
    const { userId, targetUserId, newRole } = data;

    if (userId === targetUserId) {
      throw new SelfRoleChangeError();
    }

    const requestingUser = await this.userRepository.findById(userId);
    if (!requestingUser) {
      throw new UserNotFoundError();
    }

    // Check if requesting user can update this specific user
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new UserRoleChangeError();
    }

    // First, fetch the target user to check permissions against
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundError();
    }

    // Check if role is actually changing
    if (targetUser.role === newRole) {
      return;
    }

    await this.userRepository.updateRoleById(targetUser.id, newRole);
  }
}
