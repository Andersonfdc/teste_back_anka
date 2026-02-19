// Authentication Errors
export {
  InvalidCredentialsError,
  DisabledAccountError,
  UserNotFoundError,
} from "./authentication-errors";

// Verification Code Errors
export {
  VerificationCodeNotFoundError,
  VerificationCodeExpiredError,
  VerificationCodeAlreadyUsedError,
  InvalidVerificationCodeError,
  TooManyAttemptsError,
  ResendCooldownError,
} from "./verification-code-errors";

// Password Reset Errors
export {
  PasswordResetTokenNotFoundError,
  PasswordResetTokenExpiredError,
  PasswordResetTokenAlreadyUsedError,
  InvalidPasswordResetTokenError,
  PasswordsDoNotMatchError,
} from "./password-reset-errors";

// Change User Role Errors
export {
  SelfRoleChangeError,
  UserRoleChangeError,
} from "./change-user-role.errors";

// Refresh Token Errors
export {
  InvalidRefreshTokenError,
  UserInactiveOrNotFoundError,
} from "./refresh-token-errors";
