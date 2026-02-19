import { env } from "@/env";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { DateTime } from "luxon";
import { TokenModel } from "@/core/schemas/token.schema";

export default class TokenProvider {
  private static readonly JWT_SECRET: string = env.JWT_SECRET;
  private static readonly ALGORITHM: string = "HS256";
  private static readonly ACCESS_TOKEN_EXPIRES_MINUTES: number = 720; // 12h
  private static readonly DEV_ACCESS_TOKEN_EXPIRES_MINUTES: number = 600;
  private static readonly REMEMBER_ME_ACCESS_TOKEN_EXPIRES_DAYS: number = 30;
  private static readonly REFRESH_TOKEN_EXPIRES_DAYS: number = 30;

  public static getCurrentRefreshTokenExpirationTime(): number {
    return DateTime.now()
      .plus({ days: TokenProvider.REFRESH_TOKEN_EXPIRES_DAYS })
      .toMillis();
  }

  public static getCurrentAccessTokenExpirationTime(
    rememberMe: boolean,
  ): number {
    if (rememberMe) {
      return DateTime.now()
        .plus({ days: TokenProvider.REMEMBER_ME_ACCESS_TOKEN_EXPIRES_DAYS })
        .toMillis();
    }
    const minutes =
      env.NODE_ENV === "dev"
        ? TokenProvider.DEV_ACCESS_TOKEN_EXPIRES_MINUTES
        : TokenProvider.ACCESS_TOKEN_EXPIRES_MINUTES;

    return DateTime.now().plus({ minutes }).toMillis();
  }

  public static decryptDeviceId(encryptedDeviceId: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(
        encryptedDeviceId,
        TokenProvider.JWT_SECRET,
      );
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        console.error(
          "❌ ERRO: Falha na descriptografia! Verifique se a chave privada é correta.",
        );
        return null;
      }

      return { deviceId: decryptedText };
    } catch (error) {
      console.error("❌ Erro ao descriptografar o Device ID:", error);
      return null;
    }
  }

  public static decryptDate(encryptedDate: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(
        encryptedDate,
        TokenProvider.JWT_SECRET,
      );
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        console.error(
          "❌ ERRO: Falha na descriptografia! Verifique se a chave privada é correta.",
        );
        return null;
      }

      return decryptedText;
    } catch (error) {
      console.error("❌ Erro ao descriptografar a data:", error);
      return null;
    }
  }

  static generateToken(
    user: Omit<TokenModel, "exp" | "iat">,
    rememberMe: boolean,
  ): { token: string; expiresAt: number; iat: number } {
    const expiration =
      TokenProvider.getCurrentAccessTokenExpirationTime(rememberMe);

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      exp: Math.floor(expiration / 1000),
      iat: Math.floor(DateTime.now().toMillis() / 1000),
    } as TokenModel;

    return {
      token: jwt.sign(payload, TokenProvider.JWT_SECRET, {
        algorithm: TokenProvider.ALGORITHM as jwt.Algorithm,
      }),
      expiresAt: expiration,
      iat: Math.floor(DateTime.now().toMillis() / 1000),
    };
  }

  static generateRefreshToken(userId: string): {
    token: string;
    expiresAt: number;
    iat: number;
  } {
    const expiration = TokenProvider.getCurrentRefreshTokenExpirationTime();
    const payload = {
      id: userId,
      exp: Math.floor(expiration / 1000),
      iat: Math.floor(DateTime.now().toMillis() / 1000),
    };

    return {
      token: jwt.sign(payload, TokenProvider.JWT_SECRET, {
        algorithm: TokenProvider.ALGORITHM as jwt.Algorithm,
      }),
      expiresAt: expiration,
      iat: Math.floor(DateTime.now().toMillis() / 1000),
    };
  }

  public static verifyToken(token: string): string | jwt.JwtPayload | null {
    try {
      return jwt.verify(token, TokenProvider.JWT_SECRET, {
        algorithms: [TokenProvider.ALGORITHM as jwt.Algorithm],
      });
    } catch (err) {
      return null;
    }
  }
}
