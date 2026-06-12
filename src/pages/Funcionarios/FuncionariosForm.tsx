import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Switch, FormControlLabel, CircularProgress, Alert, MenuItem,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import { getFuncionario, createFuncionario, updateFuncionario } from '../../api/funcionarios';
import { funcionarioSchema, FuncionarioFormData } from '../../lib/validation';

export default function FuncionariosForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: { nome: '', usuario: '', senha: '', cargo: '', telefone: '', email: '', permissao: 'operador', ativo: true },
  });

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    getFuncionario(Number(id)).then((res) => { if (!cancelled) reset({ ...res.data, senha: '' }); }).catch(() => { if (!cancelled) setApiError('Erro ao carregar'); });
    return () => { cancelled = true; };
  }, [id, isEditing, reset]);

  const onSubmit = async (data: FuncionarioFormData) => {
    setSaving(true);
    setApiError('');
    try {
      const clean = { ...data };
      if (isEditing && !clean.senha) delete clean.senha;
      if (isEditing) {
        await updateFuncionario(Number(id), clean);
      } else {
        await createFuncionario(clean);
      }
      navigate('/funcionarios');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const msg = apiErr.response?.data?.error || apiErr.response?.data?.message || `Erro ${apiErr.response?.status || 'de conexão'} ao salvar`;
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/funcionarios')}>Voltar</Button>
        <Typography variant="h4">{isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}</Typography>
      </Box>
      {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="nome" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Nome" size="small" required error={!!errors.nome} helperText={errors.nome?.message} autoFocus />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="usuario" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Usuário" size="small" required error={!!errors.usuario} helperText={errors.usuario?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="senha" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Senha" size="small" type="password"
                    required={!isEditing} placeholder={isEditing ? 'Deixe em branco para manter' : ''} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="cargo" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Cargo" size="small" />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="permissao" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Permissão" size="small" select>
                    {['admin', 'gerente', 'operador', 'cozinha'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="telefone" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Telefone" size="small" />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="email" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Email" size="small" type="email" error={!!errors.email} helperText={errors.email?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller name="ativo" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Ativo" />
                )} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate('/funcionarios')}>Cancelar</Button>
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
