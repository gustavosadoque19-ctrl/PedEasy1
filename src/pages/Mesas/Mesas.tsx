import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, TextField, InputAdornment,
  IconButton, Checkbox,
} from '@mui/material';
import type { ReactNode } from 'react';
import TableRestaurant from '@mui/icons-material/TableRestaurant';
import Visibility from '@mui/icons-material/Visibility';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Refresh from '@mui/icons-material/Refresh';
import Fastfood from '@mui/icons-material/Fastfood';
import AccessTime from '@mui/icons-material/AccessTime';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Cancel from '@mui/icons-material/Cancel';
import Delete from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Search from '@mui/icons-material/Search';
import Remove from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import MoreVert from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { getPedidos, createPedido, updatePedido } from '../../api/pedidos';
import { getProdutos } from '../../api/produtos';
import { getClientes } from '../../api/clientes';
import { getAdicionais, getCategoriasAdicionais } from '../../api/adicionais';
import { notificarCliente } from '../../api/notificacao';
import { Pedido, PedidoItem, Produto, Cliente, Adicional, CategoriaAdicional } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { statusLabels, statusColors } from '../../constants/pedido';
import { useSnackbar } from '../../hooks/useSnackbar';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string;   icon: React.ReactElement }> = {
  livre: {
    label: 'Livre', color: '#2E7D32', bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', border: '#4CAF50',
    icon: <CheckCircle sx={{ fontSize: 14 }} />,
  },
  ocupada: {
    label: 'Ocupada', color: '#C62828', bg: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)', border: '#E53935',
    icon: <Fastfood sx={{ fontSize: 14 }} />,
  },
};

function timeElapsed(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const rest = mins % 60;
  return `${hrs}h${rest > 0 ? rest + 'm' : ''}`;
}

const nextStatus: Record<string, { label: string; color: 'warning' | 'success' | 'info' | 'secondary';   icon: ReactNode } | null> = {
  aberto: { label: 'Iniciar Preparo', color: 'warning', icon: <PlayArrow /> },
  em_preparo: { label: 'Marcar como Pronto', color: 'success', icon: <CheckCircle /> },
  pronto: { label: 'Finalizar Entrega', color: 'info', icon: <CheckCircle /> },
  entregue: { label: 'Finalizar Pedido', color: 'secondary', icon: <CheckCircle /> },
  fechado: null,
  cancelado: null,
};

function calcTotal(itens: PedidoItem[]): number {
  return itens.reduce((sum, i) => sum + (i.total || i.quantidade * i.preco_unitario), 0);
}

function groupAdicionaisByCategoria(adicionais: Adicional[]): Map<string, Adicional[]> {
  const map = new Map<string, Adicional[]>();
  for (const a of adicionais) {
    const cat = a.categoria_nome || 'Outros';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(a);
  }
  return map;
}

