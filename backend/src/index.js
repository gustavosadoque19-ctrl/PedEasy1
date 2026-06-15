import 'dotenv/config';
import { startTrialJobs } from './jobs/trial.js';
import app from './app.js';
import { logger } from './logger.js';

const PORT = process.env.PORT || 3000;
const REQUIRED = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.error('Variáveis de ambiente obrigatórias não configuradas', { missing });
  process.exit(1);
}

if (!process.env.PAGARME_SECRET_KEY) {
  logger.warn('PAGARME_SECRET_KEY não configurada — Pagar.me desabilitado');
}

const server = app.listen(PORT, () => {
  logger.info(`Backend rodando em http://localhost:${PORT}`);
  startTrialJobs();
});

export default server;
