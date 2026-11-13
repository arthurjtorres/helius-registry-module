import { randomUUID } from 'crypto';

const transaction = { commit: jest.fn(), rollback: jest.fn() };
const mocks = {
  company: jest.fn(),
  employeeFindAll: jest.fn(),
  employeeBulkCreate: jest.fn(),
  positionFindAll: jest.fn(),
  documentFindAll: jest.fn(),
  documentBulkCreate: jest.fn(),
  personFindAll: jest.fn(),
  personBulkCreate: jest.fn(),
};

jest.mock('../database/models', () => ({
  __esModule: true,
  default: { transaction: jest.fn(async () => transaction) },
  CompanyModel: { findOne: (...a: unknown[]) => mocks.company(...a) },
  EmployeeModel: { findAll: (...a: unknown[]) => mocks.employeeFindAll(...a), bulkCreate: (...a: unknown[]) => mocks.employeeBulkCreate(...a) },
  PositionModel: { findAll: (...a: unknown[]) => mocks.positionFindAll(...a) },
  DocumentModel: { findAll: (...a: unknown[]) => mocks.documentFindAll(...a), bulkCreate: (...a: unknown[]) => mocks.documentBulkCreate(...a) },
  PersonModel: { findAll: (...a: unknown[]) => mocks.personFindAll(...a), bulkCreate: (...a: unknown[]) => mocks.personBulkCreate(...a) },
}));

import EmployeeBulkService from '../services/EmployeeBulkService';

const companyId = randomUUID();
const userId = randomUUID();
const item = (registration: string, extra: Record<string, unknown> = {}) => ({
  registration, fullName: 'Maria da Silva', admissionDate: '01/02/2020', position: 'Motorista', birthDate: '15/06/1985', ...extra,
});

