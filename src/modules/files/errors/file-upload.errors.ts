import { AppError } from "@/core/errors/app-error";

export class FileUploadError extends AppError {
  constructor(
    message: string,
    statusCode = 400,
    code?: string,
    details?: string,
  ) {
    super(message, statusCode, code, details);
  }
}

export class UnsupportedFileTypeError extends FileUploadError {
  constructor(fileExtension: string) {
    super(
      `Tipo de arquivo não suportado: .${fileExtension}`,
      400,
      "UNSUPPORTED_FILE_TYPE",
    );
  }
}

export class FileTooLargeError extends FileUploadError {
  constructor(fileSize: number) {
    super(
      `Arquivo excede o limite permitido: ${fileSize} bytes`,
      413,
      "FILE_TOO_LARGE",
    );
  }
}

export class MultipartRequiredError extends FileUploadError {
  constructor() {
    super("Apenas uploads multipart são suportados", 400, "MULTIPART_REQUIRED");
  }
}
