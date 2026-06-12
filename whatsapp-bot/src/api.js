import axios from 'axios';

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function listarProdutos() {
  const { data } = await api.get('/produtos');
  return data.filter((p) => p.ativo);
}

export async function buscarPedido(id) {
  const { data } = await api.get(`/pedidos/${id}`);
  return data;
}

export async function listarPedidosCliente(telefone) {
  const { data } = await api.get('/pedidos');
  const digitos = telefone.replace(/\D/g, '');
  return data.filter((p) => {
    const telCliente = (p.cliente_telefone || '').replace(/\D/g, '');
    return telCliente.includes(digitos) || telCliente.slice(-8) === digitos.slice(-8);
  });
}

export async function cadastrarCliente(dados) {
  const { data } = await api.post('/clientes', dados);
  return data;
}

export async function criarPedido(dados) {
  const { data } = await api.post('/cardapio/pedidos', dados);
  return data;
}

export default api;
