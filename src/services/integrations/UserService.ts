import axios from "axios";
import axiosControl from "./axiosInstance";
import { controlRoutes } from "./endpoints";
import { logError } from "../../utils/logError";

/** Falha ao consultar o `control` (indisponível, erro ou resposta inesperada). */
export class ControlUnavailableError extends Error {}

/**
 * Informa se o funcionário possui usuário ativo no `control`.
 * Repassa o JWT do usuário que executa a operação (não há token de serviço até a T04).
 *
 * @param employeeId Funcionário consultado.
 * @param authorization Valor do header `Authorization` da requisição original.
 * @returns `true` se houver ao menos um usuário ativo vinculado.
 * @throws ControlUnavailableError se o `control` não responder 200/404.
 */
export const hasActiveUserForEmployee = async (employeeId: string, authorization: string): Promise<boolean> => {
  try {
    const response = await axiosControl.get(controlRoutes.usersByEmployee(employeeId), {
      headers: { Authorization: authorization },
    });
    return Array.isArray(response.data?.data) && response.data.data.length > 0;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return false;
    logError("Falha ao consultar usuários do funcionário no control", error);
    throw new ControlUnavailableError("Módulo de controle indisponível.");
  }
};
