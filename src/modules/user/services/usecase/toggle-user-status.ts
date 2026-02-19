import { UserRole } from "@prisma/client";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { UserNotFoundError, UserRoleChangeError } from "@/modules/auth/errors";

export type ToggleUserStatusInput = {
  currentUserRole: UserRole;
  targetUserId: string;
};

export default class ToggleUserStatus {
  constructor(private userRepository: IUserRepository) {}
  async execute({ currentUserRole, targetUserId }: ToggleUserStatusInput) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new UserRoleChangeError();
    }
    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new UserNotFoundError();
    }

    return await this.userRepository.toggleActiveById(targetUserId);
  }
}
