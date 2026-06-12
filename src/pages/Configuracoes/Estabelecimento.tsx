import { useState } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Snackbar, Typography,
  FormControlLabel, Radio, RadioGroup, FormControl, Switch,
} from '@mui/material';
import Save from '@mui/icons-material/Save';
import { saveDeliveryConfig } from '../../api/cardapio';

const PREFIX = 'app_config_';

const defaultHorarios = [
  { dia: 'Segunda', abertura: '08:00', fechamento: '18:00', fechado: false },
  { dia: 'Terça', abertura: '08:00', fechamento: '18:00', fechado: false },
  { dia: 'Quarta', abertura: '08:00', fechamento: '18:00', fechado: false },
  { dia: 'Quinta', abertura: '08:00', fechamento: '18:00', fechado: false },
  { dia: 'Sexta', abertura: '08:00', fechamento: '18:00', fechado: false },
  { dia: 'Sábado', abertura: '08:00', fechamento: '13:00', fechado: false },
  { dia: 'Domingo', abertura: '', fechamento: '', fechado: true },
];

function formatHorarios(horarios: typeof defaultHorarios): string {
  const abertos = horarios.filter((h) => !h.fechado);
  if (abertos.length === 0) return 'Fechado';
  if (abertos.length === 7) {
    if (abertos.every((h) => h.abertura === '08:00' && h.fechamento === '18:00')) return 'Todos os dias: 08h-18h';
  }
  const partes = abertos.map((h) => `${h.dia.substring(0, 3)}: ${h.abertura}h-${h.fechamento}h`);
  return partes.join(', ');
}

const fields = [
  { key: 'nome_estabelecimento', label: 'Nome do Estabelecimento', defaultValue: 'PedEasy', helper: 'Nome exibido no sistema' },
  { key: 'endereco', label: 'Endereço', defaultValue: '', helper: 'Endereço completo do estabelecimento' },
  { key: 'telefone', label: 'Telefone', defaultValue: '', helper: 'Telefone para contato' },
  { key: 'email', label: 'E-mail', defaultValue: '', helper: 'E-mail para contato' },
  { key: 'server_url', label: 'URL da API', defaultValue: 'http://localhost:3000/api', helper: 'Endereço do servidor backend' },
  { key: 'bot_api_url', label: 'URL da API do WhatsApp Bot', defaultValue: 'http://localhost:3001', helper: 'Endereço do bot WhatsApp' },
];

export default function Estabelecimento() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => { initial[f.key] = localStorage.getItem(PREFIX + f.key) || f.defaultValue; });
    return initial;
  });
  const [tipoHorario, setTipoHorario] = useState(() => {
    return localStorage.getItem(PREFIX + 'tipo_horario') || 'especifico';
  });
  const [horarios, setHorarios] = useState<typeof defaultHorarios>(() => {
    try {
      const stored = localStorage.getItem(PREFIX + 'horarios');
      return stored ? JSON.parse(stored) : defaultHorarios;
    } catch { return defaultHorarios; }
  });
  const [snack, setSnack] = useState('');

  const handleSave = async () => {
    fields.forEach((f) => localStorage.setItem(PREFIX + f.key, values[f.key]));
    if (values.server_url) localStorage.setItem('server_url', values.server_url);
    if (values.bot_api_url) localStorage.setItem('bot_api_url', values.bot_api_url);
    localStorage.setItem(PREFIX + 'tipo_horario', tipoHorario);
    localStorage.setItem(PREFIX + 'horarios', JSON.stringify(horarios));
    const horarioStr = tipoHorario === 'fechado' ? 'Fechado' :
      tipoHorario === 'sempre' ? 'Sempre aberto' : formatHorarios(horarios);
    localStorage.setItem(PREFIX + 'horario_funcionamento', horarioStr);
    try {
      await saveDeliveryConfig({
        taxa_entrega: undefined,
        tempo_estimado: undefined,
        horarios: tipoHorario === 'especifico' ? horarios : defaultHorarios.map((h) => ({ ...h, fechado: tipoHorario !== 'sempre' })),
      });
    } catch { /* empty */ }
    setSnack('Informações salvas!');
  };

  const updateHorario = (index: number, field: string, value: string | boolean) => {
    const h = [...horarios];
    (h[index] as Record<string, string | boolean>)[field] = value;
    setHorarios(h);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>Salvar</Button>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {fields.map((f) => (
              <Grid size={{ xs: 12, md: f.key === 'endereco' ? 12 : 6 }} key={f.key}>
                <TextField fullWidth label={f.label} size="small" value={values[f.key]}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  helperText={f.helper} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Horário de Funcionamento</Typography>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup value={tipoHorario} onChange={(e) => setTipoHorario(e.target.value)}>
              <FormControlLabel value="sempre" control={<Radio size="small" />} label="Sempre aberto" />
              <FormControlLabel value="especifico" control={<Radio size="small" />} label="Disponível em dias e horários específicos" />
              <FormControlLabel value="agendado" control={<Radio size="small" />} label="Disponível apenas para pedidos agendados" />
              <FormControlLabel value="fechado" control={<Radio size="small" />} label="Fechado permanentemente" />
            </RadioGroup>
          </FormControl>

          {tipoHorario === 'especifico' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              {horarios.map((h, i) => (
                <Box key={h.dia} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ minWidth: 80, fontWeight: 500, fontSize: '0.9rem' }}>{h.dia}</Typography>
                  <TextField type="time" size="small" value={h.abertura}
                    disabled={h.fechado}
                    onChange={(e) => updateHorario(i, 'abertura', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 130 }} />
                  <Typography variant="body2">até</Typography>
                  <TextField type="time" size="small" value={h.fechamento}
                    disabled={h.fechado}
                    onChange={(e) => updateHorario(i, 'fechamento', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 130 }} />
                  <FormControlLabel control={
                    <Switch checked={h.fechado} size="small"
                      onChange={(e) => updateHorario(i, 'fechado', e.target.checked)} />
                  } label="Fechado" sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }} />
                </Box>
              ))}
            </Box>
          )}

          {tipoHorario === 'especifico' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Preview: {formatHorarios(horarios)}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
