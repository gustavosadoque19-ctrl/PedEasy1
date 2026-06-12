import { getCardapioResposta } from '../templates.js';

export async function handleCardapio(message) {
  await message.reply(getCardapioResposta());
}
