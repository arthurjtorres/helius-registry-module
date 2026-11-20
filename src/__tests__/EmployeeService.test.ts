import { randomUUID } from 'crypto';

const mocks = {
  companyFindOne: jest.fn(),
  employeeFindOne: jest.fn(),
  employeeFindAll: jest.fn(),
  employeeCreate: jest.fn(),
  employeeUpdate: jest.fn(),
};

jest.mock('../database/models', () => ({
  __esModule: true,
  CompanyModel: { findOne: (...a: unknown[]) => mocks.companyFindOne(...a) },
  EmployeeModel: {
    findOne: (...a: unknown[]) => mocks.employeeFindOne(...a),
    findAll: (...a: unknown[]) => mocks.employeeFindAll(...a),
    create: (...a: unknown[]) => mocks.employeeCreate(...a),
    update: (...a: unknown[]) => mocks.employeeUpdate(...a),
  },
  PersonModel: {}, PositionModel: {}, SectorModel: {}, DepartmentModel: {}, DocumentModel: {},
}));
const mockDeactivateUsers = jest.fn();
jest.mock('../services/integrations/UserService', () => ({
  deactivateUsersByEmployee: (...a: unknown[]) => mockDeactivateUsers(...a),
  ControlUnavailableError: class extends Error {},
}));

import EmployeeService from '../services/EmployeeService';
import { ControlUnavailableError } from '../services/integrations/UserService';

const companyId = randomUUID();
const employeeId = randomUUID();
const userId = randomUUID();
const service = new EmployeeService();
const createData = (over: Record<string, unknown> = {}) => ({
  registration: 'PS-8598', admissionDate: '2020-02-01', fkPersonId: randomUUID(), fkCompanyId: companyId, createdBy: userId, ...over,
}) as never;

beforeEach(() => {
  Object.values(mocks).forEach(m => m.mockReset());
  mocks.companyFindOne.mockResolvedValue({ companyId, companyAcronym: 'PS' });
  mocks.employeeFindOne.mockResolvedValue(null);
  mocks.employeeUpdate.mockResolvedValue([1]);
  mocks.employeeFindAll.mockResolvedValue([]);
  mockDeactivateUsers.mockReset();
});

describe('createEmployee', () => {
  it('monta a matrícula com a sigla da empresa e 6 dígitos', async () => {
    const res = await service.createEmployee(createData());
    expect(res.status).toBe(201);
    expect(mocks.employeeCreate).toHaveBeenCalledWith(expect.objectContaining({ registration: 'PS008598' }));
  });

  it('exige empresa e data de admissão', async () => {
    expect((await service.createEmployee(createData({ fkCompanyId: undefined }))).status).toBe(400);
    expect((await service.createEmployee(createData({ admissionDate: undefined }))).status).toBe(400);
    expect(mocks.employeeCreate).not.toHaveBeenCalled();
  });

  it('recusa empresa inativa e matrícula fora do formato', async () => {
    mocks.companyFindOne.mockResolvedValueOnce(null);
    expect((await service.createEmployee(createData())).status).toBe(400);
    expect((await service.createEmployee(createData({ registration: 'XX-12A' }))).status).toBe(400);
    expect(mocks.employeeCreate).not.toHaveBeenCalled();
  });

  it('409 quando a matrícula montada já existe', async () => {
    mocks.employeeFindOne.mockResolvedValue({ employeeId: randomUUID(), activated: true });
    expect((await service.createEmployee(createData())).status).toBe(409);
  });
});

describe('updateEmployee', () => {
  const current = { employeeId, fkCompanyId: companyId, registration: 'PS008598', activated: true };
  const update = (over: Record<string, unknown>) => ({ updatedBy: userId, ...over }) as never;

  beforeEach(() => mocks.employeeFindOne.mockImplementation(async ({ where }) => (where.employeeId === employeeId ? current : null)));

  it('aceita a mesma empresa e remonta a matrícula com a sigla atual', async () => {
    const res = await service.updateEmployee(employeeId, update({ fkCompanyId: companyId, registration: '8599' }));
    expect(res.status).toBe(200);
    expect(mocks.employeeUpdate).toHaveBeenCalledWith(expect.objectContaining({ registration: 'PS008599' }), expect.anything());
  });

  it('recusa troca de empresa', async () => {
    const res = await service.updateEmployee(employeeId, update({ fkCompanyId: randomUUID() }));
    expect(res.status).toBe(400);
    expect(mocks.employeeUpdate).not.toHaveBeenCalled();
  });

  it('409 quando a matrícula pertence a outro funcionário; a própria não conflita', async () => {
    mocks.employeeFindOne.mockImplementation(async ({ where }) =>
      where.employeeId === employeeId ? current : where.registration === 'PS008600' ? { employeeId: randomUUID(), activated: false } : null);
    expect((await service.updateEmployee(employeeId, update({ registration: '8600' }))).status).toBe(409);
    expect((await service.updateEmployee(employeeId, update({ registration: '8598' }))).status).toBe(200);
  });

  it('404 para funcionário inexistente ou inativo', async () => {
    expect((await service.updateEmployee(randomUUID(), update({ registration: '1' }))).status).toBe(404);
  });
});

