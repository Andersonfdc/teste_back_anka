import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from "fastify-type-provider-zod";
// import { z } from 'zod/v4';

export const swaggerPlugin = fp(async (fastify: FastifyInstance) => {
  // Registrar Zod provider
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.withTypeProvider<ZodTypeProvider>();

  // Convert Zod component schemas to JSON Schema so Swagger UI can render properties
  // const componentSchemasJson = Object.entries(components.schemas).reduce(
  //   (acc, [key, schema]) => ({
  //     ...acc,
  //     [key]: z.toJSONSchema(schema, { unrepresentable: "any" }),
  //   }),
  //   {} as Record<string, any>
  // );

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Anka Template API",
        version: "1.0.0",
      },
      // components: {
      //   schemas: componentSchemasJson,
      // },
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
  });

  fastify.ready(() => {
    fastify.log.info("Swagger docs disponível em /docs");
  });
});
