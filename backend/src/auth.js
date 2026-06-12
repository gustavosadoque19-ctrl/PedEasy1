import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pedy-dev-secret-key-change-in-production';
const JWT_EXPIRES = '24h';

export function generateToken(user) {
  return jwt.sign({ id: user.id, usuario: user.usuario, permissao: user.permissao }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    } catch {}
  }
  next();
}
