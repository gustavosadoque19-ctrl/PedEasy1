import 'dotenv/config';
import { startTrialJobs } from './jobs/trial.js';
import app from './app.js';
import { logger } from './logger.js';

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET não configurada — usando valor padrão (inseguro)');
}

const server = app.listen(PORT, () => {
  logger.info(`Backend rodando em http://localhost:${PORT}`);
  startTrialJobs();
});

export default server;
