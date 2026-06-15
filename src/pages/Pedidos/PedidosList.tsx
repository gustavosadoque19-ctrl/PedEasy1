import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, IconButton, Menu, MenuItem,
  CircularProgress,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import MoreVert from '@mui/icons-material/MoreVert';
import Visibility from '@mui/icons-material/Visibility';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import LocalShipping from '@mui/icons-material/LocalShipping';
import { getPedidos, deletePedido, updatePedido } from '../../api/pedidos';
import { Pedido } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { notificarCliente } from '../../api/notificacao';
import { useSnackbar } from '../../hooks/useSnackbar';
import { statusLabels, statusColors } from '../../constants/pedido';

export default function PedidosList() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pedido | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPedidos();
        if (!cancelled) setPedidos(res.data);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await getPedidos();
      if (!mountedRef.current) return;
      setPedidos(res.data);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleStatusChange = async (pedido: Pedido, status: string) => {
    try {
      await updatePedido(pedido.id!, { ...pedido, status: status as Pedido['status'] });
      if (status === 'pronto' && pedido.cliente_telefone) {
        notificarCliente(pedido.id!, pedido.cliente_telefone).catch(() => {});
      }
      setAnchorEl(null);
      snackbar.success(`Pedido #${pedido.id} atualizado para ${statusLabels[status]}`);
      load();
    } catch { snackbar.error('Erro ao atualizar pedido'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try { await deletePedido(deleteTarget.id); setDeleteTarget(null); snackbar.success('Pedido cancelado'); load(); } catch { snackbar.error('Erro ao cancelar pedido'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Pedidos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/pedidos/novo')}>Novo Pedido</Button>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, width: '100%' }}><CircularProgress size={32} /></Box>
      ) : (
      <Grid container spacing={2}>
        {pedidos.map((pedido) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pedido.id}>
            <Card sx={{ borderLeft: 4, borderColor: `${statusColors[pedido.status]}.main` }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">Pedido #{pedido.id}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pedido.tipo === 'mesa' ? `Mesa ${pedido.mesa}` : pedido.tipo}
                      {pedido.tipo === 'delivery' && pedido.endereco_entrega ? ` - ${pedido.endereco_entrega.slice(0, 40)}...` : ''}
                      {' | '}{pedido.cliente_nome || 'Sem cliente'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {pedido.tipo === 'delivery' && <LocalShipping sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />}
                    <Chip label={statusLabels[pedido.status]} size="small" color={statusColors[pedido.status]} />
                    <IconButton size="small" aria-label="Ações do pedido" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedPedido(pedido); }}>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Funcionário: {pedido.funcionario_nome}</Typography>
                  <Typography variant="h6" color="primary.main">R$ {(pedido.valor_total ?? 0).toFixed(2)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!loading && pedidos.length === 0 && (
          <Grid size={12}><Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Nenhum pedido encontrado</Typography></Grid>
        )}
      </Grid>
      )}
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { navigate(`/pedidos/visualizar/${selectedPedido?.id}`); setAnchorEl(null); }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> Visualizar
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/pedidos/${selectedPedido?.id}`); setAnchorEl(null); }}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Editar
        </MenuItem>
        {selectedPedido?.status === 'aberto' && (
          <MenuItem onClick={() => handleStatusChange(selectedPedido, 'em_preparo')}>Iniciar Preparo</MenuItem>
        )}
        {selectedPedido?.status === 'em_preparo' && (
          <MenuItem onClick={() => handleStatusChange(selectedPedido, 'pronto')}>Marcar como Pronto</MenuItem>
        )}
        {selectedPedido?.status === 'pronto' && (
          <MenuItem onClick={() => handleStatusChange(selectedPedido, 'entregue')}>Marcar como Entregue</MenuItem>
        )}
        {selectedPedido?.status === 'entregue' && (
          <MenuItem onClick={() => handleStatusChange(selectedPedido, 'fechado')}>Finalizar Pedido</MenuItem>
        )}
        <MenuItem onClick={() => { setDeleteTarget(selectedPedido); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" /> Cancelar Pedido
        </MenuItem>
      </Menu>
      <ConfirmDialog open={!!deleteTarget} title="Cancelar Pedido" message={`Deseja cancelar o pedido #${deleteTarget?.id}?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Box>
  );
}
