import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  InputLabel, FormControl, Snackbar,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Print from '@mui/icons-material/Print';

const PREFIX = 'app_config_';

interface Impressora {
  id: number;
  nome: string;
  tipo: 'termica' | 'laser' | 'matricial';
  endereco: string;
  ativo: boolean;
}

export default function Impressoras() {
  const [impressoras, setImpressoras] = useState<Impressora[]>(() => {
    try { const stored = localStorage.getItem(PREFIX + 'impressoras'); return stored ? JSON.parse(stored) : []; } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Impressora | null>(null);
  const [snack, setSnack] = useState('');

  const save = (lista: Impressora[]) => {
    setImpressoras(lista);
    localStorage.setItem(PREFIX + 'impressoras', JSON.stringify(lista));
  };

  const handleSave = () => {
    if (!edit) return;
    let lista: Impressora[];
    if (edit.id === -1) {
      lista = [...impressoras, { ...edit, id: Date.now() }];
    } else {
      lista = impressoras.map((i) => i.id === edit.id ? edit : i);
    }
    save(lista);
    setOpen(false);
    setEdit(null);
    setSnack('Impressora salva!');
  };

  const deleteImpressora = (id: number) => {
    save(impressoras.filter((i) => i.id !== id));
    setSnack('Impressora removida!');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Configure as impressoras do estabelecimento.
        </Typography>
        <Button variant="contained" size="small" startIcon={<Add />}
          onClick={() => { setEdit({ id: -1, nome: '', tipo: 'termica', endereco: '', ativo: true }); setOpen(true); }}>
          Nova Impressora
        </Button>
      </Box>

      {impressoras.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Nenhuma impressora cadastrada.
        </Typography></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {impressoras.map((imp) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={imp.id}>
              <Card variant="outlined" sx={{ borderColor: imp.ativo ? 'success.main' : 'text.disabled', opacity: imp.ativo ? 1 : 0.6 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        <Print sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                        {imp.nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Tipo: {imp.tipo}</Typography>
                      <Typography variant="body2" color="text.secondary">Endereço: {imp.endereco}</Typography>
                    </Box>
                    <Chip label={imp.ativo ? 'Ativa' : 'Inativa'} size="small"
                      color={imp.ativo ? 'success' : 'default'} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" onClick={() => { setEdit(imp); setOpen(true); }}>Editar</Button>
                    <Button size="small" color="error" onClick={() => deleteImpressora(imp.id)}>Remover</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit?.id === -1 ? 'Nova Impressora' : 'Editar Impressora'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Nome da Impressora" size="small" value={edit?.nome || ''}
              onChange={(e) => setEdit((p) => p ? { ...p, nome: e.target.value } : null)} />
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={edit?.tipo || 'termica'} label="Tipo"
                onChange={(e) => setEdit((p) => p ? { ...p, tipo: e.target.value as Impressora['tipo'] } : null)}>
                <MenuItem value="termica">Térmica</MenuItem>
                <MenuItem value="laser">Laser</MenuItem>
                <MenuItem value="matricial">Matricial</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Endereço / IP" size="small" value={edit?.endereco || ''}
              onChange={(e) => setEdit((p) => p ? { ...p, endereco: e.target.value } : null)}
              helperText="Ex: 192.168.0.100:9100 ou USB001" />
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
