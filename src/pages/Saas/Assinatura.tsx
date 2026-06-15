import { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Cancel from '@mui/icons-material/Cancel';
import { useTenant } from '../../contexts/TenantContext';
import { useSnackbar } from '../../hooks/useSnackbar';
import api from '../../api/axios';

export default function Assinatura() {
  const { tenant, refreshTenant } = useTenant();
  const snackbar = useSnackbar();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await api.delete('/saas/subscriptions');
      snackbar.success('Assinatura cancelada. Você voltou para o plano Free.');
      setCancelOpen(false);
      refreshTenant();
    } catch {
      snackbar.error('Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  if (!tenant) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Minha Assinatura</Typography>
      <Card sx={{ maxWidth: 600, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Plano atual</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{tenant.plano}</Typography>
            </Box>
            <Chip label={tenant.status} color={tenant.status === 'active' ? 'success' : tenant.status === 'trial' ? 'warning' : 'default'} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Typography variant="body2">{tenant.status === 'active' ? 'Ativo' : tenant.status === 'trial' ? 'Teste grátis' : 'Cancelado'}</Typography>
            </Box>
            {tenant.trial_ends_at && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Trial até</Typography>
                <Typography variant="body2">{new Date(tenant.trial_ends_at).toLocaleDateString()}</Typography>
              </Box>
            )}
            {tenant.pagarme_subscription_id && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Assinatura</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{tenant.pagarme_subscription_id}</Typography>
              </Box>
            )}
          </Box>
          {tenant.status === 'active' && (
            <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => setCancelOpen(true)}>
              Cancelar Assinatura
            </Button>
          )}
          {tenant.status === 'trial' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Seu período de teste termina em {Math.ceil((new Date(tenant.trial_ends_at!).getTime() - Date.now()) / 86400000)} dias.
              Assine um plano para continuar usando.
            </Alert>
          )}
        </CardContent>
      </Card>
      <Dialog open={cancelOpen} onClose={() => !canceling && setCancelOpen(false)}>
        <DialogTitle>Cancelar Assinatura?</DialogTitle>
        <DialogContent>
          <Typography>Seu plano será rebaixado para Free. Seus dados serão mantidos.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} color="inherit" disabled={canceling}>Voltar</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={canceling}>
            {canceling ? <CircularProgress size={20} color="inherit" /> : 'Confirmar Cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
