import { isValid, parse } from "date-fns";

/** Máximo de funcionários por requisição de importação em lote (T09). */
export const MAX_BULK_ITEMS = 500;

/** Tamanho máximo de texto livre (as colunas são `VARCHAR(255)`). */
export const MAX_TEXT_LENGTH = 255;

/** Item de importação como chega do cliente (qualquer campo pode vir ausente ou com tipo errado). */
export interface RawEmployeeItem {
  registration?: unknown;
  fullName?: unknown;
  admissionDate?: unknown;
  position?: unknown;
  birthDate?: unknown;
  cpf?: unknown;
}

/** Item que passou na validação de formato (ainda não conferido contra o banco). */
export interface ValidEmployeeItem {
  /** Posição do item na lista enviada, começando em 1. */
  line: number;
  registration: string;
  fullName: string;
  firstName: string;
  lastName: string;
  admissionDate: Date;
  birthDate: Date;
  position: string;
  /** Cargo normalizado (sem acento, maiúsculo, espaços únicos) para comparação exata. */
  positionKey: string;
  /** CPF só com dígitos, já validado; ausente se não informado. */
  cpf?: string;
}

/** Erro de um item. Nunca carrega nome completo nem CPF. */
export interface ItemFailure {
  line: number;
  registration?: string;
  field: string;
  error: string;
  /** `CONFLICT` quando o registro já existe inativo (ADR-010). */
  code?: "INVALID" | "CONFLICT";
}

/**
 * Normaliza texto para comparação exata: remove acentos, põe em maiúsculas e reduz espaços.
 * @param text Texto original.
 */
export const normalizeText = (text: string): string =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toUpperCase();

/**
 * Remove tudo que não é dígito do CPF.
 * @param raw Valor informado (com pontos e traço ou só números).
 */
export const cleanCpf = (raw: string): string => raw.replace(/\D/g, "");

/**
 * Valida um CPF (11 dígitos, não repetidos, dígitos verificadores corretos).
 * @param digits CPF só com dígitos.
 */
export const isValidCpf = (digits: string): boolean => {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const check = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
};

/**
 * Converte data no formato `dd/MM/aaaa`. Rejeita outros formatos, datas inexistentes
 * (ex.: 31/02) e anos fora de 1900 até o ano seguinte ao atual.
 * @param raw Valor recebido.
 * @returns A data, ou `null` se inválida.
 */
export const parseBrDate = (raw: unknown): Date | null => {
  if (typeof raw !== "string" || !/^\d{2}\/\d{2}\/\d{4}$/.test(raw.trim())) return null;
  const date = parse(raw.trim(), "dd/MM/yyyy", new Date(2000, 0, 1));
  if (!isValid(date)) return null;
  const year = date.getFullYear();
  return year >= 1900 && year <= new Date().getFullYear() + 1 ? date : null;
};

/**
 * Divide o nome completo em primeiro nome e sobrenome.
 * @param fullName Nome já sem espaços nas pontas.
 */
export const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

/**
 * Monta a matrícula como é gravada: sigla da empresa + número (as matrículas são sequenciais
 * por empresa; a sigla as torna únicas no banco, ex.: `PS8598`). Aceita só o número (`8598`,
 * texto ou inteiro) ou o número já com a sigla da própria empresa, sem diferenciar caixa, com ou
 * sem hífen entre os dois (`PS-8598`, formato que a tela atual do front envia). Grava sem hífen.
 * @param raw Matrícula recebida.
 * @param acronym Sigla da empresa da importação (`company.company_acronym`).
 * @returns A matrícula com a sigla em maiúsculas, ou `null` se o formato não bater.
 */
export const buildRegistration = (raw: unknown, acronym: string): string | null => {
  const prefix = acronym.trim().toUpperCase();
  const value = typeof raw === "number" && Number.isSafeInteger(raw) && raw >= 0
    ? String(raw)
    : typeof raw === "string" ? raw.replace(/\s+/g, "").toUpperCase() : "";
  const number = value.startsWith(prefix) ? value.slice(prefix.length).replace(/^-/, "") : value;
  return prefix && /^\d+$/.test(number) ? `${prefix}${number}` : null;
};

