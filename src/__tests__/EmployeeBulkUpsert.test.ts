const transaction = { commit: jest.fn(), rollback: jest.fn() };
const mocks = {
  company: jest.fn(),
  employeeFindAll: jest.fn(),
  employeeBulkCreate: jest.fn(),
  employeeUpdate: jest.fn(),
  activePositions: jest.fn(),
  positionNames: jest.fn(),
  documentsByNumber: jest.fn(),
  cpfDocsByPerson: jest.fn(),
  documentBulkCreate: jest.fn(),
  personFindAll: jest.fn(),
  personBulkCreate: jest.fn(),
  personUpdate: jest.fn(),
};

type Where = { where?: Record<string, unknown> };
jest.mock('../database/models', () => ({
  __esModule: true,
  default: { transaction: jest.fn(async () => transaction) },
  CompanyModel: { findOne: (...a: unknown[]) => mocks.company(...a) },
  EmployeeModel: {
    findAll: (...a: unknown[]) => mocks.employeeFindAll(...a),
    bulkCreate: (...a: unknown[]) => mocks.employeeBulkCreate(...a),
    update: (...a: unknown[]) => mocks.employeeUpdate(...a),
  },
  PositionModel: { findAll: (o: Where) => ('activated' in (o.where ?? {}) ? mocks.activePositions(o) : mocks.positionNames(o)) },
  DocumentModel: {
    findAll: (o: Where) => ('documentNumber' in (o.where ?? {}) ? mocks.documentsByNumber(o) : mocks.cpfDocsByPerson(o)),
    bulkCreate: (...a: unknown[]) => mocks.documentBulkCreate(...a),
  },
  PersonModel: {
    findAll: (...a: unknown[]) => mocks.personFindAll(...a),
    bulkCreate: (...a: unknown[]) => mocks.personBulkCreate(...a),
    update: (...a: unknown[]) => mocks.personUpdate(...a),
  },
}));

import EmployeeBulkService, { ImportOptions } from '../services/EmployeeBulkService';

const companyId = '11111111-1111-4111-8111-111111111111';
const userId = 'u-1';
const item = (registration: string, extra: Record<string, unknown> = {}) => ({
  registration, fullName: 'Maria da Silva', admissionDate: '01/02/2020', position: 'Motorista', birthDate: '15/06/1985', ...extra,
});
const stored = (over: Record<string, unknown> = {}) => ({
  employeeId: 'e-1', registration: 'PS1', activated: true, fkCompanyId: companyId,
  fkPositionId: 'p-mot', fkPersonId: 'pe-1', admissionDate: '2020-02-01', ...over,
});

