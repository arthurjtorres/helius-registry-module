import { validateEmployeeItems } from '../utils/EmployeeImport';
import { compareEmployee, ComparisonInput, ComparisonResult, isConflict, parseImportOptions, toDateOnly } from '../utils/EmployeeUpsert';

const companyId = 'c-1';
const positionId = 'p-motorista';

const validItem = (p: Record<string, unknown> = {}) => {
  const { valid } = validateEmployeeItems([{
    registration: '1001', fullName: 'Maria da Silva', admissionDate: '01/02/2020',
    position: 'Motorista', birthDate: '15/06/1985', ...p,
  }], 'PS');
  return valid[0];
};

const input = (over: Partial<ComparisonInput> = {}, itemOver: Record<string, unknown> = {}): ComparisonInput => ({
  item: validItem(itemOver),
  positionId,
  companyId,
  employee: { employeeId: 'e-1', fkCompanyId: companyId, fkPositionId: positionId, fkPersonId: 'pe-1', admissionDate: '2020-02-01', activated: true },
  person: { personId: 'pe-1', fullName: 'Maria da Silva', birthDate: '1985-06-15', activated: true },
  personCpf: null,
  currentPositionName: 'Motorista',
  ...over,
});

const changesOf = (i: ComparisonInput) => {
  const r = compareEmployee(i);
  if (isConflict(r)) throw new Error(`conflito inesperado: ${r.conflict.error}`);
  return r as ComparisonResult;
};

describe('toDateOnly', () => {
  it('aceita texto DATEONLY e Date local', () => {
    expect(toDateOnly('2020-02-01')).toBe('2020-02-01');
    expect(toDateOnly(new Date(2020, 1, 1))).toBe('2020-02-01');
    expect(toDateOnly(null)).toBeNull();
  });
});

describe('compareEmployee', () => {
  it('planilha igual ao cadastro: nenhuma diferença', () => {
    const r = changesOf(input());
    expect(r.changes).toEqual([]);
    expect(r.employeePatch).toEqual({});
    expect(r.personPatch).toEqual({});
  });

  it('nome só com caixa ou acento diferentes conta como igual', () => {
    const r = changesOf(input({ person: { personId: 'pe-1', fullName: 'Maria Conceição', birthDate: '1985-06-15', activated: true } }, { fullName: 'MARIA CONCEICAO' }));
    expect(r.changes).toEqual([]);
  });

  it('relata cargo, admissão, nome e nascimento com valor atual e novo', () => {
    const r = changesOf(input({ positionId: 'p-fiscal' }, { position: 'Fiscal', admissionDate: '10/03/2021', fullName: 'Maria Souza', birthDate: '16/06/1985' }));
    expect(r.changes).toEqual([
      { field: 'position', current: 'Motorista', new: 'Fiscal' },
      { field: 'admissionDate', current: '2020-02-01', new: '2021-03-10' },
      { field: 'fullName', current: 'Maria da Silva', new: 'Maria Souza' },
      { field: 'birthDate', current: '1985-06-15', new: '1985-06-16' },
    ]);
    expect(r.employeePatch.fkPositionId).toBe('p-fiscal');
    expect(r.personPatch).toMatchObject({ fullName: 'Maria Souza', firstName: 'Maria', lastName: 'Souza' });
  });

  it('CPF só preenche quando a pessoa não tem', () => {
    const r = changesOf(input({}, { cpf: '529.982.247-25' }));
    expect(r.addCpf).toBe('52998224725');
    expect(r.changes).toEqual([{ field: 'cpf', current: null, new: '52998224725' }]);
    expect(changesOf(input({ personCpf: '52998224725' }, { cpf: '52998224725' })).changes).toEqual([]);
  });

  it('inativo vira mudança de "activated" (reativação)', () => {
    const r = changesOf(input({ employee: { employeeId: 'e-1', fkCompanyId: companyId, fkPositionId: positionId, fkPersonId: 'pe-1', admissionDate: '2020-02-01', activated: false } }));
    expect(r.changes).toEqual([{ field: 'activated', current: false, new: true }]);
    expect(r.employeePatch).toEqual({ activated: true });
  });

  it('identidade divergente é conflito: outra empresa, CPF diferente, pessoa inativa ou ausente', () => {
    const other = compareEmployee(input({ employee: { employeeId: 'e-1', fkCompanyId: 'c-2', fkPositionId: positionId, fkPersonId: 'pe-1', admissionDate: '2020-02-01', activated: true } }));
    expect(other).toEqual({ conflict: expect.objectContaining({ field: 'companyId' }) });
    expect(compareEmployee(input({ personCpf: '11144477735' }, { cpf: '52998224725' }))).toEqual({ conflict: expect.objectContaining({ field: 'cpf' }) });
    expect(compareEmployee(input({ person: { personId: 'pe-1', fullName: 'Maria da Silva', birthDate: '1985-06-15', activated: false } }))).toEqual({ conflict: expect.objectContaining({ field: 'person' }) });
    expect(compareEmployee(input({ person: null }))).toEqual({ conflict: expect.objectContaining({ field: 'person' }) });
  });

  it('CPF cadastrado e planilha sem CPF não é conflito nem mudança', () => {
    expect(changesOf(input({ personCpf: '52998224725' })).changes).toEqual([]);
  });
});

describe('parseImportOptions', () => {
  it('padrão é insert, sem dryRun', () => {
    expect(parseImportOptions({}, {})).toEqual({ options: { dryRun: false, mode: 'insert', reactivate: false, confirmIds: [] } });
  });
  it('lê upsert, reactivate, dryRun e confirmIds', () => {
    expect(parseImportOptions({ mode: 'upsert', reactivate: 'true', dryRun: 'true' }, { confirmIds: ['e-1'] }))
      .toEqual({ options: { dryRun: true, mode: 'upsert', reactivate: true, confirmIds: ['e-1'] } });
  });
  it('rejeita mode desconhecido, confirmIds fora de lista e opções de upsert em insert', () => {
    expect(parseImportOptions({ mode: 'replace' }, {})).toHaveProperty('error');
    expect(parseImportOptions({ mode: 'upsert' }, { confirmIds: 'e-1' })).toHaveProperty('error');
    expect(parseImportOptions({ mode: 'upsert' }, { confirmIds: [1] })).toHaveProperty('error');
    expect(parseImportOptions({}, { confirmIds: ['e-1'] })).toHaveProperty('error');
    expect(parseImportOptions({ reactivate: 'true' }, {})).toHaveProperty('error');
  });
});
