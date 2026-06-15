import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import Pix from '@mui/icons-material/Pix';
import CreditCard from '@mui/icons-material/CreditCard';
import { getPagamentos, criarCobrancaPix, criarCobrancaCartao } from '../../api/pagamentos';
import { PagamentoOnline } from '../../types';

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState<PagamentoOnline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');
  const [open, setOpen] = useState(false);
  const [cobranca, setCobranca] = useState({ pedido_id: '', valor: '', parcelas: '1', forma: 'pix' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPagamentos();
        if (!cancelled) setPagamentos(res.data);
      } catch {
        if (!cancelled) setError('Erro ao carregar pagamentos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPagamentos();
      setPagamentos(res.data);
    } catch {
      setError('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarCobranca = async () => {
    try {
      if (cobranca.forma === 'pix') {
        await criarCobrancaPix(Number(cobranca.pedido_id), Number(cobranca.valor));
        setSnack('Cobrança PIX criada!');
      } else {
        await criarCobrancaCartao(Number(cobranca.pedido_id), Number(cobranca.valor), Number(cobranca.parcelas));
        setSnack('Pagamento com cartão processado!');
      }
      setOpen(false);
      setCobranca({ pedido_id: '', valor: '', parcelas: '1', forma: 'pix' });
      load();
    } catch {
      setError('Erro ao criar cobrança');
    }
  };

  const statusColor: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
    pendente: 'warning', aprovado: 'success', recusado: 'error', cancelado: 'default',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Pagamentos Online</Typography>
        <Button variant="contained" startIcon={<Pix />} onClick={() => setOpen(true)}>Nova Cobrança</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Total Recebido</Typography>
            <Typography variant="h5">
              R$ {pagamentos.filter((p) => p.status === 'aprovado').reduce((s, p) => s + (p.valor ?? 0), 0).toFixed(2)}
            </Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Pendentes</Typography>
            <Typography variant="h5" color="warning.main">
              {pagamentos.filter((p) => p.status === 'pendente').length}
            </Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Recusados</Typography>
            <Typography variant="h5" color="error.main">
              {pagamentos.filter((p) => p.status === 'recusado').length}
            </Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                  <TableRow>
                    <TableCell>Pedido</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Forma</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Transação</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagamentos.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center">Nenhum pagamento registrado</TableCell></TableRow>
                  )}
                  {pagamentos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>#{p.pedido_id}</TableCell>
                      <TableCell>R$ {(p.valor ?? 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Chip icon={p.forma === 'pix' ? <Pix /> : <CreditCard />}
                          label={p.forma === 'pix' ? 'PIX' : p.forma === 'cartao_credito' ? 'Crédito' : 'Débito'}
                          size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={p.status} color={statusColor[p.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.transacao_id ? p.transacao_id.substring(0, 12) + '...' : '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Cobrança</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Nº do Pedido" type="number" size="small"
              value={cobranca.pedido_id}
              onChange={(e) => setCobranca({ ...cobranca, pedido_id: e.target.value })} />
            <TextField fullWidth label="Valor (R$)" type="number" size="small"
              value={cobranca.valor}
              onChange={(e) => setCobranca({ ...cobranca, valor: e.target.value })} />
            <FormControl fullWidth size="small">
              <InputLabel>Forma de Pagamento</InputLabel>
              <Select value={cobranca.forma} label="Forma de Pagamento"
                onChange={(e) => setCobranca({ ...cobranca, forma: e.target.value as 'pix' | 'cartao_credito' | 'cartao_debito' })}>
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
              </Select>
            </FormControl>
            {cobranca.forma.includes('cartao') && (
              <TextField fullWidth label="Parcelas" type="number" size="small"
                value={cobranca.parcelas}
                onChange={(e) => setCobranca({ ...cobranca, parcelas: Math.max(1, Number(e.target.value)).toString() })} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleCriarCobranca} variant="contained" startIcon={<Pix />}>Criar Cobrança</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
