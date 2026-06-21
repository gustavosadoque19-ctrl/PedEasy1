export function adminGuard(req, res, next) {
  if (req.user_permissao !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem realizar esta operação.' });
  }
  next();
}
