import jwt from 'jsonwebtoken';
import { supabase } from './supabaseClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pedy-dev-secret-key-change-in-production';
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

export function authMiddleware(req, res, next) {
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
      req.user_permissao = decoded.permissao;
    } else {
      req.tenant_id = null;
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function optionalAuth(req, res, next) {
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
