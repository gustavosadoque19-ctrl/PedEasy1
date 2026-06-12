import { buscarPedido, listarPedidosCliente, criarPedido } from '../api.js';
import { formatarPedido, formatarListaPedidos, getPedidoNaoEncontrado, getErroBackend, getPedidoRepetido, getPedidoOpcoes, getPedidoStatusInstrucao, getPedidoRepetirInstrucao } from '../templates.js';

const estados = new Map();
const TTL = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of estados) {
    if (now - entry.timestamp > TTL) estados.delete(key);
  }
}, 60 * 1000);

export function getEstadoPedido(from) {
  const entry = estados.get(from);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    estados.delete(from);
    return null;
  }
  return entry;
}

export function setEstadoPedido(from, state, data = {}) {
  estados.set(from, { state, data, timestamp: Date.now() });
}

export function limparEstadoPedido(from) {
  estados.delete(from);
}

export async function handlePedido(message, from) {
  setEstadoPedido(from, 'aguardando_opcao');
  await message.reply(getPedidoOpcoes());
}

export async function handleOpcaoPedido(message, from, texto) {
  const estado = getEstadoPedido(from);
  if (!estado) {
    await handlePedido(message, from);
    return;
  }

  if (texto === '1') {
    setEstadoPedido(from, 'aguardando_numero_consulta');
    await message.reply(getPedidoStatusInstrucao());
  } else if (texto === '2') {
    setEstadoPedido(from, 'aguardando_numero_repetir');
    await message.reply(getPedidoRepetirInstrucao());
  } else {
    await handlePedido(message, from);
  }
}

export async function handleConsultarStatus(message, texto) {
  limparEstadoPedido(message.from);
  const match = texto.match(/#?(\d+)/);
  if (!match) {
    await message.reply(getPedidoStatusInstrucao());
    return;
  }
  try {
    await message.startTyping();
    const pedido = await buscarPedido(Number(match[1]));
    await message.reply(formatarPedido(pedido));
  } catch (err) {
    if (err.response?.status === 404) {
      await message.reply(getPedidoNaoEncontrado());
    } else {
      await message.reply(getErroBackend());
    }
  }
}

export async function handleRepetirPedido(message, from, texto) {
  limparEstadoPedido(from);
  const match = texto.match(/#?(\d+)/);
  if (!match) {
    await message.reply(getPedidoRepetirInstrucao());
    return;
  }
  try {
    await message.startTyping();
    const pedidoOriginal = await buscarPedido(Number(match[1]));
    const telefone = from.replace('@c.us', '');
    const novoPedido = await criarPedido({
      cliente_telefone: telefone,
      cliente_nome: pedidoOriginal.cliente_nome,
      tipo: pedidoOriginal.tipo,
      itens: pedidoOriginal.itens.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        produto_nome: item.produto_nome,
        preco_unitario: item.preco_unitario || item.total / item.quantidade,
      })),
      observacao: 'Pedido repetido via WhatsApp',
    });
    await message.reply(getPedidoRepetido(novoPedido.id));
  } catch (err) {
    if (err.response?.status === 404) {
      await message.reply(getPedidoNaoEncontrado());
    } else {
      await message.reply(getErroBackend());
    }
  }
}
