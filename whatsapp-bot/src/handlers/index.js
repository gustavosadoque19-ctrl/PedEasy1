import { handleCardapio } from './cardapio.js';
import { handlePedido, handleOpcaoPedido, handleConsultarStatus, handleRepetirPedido, getEstadoPedido, limparEstadoPedido } from './pedido.js';
import { handleSolicitarCadastro, handleFluxoCadastro, isAguardandoCadastro } from './contato.js';
import { getBoasVindas, getAjudaExplicacao, getAjudaTransferencia, getErroGeral } from '../templates.js';

export async function rotearMensagem(client, message) {
  try {
    const from = message.from;
    const texto = message.body?.trim() || '';
    const textoLower = texto.toLowerCase();

    if (isAguardandoCadastro(from)) {
      await handleFluxoCadastro(message, from, texto);
      return;
    }

    const estadoPedido = getEstadoPedido(from);
    if (estadoPedido) {
      if (estadoPedido.state === 'aguardando_opcao') {
        await handleOpcaoPedido(message, from, textoLower);
        return;
      }
      if (estadoPedido.state === 'aguardando_numero_consulta') {
        await handleConsultarStatus(message, texto);
        return;
      }
      if (estadoPedido.state === 'aguardando_numero_repetir') {
        await handleRepetirPedido(message, from, texto);
        return;
      }
      limparEstadoPedido(from);
    }

    if (/^(ola|olá|oi|bom dia|boa tarde|boa noite|oie|beleza|quero)/.test(textoLower)) {
      await message.reply(getBoasVindas());
      return;
    }

    if (/^(cardapio|cardápio|menu|catalogo|catálogo|produtos)/.test(textoLower)) {
      await handleCardapio(message);
      return;
    }

    if (/^(pedido|pedidos)/.test(textoLower)) {
      await handlePedido(message, from);
      return;
    }

    if (/^(cadastro|cadastrar|cadastre)/.test(textoLower)) {
      await handleSolicitarCadastro(message, from);
      return;
    }

    if (/^(ajuda|comandos|opcoes|opções)/.test(textoLower)) {
      await message.reply(getAjudaExplicacao());
      return;
    }

    if (/^(erro|problema|dificuldade|não funciona|nao funciona|bug)/.test(textoLower)) {
      await message.reply(getAjudaTransferencia());
      return;
    }

    await message.reply(getBoasVindas());
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
    try {
      await message.reply(getErroGeral());
    } catch (innerErr) {
      console.error('Erro ao enviar mensagem de erro:', innerErr.message);
    }
  }
}