export default function Mesas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const snackbar = useSnackbar();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMesa, setSelectedMesa] = useState<string | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pedido | null>(null);

  const [openAddProduto, setOpenAddProduto] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addQtd, setAddQtd] = useState<Record<number, number>>({});
  const [updatingItems, setUpdatingItems] = useState(false);

  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; numero: number } | null>(null);

  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [customizeProduto, setCustomizeProduto] = useState<Produto | null>(null);
  const [customizeQtd, setCustomizeQtd] = useState(1);
  const [selectedAdicionais, setSelectedAdicionais] = useState<Adicional[]>([]);
  const [itemObservacao, setItemObservacao] = useState('');
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const quantidadeMesas = parseInt(localStorage.getItem('app_config_quantidade_mesas') || '15', 10);

  const mountedRef = useRef(true);

  const snackbarRef = useRef(snackbar);
  useEffect(() => { snackbarRef.current = snackbar; });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pedRes, prodRes, cliRes, adicRes, catAdicRes] = await Promise.all([
        getPedidos(), getProdutos(), getClientes(), getAdicionais(), getCategoriasAdicionais(),
      ]);
      if (!mountedRef.current) return;
      setPedidos(pedRes.data);
      setProdutos(prodRes.data.filter((p: Produto) => p.ativo !== false));
      setClientes(cliRes.data);
      const catAtivas = (catAdicRes.data || []).filter((c: CategoriaAdicional) => c.ativo !== false);
      const todosAdicionais = (adicRes.data || []).filter((a: Adicional) => a.ativo !== false);
      const adicionaisComCat = todosAdicionais.map((a: Adicional) => {
        const cat = catAtivas.find((c: CategoriaAdicional) => c.id === a.categoria_id);
        return { ...a, categoria_nome: cat ? cat.nome : 'Outros' };
      });
      setAdicionais(adicionaisComCat);
      if (adicionaisComCat.length > 0) {
        localStorage.setItem('mock_adicionais', JSON.stringify(adicionaisComCat));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
      snackbarRef.current.error('Erro ao carregar dados');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    return () => { mountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mesasOcupadas = pedidos.filter(
    (p) => p.tipo === 'mesa' && p.mesa && p.status !== 'fechado' && p.status !== 'cancelado'
  );

  const getMesaStatus = (numero: number): 'livre' | 'ocupada' => {
    const mesaStr = String(numero);
    return mesasOcupadas.some((p) => p.mesa === mesaStr) ? 'ocupada' : 'livre';
  };

  const getMesaPedido = (numero: number): Pedido | undefined => {
    return mesasOcupadas.find((p) => p.mesa === String(numero));
  };

  const handleMesaClick = (numero: number) => {
    const pedido = getMesaPedido(numero);
    setSelectedMesa(String(numero));
    setSelectedPedido(pedido || null);
    setOpenDialog(true);
  };

  const handleVendaFacil = async (numero: number) => {
    const pedido = getMesaPedido(numero);
    if (pedido) {
      setSelectedMesa(String(numero));
      setSelectedPedido(pedido);
      setAddSearch('');
      setAddQtd({});
      setOpenAddProduto(true);
    } else {
      if (!user) return;
      setCreating(true);
      try {
        const res = await createPedido({
          funcionario_id: user.id, funcionario_nome: user.nome,
          tipo: 'mesa', mesa: String(numero), status: 'aberto',
          forma_pagamento: '', valor_total: 0, desconto: 0, observacao: '', itens: [],
        });
        navigate(`/app/pedidos/${res.data.id}`);
      } catch (err) {
        console.error(err);
      } finally {
        setCreating(false);
      }
    }
  };

  const handleCancelFromMenu = async (numero: number) => {
    const pedido = getMesaPedido(numero);
    if (!pedido?.id) return;
    try {
      await updatePedido(pedido.id, { status: 'cancelado' as Pedido['status'] });
      setMenuAnchor(null);
      await loadAll();
    } catch (err) {
      console.error(err);
      snackbar.error('Erro ao cancelar pedido');
    }
  };

  const handleCreatePedido = async () => {
    if (!selectedMesa || !user) return;
    setCreating(true);
    try {
      const res = await createPedido({
        funcionario_id: user.id, funcionario_nome: user.nome,
        tipo: 'mesa', mesa: selectedMesa, status: 'aberto',
        forma_pagamento: '', valor_total: 0, desconto: 0, observacao: '', itens: [],
      });
      setOpenDialog(false);
      navigate(`/app/pedidos/${res.data.id}`);
    } catch (err) {
      console.error(err);
      snackbar.error('Erro ao abrir pedido');
    } finally {
      setCreating(false);
    }
  };

  const handleProgression = async (status: string) => {
    if (!selectedPedido?.id) return;
    setChangingStatus(true);
    try {
      const res = await updatePedido(selectedPedido.id, { status: status as Pedido['status'] });
      setSelectedPedido(res.data);
      if (status === 'pronto' && selectedPedido.cliente_telefone) {
        notificarCliente(selectedPedido.id, selectedPedido.cliente_telefone);
      }
      await loadAll();
    } catch (err) {
      console.error(err);
      snackbar.error('Erro ao alterar status do pedido');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleCancel = async () => {
    if (!deleteTarget?.id) return;
    try {
      const res = await updatePedido(deleteTarget.id, { status: 'cancelado' as Pedido['status'] });
      setDeleteTarget(null);
      setOpenDialog(false);
      setSelectedPedido(res.data);
      await loadAll();
    } catch (err) {
      console.error(err);
      snackbar.error('Erro ao cancelar pedido');
    }
  };

  const openCustomize = (produto: Produto) => {
    const qtd = addQtd[produto.id!] || 1;
    const produtoAdicionais = (produto.adicionais_ids || [])
      .map((id) => adicionais.find((a) => a.id === id))
      .filter(Boolean) as Adicional[];
    setCustomizeProduto({ ...produto, adicionais_disponiveis: produtoAdicionais } as Produto & { adicionais_disponiveis: Adicional[] });
    setCustomizeQtd(qtd);
    setSelectedAdicionais([]);
    setItemObservacao('');
    setCustomizeOpen(true);
  };

  const openEditItem = (item: PedidoItem, index: number) => {
    const produto = produtos.find((p) => p.id === item.produto_id);
    if (!produto) {
      snackbar.error('Produto não encontrado para edição');
      return;
    }
    const produtoAdicionais = (produto.adicionais_ids || [])
      .map((id) => adicionais.find((a) => a.id === id))
      .filter(Boolean) as Adicional[];
    setCustomizeProduto({ ...produto, adicionais_disponiveis: produtoAdicionais } as Produto & { adicionais_disponiveis: Adicional[] });
    setCustomizeQtd(item.quantidade);
    setSelectedAdicionais(item.adicionais || []);
    setItemObservacao(item.observacao || '');
    setEditingItemIndex(index);
    setCustomizeOpen(true);
  };

  const toggleAdicional = (adicional: Adicional) => {
    setSelectedAdicionais((prev) => {
      const exists = prev.find((a) => a.id === adicional.id);
      if (exists) return prev.filter((a) => a.id !== adicional.id);
      const max = customizeProduto?.max_adicionais || 0;
      if (max > 0 && prev.length >= max) return prev;
      return [...prev, adicional];
    });
  };

  const confirmAddItem = async () => {
    if (!selectedPedido?.id || !customizeProduto) return;
    setUpdatingItems(true);
    try {
      const adicionaisTotal = selectedAdicionais.reduce((s, a) => s + a.preco, 0);
      const precoUnitario = customizeProduto.preco_venda + adicionaisTotal;
      const updatedItem: PedidoItem = {
        produto_id: customizeProduto.id!,
        produto_nome: customizeProduto.nome,
        quantidade: customizeQtd,
        preco_unitario: precoUnitario,
        total: precoUnitario * customizeQtd,
        observacao: itemObservacao,
        adicionais: selectedAdicionais,
        ncm: customizeProduto.ncm,
      };
      const updatedItens = [...(selectedPedido.itens || [])];
      if (editingItemIndex !== null) {
        updatedItens[editingItemIndex] = updatedItem;
      } else {
        updatedItens.push(updatedItem);
      }
      const res = await updatePedido(selectedPedido.id, {
        itens: updatedItens,
        valor_total: calcTotal(updatedItens),
      });
      setSelectedPedido(res.data);
      setCustomizeOpen(false);
      setCustomizeProduto(null);
      setEditingItemIndex(null);
      setAddQtd({});
      setAddSearch('');
      await loadAll();
    } catch (err) {
      console.error(err);
      snackbar.error('Erro ao adicionar item');
    } finally {
      setUpdatingItems(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!selectedPedido?.id || itemToRemove === null) return;
    setUpdatingItems(true);
    try {
      const updatedItens = selectedPedido.itens.filter((_, i) => i !== itemToRemove);
      const res = await updatePedido(selectedPedido.id, {
        itens: updatedItens,
        valor_total: calcTotal(updatedItens),
      });
      setSelectedPedido(res.data);
      setItemToRemove(null);
      await loadAll();
    } catch (err) {
      console.error(err);
      snackbar.error('Erro ao remover item');
    } finally {
      setUpdatingItems(false);
    }
  };

  const handleLinkCliente = async (cliente: Cliente) => {
    if (!selectedPedido?.id) return;
    setUpdatingItems(true);
    try {
      const res = await updatePedido(selectedPedido.id, {
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone,
      });
      setSelectedPedido(res.data);
      setOpenClientSearch(false);
      setClientSearch('');
      await loadAll();
    } catch (err) {
      console.error(err);
      snackbar.error('Erro ao vincular cliente');
    } finally {
      setUpdatingItems(false);
    }
  };

  const actionButton = selectedPedido ? nextStatus[selectedPedido.status] : null;
  const filteredProdutos = produtos.filter(
    (p) => !addSearch || p.nome.toLowerCase().includes(addSearch.toLowerCase()) || p.categoria?.toLowerCase().includes(addSearch.toLowerCase())
  );
  const filteredClientes = clientes.filter(
    (c) => !clientSearch || c.nome.toLowerCase().includes(clientSearch.toLowerCase()) || c.telefone?.includes(clientSearch)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TableRestaurant sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">Mesas</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip icon={<CheckCircle sx={{ fontSize: 16 }} />}
              label={`${quantidadeMesas - mesasOcupadas.length} livres`}
              sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
            <Chip icon={<Fastfood sx={{ fontSize: 16 }} />}
              label={`${mesasOcupadas.length} ocupadas`}
              sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600 }} />
          </Box>
          <Button variant="contained" size="small" startIcon={<Refresh />} onClick={loadAll} disabled={loading}>
            {loading ? <CircularProgress size={16} /> : 'Atualizar'}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {Array.from({ length: quantidadeMesas }, (_, i) => i + 1).map((numero) => {
            const status = getMesaStatus(numero);
            const config = STATUS_CONFIG[status];
            const pedido = getMesaPedido(numero);
            const nextAct = pedido ? nextStatus[pedido.status] : null;

            return (
              <Grid size={{ xs: 6, sm: 4, md: 2, lg: 2 }} key={numero}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    background: config.bg,
                    border: '2px solid',
                    borderColor: config.border,
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'translateY(-4px) scale(1.02)', boxShadow: `0 8px 24px ${config.color}33` },
                    position: 'relative', overflow: 'visible',
                    height: '100%', display: 'flex', flexDirection: 'column',
                  }}
                  onClick={() => handleMesaClick(numero)}
                >
                  {status === 'ocupada' && (
                    <>
                      <Box sx={{
                        position: 'absolute', top: -6, right: -6,
                        width: 14, height: 14, borderRadius: '50%',
                        bgcolor: '#C62828', boxShadow: '0 0 0 3px #FFCDD2',
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
                      }} />
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setMenuAnchor({ el: e.currentTarget, numero }); }}
                        sx={{ position: 'absolute', top: 2, left: 2, color: '#C62828', p: 0.5 }}>
                        <MoreVert sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  )}

                  <CardContent sx={{ textAlign: 'center', py: 2.5, px: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: pedido ? 'flex-start' : 'center' }}>
                    <Box sx={{
                      width: 56, height: 56, borderRadius: '50%', bgcolor: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mx: 'auto', mb: 1.5, boxShadow: `0 2px 8px ${config.color}33`,
                      border: `2px solid ${config.color}`,
                    }}>
                      <TableRestaurant sx={{ fontSize: 28, color: config.color }} />
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 800, color: config.color, lineHeight: 1 }}>
                      {String(numero).padStart(2, '0')}
                    </Typography>

                    <Chip label={config.label} size="small" icon={config.icon}
                      sx={{ mt: 1, fontWeight: 700, fontSize: '0.7rem', bgcolor: config.color, color: 'white', '& .MuiChip-icon': { color: 'white' } }} />

                    {pedido && (
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: `${config.color}44` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                          <AccessTime sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {timeElapsed(pedido.createdAt)}
                          </Typography>
                        </Box>
                        <Chip label={statusLabels[pedido.status]} size="small" color={statusColors[pedido.status]}
                          sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 } }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
                          R$ {(pedido.valor_total ?? 0).toFixed(2)}
                        </Typography>
                        {nextAct && pedido.status !== 'aberto' && (
                          <Button fullWidth size="small" variant="contained" color={nextAct.color}
                            startIcon={nextAct.icon}
                            onClick={(e) => { e.stopPropagation(); handleMesaClick(numero); }}
                            sx={{ mt: 1, fontSize: '0.7rem' }}>
                            {nextAct.label}
                          </Button>
                        )}
                        <Button fullWidth size="small" variant="text" color="warning"
                          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                          onClick={(e) => { e.stopPropagation(); handleVendaFacil(numero); }}
                          sx={{ mt: 0.5, fontSize: '0.65rem', fontWeight: 600, opacity: 0.8, '&:hover': { opacity: 1 } }}>
                          + Venda Rápida
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Menu
        anchorEl={menuAnchor?.el}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
        <MenuItem onClick={() => { if (menuAnchor) handleCancelFromMenu(menuAnchor.numero); }} dense>
          <ListItemIcon><Cancel fontSize="small" /></ListItemIcon>
          <ListItemText>Cancelar Pedido</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog da Mesa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        {selectedPedido ? (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableRestaurant color="primary" />
              Mesa {selectedMesa} — Pedido #{selectedPedido.id}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Info header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip label={statusLabels[selectedPedido.status]} size="small" color={statusColors[selectedPedido.status]} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    R$ {(selectedPedido.valor_total ?? 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Garçom:</Typography>
                  <Typography variant="body2">{selectedPedido.funcionario_nome}</Typography>
                </Box>
                {selectedPedido.createdAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Aberto há:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>{timeElapsed(selectedPedido.createdAt)}</Typography>
                  </Box>
                )}

                {/* Cliente */}
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Cliente</Typography>
                    {selectedPedido.status !== 'fechado' && selectedPedido.status !== 'cancelado' && (
                      <Button size="small" variant="outlined" startIcon={<PersonAdd />}
                        onClick={() => setOpenClientSearch(true)}>
                        {selectedPedido.cliente_nome ? 'Trocar' : 'Vincular'}
                      </Button>
                    )}
                  </Box>
                  {selectedPedido.cliente_nome ? (
                    <Box sx={{ bgcolor: '#E3F2FD', borderRadius: 1, px: 1.5, py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{selectedPedido.cliente_nome}</Typography>
                      {selectedPedido.cliente_telefone && (
                        <Typography variant="caption" color="text.secondary">{selectedPedido.cliente_telefone}</Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Nenhum cliente vinculado</Typography>
                  )}
                </Box>

                {/* Itens */}
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Itens ({selectedPedido.itens?.length || 0})</Typography>
                    {selectedPedido.status !== 'fechado' && selectedPedido.status !== 'cancelado' && (
                      <Button size="small" variant="outlined" startIcon={<AddIcon />}
                        onClick={() => { setAddSearch(''); setAddQtd({}); setOpenAddProduto(true); }}>
                        Adicionar
                      </Button>
                    )}
                  </Box>
                  {selectedPedido.itens && selectedPedido.itens.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {selectedPedido.itens.map((item, i) => (
                        <Box key={i} sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          bgcolor: '#F5F5F5', borderRadius: 1, px: 1.5, py: 0.75,
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.produto_nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Qtd: {item.quantidade} x R$ {(item.preco_unitario ?? 0).toFixed(2)}
                            </Typography>
                            {item.adicionais && item.adicionais.length > 0 && (
                              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500, display: 'block' }}>
                                + {item.adicionais.map((a) => a.nome).join(', ')}
                              </Typography>
                            )}
                            {item.observacao && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                                Obs: {item.observacao}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
                              R$ {((item.total ?? 0) || item.quantidade * (item.preco_unitario ?? 0)).toFixed(2)}
                            </Typography>
                            {selectedPedido.status !== 'fechado' && selectedPedido.status !== 'cancelado' && (
                              <>
                                <IconButton size="small" aria-label="Editar adicionais" onClick={() => openEditItem(item, i)} sx={{ p: 0.3 }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" aria-label="Remover item" color="error" onClick={() => setItemToRemove(i)} sx={{ p: 0.3 }}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Nenhum item adicionado</Typography>
                  )}
                </Box>

                {/* Ações */}
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Ações do Atendimento</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {actionButton && (
                      <Button variant="contained" color={actionButton.color}
                        startIcon={actionButton.icon}
                        onClick={() => handleProgression(
                          selectedPedido.status === 'aberto' ? 'em_preparo' :
                          selectedPedido.status === 'em_preparo' ? 'pronto' :
                          selectedPedido.status === 'pronto' ? 'entregue' :
                          selectedPedido.status === 'entregue' ? 'fechado' : ''
                        )}
                        disabled={changingStatus}
                        sx={{ flex: 1, minWidth: 140 }}>
                        {changingStatus ? <CircularProgress size={18} color="inherit" /> : actionButton.label}
                      </Button>
                    )}
                    {selectedPedido.status !== 'cancelado' && selectedPedido.status !== 'fechado' && (
                      <Button variant="outlined" color="error" startIcon={<Cancel />}
                        onClick={() => setDeleteTarget(selectedPedido)} sx={{ minWidth: 100 }}>
                        Cancelar
                      </Button>
                    )}
                    <Button variant="outlined" startIcon={<Visibility />}
                      onClick={() => { setOpenDialog(false);       navigate(`/app/pedidos/visualizar/${selectedPedido.id}`); }}
                      sx={{ minWidth: 100 }}>
                      Detalhes
                    </Button>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)} color="inherit">Fechar</Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableRestaurant color="success" />
              Mesa {selectedMesa} — Livre
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <TableRestaurant sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Mesa {selectedMesa} está livre</Typography>
                <Typography variant="body1" color="text.secondary">Deseja abrir um novo pedido para esta mesa?</Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button onClick={() => setOpenDialog(false)} color="inherit" size="large">Cancelar</Button>
              <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={handleCreatePedido} disabled={creating}
                sx={{ px: 4 }}>
                {creating ? <CircularProgress size={20} color="inherit" /> : 'Abrir Pedido'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Diálogo Adicionar Produto */}
      <Dialog open={openAddProduto} onClose={() => setOpenAddProduto(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adicionar Produto</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" placeholder="Buscar produto..." value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)} autoFocus
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
            sx={{ mb: 2, mt: 1 }} />
          <Box sx={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {filteredProdutos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Nenhum produto encontrado</Typography>
            ) : filteredProdutos.map((p) => (
              <Box key={p.id} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                p: 1, borderRadius: 1, cursor: 'pointer',
                bgcolor: addQtd[p.id!] ? '#E3F2FD' : 'transparent',
                '&:hover': { bgcolor: '#F5F5F5' },
              }}>
                <Box sx={{ flex: 1 }} onClick={() => setAddQtd((prev) => ({ ...prev, [p.id!]: (prev[p.id!] || 0) + 1 }))}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.nome}</Typography>
                  <Typography variant="caption" color="text.secondary">R$ {(p.preco_venda ?? 0).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                  {addQtd[p.id!] ? (
                    <>
                      <IconButton size="small" aria-label="Diminuir quantidade" onClick={() => setAddQtd((prev) => {
                        const next = { ...prev };
                        if (next[p.id!] <= 1) delete next[p.id!];
                        else next[p.id!]--;
                        return next;
                      })} sx={{ p: 0.3 }}>
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                        {addQtd[p.id!]}
                      </Typography>
                      <IconButton size="small" aria-label="Aumentar quantidade" onClick={() => setAddQtd((prev) => ({ ...prev, [p.id!]: (prev[p.id!] || 0) + 1 }))} sx={{ p: 0.3 }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <Button size="small" variant="contained" onClick={() => openCustomize(p)}
                        disabled={updatingItems} sx={{ minWidth: 60, ml: 0.5 }}>
                        {updatingItems ? <CircularProgress size={14} color="inherit" /> : 'Add'}
                      </Button>
                    </>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => setAddQtd((prev) => ({ ...prev, [p.id!]: 1 }))}>
                      +
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddProduto(false)} color="inherit">Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Personalização (Adicionais + Observação) */}
      <Dialog open={customizeOpen} onClose={() => { setCustomizeOpen(false); setEditingItemIndex(null); }} maxWidth="xs" fullWidth>
        {customizeProduto && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Fastfood color="primary" />
              {editingItemIndex !== null ? `Editar: ${customizeProduto.nome}` : customizeProduto.nome}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    R$ {(customizeProduto.preco_venda ?? 0).toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={() => setCustomizeQtd((q) => Math.max(1, q - 1))}>
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                      {customizeQtd}
                    </Typography>
                    <IconButton size="small" onClick={() => setCustomizeQtd((q) => q + 1)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {customizeProduto.max_adicionais !== undefined && customizeProduto.max_adicionais > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Selecione até {customizeProduto.max_adicionais} adicional(is)
                  </Typography>
                )}

                {(() => {
                  const pc = customizeProduto as Produto & { adicionais_disponiveis: Adicional[] };
                  const disponiveis = pc.adicionais_disponiveis || [];
                  if (disponiveis.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                        Este produto não possui adicionais
                      </Typography>
                    );
                  }
                  const grupos = groupAdicionaisByCategoria(disponiveis);
                  const rows: ReactNode[] = [];
                  for (const [catNome, adics] of grupos) {
                    rows.push(
                      <Box key={catNome}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                          {catNome}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {adics.map((a) => {
                            const selected = !!selectedAdicionais.find((sa) => sa.id === a.id);
                            const max = pc.max_adicionais || 0;
                            const disabled = !selected && max > 0 && selectedAdicionais.length >= max;
                            return (
                              <Box
                                key={a.id}
                                onClick={() => { if (!disabled) toggleAdicional(a); }}
                                sx={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  p: 1, borderRadius: 1, cursor: disabled ? 'not-allowed' : 'pointer',
                                  bgcolor: selected ? '#E3F2FD' : '#FAFAFA',
                                  border: '1px solid', borderColor: selected ? 'primary.main' : 'divider',
                                  opacity: disabled ? 0.5 : 1,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Checkbox checked={selected} size="small" disabled={disabled}
                                    onChange={() => { if (!disabled) toggleAdicional(a); }} />
                                  <Typography variant="body2">{a.nome}</Typography>
                                </Box>
                                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                  +R$ {(a.preco ?? 0).toFixed(2)}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  }
                  return rows;
                })()}

                <TextField fullWidth label="Observação para este item" size="small" multiline rows={2}
                  value={itemObservacao}
                  onChange={(e) => setItemObservacao(e.target.value)}
                  placeholder="Ex: ponto da carne, sem cebola..." />

                <Box sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  bgcolor: '#F5F5F5', borderRadius: 2, p: 1.5,
                }}>
                  <Typography variant="body2" color="text.secondary">Total do item</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    R$ {(((customizeProduto.preco_venda ?? 0) + selectedAdicionais.reduce((s, a) => s + (a.preco ?? 0), 0)) * customizeQtd).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCustomizeOpen(false)} color="inherit">Cancelar</Button>
              <Button variant="contained" onClick={confirmAddItem} disabled={updatingItems}>
                {updatingItems ? <CircularProgress size={18} color="inherit" /> : editingItemIndex !== null ? 'Atualizar Item' : 'Adicionar ao Pedido'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Diálogo Vincular Cliente */}
      <Dialog open={openClientSearch} onClose={() => setOpenClientSearch(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Vincular Cliente</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" placeholder="Buscar cliente por nome ou telefone..." value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)} autoFocus
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
            sx={{ mb: 2, mt: 1 }} />
          <Box sx={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {filteredClientes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                {clientSearch ? 'Nenhum cliente encontrado' : 'Digite para buscar...'}
              </Typography>
            ) : filteredClientes.map((c) => (
              <Box key={c.id} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                p: 1.5, borderRadius: 1, cursor: 'pointer',
                '&:hover': { bgcolor: '#F5F5F5' },
              }}
                onClick={() => handleLinkCliente(c)}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{c.nome}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.telefone || c.email || '-'}</Typography>
                </Box>
                <Button size="small" variant="contained">Vincular</Button>
              </Box>
            ))}
          </Box>
          <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }}
            onClick={() => { setOpenClientSearch(false); navigate('/app/clientes/novo'); }}>
            + Novo Cliente
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClientSearch(false)} color="inherit">Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar remover item */}
      <ConfirmDialog open={itemToRemove !== null} title="Remover Item"
        message="Deseja remover este item do pedido?"
        onConfirm={handleRemoveItem} onCancel={() => setItemToRemove(null)} />

      {/* Confirmar cancelar pedido */}
      <ConfirmDialog open={!!deleteTarget} title="Cancelar Pedido"
        message={`Deseja realmente cancelar o pedido #${deleteTarget?.id} da mesa ${selectedMesa}?`}
        onConfirm={handleCancel} onCancel={() => setDeleteTarget(null)} />
    </Box>
  );
}
