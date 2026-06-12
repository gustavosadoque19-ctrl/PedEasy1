import axios from 'axios';

const FOCUS_API = process.env.FOCUS_API_URL || 'https://api.focusnfe.com.br';

function getAuthToken() {
  const token = process.env.FOCUS_TOKEN;
  if (!token) throw new Error('FOCUS_TOKEN não configurado');
  return token;
}

function api() {
  const token = getAuthToken();
  return axios.create({
    baseURL: FOCUS_API,
    headers: {
      'Content-Type': 'application/json',
    },
    auth: { username: token, password: '' },
    timeout: 30000,
  });
}

export async function emitirNFCe(dados) {
  const ref = `pedido-${dados.pedido_id}-${Date.now()}`;
  const payload = {
    referencia: ref,
    natureza_operacao: 'Venda ao consumidor',
    data_emissao: new Date().toISOString(),
    tipo_documento: '1',
    finalidade_emissao: '1',
    destino_operacao: '1',
    consumidor_final: '1',
    presenca_comprador: '1',
    ...dados,
  };
  const response = await api().post('/v2/nfce?ref=' + ref, payload);
  return { ref, ...response.data };
}

export async function consultarNFCe(ref) {
  const response = await api().get(`/v2/nfce/${ref}`);
  return response.data;
}

export async function cancelarNFCe(ref, motivo) {
  const response = await api().delete(`/v2/nfce/${ref}`, {
    data: { justificativa: motivo },
  });
  return response.data;
}

export async function enviarEmail(ref, email) {
  const response = await api().post(`/v2/nfce/${ref}/email`, {
    email,
  });
  return response.data;
}
