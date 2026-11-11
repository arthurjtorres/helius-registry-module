import axios from "axios";
import { attachServiceToken } from "./serviceToken";

/**
 * Cliente HTTP do módulo `control`.
 * `CONTROL_API_URL` permite apontar para outra instância (ex.: teste local); por padrão usa o container.
 */
const axiosControl = axios.create({
  baseURL: process.env.CONTROL_API_URL || `http://modulo-controle:${process.env.PORT_API_CONTROLE}`,
  timeout: 5000,
});

/** Sem `Authorization` do usuário no pedido, a chamada leva o token de serviço. */
attachServiceToken(axiosControl, "registry");

export default axiosControl;
