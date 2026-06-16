import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Receipt from '@mui/icons-material/Receipt';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { getPedido, updatePedido } from '../../api/pedidos';
import { emitirNFe } from '../../api/nfe';
import { Pedido } from '../../types';
import { statusLabels, statusColors } from '../../constants/pedido';

export default function PedidosView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNFe, setOpenNFe] = useState(false);
  const [emitindo, setEmitindo] = useState(false);
  const [nfeError, setNfeError] = useState('');
  const [nfeSuccess, setNfeSuccess] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getPedido(Number(id)).then((res) => { if (!cancelled) setPedido(res.data); }).catch(() => { if (!cancelled) setError('Erro ao carregar pedido'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleEmitirNFe = async () => {
    if (!pedido?.id) return;
    setEmitindo(true);
    setNfeError('');
    setNfeSuccess('');
    try {
      await emitirNFe(pedido.id);
      setNfeSuccess('NFe emitida com sucesso!');
      setOpenNFe(false);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setNfeError(apiErr.response?.data?.error || 'Erro ao emitir NFe');
    } finally {
      setEmitindo(false);
    }
  };

  const handleFinalizar = async () => {
    if (!pedido?.id) return;
    setFinalizando(true);
    try {
      const res = await updatePedido(pedido.id, { status: 'fechado' });
      setPedido(res.data);
    } catch {
      setError('Erro ao finalizar pedido');
    } finally {
      setFinalizando(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!pedido) return <Alert severity="error">Pedido não encontrado</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/app/pedidos')}>Voltar</Button>
        <Typography variant="h4">Pedido Nº {pedido.id}</Typography>
        <Chip label={statusLabels[pedido.status]} color={statusColors[pedido.status]} />
      </Box>

      {nfeSuccess && <Alert severity="success" sx={{ mb: 2 }}>{nfeSuccess}</Alert>}
      {nfeError && <Alert severity="error" sx={{ mb: 2 }}>{nfeError}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Informações do Pedido</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Tipo</Typography>
                  <Typography variant="body1">{pedido.tipo}</Typography>
                </Grid>
                {pedido.mesa && (
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Mesa</Typography>
                    <Typography variant="body1">{pedido.mesa}</Typography>
                  </Grid>
                )}
                {pedido.tipo === 'delivery' && (
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">Endereço de Entrega</Typography>
                    <Typography variant="body1">{pedido.endereco_entrega || 'Não informado'}</Typography>
                  </Grid>
                )}
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Cliente</Typography>
                  <Typography variant="body1">{pedido.cliente_nome || 'Sem cliente'}</Typography>
                </Grid>
                {pedido.cliente_telefone && (
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Telefone</Typography>
                    <Typography variant="body1">{pedido.cliente_telefone}</Typography>
                  </Grid>
                )}
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Funcionário</Typography>
                  <Typography variant="body1">{pedido.funcionario_nome}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Forma Pagamento</Typography>
                  <Typography variant="body1">{pedido.forma_pagamento.replace('_', ' ').toUpperCase()}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Data</Typography>
                  <Typography variant="body1">{pedido.createdAt ? new Date(pedido.createdAt).toLocaleString() : '-'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Valores</Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary">Valor Total</Typography>
                  <Typography variant="h4" color="primary.main">R$ {(pedido.valor_total ?? 0).toFixed(2)}</Typography>
                </Grid>
                {pedido.desconto > 0 && (
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Desconto</Typography>
                    <Typography variant="body1" color="error.main">- R$ {(pedido.desconto ?? 0).toFixed(2)}</Typography>
                  </Grid>
                )}
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Valor Final</Typography>
                  <Typography variant="h5" color="success.main">R$ {((pedido.valor_total ?? 0) - (pedido.desconto ?? 0)).toFixed(2)}</Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                {pedido.status === 'entregue' && (
                  <Button variant="contained" color="secondary" startIcon={<CheckCircle />} onClick={handleFinalizar} disabled={finalizando}>
                    {finalizando ? <CircularProgress size={20} /> : 'Finalizar Pedido'}
                  </Button>
                )}
                <Button variant="contained" startIcon={<Receipt />} onClick={() => setOpenNFe(true)}>
                  Emitir NFe
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Itens do Pedido</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell>Adicionais</TableCell>
                      <TableCell>Observação</TableCell>
                      <TableCell align="right">Qtd</TableCell>
                      <TableCell align="right">Preço Unit.</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedido.itens?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.produto_nome}</TableCell>
                        <TableCell>
                          {item.adicionais && item.adicionais.length > 0
                            ? item.adicionais.map((a) => a.nome).join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell>{item.observacao || '-'}</TableCell>
                        <TableCell align="right">{item.quantidade}</TableCell>
                        <TableCell align="right">R$ {(item.preco_unitario ?? 0).toFixed(2)}</TableCell>
                        <TableCell align="right">R$ {(item.total ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
                {pedido.tipo === 'delivery' && (pedido.taxa_entrega ?? 0) > 0 && (
                  <Grid size={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">Taxa de Entrega</Typography>
                      <Typography variant="body2">R$ {pedido.taxa_entrega?.toFixed(2)}</Typography>
                    </Box>
                  </Grid>
                )}
                {pedido.observacao && (
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Observação</Typography>
                <Typography variant="body1">{pedido.observacao}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={openNFe} onClose={() => setOpenNFe(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Emitir NFe</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Emitir Nota Fiscal Eletrônica para o <strong>Pedido Nº {pedido.id}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Valor: R$ {((pedido.valor_total ?? 0) - (pedido.desconto ?? 0)).toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNFe(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleEmitirNFe} variant="contained" disabled={emitindo}>
            {emitindo ? <CircularProgress size={20} /> : 'Confirmar Emissão'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
