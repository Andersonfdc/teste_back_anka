import TokenProvider from "@/core/providers/token/token-provider";
import { IUserRepository } from "@/modules/user/repositories/IUserRepository";
import {
  InvalidRefreshTokenError,
  UserInactiveOrNotFoundError,
} from "../../errors";

export interface RefreshTokenRequest {
  token: string;
  userId: string;
}

export class RefreshTokenUseCase {
  constructor(private usersRepository: IUserRepository) {}

  async execute({
    token,
    userId,
  }: RefreshTokenRequest): Promise<{ token: string }> {
    const decoded = TokenProvider.verifyToken(token);

    if (
      !decoded ||
      typeof decoded === "string" ||
      (decoded as any).id !== userId
    ) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.usersRepository.findById(userId);
    if (!user || user.isActive === false) {
      throw new UserInactiveOrNotFoundError();
    }

    const { token: accessToken } = TokenProvider.generateToken(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      true,
    );

    return { token: accessToken };
  }
}
