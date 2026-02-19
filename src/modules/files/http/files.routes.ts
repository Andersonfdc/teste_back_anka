import { FastifyInstance } from "fastify";
import fastifyMultipart from "@fastify/multipart";
import { verifyApiKey } from "@/core/middlewares/verify-api-key";
import filesSchemas from "./files.schemas";
import FilesController from "./files.controller";
import { verifyToken } from "@/core/middlewares/verify-token";

export default async function DocRequestFormPublicRoutes(app: FastifyInstance) {
  app.addHook("preValidation", verifyToken);
  app.addHook("preHandler", verifyApiKey);

  // Register multipart plugin specifically for the submit form route
  await app.register(async (app) => {
    await app.register(fastifyMultipart, {
      attachFieldsToBody: false,
      limits: {
        // Align with frontend: up to 50MB per file, up to 100 files, sane part/field limits
        fileSize: 50 * 1024 * 1024,
        files: 100,
        parts: 500,
        fields: 50,
        fieldSize: 1 * 1024 * 1024,
      },
    });

    app.post(
      "/forms/:formId/submit",
      {
        schema: filesSchemas.submitDocRequestForm,
        // Set body limit to accommodate large multipart uploads
        bodyLimit: 500 * 1024 * 1024, // 500MB total body limit
      },
      FilesController.submitDocRequestForm,
    );
  });
}
