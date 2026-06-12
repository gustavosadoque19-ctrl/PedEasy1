import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const { Client, LocalAuth } = pkg;

function findChrome() {
  const paths = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
  ];
  for (const p of paths) {
    if (p && existsSync(p)) return p;
  }
  try {
    return execSync('where chrome 2>nul || where google-chrome 2>nul || where google-chrome-stable 2>nul', { encoding: 'utf-8' }).split('\n')[0].trim();
  } catch {
    return null;
  }
}

const CHROME_PATH = findChrome();

export function criarCliente() {
  const puppeteerOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (CHROME_PATH) {
    puppeteerOpts.executablePath = CHROME_PATH;
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './sessions',
    }),
    puppeteer: puppeteerOpts,
  });

  client.on('qr', (qr) => {
    console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Carregando: ${percent}% - ${message}`);
  });

  client.on('authenticated', () => {
    console.log('✅ WhatsApp autenticado!');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
  });

  client.on('ready', () => {
    try {
      const numero = client.info?.wid?.user || client.info?.me?.user || 'desconhecido';
      console.log(`🤖 Bot PedEasy está online!`);
      console.log(`📞 Número: ${numero}`);
      console.log('📌 Aguardando mensagens...\n');
    } catch (err) {
      console.log('🤖 Bot PedEasy está online!');
      console.log('📌 Aguardando mensagens...\n');
    }
  });

  let reconnectAttempts = 0;
  const MAX_RECONNECT = 5;

  client.on('disconnected', async (reason) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ⚠️ WhatsApp desconectado:`, reason);
    if (reason === 'NAVIGATION' || reason === 'LOGOUT') {
      console.log('🔴 Desconexão permanente. Não será feita reconexão automática.');
      return;
    }
    reconnectAttempts++;
    if (reconnectAttempts > MAX_RECONNECT) {
      console.log('🔴 Número máximo de tentativas de reconexão atingido.');
      return;
    }
    const delay = Math.min(5000 * reconnectAttempts, 30000);
    console.log(`🔄 Tentando reconectar em ${delay / 1000}s... (tentativa ${reconnectAttempts}/${MAX_RECONNECT})`);
    setTimeout(() => {
      client.initialize();
    }, delay);
  });

  client.on('authenticated', () => {
    reconnectAttempts = 0;
  });

  return client;
}
