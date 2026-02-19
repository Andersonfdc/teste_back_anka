import { ZodError } from "zod/v4";

// Helper function to format Zod errors
export function formatZodError(
  zodError: ZodError,
): { field: string; message: string }[] {
  return zodError.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

// Helper function to extract Zod error from fastify-type-provider-zod error
export function extractZodError(error: any): ZodError | null {
  // Check if the error is already a ZodError
  if (error instanceof ZodError) {
    return error;
  }

  // Check if this is a ResponseSerializationError from fastify-type-provider-zod
  if (
    error.name === "ResponseSerializationError" ||
    error.name === "FastifyError" ||
    error.message.includes("Response doesn't match the schema")
  ) {
    // The ZodError is often in the cause property with name '$ZodError'
    if (error.cause && error.cause.name === "$ZodError") {
      // The issues are JSON-stringified in the message
      try {
        const issues = JSON.parse(error.cause.message);
        if (Array.isArray(issues)) {
          return new ZodError(issues);
        }
      } catch (e) {
        // If parsing fails, try to return the cause directly if it's a ZodError
        if (error.cause instanceof ZodError) {
          return error.cause;
        }
      }
    }

    // Try multiple common locations where the Zod error might be stored
    const possibleLocations = [
      error.cause,
      error.validation,
      error.validationError,
      error.validationContext?.error,
      error.serialization?.error,
      error.zodError,
    ];

    for (const location of possibleLocations) {
      if (location && location instanceof ZodError) {
        return location;
      }
    }

    // Sometimes the error details are stored as plain objects that need to be reconstructed
    if (error.issues && Array.isArray(error.issues)) {
      try {
        // Create a new ZodError with the issues
        return new ZodError(error.issues);
      } catch (e) {
        // If reconstruction fails, continue
      }
    }
  }

  return null;
}
