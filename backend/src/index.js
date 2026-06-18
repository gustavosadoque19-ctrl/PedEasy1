import 'dotenv/config';
import { startTrialJobs } from './jobs/trial.js';
import app from './app.js';
import { logger } from './logger.js';

const PORT = process.env.PORT || 3000;

// Validação de variáveis obrigatórias em produção — falha o boot se faltar
// qualquer segredo. Em dev/test o fallback de auth.js ainda permite rodar.
const IS_PROD = process.env.NODE_ENV === 'production';
if (IS_PROD) {
  const REQUIRED_SECRETS = ['JWT_SECRET', 'PAGARME_SECRET_KEY', 'PAGARME_WEBHOOK_SECRET'];
  const missing = REQUIRED_SECRETS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    logger.error(`Variáveis de ambiente obrigatórias ausentes em produção: ${missing.join(', ')}`);
    process.exit(1);
  }
} else if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET não configurada — usando valor padrão (apenas para dev/test, NUNCA em produção)');
}

const server = app.listen(PORT, () => {
  logger.info(`Backend rodando em http://localhost:${PORT}`);
  startTrialJobs();
});

export default server;
