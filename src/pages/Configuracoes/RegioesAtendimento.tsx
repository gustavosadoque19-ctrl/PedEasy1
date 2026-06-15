import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton,
  Switch, FormControlLabel, ToggleButtonGroup, ToggleButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import PlayArrow from '@mui/icons-material/PlayArrow';
import MyLocation from '@mui/icons-material/MyLocation';
import MapDrawer from '../../components/MapDrawer';

interface Regiao {
  id: number;
  nome: string;
  valor: number;
  ativo: boolean;
  coordenadas?: [number, number][];
}

export default function RegioesAtendimento() {
  const [tipoFiltro, setTipoFiltro] = useState('bairro');
  const [clienteEditaBairro, setClienteEditaBairro] = useState(false);
  const [clienteEditaCidade, setClienteEditaCidade] = useState(true);
  const [search, setSearch] = useState('');
  const [regioes, setRegioes] = useState<Regiao[]>(() => {
    try {
      const stored = localStorage.getItem('app_config_regioes');
      return stored ? JSON.parse(stored) : [
        { id: 1, nome: 'Cabeceira do Vale', valor: 5, ativo: true },
        { id: 2, nome: 'Cidade do Automóvel', valor: 8, ativo: false },
      ];
    } catch { return []; }
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editRegiao, setEditRegiao] = useState<Regiao | null>(null);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    localStorage.setItem('app_config_regioes', JSON.stringify(regioes));
    localStorage.setItem('app_config_cliente_edita_bairro', String(clienteEditaBairro));
    localStorage.setItem('app_config_cliente_edita_cidade', String(clienteEditaCidade));
  }, [regioes, clienteEditaBairro, clienteEditaCidade]);

  const filtered = regioes.filter((r) =>
    r.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditRegiao({ id: 0, nome: '', valor: 0, ativo: true, coordenadas: [] });
    setOpenDialog(true);
  };

  const handleOpenEdit = (r: Regiao) => {
    setEditRegiao({ ...r });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!editRegiao || !editRegiao.nome.trim()) {
      setSnack('Informe o nome da região');
      return;
    }
    if (editRegiao.id === 0) {
      const id = regioes.length > 0 ? Math.max(...regioes.map((r) => r.id)) + 1 : 1;
      setRegioes([...regioes, { ...editRegiao, id }]);
    } else {
      setRegioes(regioes.map((r) => r.id === editRegiao.id ? editRegiao : r));
    }
    setOpenDialog(false);
    setSnack('Região salva!');
  };

  const handleDelete = (id: number) => {
    setRegioes(regioes.filter((r) => r.id !== id));
    setSnack('Região removida!');
  };

  const toggleAtivo = (id: number) => {
    setRegioes(regioes.map((r) => r.id === id ? { ...r, ativo: !r.ativo } : r));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          Adicionar
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Adicione pelo menos uma região de atendimento do seu estabelecimento
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={tipoFiltro}
              exclusive
              onChange={(_, v) => v && setTipoFiltro(v)}
              size="small"
            >
              <ToggleButton value="bairro">Bairro</ToggleButton>
              <ToggleButton value="raio">Raio</ToggleButton>
            </ToggleButtonGroup>
            <IconButton size="small" color="primary" sx={{ border: 1, borderColor: 'divider' }}>
              <PlayArrow fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            O cliente pode editar no cadastro do endereço de entrega:
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <FormControlLabel control={
              <Switch checked={clienteEditaBairro} size="small"
                onChange={(e) => setClienteEditaBairro(e.target.checked)} />
            } label="Bairro" />
            <FormControlLabel control={
              <Switch checked={clienteEditaCidade} size="small"
                onChange={(e) => setClienteEditaCidade(e.target.checked)} />
            } label="Cidade" />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar" value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
              sx={{ minWidth: 250 }} />
            <Typography variant="body2" color="text.secondary">
              Total de {regioes.length} registro(s)
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Região</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Ativo</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        Nenhuma região encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {r.nome}
                        {r.coordenadas && r.coordenadas.length > 0 && (
                          <MyLocation sx={{ fontSize: 14, ml: 0.5, color: 'primary.main', verticalAlign: 'middle' }} />
                        )}
                      </TableCell>
                      <TableCell>R$ {(r.valor ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Switch size="small" checked={r.ativo} onChange={() => toggleAtivo(r.id)} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Editar" onClick={() => handleOpenEdit(r)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" aria-label="Remover" color="error" onClick={() => handleDelete(r.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editRegiao?.id === 0 ? 'Nova Região' : 'Editar Região'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Nome da Região" size="small" value={editRegiao?.nome || ''}
              onChange={(e) => setEditRegiao((p) => p ? { ...p, nome: e.target.value } : null)}
              placeholder="ex: Centro, Bairro X" />
            <TextField fullWidth label="Valor da Taxa (R$)" type="text" inputMode="decimal" size="small"
              value={editRegiao?.valor || ''}
              onChange={(e) => setEditRegiao((p) => p ? { ...p, valor: parseFloat(e.target.value) || 0 } : null)}
              helperText="Valor adicional para entrega nesta região" />
            <MapDrawer
              coordinates={editRegiao?.coordenadas}
              onChange={(coords) => setEditRegiao((p) => p ? { ...p, coordenadas: coords } : null)}
            />
            {editRegiao?.coordenadas && editRegiao.coordenadas.length > 0 && (
              <Typography variant="caption" color="success.main">
                ✓ Região desenhada com {editRegiao.coordenadas.length} pontos
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}