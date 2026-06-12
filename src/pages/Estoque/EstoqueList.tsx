import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import { getProdutos } from '../../api/produtos';
import { createMovimento, getMovimentos } from '../../api/estoque';
import { Produto, EstoqueMovimento } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function EstoqueList() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentos, setMovimentos] = useState<EstoqueMovimento[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const [movForm, setMovForm] = useState({
    produto_id: 0, tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantidade: 0, motivo: '',
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prodRes, movRes] = await Promise.all([getProdutos(), getMovimentos()]);
        if (!cancelled) setProdutos(prodRes.data);
        if (!cancelled) setMovimentos(movRes.data);
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
      const [prodRes, movRes] = await Promise.all([getProdutos(), getMovimentos()]);
      if (!mountedRef.current) return;
      setProdutos(prodRes.data);
      setMovimentos(movRes.data);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleMovimento = async () => {
    setError('');
    try {
      await createMovimento({
        ...movForm, funcionario_id: user?.id || 0,
      });
      setOpenDialog(false);
      setMovForm({ produto_id: 0, tipo: 'entrada', quantidade: 0, motivo: '' });
      load();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro ao registrar movimento');
    }
  };

  const filtered = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) || p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Controle de Estoque</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>Movimentar Estoque</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Produtos em Estoque</Typography>
          <TextField fullWidth size="small" placeholder="Buscar produto..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> } }} sx={{ mb: 2 }}
          />
          <TableContainer>
            <Table size="small">
              <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Categoria</TableCell>
                    <TableCell>Estoque Atual</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Estoque Mínimo</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.categoria}</TableCell>
                      <TableCell>{p.estoque_atual} {p.unidade}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.estoque_minimo} {p.unidade}</TableCell>
                      <TableCell>
                        <Chip label={p.estoque_atual <= p.estoque_minimo ? 'Estoque Baixo' : 'OK'}
                          size="small" color={p.estoque_atual <= p.estoque_minimo ? 'warning' : 'success'} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Últimos Movimentos</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Qtd</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Motivo</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimentos.slice(0, 20).map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell>{m.produto_nome}</TableCell>
                      <TableCell>
                        <Chip label={m.tipo} size="small" color={m.tipo === 'entrada' ? 'success' : m.tipo === 'saida' ? 'error' : 'warning'} />
                      </TableCell>
                      <TableCell>{m.quantidade}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.motivo}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Movimentar Estoque</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField fullWidth label="Produto" size="small" select value={movForm.produto_id}
                onChange={(e) => setMovForm({ ...movForm, produto_id: Number(e.target.value) })}>
                {produtos.map((p) => <MenuItem key={p.id} value={p.id!}>{p.nome}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Tipo" size="small" select value={movForm.tipo}
                onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as 'entrada' | 'saida' | 'ajuste' })}>
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="saida">Saída</MenuItem>
                <MenuItem value="ajuste">Ajuste</MenuItem>
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Quantidade" size="small" type="number" value={movForm.quantidade}
                onChange={(e) => setMovForm({ ...movForm, quantidade: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Motivo" size="small" value={movForm.motivo}
                onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleMovimento} variant="contained">Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
