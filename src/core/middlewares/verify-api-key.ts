import { env } from "@/env";
import { FastifyRequest, FastifyReply } from "fastify";

export async function verifyApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const apiKey = request.headers["x-api-key"];
  if (apiKey !== env.API_KEY) {
    reply.status(401).send({ status: false, message: "API key inválida" });
    return;
  }
}
