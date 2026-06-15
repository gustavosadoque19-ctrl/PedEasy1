import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CreditCard from '@mui/icons-material/CreditCard';
import { getPlanos } from '../../api/saas';
import { useTenant } from '../../contexts/TenantContext';
import { useSnackbar } from '../../hooks/useSnackbar';
import { PlanoInfo } from '../../types/saas';
import api from '../../api/axios';

export default function Planos() {
  const { tenant, refreshTenant } = useTenant();
  const snackbar = useSnackbar();
  const [planos, setPlanos] = useState<PlanoInfo[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [selectedPlano, setSelectedPlano] = useState<PlanoInfo | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getPlanos();
        setPlanos(data);
      } catch {
        snackbar.error('Erro ao carregar planos');
      } finally {
        setLoadingPlanos(false);
      }
    })();
  }, []);

  const openCheckout = (plano: PlanoInfo) => {
    setSelectedPlano(plano);
    setCheckoutOpen(true);
    setError('');
  };

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  };

  const formatCardNumber = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleSubscribe = async () => {
    if (!selectedPlano) return;
    setError('');

    const [expMonth, expYear] = cardExpiry.split('/');
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
      setError('Data de validade inválida (MM/AA)');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/saas/subscriptions', {
        plan_slug: selectedPlano.slug,
        card: {
          number: cardNumber.replace(/\s/g, ''),
          holder_name: cardName,
          exp_month: expMonth,
          exp_year: `20${expYear}`,
          cvv: cardCvv,
        },
      });
      snackbar.success('Assinatura realizada com sucesso!');
      setCheckoutOpen(false);
      refreshTenant();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro ao processar assinatura');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPlanos) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Planos e Assinatura</Typography>
        <Typography variant="body1" color="text.secondary">
          {tenant?.plano === 'free'
            ? 'Você está no plano Free. Escolha um plano para desbloquear mais recursos.'
            : `Seu plano atual: ${tenant?.plano?.toUpperCase()}`}
        </Typography>
        {tenant?.status === 'trial' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Período de teste grátis. Escolha um plano para continuar usando após o trial.
          </Alert>
        )}
      </Box>

      <Grid container spacing={4} sx={{ alignItems: 'flex-end' }}>
        {planos.filter((p) => p.slug !== 'free').map((plano) => {
          const isCurrent = tenant?.plano === plano.slug;
          const features = getFeatureList(plano.slug);

          return (
            <Grid size={{ xs: 12, md: 6 }} key={plano.slug}>
              <Card sx={{
                borderRadius: 4,
                border: isCurrent ? 2 : 1,
                borderColor: isCurrent ? 'primary.main' : 'divider',
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{plano.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plano.slug === 'pro' ? 'Para crescer' : 'Para grandes redes'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        R$ {plano.preco}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">/mês</Typography>
                    </Box>
                  </Box>

                  {isCurrent && <Chip label="PLANO ATUAL" color="primary" size="small" sx={{ mb: 2 }} />}

                  <Box sx={{ mb: 4 }}>
                    {features.map((f) => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    fullWidth variant={isCurrent ? 'outlined' : 'contained'}
                    size="large" onClick={() => openCheckout(plano)}
                    disabled={isCurrent}
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {isCurrent ? 'Plano Atual' : `Assinar ${plano.nome}`}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={checkoutOpen} onClose={() => !submitting && setCheckoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard color="primary" />
            Assinar {selectedPlano?.nome} — R$ {selectedPlano?.preco}/mês
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Seus dados de pagamento são enviados com segurança para o Pagar.me.
            </Typography>
            <TextField fullWidth label="Número do Cartão" size="small"
              value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4111 1111 1111 1111" required />
            <TextField fullWidth label="Nome do Titular" size="small"
              value={cardName} onChange={(e) => setCardName(e.target.value)}
              placeholder="Como está no cartão" required />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Validade (MM/AA)" size="small"
                value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="12/27" required slotProps={{ htmlInput: { maxLength: 5 } }} />
              <TextField fullWidth label="CVV" size="small" type="password"
                value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123" required slotProps={{ htmlInput: { maxLength: 4 } }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCheckoutOpen(false)} color="inherit" disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubscribe} variant="contained" disabled={submitting || !cardNumber || !cardName || !cardExpiry || !cardCvv}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : `Assinar R$ ${selectedPlano?.preco}/mês`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function getFeatureList(slug: string): string[] {
  if (slug === 'pro') {
    return [
      'Pedidos ilimitados', 'Até 10 funcionários', 'Mesas ilimitadas',
      '100 NFC-e/mês', 'WhatsApp Bot', 'Relatórios avançados',
      'Cardápio digital completo', 'Suporte por email',
    ];
  }
  return [
    'Pedidos ilimitados', 'Funcionários ilimitados', 'Mesas ilimitadas',
    'NFC-e ilimitadas', 'WhatsApp Bot', 'Relatórios avançados',
    'Domínio personalizado', 'Suporte prioritário 24h', 'Onboarding dedicado',
  ];
}
