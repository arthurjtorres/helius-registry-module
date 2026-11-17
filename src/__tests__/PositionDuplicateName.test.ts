const mocks = { findAll: jest.fn(), create: jest.fn(), update: jest.fn(), findOne: jest.fn() };

jest.mock('../database/models', () => ({
  __esModule: true,
  PositionModel: {
    findAll: (...a: unknown[]) => mocks.findAll(...a),
    create: (...a: unknown[]) => mocks.create(...a),
    update: (...a: unknown[]) => mocks.update(...a),
    findOne: (...a: unknown[]) => mocks.findOne(...a),
  },
  EmployeeModel: {},
}));

import PositionService from '../services/PositionService';

const service = new PositionService();
const base = () => ({ positionName: 'ZZ_TEST_Motorista', createdBy: 'u-1' }) as never;
const stored = (positionId: string, positionName: string, activated = true) => ({ positionId, positionName, activated });

describe('PositionService: nome duplicado', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cria quando o nome está livre', async () => {
    mocks.findAll.mockResolvedValue([stored('p-1', 'ZZ_TEST_Cobrador')]);
    const r = await service.createPosition(base());
    expect(r.status).toBe(201);
    expect(mocks.create).toHaveBeenCalled();
  });

  it('bloqueia nome igual a um ativo, ignorando acento, caixa e espaços', async () => {
    mocks.findAll.mockResolvedValue([stored('p-1', '  zz_test_MOTORISTA ')]);
    const r = await service.createPosition(base());
    expect(r.status).toBe(409);
    expect('data' in r).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('nome igual a um inativo devolve o id para reativação', async () => {
    mocks.findAll.mockResolvedValue([stored('p-9', 'ZZ_TEST_Motorista', false)]);
    const r = await service.createPosition(base());
    expect(r).toEqual(expect.objectContaining({ status: 409, data: { id: 'p-9' } }));
  });

  it('no PUT ignora o próprio registro e bloqueia o nome de outro', async () => {
    mocks.findAll.mockResolvedValue([stored('p-1', 'ZZ_TEST_Motorista'), stored('p-2', 'ZZ_TEST_Cobrador')]);
    mocks.update.mockResolvedValue([1]);
    const own = await service.updatePosition('p-1', { positionName: 'ZZ_TEST_Motorista', updatedBy: 'u-1' } as never);
    expect(own.status).toBe(200);
    const other = await service.updatePosition('p-1', { positionName: 'ZZ_TEST_Cobrador', updatedBy: 'u-1' } as never);
    expect(other.status).toBe(409);
  });
});
