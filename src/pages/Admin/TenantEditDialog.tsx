import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
} from '@mui/material';
import { AdminTenant } from '../../api/admin';

interface Props {
  open: boolean;
  tenant: AdminTenant | null;
  onSave: (id: number, data: { plano: string; status: string }) => Promise<void>;
  onClose: () => void;
}

export default function TenantEditDialog({ open, tenant, onSave, onClose }: Props) {
  const [plano, setPlano] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tenant) {
      setPlano(tenant.plano);
      setStatus(tenant.status);
      setError('');
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    setError('');
    try {
      await onSave(tenant.id, { plano, status });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Tenant</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Plano</InputLabel>
          <Select value={plano} label="Plano" onChange={(e) => setPlano(e.target.value)}>
            <MenuItem value="free">Free</MenuItem>
            <MenuItem value="pro">Pro</MenuItem>
            <MenuItem value="enterprise">Enterprise</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="trial">Trial</MenuItem>
            <MenuItem value="active">Ativo</MenuItem>
            <MenuItem value="canceled">Cancelado</MenuItem>
            <MenuItem value="suspended">Suspenso</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
