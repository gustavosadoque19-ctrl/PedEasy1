import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { getCaixaAberto, abrirCaixa, fecharCaixa, addMovimento, getHistoricoCaixa } from '../../api/caixa';
import { Caixa } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function CaixaDashboard() {
  const [caixaAberto, setCaixaAberto] = useState<Caixa | null>(null);
  const [, setHistorico] = useState<Caixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAbrir, setOpenAbrir] = useState(false);
  const [openMov, setOpenMov] = useState(false);
  const [openFechar, setOpenFechar] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const { user } = useAuth();

  const [movForm, setMovForm] = useState({
    tipo: 'entrada' as 'entrada' | 'saida', categoria: '', valor: 0,
    descricao: '', forma_pagamento: 'dinheiro',
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [caixaRes, histRes] = await Promise.all([getCaixaAberto(), getHistoricoCaixa()]);
        if (!cancelled) setCaixaAberto(caixaRes.data);
        if (!cancelled) setHistorico(histRes.data);
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
      const [caixaRes, histRes] = await Promise.all([getCaixaAberto(), getHistoricoCaixa()]);
      if (!mountedRef.current) return;
      setCaixaAberto(caixaRes.data);
      setHistorico(histRes.data);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleAbrirCaixa = async () => {
    try {
      await abrirCaixa({ funcionario_id: user?.id || 0, saldo_inicial: saldoInicial });
      setOpenAbrir(false);
      load();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro');
    }
  };
  const handleAddMovimento = async () => {
    if (!caixaAberto?.id) return;
    try {
      await addMovimento({ ...movForm, caixa_id: caixaAberto.id });
      setOpenMov(false);
      setMovForm({ tipo: 'entrada', categoria: '', valor: 0, descricao: '', forma_pagamento: 'dinheiro' });
      load();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro');
    }
  };
  const handleFecharCaixa = async () => {
    if (!caixaAberto?.id) return;
    try {
      await fecharCaixa(caixaAberto.id);
      setOpenFechar(false);
      load();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro');
    }
  };

  const totalEntradas = caixaAberto?.movimentos?.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0) || 0;
  const totalSaidas = caixaAberto?.movimentos?.filter((m) => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0) || 0;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Caixa</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!caixaAberto ? (
            <Button variant="contained" onClick={() => setOpenAbrir(true)}>Abrir Caixa</Button>
          ) : (
            <>
              <Button variant="outlined" onClick={() => setOpenMov(true)}>Adicionar Movimento</Button>
              <Button variant="contained" color="secondary" onClick={() => setOpenFechar(true)}>Fechar Caixa</Button>
            </>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {caixaAberto ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Saldo Inicial</Typography>
                <Typography variant="h6">R$ {caixaAberto.saldo_inicial.toFixed(2)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Entradas</Typography>
                <Typography variant="h6" color="success.main">R$ {totalEntradas.toFixed(2)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Saídas</Typography>
                <Typography variant="h6" color="error.main">R$ {totalSaidas.toFixed(2)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Saldo Atual</Typography>
                <Typography variant="h6" color="primary.main">
                  R$ {(caixaAberto.saldo_inicial + totalEntradas - totalSaidas).toFixed(2)}
                </Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Movimentos</Typography>
              <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Categoria</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Descrição</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Forma Pag.</TableCell>
                        <TableCell align="right">Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {caixaAberto.movimentos?.map((m, i) => (
                        <TableRow key={m.id || i} hover>
                          <TableCell>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</TableCell>
                          <TableCell>
                            <Chip label={m.tipo} size="small" color={m.tipo === 'entrada' ? 'success' : 'error'} />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.categoria}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.descricao}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.forma_pagamento}</TableCell>
                          <TableCell align="right">R$ {m.valor.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">Caixa fechado</Typography>
            <Typography variant="body2" color="text.secondary">Abra o caixa para começar a registrar movimentos</Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={openAbrir} onClose={() => setOpenAbrir(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Abrir Caixa</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Saldo Inicial (R$)" type="number" size="small" sx={{ mt: 2 }}
            value={saldoInicial} onChange={(e) => setSaldoInicial(parseFloat(e.target.value) || 0)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAbrir(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleAbrirCaixa} variant="contained">Abrir</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMov} onClose={() => setOpenMov(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Movimento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={6}>
              <TextField fullWidth label="Tipo" size="small" select value={movForm.tipo}
                onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as 'entrada' | 'saida' })}>
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="saida">Saída</MenuItem>
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Forma Pagamento" size="small" select value={movForm.forma_pagamento}
                onChange={(e) => setMovForm({ ...movForm, forma_pagamento: e.target.value })}>
                {['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'vale_refeicao'].map((f) => (
                  <MenuItem key={f} value={f}>{f.replace('_', ' ').toUpperCase()}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Categoria" size="small" value={movForm.categoria}
                onChange={(e) => setMovForm({ ...movForm, categoria: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Valor (R$)" size="small" type="number" value={movForm.valor}
                onChange={(e) => setMovForm({ ...movForm, valor: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Descrição" size="small" value={movForm.descricao}
                onChange={(e) => setMovForm({ ...movForm, descricao: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMov(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleAddMovimento} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openFechar} onClose={() => setOpenFechar(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Fechar Caixa</DialogTitle>
        <DialogContent>
          <Typography>Saldo atual: R$ {(caixaAberto ? caixaAberto.saldo_inicial + totalEntradas - totalSaidas : 0).toFixed(2)}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Deseja realmente fechar o caixa?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFechar(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleFecharCaixa} variant="contained" color="secondary">Fechar Caixa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
