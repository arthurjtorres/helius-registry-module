import { Request, Response as ExpressResponse } from 'express';
import { JwtPayload } from '../middlewares/Authentication';
import { checkPermission, evaluatePermission } from '../middlewares/CheckPermission';
import { hasFullAccess } from '../utils/AccessPolicy';
import { PermissionEnum } from '../database/models/enums/PermissionEnum';

const user = (p: Partial<JwtPayload>): JwtPayload => ({
  userId: 'u1', userName: 'u', usertag: 'u', email: 'u@example.invalid', userType: 'COLABORADOR',
  clearance: 'USUARIO', clearanceId: 'c', modules: ['CADASTRO'],
  roles: [], allowedMenus: [{ menu: 'PESSOAS', permissions: ['READ', 'CREATE'] }], ...p,
});
const service = { tokenType: 'service', userId: 'service:x', roles: [], modules: [], allowedMenus: [] } as unknown as JwtPayload;

type Middleware = (q: Request, s: ExpressResponse, n: () => void) => unknown;

/** Executa o middleware e devolve o status (0 se não respondeu) e se chamou `next`. */
const run = (mw: Middleware, u: JwtPayload | undefined, method = 'GET') => {
  const out = { status: 0, next: false };
  const res = {
    locals: { user: u },
    status(code: number) { out.status = code; return this; },
    json() { return this; },
  } as unknown as ExpressResponse;
  mw({ method, params: {} } as unknown as Request, res, () => { out.next = true; });
  return out;
};

describe('hasFullAccess', () => {
  it('SYSTEM_ADMIN e SUPER_ADMIN têm; ADMIN não', () => {
    expect(hasFullAccess(user({ clearance: 'SYSTEM_ADMIN' }))).toBe(true);
    expect(hasFullAccess(user({ clearance: 'SUPER_ADMIN' }))).toBe(true);
    expect(hasFullAccess(user({ clearance: 'ADMIN' }))).toBe(false);
  });
  it('role DESENVOLVEDOR tem; token de serviço e ausência de usuário não', () => {
    expect(hasFullAccess(user({ roles: [{ module: 'CADASTRO', role: 'DESENVOLVEDOR' }] }))).toBe(true);
    expect(hasFullAccess(service)).toBe(false);
    expect(hasFullAccess(undefined)).toBe(false);
  });
});

describe('evaluatePermission', () => {
  it('sem usuário → 401', () => {
    expect(evaluatePermission(undefined, 'GET', 'PESSOAS')?.status).toBe(401);
  });
  it('token de serviço: GET e HEAD passam, escrita → 403', () => {
    expect(evaluatePermission(service, 'GET', 'PESSOAS', PermissionEnum.READ)).toBeNull();
    expect(evaluatePermission(service, 'HEAD', 'PESSOAS', PermissionEnum.READ)).toBeNull();
    expect(evaluatePermission(service, 'POST', 'FUNCIONARIOS', PermissionEnum.CREATE)?.status).toBe(403);
    expect(evaluatePermission(service, 'PUT', 'PESSOAS', PermissionEnum.UPDATE)?.status).toBe(403);
    expect(evaluatePermission(service, 'DELETE', 'PESSOAS', PermissionEnum.DELETE)?.status).toBe(403);
  });
  it('DOCUMENTOS com allowServiceToken=false: serviço negado até em GET', () => {
    expect(evaluatePermission(service, 'GET', 'DOCUMENTOS', PermissionEnum.READ, { allowServiceToken: false })?.status).toBe(403);
  });
  it('allowServiceToken=false não afeta usuário com o menu', () => {
    const u = user({ allowedMenus: [{ menu: 'DOCUMENTOS', permissions: ['READ'] }] });
    expect(evaluatePermission(u, 'GET', 'DOCUMENTOS', PermissionEnum.READ, { allowServiceToken: false })).toBeNull();
  });
  it('SYSTEM_ADMIN, SUPER_ADMIN e DESENVOLVEDOR passam em tudo', () => {
    expect(evaluatePermission(user({ clearance: 'SYSTEM_ADMIN', modules: [] }), 'DELETE', 'X', PermissionEnum.DELETE)).toBeNull();
    expect(evaluatePermission(user({ clearance: 'SUPER_ADMIN', modules: [] }), 'DELETE', 'X', PermissionEnum.DELETE)).toBeNull();
    expect(evaluatePermission(user({ modules: [], roles: [{ module: 'CADASTRO', role: 'DESENVOLVEDOR' }] }), 'DELETE', 'X', PermissionEnum.DELETE)).toBeNull();
  });
  it('ADMIN não tem bypass: depende de módulo, menu e ação', () => {
    expect(evaluatePermission(user({ clearance: 'ADMIN', allowedMenus: [] }), 'GET', 'PESSOAS', PermissionEnum.READ)?.status).toBe(403);
  });
  it('sem o módulo CADASTRO → 403', () => {
    expect(evaluatePermission(user({ modules: ['JURIDICO'] }), 'GET', 'PESSOAS', PermissionEnum.READ)?.status).toBe(403);
  });
  it('sem o menu → 403', () => {
    expect(evaluatePermission(user({}), 'GET', 'EMPRESAS', PermissionEnum.READ)?.status).toBe(403);
  });
  it('menu sem a ação → 403 (antes não bloqueava)', () => {
    expect(evaluatePermission(user({}), 'DELETE', 'PESSOAS', PermissionEnum.DELETE)?.status).toBe(403);
  });
  it('com módulo, menu e ação → permitido', () => {
    expect(evaluatePermission(user({}), 'POST', 'PESSOAS', PermissionEnum.CREATE)).toBeNull();
  });
  it('payload sem roles, modules e allowedMenus não quebra (TypeError)', () => {
    const quebrado = { userId: 'u', clearance: 'USUARIO' } as unknown as JwtPayload;
    expect(() => evaluatePermission(quebrado, 'GET', 'PESSOAS', PermissionEnum.READ)).not.toThrow();
    expect(evaluatePermission(quebrado, 'GET', 'PESSOAS', PermissionEnum.READ)?.status).toBe(403);
  });
});

describe('middleware checkPermission', () => {
  it('responde 403 e não chama next', () => {
    const r = run(checkPermission('PESSOAS', PermissionEnum.DELETE), user({}), 'DELETE');
    expect(r.status).toBe(403);
    expect(r.next).toBe(false);
  });
  it('chama next quando permitido', () => {
    const r = run(checkPermission('PESSOAS', PermissionEnum.READ), user({}));
    expect(r.next).toBe(true);
    expect(r.status).toBe(0);
  });
  it('repassa a opção allowServiceToken=false', () => {
    const r = run(checkPermission('DOCUMENTOS', PermissionEnum.READ, { allowServiceToken: false }), service);
    expect(r.status).toBe(403);
    expect(r.next).toBe(false);
  });
});
