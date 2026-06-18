import crypto from 'crypto';
import { logger } from '../logger.js';

const WEBHOOK_SECRET = process.env.PAGARME_WEBHOOK_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Verifica a assinatura HMAC-SHA1 do webhook da Pagar.me.
 *
 * A Pagar.me envia o header `X-Hub-Signature` no formato `sha1=<hex-hmac>`
 * calculado sobre o corpo bruto (raw body) da requisição usando a chave
 * configurada no painel da Pagar.me (PAGARME_WEBHOOK_SECRET).
 *
 * Sem esta verificação qualquer pessoa pode POSTAR eventos falsos
 * (ex: subscription.canceled) e rebaixar/cancelar tenants alheios.
 *
 * Em desenvolvimento (PAGARME_WEBHOOK_SECRET ausente e NODE_ENV != production)
 * o middleware aceita a requisição mas loga um warning, para permitir testes
 * locais. Em produção o boot em index.js já falha se o secret faltar.
 */
export function webhookSignature(req, res, next) {
  // Modo dev: sem secret configurado, aceita com warning.
  if (!WEBHOOK_SECRET && !IS_PROD) {
    logger.warn('[Webhook] PAGARME_WEBHOOK_SECRET ausente — verificação HMAC desativada (apenas dev/test).');
    return next();
  }
  if (!WEBHOOK_SECRET) {
    // Em produção isto não deveria ocorrer (boot valida), mas defende em profundidade.
    logger.error('[Webhook] Requisição recebida sem PAGARME_WEBHOOK_SECRET em produção.');
    return res.status(500).json({ error: 'Webhook secret não configurado' });
  }

  const signatureHeader = req.headers['x-hub-signature'] || req.headers['hub-signature'];
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    logger.warn('[Webhook] Requisição sem header de assinatura.');
    return res.status(401).json({ error: 'Assinatura ausente' });
  }

  const match = signatureHeader.match(/^sha1=([a-fA-F0-9]+)$/);
  if (!match) {
    logger.warn(`[Webhook] Formato de assinatura inválido: ${signatureHeader}`);
    return res.status(401).json({ error: 'Formato de assinatura inválido' });
  }

  const received = Buffer.from(match[1], 'hex');
  const rawBody = req.rawBody;
  if (!rawBody) {
    logger.error('[Webhook] rawBody indisponível — express.json precisa de verify.');
    return res.status(500).json({ error: 'Corpo bruto indisponível' });
  }

  const computed = crypto
    .createHmac('sha1', WEBHOOK_SECRET)
    .update(rawBody)
    .digest();

  if (received.length !== computed.length || !crypto.timingSafeEqual(received, computed)) {
    logger.warn('[Webhook] Assinatura HMAC inválida — requisição rejeitada.');
    return res.status(401).json({ error: 'Assinatura inválida' });
  }

  next();
}
