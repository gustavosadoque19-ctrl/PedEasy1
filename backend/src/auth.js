import jwt from 'jsonwebtoken';

const AUTH_BYPASS = process.env.NODE_ENV === 'test' && process.env.AUTH_BYPASS === 'true';
const TEST_TENANT_ID = process.env.TEST_TENANT_ID;
// JWT_SECRET é obrigatório em todos os ambientes. Sem ele, qualquer um pode
// forjar tokens. O boot em index.js falha se não estiver definido.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurada. Defina JWT_SECRET no ambiente.');
}
const JWT_EXPIRES = '24h';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, usuario: user.usuario, permissao: user.permissao },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

export function generateTenantToken(tenantUser, tenantId) {
  return jwt.sign(
    { user_id: tenantUser.id, tenant_id: tenantId, permissao: tenantUser.permissao },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// Exportado para que saas.js reutilize o mesmo secret (antes duplicado).
export { JWT_SECRET, JWT_EXPIRES };

export function authMiddleware(req, res, next) {
  if (AUTH_BYPASS) {
    req.user = { id: 1, user_id: 1, tenant_id: TEST_TENANT_ID, permissao: 'admin' };
    req.tenant_id = TEST_TENANT_ID;
    req.user_id = 1;
    req.user_permissao = 'admin';
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    if (decoded.tenant_id) {
      req.tenant_id = decoded.tenant_id;
      req.user_id = decoded.user_id;
    } else {
      req.tenant_id = null;
    }
    req.user_permissao = decoded.permissao;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function optionalAuth(req, res, next) {
  if (AUTH_BYPASS) {
    req.user = { id: 1, user_id: 1, tenant_id: TEST_TENANT_ID, permissao: 'admin' };
    req.tenant_id = TEST_TENANT_ID;
    req.user_id = 1;
    req.user_permissao = 'admin';
    return next();
  }

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
      req.user = decoded;
      if (decoded.tenant_id) {
        req.tenant_id = decoded.tenant_id;
        req.user_id = decoded.user_id;
        req.user_permissao = decoded.permissao;
      }
    } catch {}
  }
  next();
}
