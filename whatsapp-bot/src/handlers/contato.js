import { cadastrarCliente } from '../api.js';
import { getCadastroSolicitado, getCadastroPerguntaTelefone, getCadastroPerguntaEndereco, getCadastroConfirmacao, getCadastroConfirmado, getCadastroCancelado, getErroBackend } from '../templates.js';

const estados = new Map();
const TTL = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of estados) {
    if (now - entry.timestamp > TTL) estados.delete(key);
  }
}, 60 * 1000);

export function getEstadoCadastro(from) {
  const entry = estados.get(from);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    estados.delete(from);
    return null;
  }
  return entry;
}

export function isAguardandoCadastro(from) {
  return getEstadoCadastro(from) !== null;
}

export async function handleSolicitarCadastro(message, from) {
  await message.startTyping();
  estados.set(from, { state: 'aguardando_nome', data: {}, timestamp: Date.now() });
  await message.reply(getCadastroSolicitado());
}

export async function handleFluxoCadastro(message, from, texto) {
  const estado = getEstadoCadastro(from);
  if (!estado) {
    await handleSolicitarCadastro(message, from);
    return;
  }

  if (texto.toLowerCase() === 'cancelar') {
    estados.delete(from);
    await message.reply(getCadastroCancelado());
    return;
  }

  switch (estado.state) {
    case 'aguardando_nome': {
      estado.data.nome = texto;
      estado.state = 'aguardando_telefone';
      estado.timestamp = Date.now();
      await message.reply(getCadastroPerguntaTelefone());
      break;
    }
    case 'aguardando_telefone': {
      estado.data.telefone = texto;
      estado.state = 'aguardando_endereco';
      estado.timestamp = Date.now();
      await message.reply(getCadastroPerguntaEndereco());
      break;
    }
    case 'aguardando_endereco': {
      estado.data.endereco = texto;
      estado.state = 'confirmar';
      estado.timestamp = Date.now();
      await message.reply(getCadastroConfirmacao(estado.data));
      break;
    }
    case 'confirmar': {
      if (texto.toLowerCase() === 'confirmar') {
        estados.delete(from);
        try {
          await message.startTyping();
          await cadastrarCliente({
            nome: estado.data.nome,
            telefone: estado.data.telefone,
            endereco: estado.data.endereco,
            documento: '',
            email: '',
            observacao: 'Cadastro via WhatsApp',
            ativo: true,
          });
          await message.reply(getCadastroConfirmado());
        } catch (err) {
          console.error('Erro no cadastro:', err.message);
          await message.reply(getErroBackend());
        }
      } else {
        estados.delete(from);
        await message.reply(getCadastroCancelado());
      }
      break;
    }
    default: {
      estados.delete(from);
      await handleSolicitarCadastro(message, from);
    }
  }
}
