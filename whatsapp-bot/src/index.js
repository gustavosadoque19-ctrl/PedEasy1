import { criarCliente } from './client.js';
import { rotearMensagem } from './handlers/index.js';
import { getConfig, saveConfig, reloadConfig } from './config.js';
import { formatarPedidoPronto } from './templates.js';
import express from 'express';
import axios from 'axios';

const CONFIG_PORT = process.env.CONFIG_PORT || 3001;
const API_KEY = process.env.BOT_API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const reqLog = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
};

const requireAuth = (req, res, next) => {
  if (!API_KEY) return next();
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'API key inválida' });
  }
  next();
};

const rateLimits = new Map();
const RATE_WINDOW = 60000;
const RATE_MAX = 30;

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }
  const timestamps = rateLimits.get(ip).filter((t) => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_MAX) {
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
  }
  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  next();
};

const app = express();
app.use(express.json());
app.use(reqLog);
app.use(rateLimit);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => {
  const cfg = getConfig();
  res.json({
    status: 'ok',
    bot: cfg.bot_ativo ? (whatsappClient ? 'conectado' : 'desconectado') : 'desativado',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/config', (req, res) => {
  res.json(getConfig());
});

app.put('/config', requireAuth, (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Corpo da requisição inválido' });
    }
    const updated = saveConfig(req.body);
    const ts = new Date().toISOString();
    console.log(`[${ts}] ⚙️ Configuração do bot atualizada!`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/config/reload', requireAuth, (req, res) => {
  reloadConfig();
  res.json({ ok: true });
});

let whatsappClient = null;

app.post('/send-message', requireAuth, async (req, res) => {
  try {
    const { telefone, pedidoId } = req.body;
    if (!telefone || !pedidoId) {
      return res.status(400).json({ error: 'telefone e pedidoId são obrigatórios' });
    }
    if (!whatsappClient) {
      return res.status(503).json({ error: 'WhatsApp não está conectado' });
    }
    const chatId = telefone.includes('@c.us') ? telefone : `${telefone}@c.us`;

    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    const { data: pedido } = await axios.get(`${apiUrl}/pedidos/${pedidoId}`);

    const mensagem = formatarPedidoPronto(pedido);
    await whatsappClient.sendMessage(chatId, mensagem);
    const ts = new Date().toISOString();
    console.log(`[${ts}] 📤 Notificação enviada para ${telefone} - Pedido #${pedidoId}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Erro ao enviar mensagem:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(CONFIG_PORT, () => {
  console.log(`⚙️ API de configuração rodando em http://localhost:${CONFIG_PORT}`);
  if (API_KEY) console.log('🔑 Autenticação via API key ativada');
});

const config = getConfig();

if (config.bot_ativo) {
  console.log('🚀 Iniciando PedEasy WhatsApp Bot...\n');

  const client = criarCliente();
  whatsappClient = client;

  process.on('unhandledRejection', (reason) => {
    console.error(`[${new Date().toISOString()}] ❌ Unhandled Rejection:`, reason);
  });

  client.on('message', async (message) => {
    try {
      if (message.from === 'status@broadcast') return;
      if (message.isGroup) return;
      if (message.type !== 'chat' && message.type !== 'text') return;

      const texto = message.body || '';
      const ts = new Date().toISOString();
      console.log(`[${ts}] 📩 Mensagem de ${message.from}: ${texto}`);
      await rotearMensagem(client, message);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ❌ Erro no message handler:`, err);
    }
  });

  client.initialize();
} else {
  console.log('⏸️ Bot WhatsApp desativado (bot_ativo=false). Ative na página de configuração.');
}

const gracefulShutdown = async (signal) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] 📴 Recebido ${signal}. Encerrando...`);
  server.close();
  if (whatsappClient?.destroy) {
    try {
      await whatsappClient.destroy();
      console.log(`[${ts}] ✅ Cliente WhatsApp destruído`);
    } catch (err) {
      console.error(`[${ts}] ❌ Erro ao destruir cliente:`, err.message);
    }
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
