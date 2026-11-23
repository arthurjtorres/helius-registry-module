import { JwtPayload } from '../middlewares/Authentication';
import { companyScope, inCompanyScope, isSystemUser } from '../utils/AccessPolicy';

const user = (p: Partial<JwtPayload>): JwtPayload => ({
  userId: 'u1', userName: 'u', usertag: 'u', email: 'u@example.com', userType: 'COLABORADOR',
  clearance: 'USUARIO', clearanceId: 'c', modules: [], roles: [], allowedMenus: [], ...p,
});
const service = { tokenType: 'service', userId: 'service:x', userType: 'SISTEMA' } as unknown as JwtPayload;

describe('companyScope (T18)', () => {
  it('SISTEMA e token de serviço não são filtrados', () => {
    expect(companyScope(user({ userType: 'SISTEMA', companyIds: [] }))).toBeNull();
    expect(companyScope(service)).toBeNull();
  });
  it('colaborador usa companyIds do token, mesmo SUPER_ADMIN', () => {
    expect(companyScope(user({ companyIds: ['a', 'b'] }))).toEqual(['a', 'b']);
    expect(companyScope(user({ clearance: 'SUPER_ADMIN', companyIds: ['a'] }))).toEqual(['a']);
  });
  it('token antigo sem companyIds, EXTERNO ou sem usuário: lista vazia (fail-closed)', () => {
    expect(companyScope(user({}))).toEqual([]);
    expect(companyScope(user({ userType: 'EXTERNO', companyIds: [] }))).toEqual([]);
    expect(companyScope(undefined)).toEqual([]);
  });
  it('isSystemUser é falso para token de serviço', () => {
    expect(isSystemUser(service)).toBe(false);
    expect(isSystemUser(user({ userType: 'SISTEMA' }))).toBe(true);
  });
  it('inCompanyScope', () => {
    expect(inCompanyScope(null, undefined)).toBe(true);
    expect(inCompanyScope(['a'], 'a')).toBe(true);
    expect(inCompanyScope(['a'], 'b')).toBe(false);
    expect(inCompanyScope([], undefined)).toBe(false);
  });
});