/**
 * Valida o formato de cada item da importação e detecta repetições dentro da própria lista
 * (matrícula e CPF). Não consulta o banco.
 * @param items Lista recebida no corpo da requisição.
 * @param companyAcronym Sigla da empresa da importação, usada para montar a matrícula.
 * @returns Itens válidos e as falhas (uma por problema, com linha e campo).
 */
export const validateEmployeeItems = (
  items: unknown[],
  companyAcronym: string
): { valid: ValidEmployeeItem[]; failed: ItemFailure[] } => {
  const valid: ValidEmployeeItem[] = [];
  const failed: ItemFailure[] = [];
  const seenRegistration = new Map<string, number>();
  const seenCpf = new Map<string, number>();

  items.forEach((raw, index) => {
    const line = index + 1;
    const item = (raw && typeof raw === "object" ? raw : {}) as RawEmployeeItem;
    const problems: Omit<ItemFailure, "line" | "registration" | "code">[] = [];

    const rawRegistration = typeof item.registration === "number" ? item.registration : text(item.registration);
    const registration = rawRegistration === null ? null : buildRegistration(rawRegistration, companyAcronym);
    if (rawRegistration === null) problems.push({ field: "registration", error: "Matrícula não informada." });
    else if (!registration) problems.push({
      field: "registration",
      error: `Matrícula inválida: informe o número ou a sigla da empresa (${companyAcronym.trim().toUpperCase()}) seguida do número.`,
    });
    else if (registration.length > MAX_TEXT_LENGTH) problems.push({ field: "registration", error: `Matrícula longa demais (máximo ${MAX_TEXT_LENGTH} caracteres).` });

    const fullName = text(item.fullName);
    if (!fullName) problems.push({ field: "fullName", error: "Nome completo não informado." });
    else if (fullName.length > MAX_TEXT_LENGTH) problems.push({ field: "fullName", error: `Nome longo demais (máximo ${MAX_TEXT_LENGTH} caracteres).` });
    else if (fullName.split(/\s+/).length < 2) problems.push({ field: "fullName", error: "Informe nome e sobrenome." });

    const position = text(item.position);
    if (!position) problems.push({ field: "position", error: "Cargo não informado." });
    else if (position.length > MAX_TEXT_LENGTH) problems.push({ field: "position", error: `Cargo longo demais (máximo ${MAX_TEXT_LENGTH} caracteres).` });

    const admissionDate = parseBrDate(item.admissionDate);
    if (!admissionDate) problems.push({ field: "admissionDate", error: "Data de admissão inválida; use dd/MM/aaaa." });

    const birthDate = parseBrDate(item.birthDate);
    if (!birthDate) problems.push({ field: "birthDate", error: "Data de nascimento inválida; use dd/MM/aaaa." });

    let cpf: string | undefined;
    const rawCpf = typeof item.cpf === "string" ? item.cpf.trim() : item.cpf;
    if (rawCpf !== undefined && rawCpf !== null && rawCpf !== "") {
      const digits = typeof rawCpf === "string" ? cleanCpf(rawCpf) : "";
      if (isValidCpf(digits)) cpf = digits;
      else problems.push({ field: "cpf", error: "CPF inválido." });
    }

    if (registration) {
      const first = seenRegistration.get(registration);
      if (first !== undefined) problems.push({ field: "registration", error: `Matrícula repetida no arquivo (primeira ocorrência na linha ${first}).` });
      else seenRegistration.set(registration, line);
    }
    if (cpf) {
      const first = seenCpf.get(cpf);
      if (first !== undefined) problems.push({ field: "cpf", error: `CPF repetido no arquivo (primeira ocorrência na linha ${first}).` });
      else seenCpf.set(cpf, line);
    }

    if (problems.length) {
      problems.forEach(p => failed.push({ line, registration: registration ?? undefined, code: "INVALID", ...p }));
      return;
    }

    const names = splitName(fullName as string);
    valid.push({
      line,
      registration: registration as string,
      fullName: fullName as string,
      ...names,
      admissionDate: admissionDate as Date,
      birthDate: birthDate as Date,
      position: position as string,
      positionKey: normalizeText(position as string),
      cpf,
    });
  });

  return { valid, failed };
};
