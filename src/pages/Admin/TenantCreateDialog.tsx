import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
} from '@mui/material';

interface Props {
  open: boolean;
  onSave: (data: { nome: string; email: string; senha: string; plano: string }) => Promise<void>;
  onClose: () => void;
}

export default function TenantCreateDialog({ open, onSave, onClose }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [plano, setPlano] = useState('free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!nome || !email || !senha) {
      setError('Preencha todos os campos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ nome, email, senha, plano });
      setNome('');
      setEmail('');
      setSenha('');
      setPlano('free');
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Erro ao criar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Novo Cliente</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth label="Nome do estabelecimento" size="small" value={nome}
          onChange={(e) => setNome(e.target.value)} sx={{ mt: 2, mb: 2 }} required />
        <TextField fullWidth label="Email do administrador" size="small" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} required />
        <TextField fullWidth label="Senha" size="small" type="password" value={senha}
          onChange={(e) => setSenha(e.target.value)} sx={{ mb: 2 }} required />
        <FormControl fullWidth>
          <InputLabel>Plano</InputLabel>
          <Select value={plano} label="Plano" onChange={(e) => setPlano(e.target.value)}>
            <MenuItem value="free">Free</MenuItem>
            <MenuItem value="pro">Pro</MenuItem>
            <MenuItem value="enterprise">Enterprise</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
