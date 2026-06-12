import { getConfig } from './config.js';

export function getBoasVindas() {
  return getConfig().boasVindas;
}

export function getCardapioResposta() {
  return getConfig().cardapioResposta;
}

export function getPedidoOpcoes() {
  return getConfig().pedidoOpcoes;
}

export function getPedidoStatusInstrucao() {
  return getConfig().pedidoStatusInstrucao;
}

export function getPedidoRepetirInstrucao() {
  return getConfig().pedidoRepetirInstrucao;
}

export function getCadastroSolicitado() {
  return getConfig().cadastroSolicitado;
}

export function getCadastroPerguntaTelefone() {
  return getConfig().cadastroPerguntaTelefone;
}

export function getCadastroPerguntaEndereco() {
  return getConfig().cadastroPerguntaEndereco;
}

export function getCadastroConfirmacao(dados) {
  let msg = getConfig().cadastroConfirmacao;
  msg = msg.replace('{nome}', dados.nome);
  msg = msg.replace('{telefone}', dados.telefone);
  msg = msg.replace('{endereco}', dados.endereco);
  return msg;
}

export function getCadastroConfirmado() {
  return getConfig().cadastroConfirmado;
}

export function getCadastroCancelado() {
  return getConfig().cadastroCancelado;
}

export function getAjudaExplicacao() {
  return getConfig().ajudaExplicacao;
}

export function getAjudaTransferencia() {
  return getConfig().ajudaTransferencia;
}

export function getErroGeral() {
  return getConfig().erroGeral;
}

export function getErroBackend() {
  return getConfig().erroBackend;
}

export function getPedidoNaoEncontrado() {
  return getConfig().pedidoNaoEncontrado;
}

export function getNenhumPedido() {
  return getConfig().nenhumPedido;
}

export function formatarPedido(pedido) {
  const statusLabels = {
    aberto: '📥 Aberto',
    em_preparo: '👨‍🍳 Em Preparo',
    pronto: '✅ Pronto',
    entregue: '📦 Entregue',
    cancelado: '❌ Cancelado',
    fechado: '🔒 Fechado',
  };

  let msg = `🔍 *Pedido #${pedido.id}*\n\n`;
  msg += `*Status:* ${statusLabels[pedido.status] || pedido.status}\n`;
  msg += `*Tipo:* ${pedido.tipo}${pedido.mesa ? ` (Mesa ${pedido.mesa})` : ''}\n`;
  if (pedido.cliente_nome) msg += `*Cliente:* ${pedido.cliente_nome}\n`;
  msg += '\n*Itens:*\n';

  for (const item of pedido.itens || []) {
    msg += `• ${item.produto_nome} x${item.quantidade} - R$ ${item.total.toFixed(2)}\n`;
  }

  msg += `\n*Total:* R$ ${pedido.valor_total.toFixed(2)}`;
  if (pedido.desconto > 0) {
    msg += `\n*Desconto:* -R$ ${pedido.desconto.toFixed(2)}`;
    msg += `\n*Valor Final:* R$ ${(pedido.valor_total - pedido.desconto).toFixed(2)}`;
  }

  msg += `\n*Pagamento:* ${pedido.forma_pagamento.replace(/_/g, ' ').toUpperCase()}`;
  if (pedido.createdAt) {
    msg += `\n*Data:* ${new Date(pedido.createdAt).toLocaleString('pt-BR')}`;
  }

  return msg;
}

export function formatarListaPedidos(pedidos) {
  if (pedidos.length === 0) return getNenhumPedido();

  let msg = '📦 *SEUS PEDIDOS*\n\n';
  for (const p of pedidos) {
    const statusIcons = {
      aberto: '📥', em_preparo: '👨‍🍳', pronto: '✅',
      entregue: '📦', cancelado: '❌', fechado: '🔒',
    };
    const data = p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-';
    msg += `${statusIcons[p.status] || '•'} *Pedido #${p.id}* - ${data}\n`;
    msg += `   R$ ${p.valor_total.toFixed(2)} - ${p.tipo}${p.mesa ? ` M${p.mesa}` : ''}\n\n`;
  }
  return msg;
}

export function getPedidoRepetido(id) {
  return getConfig().pedidoRepetido.replace('{id}', id);
}

export function formatarPedidoPronto(pedido) {
  const statusLabels = {
    aberto: '📥 Aberto',
    em_preparo: '👨‍🍳 Em Preparo',
    pronto: '✅ Pronto',
    entregue: '📦 Entregue',
    cancelado: '❌ Cancelado',
    fechado: '🔒 Fechado',
  };

  let msg = `✅ *Pedido #${pedido.id} Pronto!*\n\n`;
  msg += `*Status:* ${statusLabels[pedido.status] || pedido.status}\n`;
  msg += `*Tipo:* ${pedido.tipo}${pedido.mesa ? ` (Mesa ${pedido.mesa})` : ''}\n`;

  msg += '\n*Itens:*\n';
  for (const item of pedido.itens || []) {
    msg += `• ${item.produto_nome} x${item.quantidade}\n`;
  }

  msg += `\n*Total:* R$ ${pedido.valor_total.toFixed(2)}`;
  if (pedido.desconto > 0) {
    msg += `\n*Valor Final:* R$ ${(pedido.valor_total - pedido.desconto).toFixed(2)}`;
  }

  if (pedido.createdAt) {
    msg += `\n*Data:* ${new Date(pedido.createdAt).toLocaleString('pt-BR')}`;
  }

  msg += '\n\nSeu pedido já está pronto! 🎉';
  return msg;
}
