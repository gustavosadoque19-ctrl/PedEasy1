import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', 'config.json');

const DEFAULTS = {
  bot_ativo: true,
  boasVindas: 'Olá! Sou o assistente virtual. Como posso agilizar seu atendimento hoje? Digite uma das opções:\n👉 *Cardápio* (Para ver nossas opções)\n👉 *Pedido* (Para acompanhar ou repetir)\n👉 *Cadastro* (Para atualizar seus dados)\n👉 *Ajuda* (Se precisar de suporte)',
  cardapioResposta: 'Aqui está o nosso cardápio digital: [INSERIR LINK]',
  pedidoOpcoes: 'O que você deseja fazer?\n1️⃣ *Consultar status* de um pedido em andamento\n2️⃣ *Repetir* um pedido realizado anteriormente\n\nDigite *1* ou *2* para escolher.',
  pedidoStatusInstrucao: 'Informe o número do pedido que deseja consultar. Ex: *#123*',
  pedidoRepetirInstrucao: 'Informe o número do pedido que deseja repetir. Ex: *#123*',
  cadastroSolicitado: 'Vamos fazer seu cadastro! Primeiro, informe seu *nome completo*:',
  cadastroPerguntaTelefone: 'Ótimo! Agora informe seu *telefone para contato*:',
  cadastroPerguntaEndereco: 'Perfeito! Por último, informe seu *endereço de entrega*:',
  cadastroConfirmacao: 'Confirme os dados informados:\n\n*Nome:* {nome}\n*Telefone:* {telefone}\n*Endereço:* {endereco}\n\nDigite *confirmar* para finalizar ou *cancelar* para reiniciar.',
  cadastroConfirmado: '✅ Cadastro realizado com sucesso! Agora você pode consultar pedidos e fazer pedidos pelo WhatsApp.',
  cadastroCancelado: '❌ Cadastro cancelado. Digite *cadastro* quando quiser tentar novamente.',
  ajudaExplicacao: '*Comandos disponíveis:*\n\n📋 *Cardápio* - Ver o cardápio digital\n📦 *Pedido* - Consultar status ou repetir um pedido\n📝 *Cadastro* - Atualizar seus dados cadastrais\n❓ *Ajuda* - Mostrar esta mensagem',
  ajudaTransferencia: 'Vou transferir você para um de nossos atendentes humanos para resolver isso rapidamente.',
  erroGeral: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
  erroBackend: 'Sistema temporariamente indisponível. Tente novamente em instantes.',
  pedidoNaoEncontrado: 'Pedido não encontrado. Verifique o número informado.',
  nenhumPedido: 'Nenhum pedido encontrado para este contato.',
  pedidoRepetido: '✅ Pedido #{id} registrado com sucesso! Em breve você receberá a confirmação.',
};

let cachedConfig = null;

function validateConfig(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Configuração inválida');
  }
  if (data.bot_ativo !== undefined && typeof data.bot_ativo !== 'boolean') {
    throw new Error('Campo "bot_ativo" deve ser verdadeiro ou falso');
  }
  const stringFields = [
    'boasVindas', 'cardapioResposta', 'pedidoOpcoes',
    'pedidoStatusInstrucao', 'pedidoRepetirInstrucao',
    'cadastroSolicitado', 'cadastroPerguntaTelefone', 'cadastroPerguntaEndereco',
    'cadastroConfirmacao', 'cadastroConfirmado', 'cadastroCancelado',
    'ajudaExplicacao', 'ajudaTransferencia',
    'erroGeral', 'erroBackend', 'pedidoNaoEncontrado', 'nenhumPedido', 'pedidoRepetido',
  ];
  for (const key of Object.keys(data)) {
    if (!stringFields.includes(key)) continue;
    if (typeof data[key] !== 'string') {
      throw new Error(`Campo "${key}" deve ser uma string`);
    }
    if (data[key].length > 5000) {
      throw new Error(`Campo "${key}" excede o limite de 5000 caracteres`);
    }
  }
  return true;
}

export function getConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      cachedConfig = { ...DEFAULTS, ...JSON.parse(raw) };
    } else {
      cachedConfig = { ...DEFAULTS };
    }
  } catch {
    cachedConfig = { ...DEFAULTS };
  }
  return cachedConfig;
}

export function saveConfig(data) {
  validateConfig(data);
  const merged = { ...DEFAULTS, ...data };
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  cachedConfig = merged;
  return merged;
}

export function reloadConfig() {
  cachedConfig = null;
  return getConfig();
}
