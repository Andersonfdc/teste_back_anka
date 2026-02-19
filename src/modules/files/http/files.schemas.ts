import { z } from "zod/v4";
import { errorModel } from "@/core/schemas/error.schema";

export const docRequestFormSchemas = {
  submitDocRequestForm: {
    summary: "Submeter formulário público de solicitação de documentos",
    description: "Recebe arquivos multipart.",
    tags: ["Documento"],
    // Multipart form-data with dynamic keys like files[<id>] and deleteFileIds[]
    // We parse and validate parts in the controller to keep memory usage low
    body: z.looseObject({}),
    response: {
      200: z.object({ success: z.literal(true) }),
      400: errorModel,
      401: errorModel,
      404: errorModel,
      500: errorModel,
    },
  },
};

export default docRequestFormSchemas;
