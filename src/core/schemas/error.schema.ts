import { z } from "zod/v4";

export const errorModel = z.object({
  status: z.boolean().describe("Status da resposta (false para erro)."),
  message: z.string().describe("Mensagem descritiva do erro."),
  code: z
    .string()
    .optional()
    .describe("Código específico do erro para identificação no frontend."),
  details: z.string().optional().describe("Detalhes adicionais do erro."),
});
