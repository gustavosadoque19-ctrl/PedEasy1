import { useState } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Switch, FormControlLabel,
  Select, MenuItem, InputLabel, FormControl, Snackbar,
} from '@mui/material';
import Save from '@mui/icons-material/Save';

const PREFIX = 'app_config_';

export default function ConfigPedidos() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const get = (key: string, def: string) => localStorage.getItem(PREFIX + key) || def;
    return {
      tipo_padrao: get('tipo_padrao', 'mesa'),
      tempo_limite: get('dashboard_tempo_limite', '30'),
      confirmar_entrega: get('confirmar_entrega', 'true'),
      permitir_obs: get('permitir_obs', 'true'),
      impressao_auto: get('impressao_auto', 'false'),
    };
  });
  const [snack, setSnack] = useState('');

  const handleSave = () => {
    Object.entries(values).forEach(([k, v]) => localStorage.setItem(PREFIX + k, v));
    localStorage.setItem('dashboard_tempo_limite', values.tempo_limite);
    setSnack('Configurações salvas!');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>Salvar</Button>
      </Box>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Pedido Padrão</InputLabel>
                <Select value={values.tipo_padrao} label="Tipo de Pedido Padrão"
                  onChange={(e) => setValues((p) => ({ ...p, tipo_padrao: e.target.value }))}>
                  <MenuItem value="mesa">Mesa</MenuItem>
                  <MenuItem value="comanda">Comanda</MenuItem>
                  <MenuItem value="delivery">Delivery</MenuItem>
                  <MenuItem value="balcao">Balcão</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Tempo Limite (minutos)" type="number" size="small"
                value={values.tempo_limite}
                onChange={(e) => setValues((p) => ({ ...p, tempo_limite: e.target.value }))}
                helperText="Pedidos acima deste tempo são considerados atrasados" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={<Switch checked={values.confirmar_entrega === 'true'}
                  onChange={(e) => setValues((p) => ({ ...p, confirmar_entrega: String(e.target.checked) }))} />}
                label="Confirmar antes de finalizar entrega" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={<Switch checked={values.permitir_obs === 'true'}
                  onChange={(e) => setValues((p) => ({ ...p, permitir_obs: String(e.target.checked) }))} />}
                label="Permitir observações nos itens" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={<Switch checked={values.impressao_auto === 'true'}
                  onChange={(e) => setValues((p) => ({ ...p, impressao_auto: String(e.target.checked) }))} />}
                label="Impressão automática ao receber pedido" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
