import { Client } from '@pagarme/pagarme-nodejs-sdk';

const SECRET_KEY = process.env.PAGARME_SECRET_KEY;

let client = null;

function getClient() {
  if (!SECRET_KEY) {
    throw new Error('PAGARME_SECRET_KEY não configurada no .env');
  }
  if (!client) {
    client = new Client({
      basicAuthCredentials: { username: SECRET_KEY, password: '' },
      timeout: 30000,
    });
  }
  return client;
}

export async function criarCustomer(tenant) {
  const c = getClient();
  const result = await c.customers.create({
    name: tenant.nome,
    email: tenant.email || `${tenant.slug}@pedy.app`,
    code: String(tenant.id),
    type: 'individual',
  });
  return result;
}

export async function criarAssinatura(customerId, planId, cardData, tenantId) {
  const c = getClient();
  const result = await c.subscriptions.create({
    customer_id: customerId,
    plan_id: planId,
    payment_method: 'credit_card',
    card: {
      number: cardData.number.replace(/\s/g, ''),
      holder_name: cardData.holder_name,
      exp_month: parseInt(cardData.exp_month, 10),
      exp_year: parseInt(cardData.exp_year, 10),
      cvv: cardData.cvv,
    },
    installments: 1,
    metadata: { tenant_id: String(tenantId) },
  });
  return result;
}

export async function cancelarAssinatura(subscriptionId) {
  const c = getClient();
  const result = await c.subscriptions.cancel({ subscription_id: subscriptionId });
  return result;
}

export async function criarOrdemPagamento(data) {
  const c = getClient();
  const result = await c.orders.create({
    customer_id: data.customerId,
    items: data.items,
    payments: data.payments,
    metadata: { tenant_id: String(data.tenantId), pedido_id: String(data.pedidoId) },
  });
  return result;
}

export async function getAssinatura(subscriptionId) {
  const c = getClient();
  const result = await c.subscriptions.get({ subscription_id: subscriptionId });
  return result;
}

export async function getOrder(orderId) {
  const c = getClient();
  const result = await c.orders.get({ order_id: orderId });
  return result;
}
