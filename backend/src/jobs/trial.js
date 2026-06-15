import cron from 'node-cron';
import { supabase } from '../supabaseClient.js';
import { logger } from '../logger.js';

export function startTrialJobs() {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[Trial Job] Verificando trials a expirar...');
    const until = new Date(Date.now() + 3 * 86400000).toISOString();
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, nome, slug')
      .eq('status', 'trial')
      .lte('trial_ends_at', until);
    for (const tenant of tenants || []) {
      logger.info(`Trial expirando em breve: ${tenant.nome} (${tenant.slug})`);
    }
  });

  cron.schedule('0 23 * * *', async () => {
    logger.info('[Trial Job] Suspending expired trials...');
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, nome, slug')
      .eq('status', 'trial')
      .lte('trial_ends_at', new Date().toISOString());
    for (const tenant of tenants || []) {
      await supabase.from('tenants').update({ status: 'suspended' }).eq('id', tenant.id);
      logger.info(`Trial suspenso: ${tenant.nome} (${tenant.slug})`);
    }
  });

  logger.info('[Trial Job] Agendador de trials iniciado');
}
