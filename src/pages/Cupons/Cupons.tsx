import { useState, useEffect } from 'react';
import {
  Box, Typography,   Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, CircularProgress, Alert,
  Chip, Snackbar,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { getCupons, createCupom, updateCupom, deleteCupom } from '../../api/cupons';
import { Cupom } from '../../types';

export default function Cupons() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Cupom> | null>(null);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCupons();
        if (!cancelled) setCupons(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setError('Erro ao carregar cupons');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCupons();
      setCupons(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: Cupom) => {
    if (item) {
      setEditItem(item);
    } else {
      setEditItem({ codigo: gerarCodigo(), tipo: 'percentual', valor: 10, valor_minimo_pedido: 0, uso_maximo: 100, usos_atuais: 0, expiracao: '', ativo: true });
    }
    setOpen(true);
  };

  const gerarCodigo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    return codigo;
  };

  const handleSave = async () => {
    if (!editItem) return;
    try {
      if (editItem.id) {
        await updateCupom(editItem.id, editItem);
      } else {
        await createCupom(editItem as Omit<Cupom, 'id' | 'createdAt'>);
      }
      setSnack(editItem.id ? 'Cupom atualizado!' : 'Cupom criado!');
      setOpen(false);
      load();
    } catch {
      setError('Erro ao salvar cupom');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCupom(id);
      setSnack('Cupom removido!');
      load();
    } catch {
      setError('Erro ao remover cupom');
    }
  };

  const handleCopiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setSnack('Código copiado!');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Cupons de Desconto</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Novo Cupom</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Tipo</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Usos</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Expiração</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cupons.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">Nenhum cupom cadastrado</TableCell></TableRow>
                  )}
                  {cupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={c.codigo} size="small" color="primary" variant="outlined" />
                          <IconButton size="small" aria-label="Copiar código" onClick={() => handleCopiarCodigo(c.codigo)}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.tipo === 'percentual' ? '%' : 'R$'}</TableCell>
                      <TableCell>{c.tipo === 'percentual' ? `${c.valor}%` : `R$ ${(c.valor ?? 0).toFixed(2)}`}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.usos_atuais}/{c.uso_maximo}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.expiracao ? new Date(c.expiracao).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Chip label={c.ativo ? 'Ativo' : 'Inativo'} color={c.ativo ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton aria-label="Editar cupom" onClick={() => handleOpen(c)}><Edit /></IconButton>
                        <IconButton aria-label="Remover cupom" color="error" onClick={() => handleDelete(c.id!)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Código" size="small" value={editItem?.codigo || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, codigo: e.target.value.toUpperCase() } : null)} />
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={editItem?.tipo || 'percentual'} label="Tipo"
                onChange={(e) => setEditItem((p) => p ? { ...p, tipo: e.target.value as 'percentual' | 'fixo' } : null)}>
                <MenuItem value="percentual">Percentual (%)</MenuItem>
                <MenuItem value="fixo">Valor Fixo (R$)</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Valor" type="number" size="small"
              value={editItem?.valor || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, valor: Math.max(0, Number(e.target.value)) } : null)} />
            <TextField fullWidth label="Valor mínimo do pedido (R$)" type="number" size="small"
              value={editItem?.valor_minimo_pedido || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, valor_minimo_pedido: Math.max(0, Number(e.target.value)) } : null)} />
            <TextField fullWidth label="Uso máximo" type="number" size="small"
              value={editItem?.uso_maximo || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, uso_maximo: Math.max(1, Number(e.target.value)) } : null)} />
            <TextField fullWidth label="Data de expiração" type="date" size="small"
              value={editItem?.expiracao || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, expiracao: e.target.value } : null)}
              slotProps={{ inputLabel: { shrink: true } }} />
            <FormControlLabel control={
              <Switch checked={editItem?.ativo ?? true}
                onChange={(e) => setEditItem((p) => p ? { ...p, ativo: e.target.checked } : null)} />
            } label="Ativo" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
