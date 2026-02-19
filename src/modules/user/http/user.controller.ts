import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod/v4";
import type { userSchemas } from "./user.schemas";
import makeCreateUser from "../services/factories/make-create-user";
import makeChangeUserRole from "../services/factories/make-change-user-role";
import makeFetchUsers from "../services/factories/make-fetch-users";
import makeToggleUserStatus from "../services/factories/make-toggle-user-status";
import makeEditUser from "../services/factories/make-edit-user";
import { HandleAppContollerError } from "@/core/decorators/controller-error-handler";

type CreateUserRequest = FastifyRequest<{
  Body: z.infer<typeof userSchemas.createUser.body>;
}>;

type ChangeUserRoleRequest = FastifyRequest<{
  Params: z.infer<typeof userSchemas.changeUserRole.params>;
  Body: z.infer<typeof userSchemas.changeUserRole.body>;
}>;

type FetchUsersRequest = FastifyRequest<{
  Querystring: z.infer<
    typeof userSchemas.fetchAllUsersByPagination.querystring
  >;
}>;

type ToggleUserStatusRequest = FastifyRequest<{
  Params: z.infer<typeof userSchemas.toggleUserStatus.params>;
}>;

type EditUserRequest = FastifyRequest<{
  Params: z.infer<typeof userSchemas.editUser.params>;
  Body: z.infer<typeof userSchemas.editUser.body>;
}>;

export default class UserController {
  @HandleAppContollerError()
  public static async fetchUsers(
    request: FetchUsersRequest,
    res: FastifyReply,
  ) {
    const { page, limit } = request.query;
    const fetchUsersUseCase = await makeFetchUsers();
    const result = await fetchUsersUseCase.execute({ page, limit });

    return res.status(200).send({
      status: true,
      message: "Todos os usuários foram listados com sucesso",
      data: result.data,
    });
  }
  @HandleAppContollerError()
  public static async createUser(
    request: CreateUserRequest,
    res: FastifyReply,
  ) {
    const createUserUseCase = await makeCreateUser();
    const createdUser = await createUserUseCase.execute({
      ...request.body,
    });

    return res.status(201).send({
      status: true,
      message: "Usuário criado com sucesso",
      data: createdUser,
    });
  }

  @HandleAppContollerError()
  public static async changeUserRole(
    request: ChangeUserRoleRequest,
    res: FastifyReply,
  ) {
    const { user } = request;
    const { id } = request.params;

    const changeUserRoleUseCase = await makeChangeUserRole();
    await changeUserRoleUseCase.execute({
      userId: user.id,
      targetUserId: id,
      newRole: request.body.newRole,
    });

    return res.status(200).send({
      status: true,
      message: "Função do usuário alterada com sucesso",
    });
  }

  @HandleAppContollerError()
  public static async toggleUserStatus(
    request: ToggleUserStatusRequest,
    res: FastifyReply,
  ) {
    const { user } = request;
    const { id: userId } = request.params;

    const toggleUserStatusUseCase = await makeToggleUserStatus();
    await toggleUserStatusUseCase.execute({
      currentUserRole: user.role,
      targetUserId: userId,
    });

    return res.status(200).send({
      status: true,
      message: "Status do usuário alterado com sucesso",
    });
  }

  @HandleAppContollerError()
  public static async editUser(request: EditUserRequest, res: FastifyReply) {
    const { user } = request;

    const editUserUseCase = await makeEditUser();
    const updatedUser = await editUserUseCase.execute({
      targetUserId: request.params.id,
      currentUserId: user.id,
      name: request.body.name,
      email: request.body.email,
      role: request.body.role,
      toggleStatus: request.body.toggleStatus ?? false,
      passwordConfig: request.body.passwordConfig,
    });

    return res.status(200).send({
      status: true,
      message: "Usuário editado com sucesso",
      data: updatedUser,
    });
  }
}

export type {
  CreateUserRequest,
  ChangeUserRoleRequest,
  FetchUsersRequest,
  ToggleUserStatusRequest,
  EditUserRequest,
};
