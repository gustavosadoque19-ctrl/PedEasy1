import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import AddShoppingCart from '@mui/icons-material/AddShoppingCart';
import Schedule from '@mui/icons-material/Schedule';
import Settings from '@mui/icons-material/Settings';
import PlayArrow from '@mui/icons-material/PlayArrow';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { getPedidos, updatePedido } from '../../api/pedidos';
import { Pedido } from '../../types';
import { notificarCliente } from '../../api/notificacao';
import { getPendentes } from '../../api/funcionarios';

const DEFAULT_LIMIT = 30;
const PRONTO_LIMIT_MINUTES = 15;

function getLimite(): number {
  const stored = localStorage.getItem('dashboard_tempo_limite');
  return stored ? parseInt(stored, 10) : DEFAULT_LIMIT;
}

const columns = [
  { key: 'aberto', label: 'Novos Pedidos', color: '#1976D2' },
  { key: 'em_preparo', label: 'Em Preparo', color: '#FF8F00' },
  { key: 'pronto', label: 'Prontos', color: '#388E3C' },
  { key: 'atrasado', label: 'Atrasados', color: '#D32F2F' },
];

function isAtrasado(pedido: Pedido): boolean {
  if (!pedido.createdAt) return false;
  const limite = getLimite();
  const diff = Date.now() - new Date(pedido.createdAt).getTime();
  if (pedido.status === 'pronto') return diff > PRONTO_LIMIT_MINUTES * 60 * 1000;
  if (pedido.status === 'aberto' || pedido.status === 'em_preparo') return diff > limite * 60 * 1000;
  return false;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [openConfig, setOpenConfig] = useState(false);
  const [tempoLimite, setTempoLimite] = useState(String(getLimite()));
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.permissao === 'admin';

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
    if (isAdmin) {
      getPendentes().then((res) => { if (!cancelled) setPendentesCount(res.data.length); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [isAdmin]);

  const getCardData = (key: string): Pedido[] => {
    if (key === 'atrasado') return pedidos.filter(isAtrasado);
    return pedidos.filter((p) => p.status === key);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const handleStatusChange = async (pedido: Pedido, status: string) => {
    try {
      await updatePedido(pedido.id!, { ...pedido, status: status as Pedido['status'] });
      if (status === 'pronto' && pedido.cliente_telefone) {
        notificarCliente(pedido.id!, pedido.cliente_telefone).catch(() => {});
      }
      const res = await getPedidos();
      setPedidos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSalvarConfig = () => {
    const val = parseInt(tempoLimite, 10);
    if (val > 0) {
      localStorage.setItem('dashboard_tempo_limite', String(val));
      setOpenConfig(false);
      getPedidos().then((res) => setPedidos(res.data)).catch(console.error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4">Dashboard</Typography>
          <IconButton size="small" onClick={() => { setTempoLimite(String(getLimite())); setOpenConfig(true); }}>
            <Settings />
          </IconButton>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddShoppingCart />}
          onClick={() => navigate('/pedidos/novo')} sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}>
          Pedido Fácil
        </Button>
      </Box>
      {isAdmin && pendentesCount > 0 && (
        <Alert severity="info" sx={{ mb: 2 }} action={
          <Button size="small" color="inherit" onClick={() => navigate('/funcionarios')}>
            Gerenciar
          </Button>
        }>
          <strong>{pendentesCount}</strong> funcionário(s) aguardando aprovação
        </Alert>
      )}
      <Grid container spacing={2}>
        {columns.map((col) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={col.key}>
            <Card sx={{ borderTop: 3, borderColor: col.color, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{col.label}</Typography>
                  <Chip label={getCardData(col.key).length} size="small" sx={{ bgcolor: col.color, color: 'white', fontWeight: 'bold' }} />
                </Box>
                {getCardData(col.key).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Nenhum pedido
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {getCardData(col.key).map((pedido) => (
                      <Card key={pedido.id} variant="outlined">
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 }, cursor: 'pointer' }}
                          onClick={() => navigate(`/pedidos/visualizar/${pedido.id}`)}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">#{pedido.id}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {pedido.createdAt ? new Date(pedido.createdAt).toLocaleTimeString() : '-'}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {pedido.tipo === 'mesa' ? `Mesa ${pedido.mesa}` : pedido.tipo}
                            {pedido.cliente_nome ? ` | ${pedido.cliente_nome}` : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">{pedido.funcionario_nome}</Typography>
                            <Typography variant="subtitle2" color="primary.main">R$ {pedido.valor_total.toFixed(2)}</Typography>
                          </Box>
                        </CardContent>
                        {col.key === 'aberto' && (
                          <Box sx={{ px: 1, pb: 1 }}>
                            <Button fullWidth size="small" variant="contained" color="warning"
                              startIcon={<PlayArrow />}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(pedido, 'em_preparo'); }}>
                              Iniciar Preparo
                            </Button>
                          </Box>
                        )}
                        {col.key === 'em_preparo' && (
                          <Box sx={{ px: 1, pb: 1 }}>
                            <Button fullWidth size="small" variant="contained" color="success"
                              startIcon={<CheckCircle />}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(pedido, 'pronto'); }}>
                              Enviar para Prontos
                            </Button>
                          </Box>
                        )}
                        {col.key === 'pronto' && (
                          <Box sx={{ px: 1, pb: 1 }}>
                            <Button fullWidth size="small" variant="contained" color="info"
                              startIcon={<CheckCircle />}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(pedido, 'entregue'); }}>
                              Finalizar
                            </Button>
                          </Box>
                        )}
                        {col.key === 'atrasado' && pedido.status === 'pronto' && (
                          <Box sx={{ px: 1, pb: 1 }}>
                            <Button fullWidth size="small" variant="contained" color="info"
                              startIcon={<CheckCircle />}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(pedido, 'entregue'); }}>
                              Finalizar
                            </Button>
                          </Box>
                        )}
                        {col.key === 'atrasado' && pedido.status === 'em_preparo' && (
                          <Box sx={{ px: 1, pb: 1 }}>
                            <Button fullWidth size="small" variant="contained" color="success"
                              startIcon={<CheckCircle />}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(pedido, 'pronto'); }}>
                              Enviar para Prontos
                            </Button>
                          </Box>
                        )}
                        {col.key === 'atrasado' && pedido.status === 'aberto' && (
                          <Box sx={{ px: 1, pb: 1 }}>
                            <Button fullWidth size="small" variant="contained" color="warning"
                              startIcon={<PlayArrow />}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(pedido, 'em_preparo'); }}>
                              Iniciar Preparo
                            </Button>
                          </Box>
                        )}
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Configurações do Dashboard</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Tempo limite (minutos)" type="number" size="small" sx={{ mt: 2 }}
            value={tempoLimite}
            onChange={(e) => setTempoLimite(e.target.value)}
            helperText="Pedidos em aberto ou preparo acima deste tempo são considerados atrasados. Pedidos prontos há mais de 15 min também."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfig(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSalvarConfig} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
