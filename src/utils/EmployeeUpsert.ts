import { format } from "date-fns";
import { normalizeText, ValidEmployeeItem } from "./EmployeeImport";

/** Diferença de um campo entre o cadastro e a planilha (T10). Os valores aparecem na resposta, nunca em log. */
export interface FieldChange {
  field: "position" | "admissionDate" | "fullName" | "birthDate" | "cpf" | "activated";
  current: string | boolean | null;
  new: string | boolean;
}

/** Funcionário cadastrado, como lido do banco. */
export interface CurrentEmployee {
  employeeId: string;
  fkCompanyId: string | null;
  fkPositionId: string | null;
  fkPersonId: string;
  /** `DATEONLY`: o Sequelize devolve `aaaa-MM-dd`. */
  admissionDate: string | Date;
  activated: boolean;
}

/** Pessoa vinculada ao funcionário. */
export interface CurrentPerson {
  personId: string;
  fullName: string;
  birthDate: string | Date | null;
  activated: boolean;
}

/** Tudo o que a comparação precisa saber sobre um item que já existe. */
export interface ComparisonInput {
  item: ValidEmployeeItem;
  /** Cargo da planilha já resolvido para o id (cargo ativo, nome exato). */
  positionId: string;
  companyId: string;
  employee: CurrentEmployee;
  person: CurrentPerson | null;
  /** Número do CPF já cadastrado para a pessoa, se houver. */
  personCpf: string | null;
  /** Nome do cargo atual, para o relatório. */
  currentPositionName: string | null;
}

/** Item que não pode ser atualizado: a divergência está num campo de identidade. */
export interface ComparisonConflict {
  conflict: { field: string; error: string };
}

/** O que mudaria no funcionário, na pessoa e no CPF. Lista vazia = item inalterado. */
export interface ComparisonResult {
  changes: FieldChange[];
  employeePatch: { fkPositionId?: string; admissionDate?: Date; activated?: true };
  personPatch: { firstName?: string; lastName?: string; fullName?: string; birthDate?: Date };
  /** CPF a cadastrar para a pessoa que ainda não tem (só preenche vazio). */
  addCpf?: string;
}

/**
 * Data só com dia (`aaaa-MM-dd`) para comparar o valor do banco com o da planilha.
 * @param value Valor `DATEONLY` do banco (texto) ou data já convertida.
 */
export const toDateOnly = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  return typeof value === "string" ? value.slice(0, 10) : format(value, "yyyy-MM-dd");
};

/**
 * Compara um item da planilha com o funcionário cadastrado, seguindo as categorias de campo
 * aprovadas na T10: identidade (empresa, CPF já cadastrado) diverge → conflito; cargo, admissão,
 * nome e nascimento → atualizáveis; CPF só preenche quando a pessoa não tem.
 *
 * Nome que difere só em caixa ou acento conta como igual: a planilha costuma vir em maiúsculas
 * sem acento, e isso não deve sobrescrever o nome bem grafado do cadastro.
 */
export const compareEmployee = (input: ComparisonInput): ComparisonConflict | ComparisonResult => {
  const { item, positionId, companyId, employee, person, personCpf, currentPositionName } = input;

  if (employee.fkCompanyId !== companyId) {
    return { conflict: { field: "companyId", error: "Matrícula já cadastrada em outra empresa." } };
  }
  if (!person || !person.activated) {
    return { conflict: { field: "person", error: "Pessoa vinculada ao funcionário está inativa; reative o cadastro da pessoa antes de importar." } };
  }
  if (personCpf && item.cpf && personCpf !== item.cpf) {
    return { conflict: { field: "cpf", error: "CPF diferente do cadastrado para este funcionário." } };
  }

  const result: ComparisonResult = { changes: [], employeePatch: {}, personPatch: {} };

  if (!employee.activated) {
    result.changes.push({ field: "activated", current: false, new: true });
    result.employeePatch.activated = true;
  }
  if (employee.fkPositionId !== positionId) {
    result.changes.push({ field: "position", current: currentPositionName, new: item.position });
    result.employeePatch.fkPositionId = positionId;
  }
  const admission = toDateOnly(item.admissionDate) as string;
  if (toDateOnly(employee.admissionDate) !== admission) {
    result.changes.push({ field: "admissionDate", current: toDateOnly(employee.admissionDate), new: admission });
    result.employeePatch.admissionDate = item.admissionDate;
  }
  if (normalizeText(person.fullName ?? "") !== normalizeText(item.fullName)) {
    result.changes.push({ field: "fullName", current: person.fullName ?? null, new: item.fullName });
    result.personPatch = { ...result.personPatch, fullName: item.fullName, firstName: item.firstName, lastName: item.lastName };
  }
  const birth = toDateOnly(item.birthDate) as string;
  if (toDateOnly(person.birthDate) !== birth) {
    result.changes.push({ field: "birthDate", current: toDateOnly(person.birthDate), new: birth });
    result.personPatch.birthDate = item.birthDate;
  }
  if (!personCpf && item.cpf) {
    result.changes.push({ field: "cpf", current: null, new: item.cpf });
    result.addCpf = item.cpf;
  }

  return result;
};

/** Opções da importação lidas da requisição (mesmo formato de `ImportOptions` do serviço). */
export interface ParsedImportOptions {
  dryRun: boolean;
  mode: "insert" | "upsert";
  reactivate: boolean;
  confirmIds: string[];
}

/**
 * Lê `?dryRun`, `?mode`, `?reactivate` e `confirmIds` (corpo) da importação em lote.
 * @returns As opções, ou a mensagem de erro para responder 400.
 */
export const parseImportOptions = (
  query: Record<string, unknown>,
  body: Record<string, unknown> | undefined
): { options: ParsedImportOptions } | { error: string } => {
  const mode = query.mode ?? "insert";
  if (mode !== "insert" && mode !== "upsert") return { error: "Parâmetro mode inválido: use insert ou upsert." };
  const confirmIds: unknown = body?.confirmIds ?? [];
  if (!Array.isArray(confirmIds) || !confirmIds.every(id => typeof id === "string")) {
    return { error: "confirmIds deve ser uma lista de ids." };
  }
  if (mode === "insert" && (confirmIds.length || query.reactivate === "true")) {
    return { error: "confirmIds e reactivate só valem com mode=upsert." };
  }
  return { options: { dryRun: query.dryRun === "true", mode, reactivate: query.reactivate === "true", confirmIds: confirmIds as string[] } };
};

/** `true` se a comparação terminou em conflito. */
export const isConflict = (r: ComparisonConflict | ComparisonResult): r is ComparisonConflict => "conflict" in r;
