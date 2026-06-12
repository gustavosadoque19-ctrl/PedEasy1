import axios from 'axios';

export async function notificarCliente(pedidoId: number, telefone: string) {
  try {
    if (!telefone) return false;
    const botUrl = import.meta.env.VITE_BOT_API_URL || localStorage.getItem('bot_api_url') || 'http://localhost:3001';
    await axios.post(`${botUrl}/send-message`, {
      telefone,
      pedidoId,
    }, { timeout: 5000 });
    console.info(`📤 Notificação enviada para ${telefone} - Pedido #${pedidoId}`);
    return true;
  } catch (err) {
    console.warn('⚠️ Não foi possível notificar o cliente via WhatsApp:', err);
    return false;
  }
}
