export class AppError {
  public readonly message: string;
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: string;

  constructor(
    message: string,
    statusCode = 400,
    code?: string,
    details?: string,
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
