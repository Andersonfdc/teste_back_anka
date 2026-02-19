import { z } from "zod/v4";

export const fileUploadModel = z.object({
  name: z.string(),
  description: z.string().optional(),
  file: z
    .any() // Represents the uploaded file
    .refine((file) => file !== undefined, "File is required.")
    .refine((file) => {
      const allowedExtensions = [
        "pdf",
        "png",
        "jpg",
        "jpeg",
        "xlsx",
        "xls",
        "csv",
      ];
      const fileExtension = file.name.split(".").pop();
      return allowedExtensions.includes(fileExtension);
    }, "Only pdf, png, jpg, jpeg, xlsx, xls and csv files are allowed.")
    .refine((file) => file.size < 50_000_000, "Max file size is 50MB."),
});
