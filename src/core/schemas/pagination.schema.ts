import { z } from "zod/v4";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).default(10),
  total: z.number().default(0),
  totalPages: z.number().default(0),
});
