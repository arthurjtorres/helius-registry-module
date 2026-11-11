import { cleanCpf, isValidCpf, normalizeText, parseBrDate, splitName, validateEmployeeItems } from '../utils/EmployeeImport';

const item = (p: Record<string, unknown> = {}) => ({
  registration: 'ABC-001', fullName: 'Maria da Silva', admissionDate: '01/02/2020',
  position: 'Motorista', birthDate: '15/06/1985', cpf: '529.982.247-25', ...p,
});

describe('CPF', () => {
  it('limpa a máscara', () => expect(cleanCpf('529.982.247-25')).toBe('52998224725'));
  it('aceita CPF com dígitos verificadores corretos', () => expect(isValidCpf('52998224725')).toBe(true));
  it('rejeita dígito errado, tamanho errado e repetidos', () => {
    expect(isValidCpf('52998224726')).toBe(false);
    expect(isValidCpf('1234567890')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });
});

describe('parseBrDate', () => {
  it('aceita dd/MM/aaaa', () => {
    const d = parseBrDate('01/02/2020');
    expect(d?.getFullYear()).toBe(2020);
    expect(d?.getMonth()).toBe(1);
    expect(d?.getDate()).toBe(1);
  });
  it('rejeita data inexistente, outro formato, número (serial do Excel) e ano fora da faixa', () => {
    expect(parseBrDate('31/02/2020')).toBeNull();
    expect(parseBrDate('2020-02-01')).toBeNull();
    expect(parseBrDate('1/2/2020')).toBeNull();
    expect(parseBrDate(43831)).toBeNull();
    expect(parseBrDate(undefined)).toBeNull();
    expect(parseBrDate('01/01/1800')).toBeNull();
    expect(parseBrDate('01/01/2999')).toBeNull();
  });
});

describe('texto', () => {
  it('normalizeText remove acento, caixa e espaços repetidos', () => {
    expect(normalizeText('  Motorista  de   Ônibus ')).toBe('MOTORISTA DE ONIBUS');
  });
  it('splitName separa primeiro nome e sobrenome', () => {
    expect(splitName('Maria da Silva')).toEqual({ firstName: 'Maria', lastName: 'da Silva' });
  });
});

describe('validateEmployeeItems', () => {
  it('item correto vira válido, com CPF só em dígitos e cargo normalizado', () => {
    const { valid, failed } = validateEmployeeItems([item()]);
    expect(failed).toEqual([]);
    expect(valid).toHaveLength(1);
    expect(valid[0]).toMatchObject({ line: 1, registration: 'ABC-001', cpf: '52998224725', positionKey: 'MOTORISTA', firstName: 'Maria', lastName: 'da Silva' });
  });
  it('CPF é opcional (ausente, nulo ou vazio)', () => {
    const { valid, failed } = validateEmployeeItems([item({ cpf: undefined }), item({ registration: 'B', cpf: null }), item({ registration: 'C', cpf: '' })]);
    expect(failed).toEqual([]);
    expect(valid.every(v => v.cpf === undefined)).toBe(true);
  });
  it('relata cada problema com linha, campo e matrícula, sem nome nem CPF na mensagem', () => {
    const { valid, failed } = validateEmployeeItems([
      item(),
      item({ registration: 'X-2', fullName: 'Madonna', admissionDate: '31/02/2020', birthDate: 43831, position: '', cpf: '123' }),
    ]);
    expect(valid).toHaveLength(1);
    const campos = failed.map(f => f.field).sort();
    expect(campos).toEqual(['admissionDate', 'birthDate', 'cpf', 'fullName', 'position']);
    expect(failed.every(f => f.line === 2 && f.registration === 'X-2' && f.code === 'INVALID')).toBe(true);
    expect(JSON.stringify(failed)).not.toMatch(/Madonna|123/);
  });
  it('matrícula e CPF repetidos no arquivo apontam a primeira linha', () => {
    const { valid, failed } = validateEmployeeItems([item(), item(), item({ registration: 'ABC-003' })]);
    expect(valid).toHaveLength(1);
    expect(failed.filter(f => f.line === 2).map(f => f.field).sort()).toEqual(['cpf', 'registration']);
    expect(failed.find(f => f.line === 3)?.field).toBe('cpf');
    expect(failed.find(f => f.field === 'registration')?.error).toContain('linha 1');
  });
  it('itens que não são objeto e campos com tipo errado não quebram', () => {
    const { valid, failed } = validateEmployeeItems([null, 'texto', 5, item({ registration: 123, fullName: ['a', 'b'] })]);
    expect(valid).toEqual([]);
    expect(new Set(failed.map(f => f.line))).toEqual(new Set([1, 2, 3, 4]));
  });
});

describe('tamanho máximo de texto', () => {
  it('rejeita matrícula, nome e cargo acima de 255 caracteres', () => {
    const longo = 'x'.repeat(256);
    const { failed } = validateEmployeeItems([item({ registration: longo, fullName: `A ${longo}`, position: longo })]);
    expect(failed.map(f => f.field).sort()).toEqual(['fullName', 'position', 'registration']);
  });
});