describe('findEmployees', () => {
  it('filtra por empresa e por pessoa', async () => {
    mocks.employeeFindAll.mockResolvedValue([{}]);
    const personId = randomUUID();
    await service.findEmployees({ fkCompanyId: companyId, fkPersonId: personId });
    expect(mocks.employeeFindAll.mock.calls[0][0].where).toEqual(expect.objectContaining({ fkCompanyId: companyId, fkPersonId: personId, activated: true }));
  });

  it('400 para id de filtro que não é UUID', async () => {
    expect((await service.findEmployees({ fkCompanyId: 'abc' })).status).toBe(400);
    expect(mocks.employeeFindAll).not.toHaveBeenCalled();
  });
});

describe('vínculo ativo da pessoa (04 §6.2, regra 2)', () => {
  const personId = randomUUID();
  const active = [{ fkPersonId: personId, Company: { companyName: 'Empresa Antiga' } }];

  it('createEmployee recusa pessoa com funcionário ativo em qualquer empresa', async () => {
    mocks.employeeFindAll.mockResolvedValue(active);
    const res = await service.createEmployee(createData({ fkPersonId: personId }));
    expect(res).toEqual({ status: 409, message: 'Pessoa com vínculo ativo em Empresa Antiga; desative antes.' });
    expect(mocks.employeeCreate).not.toHaveBeenCalled();
  });

  it('reactivateEmployee recusa se a pessoa já tem outro funcionário ativo', async () => {
    mocks.employeeFindOne.mockResolvedValue({ employeeId, fkPersonId: personId, activated: false });
    mocks.employeeFindAll.mockResolvedValue(active);
    expect((await service.reactivateEmployee(employeeId, userId)).status).toBe(409);
    expect(mocks.employeeUpdate).not.toHaveBeenCalled();
  });
});

describe('deleteEmployee (demissão, T20)', () => {
  const current = { employeeId, admissionDate: '2020-02-01', activated: true };
  beforeEach(() => mocks.employeeFindOne.mockResolvedValue(current));

  it('grava a rescisão informada, desativa e desativa os usuários no control', async () => {
    mockDeactivateUsers.mockResolvedValue(['u-1']);
    const res = await service.deleteEmployee(employeeId, userId, '2026-11-19');
    expect(res.status).toBe(200);
    expect((res as { data?: unknown }).data).toEqual({ deactivatedUsers: ['u-1'], pendingEmployeeIds: [] });
    expect(mocks.employeeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ activated: false, terminationDate: '2026-11-19', updatedBy: userId }), expect.anything());
    expect(mockDeactivateUsers).toHaveBeenCalledWith([employeeId], userId);
  });

  it('sem data, usa hoje', async () => {
    mockDeactivateUsers.mockResolvedValue([]);
    await service.deleteEmployee(employeeId, userId);
    const today = new Date().toISOString().slice(0, 10);
    expect(mocks.employeeUpdate.mock.calls[0][0].terminationDate).toBe(today);
  });

  it('control fora: funcionário fica desativado e a resposta lista o pendente', async () => {
    mockDeactivateUsers.mockRejectedValue(new ControlUnavailableError('x'));
    const res = await service.deleteEmployee(employeeId, userId, '2026-11-19');
    expect(res.status).toBe(200);
    expect((res as { data?: unknown }).data).toEqual({ deactivatedUsers: [], pendingEmployeeIds: [employeeId] });
    expect(res.message).toContain('usuário');
    expect(mocks.employeeUpdate).toHaveBeenCalled();
  });

  it('data inválida ou anterior à admissão → 400, sem gravar', async () => {
    expect((await service.deleteEmployee(employeeId, userId, '19/11/2026')).status).toBe(400);
    expect((await service.deleteEmployee(employeeId, userId, '2019-01-01')).status).toBe(400);
    expect(mocks.employeeUpdate).not.toHaveBeenCalled();
  });

  it('inexistente ou já inativo → 404, sem chamar o control', async () => {
    mocks.employeeFindOne.mockResolvedValue(null);
    expect((await service.deleteEmployee(employeeId, userId)).status).toBe(404);
    expect(mockDeactivateUsers).not.toHaveBeenCalled();
  });
});