beforeEach(() => {
  Object.values(mocks).forEach(m => m.mockReset());
  transaction.commit.mockReset();
  transaction.rollback.mockReset();
  mocks.company.mockResolvedValue({ companyId, companyAcronym: 'PS' });
  mocks.employeeFindAll.mockResolvedValue([stored()]);
  mocks.activePositions.mockResolvedValue([{ positionId: 'p-mot', positionName: 'Motorista' }, { positionId: 'p-fis', positionName: 'Fiscal' }]);
  mocks.positionNames.mockResolvedValue([{ positionId: 'p-mot', positionName: 'Motorista' }]);
  mocks.documentsByNumber.mockResolvedValue([]);
  mocks.cpfDocsByPerson.mockResolvedValue([]);
  mocks.personFindAll.mockResolvedValue([{ personId: 'pe-1', fullName: 'Maria da Silva', birthDate: '1985-06-15', activated: true }]);
  [mocks.personBulkCreate, mocks.documentBulkCreate, mocks.employeeBulkCreate, mocks.employeeUpdate, mocks.personUpdate]
    .forEach(m => m.mockResolvedValue([]));
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const run = (employees: unknown[], options: ImportOptions = {}) =>
  new EmployeeBulkService().importEmployees({ companyId, userId, employees }, { mode: 'upsert', ...options });

describe('EmployeeBulkService em modo upsert (T10)', () => {
  it('planilha igual ao cadastro: unchanged, nada gravado', async () => {
    const r = await run([item('1')]);
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({ mode: 'upsert', unchanged: [{ line: 1, registration: 'PS1', employeeId: 'e-1' }], updated: [], skipped: [] });
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('diferença sem confirmação vai para skipped com as mudanças e não grava', async () => {
    const r = await run([item('1', { position: 'Fiscal' })]);
    expect(r.status).toBe(200);
    expect(r.data?.skipped[0]).toMatchObject({ employeeId: 'e-1', changes: [{ field: 'position', current: 'Motorista', new: 'Fiscal' }] });
    expect(mocks.employeeUpdate).not.toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('diferença confirmada atualiza funcionário e pessoa com o autor do token, na transação', async () => {
    const r = await run([item('1', { position: 'Fiscal', fullName: 'Maria Souza' })], { confirmIds: ['e-1'] });
    expect(r.status).toBe(200);
    expect(r.data?.updated?.[0].changes.map(c => c.field)).toEqual(['position', 'fullName']);
    expect(mocks.employeeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ fkPositionId: 'p-fis', updatedBy: userId }),
      expect.objectContaining({ where: { employeeId: 'e-1' }, transaction }),
    );
    expect(mocks.personUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Maria Souza', firstName: 'Maria', lastName: 'Souza', updatedBy: userId }),
      expect.objectContaining({ where: { personId: 'pe-1' }, transaction }),
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('dryRun mostra o que seria atualizado sem gravar', async () => {
    const r = await run([item('1', { position: 'Fiscal' })], { confirmIds: ['e-1'], dryRun: true });
    expect(r.status).toBe(200);
    expect(r.data?.updated).toHaveLength(1);
    expect(mocks.employeeUpdate).not.toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('inativo sem reactivate é conflito; com reactivate e confirmação, reativa', async () => {
    mocks.employeeFindAll.mockResolvedValue([stored({ activated: false })]);
    const sem = await run([item('1')]);
    expect(sem.status).toBe(400);
    expect(sem.data?.failed[0].error).toContain('reactivate=true');

    const com = await run([item('1')], { reactivate: true, confirmIds: ['e-1'] });
    expect(com.status).toBe(200);
    expect(com.data?.updated?.[0].changes).toEqual([{ field: 'activated', current: false, new: true }]);
    expect(mocks.employeeUpdate).toHaveBeenCalledWith(expect.objectContaining({ activated: true }), expect.anything());
  });

  it('matrícula de outra empresa é conflito e rejeita o lote inteiro', async () => {
    mocks.employeeFindAll.mockResolvedValue([stored({ fkCompanyId: 'outra' })]);
    const r = await run([item('1'), item('2')], { confirmIds: ['e-1'] });
    expect(r.status).toBe(400);
    expect(r.data?.failed[0]).toMatchObject({ line: 1, field: 'companyId', code: 'CONFLICT' });
    expect(mocks.employeeBulkCreate).not.toHaveBeenCalled();
  });

  it('CPF a preencher que já pertence a outra pessoa é conflito', async () => {
    mocks.documentsByNumber.mockResolvedValue([{ documentNumber: '52998224725', documentType: 'CPF', fkPersonId: 'pe-9', activated: true }]);
    const r = await run([item('1', { cpf: '52998224725' })], { confirmIds: ['e-1'] });
    expect(r.status).toBe(400);
    expect(r.data?.failed[0]).toMatchObject({ field: 'cpf', code: 'CONFLICT' });
  });

  it('CPF confirmado para pessoa sem CPF é cadastrado', async () => {
    const r = await run([item('1', { cpf: '52998224725' })], { confirmIds: ['e-1'] });
    expect(r.status).toBe(200);
    expect(mocks.documentBulkCreate).toHaveBeenLastCalledWith(
      [expect.objectContaining({ documentType: 'CPF', documentNumber: '52998224725', fkPersonId: 'pe-1', createdBy: userId })],
      expect.objectContaining({ transaction }),
    );
  });

  it('novo e atualizado no mesmo lote: 201; falha na atualização desfaz tudo', async () => {
    const ok = await run([item('1', { position: 'Fiscal' }), item('2', { cpf: undefined })], { confirmIds: ['e-1'] });
    expect(ok.status).toBe(201);
    expect(ok.data?.created).toHaveLength(1);
    expect(ok.data?.updated).toHaveLength(1);

    mocks.employeeUpdate.mockRejectedValue(new Error('falha simulada'));
    const falha = await run([item('1', { position: 'Fiscal' }), item('2')], { confirmIds: ['e-1'] });
    expect(falha.status).toBe(500);
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
  });

  it('duas matrículas da mesma pessoa com nomes diferentes: conflito na segunda', async () => {
    mocks.employeeFindAll.mockResolvedValue([stored(), stored({ employeeId: 'e-2', registration: 'PS2' })]);
    const r = await run([item('1', { fullName: 'Maria Souza' }), item('2', { fullName: 'Maria Lima' })], { confirmIds: ['e-1', 'e-2'] });
    expect(r.status).toBe(400);
    expect(r.data?.failed).toEqual([expect.objectContaining({ line: 2, field: 'person' })]);
  });
});
