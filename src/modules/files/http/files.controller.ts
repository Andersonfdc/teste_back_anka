import { FastifyRequest, FastifyReply } from "fastify";
import z from "zod/v4";
import filesSchemas from "./files.schemas";
import { HandleAppContollerError } from "@/core/decorators/controller-error-handler";
import { makeUploadMultipartFileToS3 } from "../services/factories/make-upload-multipart-file-to-s3";

type SubmitDocRequestFormRequest = FastifyRequest<{
  Body: z.infer<typeof filesSchemas.submitDocRequestForm.body>;
}>;

export default class FilesController {
  @HandleAppContollerError()
  public static async submitDocRequestForm(
    request: SubmitDocRequestFormRequest,
    reply: FastifyReply,
  ) {
    try {
      const useCase = await makeUploadMultipartFileToS3();
      await useCase.execute({ request });
      return reply.status(200).send({ success: true });
    } catch (error) {
      throw error;
    }
  }
}
