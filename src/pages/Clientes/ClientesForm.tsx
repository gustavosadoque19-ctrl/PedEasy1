import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Switch, FormControlLabel, CircularProgress, Alert,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import { getCliente, createCliente, updateCliente } from '../../api/clientes';
import { clienteSchema, ClienteFormData } from '../../lib/validation';

export default function ClientesForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: { nome: '', documento: '', telefone: '', email: '', endereco: '', observacao: '', ativo: true },
  });

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    getCliente(Number(id)).then((res) => { if (!cancelled) reset(res.data); }).catch(() => { if (!cancelled) setApiError('Erro ao carregar cliente'); });
    return () => { cancelled = true; };
  }, [id, isEditing, reset]);

  const onSubmit = async (data: ClienteFormData) => {
    setSaving(true);
    setApiError('');
    try {
      if (isEditing) {
        await updateCliente(Number(id), data);
      } else {
        await createCliente(data);
      }
      navigate('/clientes');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setApiError(apiErr.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/clientes')}>Voltar</Button>
        <Typography variant="h4">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</Typography>
      </Box>
      {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit as any)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="nome" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Nome" size="small" required error={!!errors.nome} helperText={errors.nome?.message} autoFocus />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="documento" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="CPF/CNPJ" size="small" />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="telefone" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Telefone" size="small" />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="email" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Email" size="small" type="email" error={!!errors.email} helperText={errors.email?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller name="endereco" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Endereço" size="small" />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller name="observacao" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Observação" size="small" multiline rows={2} />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller name="ativo" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Ativo" />
                )} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate('/clientes')}>Cancelar</Button>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
                {saving ? <CircularProgress size={20} /> : 'Salvar'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
