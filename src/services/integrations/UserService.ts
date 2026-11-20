import axiosControl from "./axiosInstance";
import { controlRoutes } from "./endpoints";
import { logError } from "../../utils/logError";

/** Falha ao chamar o `control` (indisponível, erro ou resposta inesperada). */
export class ControlUnavailableError extends Error {}

/**
 * Demissão (T20): pede ao `control` que desative os usuários dos funcionários e remova
 * `user_module`/`user_app_role`. Vai com o token de serviço (sem `Authorization` do usuário).
 *
 * @param employeeIds Funcionários desligados.
 * @param updatedBy Usuário que desligou (do token da requisição original).
 * @returns Ids dos usuários desativados.
 * @throws ControlUnavailableError se o `control` não responder 200.
 */
export const deactivateUsersByEmployee = async (employeeIds: string[], updatedBy: string): Promise<string[]> => {
  try {
    const response = await axiosControl.post(controlRoutes.deactivateByEmployee, { employeeIds, updatedBy });
    return response.data?.data?.deactivated ?? [];
  } catch (error: unknown) {
    logError("Falha ao desativar usuários dos funcionários no control", error);
    throw new ControlUnavailableError("Módulo de controle indisponível.");
  }
};
