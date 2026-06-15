import { logger } from '../logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      tenant_id: req.tenant_id || null,
      user_id: req.user_id || null,
      ip: req.ip,
    });
  });
  next();
}
