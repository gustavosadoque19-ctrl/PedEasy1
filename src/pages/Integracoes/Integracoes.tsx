import { useState, useEffect } from 'react';
import {
  Box, Typography,   Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Chip, CircularProgress,
  Alert, Snackbar,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Sync from '@mui/icons-material/Sync';
import { getIntegracoes, createIntegracao, updateIntegracao, deleteIntegracao, sincronizarIntegracao } from '../../api/integracoes';
import { IntegracaoPDV } from '../../types';

const tipos: { value: string; label: string }[] = [
  { value: 'ifood', label: 'iFood' },
  { value: 'delivery', label: 'Delivery Próprio' },
  { value: 'erp', label: 'ERP' },
  { value: 'outro', label: 'Outro' },
];

export default function Integracoes() {
  const [integracoes, setIntegracoes] = useState<IntegracaoPDV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<IntegracaoPDV> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getIntegracoes();
        if (!cancelled) setIntegracoes(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setError('Erro ao carregar integrações');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getIntegracoes();
      setIntegracoes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: IntegracaoPDV) => {
    if (item) {
      setEditItem(item);
    } else {
      setEditItem({ nome: '', tipo: 'outro', api_url: '', api_key: '', ativo: true });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editItem) return;
    try {
      if (editItem.id) {
        await updateIntegracao(editItem.id, editItem);
      } else {
        await createIntegracao(editItem as Omit<IntegracaoPDV, 'id' | 'createdAt'>);
      }
      setSnack(editItem.id ? 'Integração atualizada!' : 'Integração criada!');
      setOpen(false);
      load();
    } catch {
      setError('Erro ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteIntegracao(id);
      setSnack('Integração removida!');
      load();
    } catch {
      setError('Erro ao remover');
    }
  };

  const handleSync = async (id: number) => {
    try {
      await sincronizarIntegracao(id);
      setSnack('Sincronização iniciada!');
      load();
    } catch {
      setError('Erro ao sincronizar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Integração com PDV</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Nova Integração</Button>
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
                    <TableCell>Nome</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Tipo</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>URL</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Última Sinc.</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {integracoes.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center">Nenhuma integração configurada</TableCell></TableRow>
                  )}
                  {integracoes.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.nome}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Chip label={tipos.find((t) => t.value === i.tipo)?.label || i.tipo} size="small" variant="outlined" /></TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: { xs: 'none', md: 'table-cell' } }}>{i.api_url}</TableCell>
                      <TableCell>
                        <Chip label={i.ativo ? 'Ativo' : 'Inativo'} color={i.ativo ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{i.ultima_sync ? new Date(i.ultima_sync).toLocaleString() : 'Nunca'}</TableCell>
                      <TableCell align="right">
                      <IconButton aria-label="Sincronizar" onClick={() => handleSync(i.id!)} color="primary"><Sync /></IconButton>
                      <IconButton aria-label="Editar" onClick={() => handleOpen(i)}><Edit /></IconButton>
                      <IconButton aria-label="Remover" color="error" onClick={() => handleDelete(i.id!)}><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Integração' : 'Nova Integração'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Nome" size="small" value={editItem?.nome || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, nome: e.target.value } : null)} />
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={editItem?.tipo || 'outro'} label="Tipo"
                onChange={(e) => setEditItem((p) => p ? { ...p, tipo: e.target.value as IntegracaoPDV['tipo'] } : null)}>
                {tipos.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="URL da API" size="small" value={editItem?.api_url || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, api_url: e.target.value } : null)} />
            <TextField fullWidth label="Chave de API (API Key)" size="small" type="password" value={editItem?.api_key || ''}
              onChange={(e) => setEditItem((p) => p ? { ...p, api_key: e.target.value } : null)} />
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
