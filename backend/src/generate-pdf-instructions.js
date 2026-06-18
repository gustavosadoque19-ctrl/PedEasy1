import PDFDocument from 'pdfkit';
import { writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const OUTPUT_PATH = join(OUTPUT_DIR, 'instrucoes-deploy.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Instruções de Deploy - PedEasy',
    Author: 'PedEasy',
    Subject: 'Configuração de produção com SQLite por tenant',
  },
});

doc.pipe(createWriteStream(OUTPUT_PATH));

function titulo(texto) {
  doc.font('Helvetica-Bold').fontSize(22).text(texto, { align: 'center' });
  doc.moveDown(1);
}

function secao(texto) {
  doc.font('Helvetica-Bold').fontSize(14).text(texto);
  doc.moveDown(0.5);
}

function subsecao(texto) {
  doc.font('Helvetica-Bold').fontSize(11).text(texto);
  doc.moveDown(0.3);
}

function texto(texto) {
  doc.font('Helvetica').fontSize(10).text(texto, { align: 'justify' });
  doc.moveDown(0.5);
}

function codigo(texto) {
  doc.font('Courier').fontSize(9).fillColor('#333');
  doc.text(texto, { indent: 10 });
  doc.fillColor('#000');
  doc.moveDown(0.5);
}

function lista(itens) {
  doc.font('Helvetica').fontSize(10);
  for (const item of itens) {
    doc.text(`  \u2022 ${item}`, { indent: 10 });
  }
  doc.moveDown(0.5);
}

function linha() {
  doc.moveDown(0.3);
  doc.fontSize(10).text('\u2500'.repeat(70), { align: 'center' });
  doc.moveDown(0.3);
}

// ============================================================
titulo('PedEasy \u2014 Instru\u00E7\u00F5es de Deploy');
texto('Arquitetura: backend Node.js + SQLite por tenant + frontend React (Vite) + Docker');
doc.moveDown(1);

// ============================================================
secao('1. Pr\u00E9-requisitos');
lista([
  'Git',
  'Docker + Docker Compose',
  'Um VPS ou servidor com Docker instalado (Linux recomendado)',
  'Um dom\u00EDnio (opcional, para produ\u00E7\u00E3o)',
  'Conta no Vercel para o frontend (opcional)',
]);
doc.moveDown(0.5);

// ============================================================
secao('2. Clonar o reposit\u00F3rio');
codigo('git clone https://github.com/gustavosadoque19-ctrl/PedEasy1.git');
codigo('cd PedEasy1');
doc.moveDown(0.5);

// ============================================================
secao('3. Configurar vari\u00E1veis de ambiente');
texto('Crie um arquivo .env na raiz do projeto:');

codigo([
  '# Obrigat\u00F3rias',
  'JWT_SECRET=coloque-uma-chave-secreta-forte-aqui',
  '',
  '# Frontend (URL p\u00FAblica do backend para o Vercel)',
  '# VITE_API_URL=https://api.seudominio.com/api',
  '',
  '# Pagar.me (para processar pagamentos)',
  'PAGARME_SECRET_KEY=sk_...',
  'PAGARME_PLAN_PRO=plan_...',
  'PAGARME_PLAN_ENTERPRISE=plan_...',
  '',
  '# Focus NFe (para emiss\u00E3o de notas fiscais)',
  'FOCUS_TOKEN=...',
  'FOCUS_CNPJ=...',
  'FOCUS_CIDADE=Sao Paulo',
  'FOCUS_UF=SP',
  '',
  '# WhatsApp Bot',
  'BOT_API_KEY=...',
].join('\n'));
doc.moveDown(0.5);

// ============================================================
secao('4. Subir com Docker Compose');
texto('O docker-compose.yml j\u00E1 est\u00E1 configurado para subir 3 servi\u00E7os:');
lista([
  'frontend (nginx porta 80)',
  'backend (Express porta 3000)',
  'bot (WhatsApp porta 3001)',
]);

codigo('docker compose up -d --build');
doc.moveDown(0.5);

subsecao('Verificar se os containers est\u00E3o rodando:');
codigo('docker compose ps');

subsecao('Ver logs do backend:');
codigo('docker compose logs -f backend');
doc.moveDown(0.5);

// ============================================================
secao('5. Executar o Seed (primeira execu\u00E7\u00E3o)');
texto('Ap\u00F3s subir os containers, execute o seed para criar o primeiro tenant e dados iniciais:');
codigo('docker compose exec backend npm run seed');
texto('Isso cria:');
lista([
  'Tenant "Estabelecimento Padr\u00E3o" (admin@pedy.com / admin)',
  'Usu\u00E1rio administrador no banco global',
  'Banco SQLite do tenant com produtos, clientes e funcion\u00E1rios de exemplo',
]);
doc.moveDown(0.5);

// ============================================================
secao('6. Acessar o sistema');
lista([
  'Frontend: http://localhost (porta 80)',
  'Backend API: http://localhost:3000/api',
  'Login SaaS: admin@pedy.com / admin',
]);
doc.moveDown(0.5);

// ============================================================
secao('7. Deploy do Frontend no Vercel (opcional)');
texto('Se quiser usar o Vercel apenas para o frontend:');
lista([
  'Conecte o reposit\u00F3rio no Vercel',
  'Em Settings \u2192 Environment Variables, adicione:',
]);
codigo('VITE_API_URL=https://seudominio.com/api');
lista([
  'Fa\u00E7a o deploy (a main j\u00E1 est\u00E1 configurada com vercel.json para SPA)',
  'O backend precisa estar rodando em um servidor acess\u00EDvel publicamente',
]);
doc.moveDown(0.5);

// ============================================================
secao('8. Novo tenant (cadastro)');
texto('Pelo formul\u00E1rio de signup do SaaS, um novo tenant \u00E9 criado com:');
lista([
  'Registro no banco global (tenants + tenant_users)',
  'Cria\u00E7\u00E3o autom\u00E1tica de um novo arquivo SQLite (tenant-{id}.db)',
  'Todas as tabelas s\u00E3o criadas via schema.sql',
  'O tenant j\u00E1 fica pronto para uso imediato',
]);
doc.moveDown(0.5);

// ============================================================
secao('9. Backup dos dados');
texto('Os bancos SQLite ficam em backend/data/. Para backup:');
codigo('docker compose exec backend tar -czf /tmp/backup-data.tar.gz -C /app/data .');
codigo('docker compose cp backend:/tmp/backup-data.tar.gz ./backup-$(date +%Y%m%d).tar.gz');
doc.moveDown(0.5);

// ============================================================
secao('10. Comandos \u00FAteis');

subsecao('Reconstruir e reiniciar:');
codigo('docker compose down');
codigo('docker compose up -d --build');

subsecao('Ver logs:');
codigo('docker compose logs -f backend');

subsecao('Executar comandos no backend:');
codigo('docker compose exec backend npm run seed');

subsecao('Acessar o banco SQLite diretamente:');
codigo('docker compose exec backend sqlite3 /app/data/tenant-1.db');
codigo('.tables');
codigo('SELECT * FROM produtos;');

doc.moveDown(1);

// ============================================================
linha();
texto('Documenta\u00E7\u00E3o gerada em ' + new Date().toLocaleString('pt-BR'));
doc.moveDown(2);

doc.end();

console.log(`\u2705 PDF gerado: ${OUTPUT_PATH}`);