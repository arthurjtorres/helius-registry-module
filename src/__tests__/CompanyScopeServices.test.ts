import { Op } from 'sequelize';
import { Request, Response as ExpressResponse } from 'express';

const mocks = { companyFindAll: jest.fn(), companyFindOne: jest.fn(), groupFindAll: jest.fn(), groupFindOne: jest.fn() };
jest.mock('../database/models', () => ({
  __esModule: true,
  CompanyModel: { findAll: (...a: unknown[]) => mocks.companyFindAll(...a), findOne: (...a: unknown[]) => mocks.companyFindOne(...a) },
  CompanyGroupModel: { findAll: (...a: unknown[]) => mocks.groupFindAll(...a), findOne: (...a: unknown[]) => mocks.groupFindOne(...a) },
  CorporationModel: {}, EmployeeModel: {},
}));

import CompanyService from '../services/CompanyService';
import CompanyGroupService from '../services/CompanyGroupService';
import { onlySystemUser } from '../middlewares/CheckPermission';
import { JwtPayload } from '../middlewares/Authentication';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const whereOf = (m: jest.Mock) => m.mock.calls[0][0].where;

beforeEach(() => {
  Object.values(mocks).forEach(m => m.mockReset());
  mocks.companyFindAll.mockResolvedValue([]);
  mocks.groupFindAll.mockResolvedValue([]);
});

describe('CompanyService com escopo (T18)', () => {
  const service = new CompanyService();

  it('GET / e GET /:id filtram pelo escopo; null não filtra', async () => {
    await service.findCompanies({}, [A]);
    expect(whereOf(mocks.companyFindAll).companyId).toEqual({ [Op.in]: [A] });
    expect((await service.getCompany(B, [A])).status).toBe(404);
    expect(whereOf(mocks.companyFindOne).companyId).toEqual({ [Op.in]: [A] });
    mocks.companyFindAll.mockClear();
    await service.findCompanies({}, null);
    expect(whereOf(mocks.companyFindAll).companyId).toBeUndefined();
  });

  it('lookup com token de usuário só devolve ids do escopo; com serviço (null), todos', async () => {
    await service.getCompaniesByIds([A, B], [A]);
    expect(whereOf(mocks.companyFindAll).companyId).toEqual({ [Op.in]: [A] });
    mocks.companyFindAll.mockClear();
    await service.getCompaniesByIds([A, B], null);
    expect(whereOf(mocks.companyFindAll).companyId).toEqual({ [Op.in]: [A, B] });
  });
});

describe('CompanyGroupService com escopo (T18)', () => {
  const service = new CompanyGroupService();

  it('GET / mostra só os grupos das empresas do escopo', async () => {
    mocks.companyFindAll.mockResolvedValue([{ fkCompanyGroupId: 'g1' }, { fkCompanyGroupId: null }]);
    await service.findCompanyGroups({}, [A]);
    expect(whereOf(mocks.companyFindAll).companyId).toEqual({ [Op.in]: [A] });
    expect(whereOf(mocks.groupFindAll).groupId).toEqual({ [Op.in]: ['g1'] });
  });

  it('GET /:id de outro grupo → 404; null não consulta empresas', async () => {
    expect((await service.getCompanyGroup('g2', [])).status).toBe(404);
    expect(whereOf(mocks.groupFindOne).groupId).toEqual({ [Op.in]: [] });
    mocks.companyFindAll.mockClear();
    await service.getCompanyGroup('g2', null);
    expect(mocks.companyFindAll).not.toHaveBeenCalled();
  });
});

describe('onlySystemUser (T18, decisão 1)', () => {
  const run = (user: Partial<JwtPayload>) => {
    const out = { status: 0, next: false };
    const res = { locals: { user }, status(c: number) { out.status = c; return this; }, json() { return this; } } as unknown as ExpressResponse;
    onlySystemUser({} as Request, res, () => { out.next = true; });
    return out;
  };
  it('SISTEMA passa; colaborador SYSTEM_ADMIN e token de serviço → 403', () => {
    expect(run({ userType: 'SISTEMA' }).next).toBe(true);
    expect(run({ userType: 'COLABORADOR', clearance: 'SYSTEM_ADMIN' }).status).toBe(403);
    expect(run({ tokenType: 'service', userType: 'SISTEMA' }).status).toBe(403);
  });
});
