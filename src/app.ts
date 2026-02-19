import fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import { appErrorHandler } from "@/core/utils/app-error-handler";
import { swaggerPlugin } from "@/plugins/swagger";
import AuthRoutes from "@/modules/auth/http/auth.routes";
import UserRoutes from "@/modules/user/http/user.routes";
import FilesRoutes from "@/modules/files/http/files.routes";
import fastifyJwt from "@fastify/jwt";
import { env } from "@/env";

export const app: FastifyInstance = fastify({ logger: true });
const appPrefix = "/api/v1";

// App hooks
app
  .addHook("onReady", async () => {
    console.log("Server is ready to accept requests.");
  })
  .addHook("onClose", async (_) => {
    console.log("Server is shutting down.");
  });

// Global error handler
app.setErrorHandler(appErrorHandler);

// CORS plugin
app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
});

// Swagger plugin
app.register(swaggerPlugin);

// JWT plugin
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: { algorithm: "HS256" },
});

// Health endpoint for AWS ELB
app.register(async (app) => {
  app.get(`${appPrefix}/health`, async (_, res) => {
    res.send({ status: true, message: "Server is running" }).status(200);
  });
});

// App routes
app.register(AuthRoutes, { prefix: `${appPrefix}/auth` });
app.register(UserRoutes, { prefix: `${appPrefix}/users` });
app.register(FilesRoutes, { prefix: `${appPrefix}/files` });
