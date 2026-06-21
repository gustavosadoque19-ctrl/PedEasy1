import 'dotenv/config';
import { startTrialJobs } from './jobs/trial.js';
import app from './app.js';
import { logger } from './logger.js';

const PORT = process.env.PORT || 3000;

// Validação de variáveis obrigatórias em todos os ambientes — o fallback
// hardcoded em auth.js foi removido, então sem JWT_SECRET o boot falha.
const REQUIRED_SECRETS = ['JWT_SECRET'];
if (process.env.NODE_ENV === 'production') {
  REQUIRED_SECRETS.push('PAGARME_SECRET_KEY', 'PAGARME_WEBHOOK_SECRET', 'RECAPTCHA_SECRET_KEY');
}
const missing = REQUIRED_SECRETS.filter((name) => !process.env[name]);
if (missing.length > 0) {
  logger.error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  logger.info(`Backend rodando em http://localhost:${PORT}`);
  startTrialJobs();
});

export default server;
