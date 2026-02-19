import "@fastify/jwt";
import { UserRole } from "@prisma/client";

declare module "@fastify/jwt" {
  export interface FastifyJWT {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      isActive: boolean;
      exp: number;
      iat: number;
    };
  }
}
