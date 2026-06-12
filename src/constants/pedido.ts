export const statusLabels: Record<string, string> = {
  aberto: 'Aberto',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  fechado: 'Fechado',
};

export const statusColors: Record<string, 'info' | 'warning' | 'success' | 'default' | 'error'> = {
  aberto: 'info',
  em_preparo: 'warning',
  pronto: 'success',
  entregue: 'default',
  cancelado: 'error',
  fechado: 'default',
};

export const statusIcons: Record<string, string> = {
  aberto: '📥',
  em_preparo: '👨‍🍳',
  pronto: '✅',
  entregue: '📦',
  cancelado: '❌',
  fechado: '🔒',
};