beforeEach(() => {
  Object.values(mocks).forEach(m => m.mockReset());
  transaction.commit.mockReset();
  transaction.rollback.mockReset();
  mocks.company.mockResolvedValue({ companyId, companyAcronym: 'PS' });
  mocks.employeeFindAll.mockResolvedValue([]);
  mocks.positionFindAll.mockResolvedValue([{ positionId: randomUUID(), positionName: 'Motorista' }]);
  mocks.documentFindAll.mockResolvedValue([]);
  mocks.personFindAll.mockResolvedValue([]);
  mocks.personBulkCreate.mockResolvedValue([]);
  mocks.documentBulkCreate.mockResolvedValue([]);
  mocks.employeeBulkCreate.mockResolvedValue([]);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const run = (employees: unknown, dryRun = false) =>
  new EmployeeBulkService().importEmployees({ companyId, userId, employees }, { dryRun });

describe('EmployeeBulkService (tudo ou nada)', () => {
  it('grava pessoas, funcionários e confirma a transação', async () => {
    const r = await run([item('1'), item('2')]);
    expect(r.status).toBe(201);
    expect(r.data?.created).toHaveLength(2);
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();
  });

  it('falha ao gravar o funcionário desfaz tudo (rollback) e responde 500 sem confirmar', async () => {
    mocks.employeeBulkCreate.mockRejectedValue(new Error('falha simulada'));
    const r = await run([item('1'), item('2')]);
    expect(r.status).toBe(500);
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(mocks.personBulkCreate).toHaveBeenCalledTimes(1); // gravou dentro da transação, que foi desfeita
  });

  it('um item inválido rejeita o lote inteiro sem abrir transação nem gravar', async () => {
    const r = await run([item('1'), item('2', { admissionDate: 'ontem' })]);
    expect(r.status).toBe(400);
    expect(r.data?.failed).toHaveLength(1);
    expect(r.data?.failed[0]).toMatchObject({ line: 2, field: 'admissionDate' });
    expect(r.data?.created).toEqual([]);
    expect(mocks.personBulkCreate).not.toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('cargo inexistente rejeita e lista os cargos faltantes sem repetição', async () => {
    const r = await run([item('1', { position: 'Fiscal' }), item('2', { position: 'Fiscal' })]);
    expect(r.status).toBe(400);
    expect(r.data?.missingPositions).toEqual(['Fiscal']);
    expect(r.data?.failed.map(f => f.line)).toEqual([1, 2]);
  });

  it('cargo é comparado sem acento nem caixa', async () => {
    mocks.positionFindAll.mockResolvedValue([{ positionId: randomUUID(), positionName: 'Motorista de Ônibus' }]);
    const r = await run([item('1', { position: 'MOTORISTA DE ONIBUS' })]);
    expect(r.status).toBe(201);
  });

  it('cargo ambíguo (dois ativos com o mesmo nome) é rejeitado', async () => {
    mocks.positionFindAll.mockResolvedValue([
      { positionId: randomUUID(), positionName: 'Motorista' },
      { positionId: randomUUID(), positionName: 'MOTORISTA' },
    ]);
    const r = await run([item('1')]);
    expect(r.status).toBe(400);
    expect(r.data?.failed[0].error).toContain('ambíguo');
  });

  it('matrícula ativa já existente é ignorada (skipped); só os novos entram', async () => {
    mocks.employeeFindAll.mockResolvedValue([{ employeeId: 'e-1', registration: 'PS1', activated: true }]);
    const r = await run([item('1'), item('2')]);
    expect(r.status).toBe(201);
    expect(r.data?.skipped).toEqual([expect.objectContaining({ line: 1, registration: 'PS1', employeeId: 'e-1' })]);
    expect(r.data?.created).toHaveLength(1);
  });

  it('todas já existentes → 200 sem gravar', async () => {
    mocks.employeeFindAll.mockResolvedValue([{ employeeId: 'e-1', registration: 'PS1', activated: true }]);
    const r = await run([item('1')]);
    expect(r.status).toBe(200);
    expect(r.data?.skipped).toHaveLength(1);
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('matrícula existente inativa vira conflito com a rota de reativação', async () => {
    mocks.employeeFindAll.mockResolvedValue([{ employeeId: 'e-9', registration: 'PS1', activated: false }]);
    const r = await run([item('1')]);
    expect(r.status).toBe(400);
    expect(r.data?.failed[0]).toMatchObject({ code: 'CONFLICT', field: 'registration' });
    expect(r.data?.failed[0].error).toContain('/employee/e-9/reactivate');
  });

  it('CPF já cadastrado ativo reaproveita a pessoa e não cria outra', async () => {
    const personId = randomUUID();
    mocks.documentFindAll.mockResolvedValue([{ documentNumber: '52998224725', documentType: 'CPF', fkPersonId: personId, activated: true }]);
    mocks.personFindAll.mockResolvedValue([{ personId }]);
    const r = await run([item('1', { cpf: '529.982.247-25' })]);
    expect(r.status).toBe(201);
    expect(r.data?.created[0].personReused).toBe(true);
    expect(mocks.personBulkCreate).toHaveBeenCalledWith([], expect.anything());
    expect(mocks.documentBulkCreate).toHaveBeenCalledWith([], expect.anything());
  });

  it('CPF em documento inativo ou de outro tipo é conflito', async () => {
    mocks.documentFindAll.mockResolvedValue([{ documentNumber: '52998224725', documentType: 'CPF', fkPersonId: randomUUID(), activated: false }]);
    expect((await run([item('1', { cpf: '52998224725' })])).status).toBe(400);
    mocks.documentFindAll.mockResolvedValue([{ documentNumber: '52998224725', documentType: 'RG', fkPersonId: randomUUID(), activated: true }]);
    const r = await run([item('1', { cpf: '52998224725' })]);
    expect(r.data?.failed[0].code).toBe('CONFLICT');
  });

  it('dryRun valida e relata sem gravar nem abrir transação', async () => {
    const r = await run([item('1')], true);
    expect(r.status).toBe(200);
    expect(r.data?.dryRun).toBe(true);
    expect(r.data?.created).toHaveLength(1);
    expect(mocks.personBulkCreate).not.toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('violação de unicidade na gravação → 409, rollback e nada confirmado', async () => {
    const { UniqueConstraintError } = jest.requireActual('sequelize');
    mocks.employeeBulkCreate.mockRejectedValue(new UniqueConstraintError({}));
    const r = await run([item('1')]);
    expect(r.status).toBe(409);
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
  });

  it('validações de entrada: lista vazia, acima do limite, empresa inválida ou inexistente', async () => {
    expect((await run([])).status).toBe(400);
    expect((await run(undefined)).status).toBe(400);
    expect((await run(Array.from({ length: 501 }, (_, i) => item('R-' + i)))).status).toBe(400);
    expect((await new EmployeeBulkService().importEmployees({ companyId: 'x', userId, employees: [item('A')] })).status).toBe(400);
    mocks.company.mockResolvedValue(null);
    expect((await run([item('1')])).status).toBe(400);
    expect((await new EmployeeBulkService().importEmployees({ companyId, employees: [item('A')] })).status).toBe(401);
  });

  it('o relatório não contém nome completo nem CPF', async () => {
    const r = await run([item('1', { fullName: 'Fulano Sobrenome', cpf: '52998224725' })]);
    const texto = JSON.stringify(r);
    expect(texto).not.toMatch(/Fulano|Sobrenome|52998224725/);
  });
});
