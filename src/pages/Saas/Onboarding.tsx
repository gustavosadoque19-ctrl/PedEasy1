import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stepper, Step, StepLabel, Card, CardContent, TextField,
  Button, CircularProgress, Alert, Grid, FormControl, InputLabel, Select, MenuItem,
  Chip, Checkbox, ListItemText, OutlinedInput,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import api from '../../api/axios';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useTenant } from '../../contexts/TenantContext';

const STEPS = ['Estabelecimento', 'Configuração de Entrega', 'Finalizar'];

const ALL_PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'vale_refeicao', label: 'Vale Refeição' },
];

const WEEKDAYS = [
  { key: 'Segunda', label: 'Segunda-feira' },
  { key: 'Terça', label: 'Terça-feira' },
  { key: 'Quarta', label: 'Quarta-feira' },
  { key: 'Quinta', label: 'Quinta-feira' },
  { key: 'Sexta', label: 'Sexta-feira' },
  { key: 'Sábado', label: 'Sábado' },
  { key: 'Domingo', label: 'Domingo' },
];

const defaultHours = WEEKDAYS.map((d) => ({
  dia: d.key, abertura: d.key === 'Domingo' ? '' : '08:00',
  fechamento: d.key === 'Domingo' ? '' : '18:00',
  fechado: d.key === 'Domingo',
}));

export default function Onboarding() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { refreshTenant } = useTenant();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [taxaEntrega, setTaxaEntrega] = useState('0');
  const [tempoEstimado, setTempoEstimado] = useState('30-50 min');
  const [horarios, setHorarios] = useState(defaultHours);

  useEffect(() => {
    api.get('/saas/onboarding').then((res) => {
      const o = res.data;
      if (o.completed) { navigate('/app', { replace: true }); return; }
      if (o.data) {
        setTelefone(o.data.telefone || '');
        setWhatsapp(o.data.whatsapp || '');
        setEndereco(o.data.endereco || '');
        setPaymentMethods(o.data.formas_pagamento || []);
        setTaxaEntrega(String(o.data.taxa_entrega ?? '0'));
        setTempoEstimado(o.data.tempo_estimado || '30-50 min');
        if (o.data.horarios) setHorarios(o.data.horarios);
      }
      if (o.step > 0) setActiveStep(o.step);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  const saveStep = async (step: number, extra: Record<string, any> = {}) => {
    setSaving(true);
    setError('');
    try {
      await api.post('/saas/onboarding', { step, data: extra });
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao salvar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const ok = await saveStep(1, { telefone, whatsapp, endereco });
      if (!ok) return;
    } else if (activeStep === 1) {
      const ok = await saveStep(2, {
        formas_pagamento: paymentMethods, taxa_entrega: Number(taxaEntrega),
        tempo_estimado: tempoEstimado, horarios,
      });
      if (!ok) return;
    } else if (activeStep === 2) {
      const ok = await saveStep(3, { completed: true });
      if (ok) {
        snackbar.success('Configuração concluída!');
        await refreshTenant();
        navigate('/app', { replace: true });
      }
      return;
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const toggleHorario = (idx: number) => {
    setHorarios((prev) => prev.map((h, i) => i === idx ? { ...h, fechado: !h.fechado } : h));
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Boas-vindas!</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Vamos configurar seu estabelecimento em poucos passos.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Dados do Estabelecimento</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Telefone" size="small" value={telefone}
                    onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="WhatsApp" size="small" value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Endereço" size="small" value={endereco}
                    onChange={(e) => setEndereco(e.target.value)} placeholder="Rua Exemplo, 123" />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Configuração de Delivery</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Taxa de Entrega (R$)" size="small" type="number"
                    value={taxaEntrega} onChange={(e) => setTaxaEntrega(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Tempo Estimado" size="small" value={tempoEstimado}
                    onChange={(e) => setTempoEstimado(e.target.value)} placeholder="30-50 min" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Formas de Pagamento</InputLabel>
                    <Select multiple value={paymentMethods}
                      onChange={(e) => setPaymentMethods(e.target.value as string[])}
                      input={<OutlinedInput label="Formas de Pagamento" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((v) => <Chip key={v} label={ALL_PAYMENT_METHODS.find((m) => m.value === v)?.label || v} size="small" />)}
                        </Box>
                      )}>
                      {ALL_PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m.value} value={m.value}>
                          <Checkbox checked={paymentMethods.includes(m.value)} size="small" />
                          <ListItemText primary={m.label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Horários de Funcionamento</Typography>
                  {horarios.map((h, i) => (
                    <Box key={h.dia} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={h.dia} size="small" color={h.fechado ? 'default' : 'primary'}
                        variant={h.fechado ? 'outlined' : 'filled'}
                        onClick={() => toggleHorario(i)} />
                      {!h.fechado && (
                        <>
                          <TextField size="small" type="time" value={h.abertura}
                            onChange={(e) => setHorarios((prev) => prev.map((h2, j) => j === i ? { ...h2, abertura: e.target.value } : h2))}
                            slotProps={{ htmlInput: { style: { fontSize: '0.8rem' } } }} sx={{ width: 100 }} />
                          <Typography variant="body2">até</Typography>
                          <TextField size="small" type="time" value={h.fechamento}
                            onChange={(e) => setHorarios((prev) => prev.map((h2, j) => j === i ? { ...h2, fechamento: e.target.value } : h2))}
                            slotProps={{ htmlInput: { style: { fontSize: '0.8rem' } } }} sx={{ width: 100 }} />
                        </>
                      )}
                      {h.fechado && <Typography variant="caption" color="text.secondary">Fechado</Typography>}
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Tudo pronto!</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Suas configurações iniciais foram salvas. Agora você já pode começar a usar o sistema.
              </Typography>
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Próximos passos:</Typography>
                <Typography variant="body2">• Cadastre seus produtos no cardápio</Typography>
                <Typography variant="body2">• Configure as mesas do restaurante</Typography>
                <Typography variant="body2">• Adicione funcionários</Typography>
                <Typography variant="body2">• Veja planos para liberar mais recursos</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={handleBack} disabled={activeStep === 0 || saving} color="inherit">
              Voltar
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => navigate('/app', { replace: true })} color="inherit" disabled={saving}>
                Pular
              </Button>
              <Button onClick={handleNext} variant="contained" disabled={saving}>
                {saving ? <CircularProgress size={20} color="inherit" /> : activeStep === STEPS.length - 1 ? 'Finalizar' : 'Continuar'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
