export interface Cliente {
  id?: number;
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  observacao: string;
  ativo: boolean;
  createdAt?: string;
}

export interface CategoriaAdicional {
  id?: number;
  nome: string;
  ativo: boolean;
  createdAt?: string;
}

export interface Adicional {
  id?: number;
  nome: string;
  preco: number;
  categoria_id: number;
  categoria_nome?: string;
  ativo: boolean;
  createdAt?: string;
}

export interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  categoria: string;
  preco_venda: number;
  preco_custo: number;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
  imagem?: string;
  adicionais_ids?: number[];
  max_adicionais?: number;
  ncm?: string;
  createdAt?: string;
}

export interface Funcionario {
  id?: number;
  nome: string;
  usuario: string;
  senha?: string;
  cargo: string;
  telefone: string;
  email: string;
  permissao: string;
  ativo: boolean;
  createdAt?: string;
}

export interface Pedido {
  id?: number;
  cliente_id?: number;
  cliente_nome?: string;
  cliente_telefone?: string;
  funcionario_id: number;
  funcionario_nome?: string;
  tipo: 'mesa' | 'comanda' | 'delivery' | 'balcao';
  mesa?: string;
  status: 'aberto' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado' | 'fechado';
  forma_pagamento: string;
  valor_total: number;
  desconto: number;
  observacao: string;
  itens: PedidoItem[];
  createdAt?: string;
  endereco_entrega?: string;
  taxa_entrega?: number;
  troco_para?: number;
}

export interface PedidoItem {
  id?: number;
  pedido_id?: number;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  observacao: string;
  adicionais?: Adicional[];
  ncm?: string;
}

export interface EstoqueMovimento {
  id?: number;
  produto_id: number;
  produto_nome?: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  funcionario_id: number;
  funcionario_nome?: string;
  createdAt?: string;
}

export interface Caixa {
  id?: number;
  funcionario_id: number;
  funcionario_nome?: string;
  data_abertura: string;
  data_fechamento?: string;
  saldo_inicial: number;
  saldo_final?: number;
  status: 'aberto' | 'fechado';
  movimentos?: CaixaMovimento[];
}

export interface CaixaMovimento {
  id?: number;
  caixa_id: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  valor: number;
  descricao: string;
  forma_pagamento: string;
  pedido_id?: number;
  createdAt?: string;
}

export interface RelatorioVendas {
  periodo: string;
  total_vendas: number;
  total_recebido: number;
  total_descontos: number;
  quantidade_pedidos: number;
  ticket_medio: number;
  vendas_por_forma_pagamento: { forma: string; total: number }[];
  produtos_mais_vendidos: { produto: string; quantidade: number; total: number }[];
}

export interface NFe {
  id?: number;
  pedido_id: number;
  cliente_id?: number;
  numero_nf?: string;
  chave_acesso?: string;
  status: 'pendente' | 'autorizada' | 'cancelada' | 'rejeitada';
  xml?: string;
  valor: number;
  ref?: string;
  protocolo?: string;
  url_danfe?: string;
  url_qrcode?: string;
  createdAt?: string;
}

export interface FocusConfig {
  token: string | null;
  ambiente: 'homologacao' | 'producao';
  cidade: string;
  uf: string;
}

export interface User {
  id: number;
  nome: string;
  usuario: string;
  cargo: string;
  permissao: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Cupom {
  id?: number;
  codigo: string;
  tipo: 'percentual' | 'fixo';
  valor: number;
  valor_minimo_pedido: number;
  uso_maximo: number;
  usos_atuais: number;
  expiracao: string;
  ativo: boolean;
  createdAt?: string;
}

export interface FidelidadeConfig {
  pontos_por_real: number;
  pontos_minimo_resgate: number;
  valor_resgate_por_ponto: number;
  ativo: boolean;
}

export interface FidelidadeCliente {
  id?: number;
  cliente_id: number;
  cliente_nome?: string;
  pontos: number;
  total_gasto: number;
  createdAt?: string;
}

export interface NPSPesquisa {
  id?: number;
  cliente_id?: number;
  cliente_nome?: string;
  nota: number;
  comentario: string;
  origem: string;
  createdAt?: string;
}

export interface CarrinhoAbandonado {
  id?: number;
  cliente_id?: number;
  cliente_nome?: string;
  cliente_telefone?: string;
  itens: PedidoItem[];
  valor_total: number;
  status: 'pendente' | 'recuperado' | 'perdido';
  whatsapp_enviado: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PagamentoOnline {
  id?: number;
  pedido_id: number;
  valor: number;
  forma: 'pix' | 'cartao_credito' | 'cartao_debito';
  status: 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
  transacao_id?: string;
  qr_code?: string;
  cobranca?: string;
  createdAt?: string;
}

export interface IntegracaoPDV {
  id?: number;
  nome: string;
  tipo: 'ifood' | 'delivery' | 'erp' | 'outro';
  api_url: string;
  api_key: string;
  ativo: boolean;
  ultima_sync?: string;
  createdAt?: string;
}
