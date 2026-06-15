import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import Pix from '@mui/icons-material/Pix';
import CreditCard from '@mui/icons-material/CreditCard';
import QrCode from '@mui/icons-material/QrCode';
import { getPagamentos, criarCobrancaPix, criarCobrancaCartao } from '../../api/pagamentos';
import { PagamentoOnline } from '../../types';

function PixQrCodeDialog({ open, pagamento, onClose }: { open: boolean; pagamento: PagamentoOnline | null; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pagamento PIX</DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        {pagamento?.qr_code ? (
          <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <QrCode sx={{ fontSize: 200, color: 'primary.main' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Escaneie o código PIX abaixo ou copie o código:
            </Typography>
            <Box sx={{
              bgcolor: 'grey.100', p: 2, borderRadius: 2, wordBreak: 'break-all',
              fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'left',
            }}>
              {pagamento.qr_code}
            </Box>
          </>
        ) : pagamento?.cobranca ? (
          <>
            <Typography sx={{ mb: 2 }}>Pagamento PIX solicitado com sucesso!</Typography>
            <Button variant="contained" href={pagamento.cobranca} target="_blank" startIcon={<Pix />}>
              Abrir Pagamento
            </Button>
          </>
        ) : (
          <CircularProgress />
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Status: {pagamento?.status}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState<PagamentoOnline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');
  const [open, setOpen] = useState(false);
  const [cobranca, setCobranca] = useState<Record<string, string>>({ pedido_id: '', valor: '', parcelas: '1', forma: 'pix' });
  const [pixDialog, setPixDialog] = useState<PagamentoOnline | null>(null);
  const [pixOpen, setPixOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPagamentos();
      setPagamentos(res.data);
    } catch {
      setError('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCriarCobranca = async () => {
    setSaving(true);
    try {
      if (cobranca.forma === 'pix') {
        const res = await criarCobrancaPix(Number(cobranca.pedido_id), Number(cobranca.valor));
        setSnack('Cobrança PIX criada!');
        setPixDialog(res.data);
        setPixOpen(true);
      } else {
        if (!cobranca.card_number || !cobranca.card_holder || !cobranca.card_expiry || !cobranca.card_cvv) {
          setError('Preencha todos os dados do cartão');
          setSaving(false);
          return;
        }
        const [expMonth, expYear] = cobranca.card_expiry.split('/');
        await criarCobrancaCartao(
          Number(cobranca.pedido_id), Number(cobranca.valor), Number(cobranca.parcelas),
          {
            number: cobranca.card_number,
            holder_name: cobranca.card_holder,
            exp_month: expMonth,
            exp_year: expYear.length === 2 ? `20${expYear}` : expYear,
            cvv: cobranca.card_cvv,
          }
        );
        setSnack('Pagamento com cartão processado!');
      }
      setOpen(false);
      setCobranca({ pedido_id: '', valor: '', parcelas: '1', forma: 'pix' });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erro ao criar cobrança');
    } finally {
      setSaving(false);
    }
  };

  const statusColor: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
    pendente: 'warning', aprovado: 'success', recusado: 'error', cancelado: 'default',
  };

  const totais = {
    recebido: pagamentos.filter((p) => p.status === 'aprovado').reduce((s, p) => s + (p.valor ?? 0), 0),
    pendentes: pagamentos.filter((p) => p.status === 'pendente').length,
    recusados: pagamentos.filter((p) => p.status === 'recusado').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Pagamentos Online</Typography>
        <Button variant="contained" startIcon={<Pix />} onClick={() => setOpen(true)}>Nova Cobrança</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Total Recebido</Typography>
            <Typography variant="h5">R$ {totais.recebido.toFixed(2)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Pendentes</Typography>
            <Typography variant="h5" color="warning.main">{totais.pendentes}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Recusados</Typography>
            <Typography variant="h5" color="error.main">{totais.recusados}</Typography>
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
                  <TableRow><TableCell colSpan={6} align="center">Nenhum pagamento registrado</TableCell></TableRow>
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
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: '0.75rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.transacao_id ? p.transacao_id : '-'}
                    </TableCell>
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
            {cobranca.forma === 'cartao_credito' && (
              <>
                <TextField fullWidth label="Parcelas" type="number" size="small"
                  value={cobranca.parcelas}
                  onChange={(e) => setCobranca({ ...cobranca, parcelas: Math.max(1, Number(e.target.value)).toString() })} />
                <TextField fullWidth label="Nº do Cartão" size="small"
                  value={(cobranca as any).card_number || ''}
                  onChange={(e) => setCobranca({ ...cobranca, card_number: e.target.value })} placeholder="1234 5678 9012 3456" />
                <TextField fullWidth label="Titular" size="small"
                  value={(cobranca as any).card_holder || ''}
                  onChange={(e) => setCobranca({ ...cobranca, card_holder: e.target.value })} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField fullWidth label="Validade (MM/AA)" size="small"
                    value={(cobranca as any).card_expiry || ''}
                    onChange={(e) => setCobranca({ ...cobranca, card_expiry: e.target.value })} placeholder="12/27" />
                  <TextField fullWidth label="CVV" size="small"
                    value={(cobranca as any).card_cvv || ''}
                    onChange={(e) => setCobranca({ ...cobranca, card_cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" />
                </Box>
              </>
            )}
            {cobranca.forma === 'cartao_debito' && (
              <>
                <TextField fullWidth label="Nº do Cartão" size="small"
                  value={(cobranca as any).card_number || ''}
                  onChange={(e) => setCobranca({ ...cobranca, card_number: e.target.value })} />
                <TextField fullWidth label="Titular" size="small"
                  value={(cobranca as any).card_holder || ''}
                  onChange={(e) => setCobranca({ ...cobranca, card_holder: e.target.value })} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField fullWidth label="Validade (MM/AA)" size="small"
                    value={(cobranca as any).card_expiry || ''}
                    onChange={(e) => setCobranca({ ...cobranca, card_expiry: e.target.value })} />
                  <TextField fullWidth label="CVV" size="small"
                    value={(cobranca as any).card_cvv || ''}
                    onChange={(e) => setCobranca({ ...cobranca, card_cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
          <Button onClick={handleCriarCobranca} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : cobranca.forma === 'pix' ? <Pix /> : <CreditCard />}>
            {saving ? 'Processando...' : 'Criar Cobrança'}
          </Button>
        </DialogActions>
      </Dialog>

      <PixQrCodeDialog open={pixOpen} pagamento={pixDialog} onClose={() => setPixOpen(false)} />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
