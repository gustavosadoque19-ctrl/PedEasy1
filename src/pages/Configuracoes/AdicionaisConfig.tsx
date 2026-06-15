import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button,
  Switch, FormControlLabel, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, MenuItem,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import {
  getCategoriasAdicionais, createCategoriaAdicional, updateCategoriaAdicional, deleteCategoriaAdicional,
  getAdicionais, createAdicional, updateAdicional, deleteAdicional,
} from '../../api/adicionais';
import { Adicional, CategoriaAdicional } from '../../types';

export default function AdicionaisConfig() {
  const [categorias, setCategorias] = useState<CategoriaAdicional[]>([]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(true);

  const [catDialog, setCatDialog] = useState(false);
  const [catEdit, setCatEdit] = useState<CategoriaAdicional | null>(null);
  const [catNome, setCatNome] = useState('');

  const [adicDialog, setAdicDialog] = useState(false);
  const [adicEdit, setAdicEdit] = useState<Adicional | null>(null);
  const [adicNome, setAdicNome] = useState('');
  const [adicPreco, setAdicPreco] = useState('');
  const [adicCategoria, setAdicCategoria] = useState(0);
  const [adicAtivo, setAdicAtivo] = useState(true);

  const load = async () => {
    try {
      const [catRes, adicRes] = await Promise.all([getCategoriasAdicionais(), getAdicionais()]);
      setCategorias(catRes.data);
      setAdicionais(adicRes.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [catRes, adicRes] = await Promise.all([getCategoriasAdicionais(), getAdicionais()]);
        if (!cancelled) setCategorias(catRes.data);
        if (!cancelled) setAdicionais(adicRes.data);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const openCatDialog = (cat?: CategoriaAdicional) => {
    setCatEdit(cat || null);
    setCatNome(cat?.nome || '');
    setCatDialog(true);
  };

  const saveCat = async () => {
    if (!catNome.trim()) return;
    try {
      if (catEdit) {
        await updateCategoriaAdicional(catEdit.id!, { nome: catNome.trim() });
      } else {
        await createCategoriaAdicional({ nome: catNome.trim(), ativo: true });
      }
      setCatDialog(false);
      load();
    } catch { /* ignore */ }
  };

  const deleteCat = async (id: number) => {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      await deleteCategoriaAdicional(id);
      load();
    } catch { /* ignore */ }
  };

  const openAdicDialog = (adic?: Adicional) => {
    setAdicEdit(adic || null);
    setAdicNome(adic?.nome || '');
    setAdicPreco(adic ? adic.preco.toString() : '');
    setAdicCategoria(adic?.categoria_id || (categorias[0]?.id || 0));
    setAdicAtivo(adic?.ativo ?? true);
    setAdicDialog(true);
  };

  const saveAdic = async () => {
    if (!adicNome.trim() || !adicPreco) return;
    try {
      const data = { nome: adicNome.trim(), preco: parseFloat(adicPreco) || 0, categoria_id: adicCategoria, ativo: adicAtivo };
      if (adicEdit) {
        await updateAdicional(adicEdit.id!, data);
      } else {
        await createAdicional(data);
      }
      setAdicDialog(false);
      load();
    } catch { /* ignore */ }
  };

  const deleteAdic = async (id: number) => {
    if (!confirm('Excluir este adicional?')) return;
    try {
      await deleteAdicional(id);
      load();
    } catch { /* ignore */ }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Categorias de Adicionais</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => openCatDialog()}>Nova Categoria</Button>
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Ativo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorias.length === 0 && (
              <TableRow><TableCell colSpan={3} align="center">Nenhuma categoria cadastrada</TableCell></TableRow>
            )}
            {categorias.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.nome}</TableCell>
                <TableCell>{cat.ativo ? 'Sim' : 'Não'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openCatDialog(cat)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteCat(cat.id!)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Adicionais</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => openAdicDialog()}>Novo Adicional</Button>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Preço</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Ativo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adicionais.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">Nenhum adicional cadastrado</TableCell></TableRow>
            )}
            {adicionais.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.nome}</TableCell>
                <TableCell>R$ {(a.preco ?? 0).toFixed(2)}</TableCell>
                <TableCell>{categorias.find((c) => c.id === a.categoria_id)?.nome || '-'}</TableCell>
                <TableCell>{a.ativo ? 'Sim' : 'Não'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openAdicDialog(a)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteAdic(a.id!)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={catDialog} onClose={() => setCatDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{catEdit ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nome" size="small" value={catNome} onChange={(e) => setCatNome(e.target.value)} sx={{ mt: 1 }} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatDialog(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={saveCat}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={adicDialog} onClose={() => setAdicDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{adicEdit ? 'Editar Adicional' : 'Novo Adicional'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Nome" size="small" value={adicNome} onChange={(e) => setAdicNome(e.target.value)} autoFocus />
            <TextField fullWidth label="Preço" size="small" type="number" value={adicPreco}
              onChange={(e) => setAdicPreco(e.target.value)} slotProps={{ htmlInput: { step: '0.01', min: 0 } }} />
            <TextField fullWidth label="Categoria" size="small" select value={adicCategoria}
              onChange={(e) => setAdicCategoria(Number(e.target.value))}>
              {categorias.map((c) => <MenuItem key={c.id} value={c.id!}>{c.nome}</MenuItem>)}
            </TextField>
            <FormControlLabel control={<Switch checked={adicAtivo} onChange={(e) => setAdicAtivo(e.target.checked)} />} label="Ativo" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdicDialog(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={saveAdic}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
