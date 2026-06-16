import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Switch, FormControlLabel, CircularProgress, Alert, MenuItem, Avatar,
  Chip, Select, InputLabel, FormControl, OutlinedInput,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import CloudUpload from '@mui/icons-material/CloudUpload';
import { getProduto, createProduto, updateProduto, uploadProdutoImagem, getImagemUrl } from '../../api/produtos';
import { getAdicionais } from '../../api/adicionais';
import { Produto, Adicional } from '../../types';
import { produtoSchema, ProdutoFormData } from '../../lib/validation';

const categorias = ['Bebidas', 'Cervejas', 'Petiscos', 'Porções', 'Lanches', 'Sobremesas', 'Pizzas', 'Massas', 'Saladas', 'Outros'];

function toProduto(form: ProdutoFormData): Omit<Produto, 'id' | 'createdAt'> {
  return {
    nome: form.nome,
    descricao: form.descricao,
    categoria: form.categoria,
    preco_venda: parseFloat(form.preco_venda) || 0,
    preco_custo: parseFloat(form.preco_custo) || 0,
    unidade: form.unidade,
    ncm: form.ncm || undefined,
    estoque_atual: parseFloat(form.estoque_atual) || 0,
    estoque_minimo: parseFloat(form.estoque_minimo) || 0,
    ativo: form.ativo,
    adicionais_ids: form.adicionais_ids || [],
    max_adicionais: form.max_adicionais || 0,
  };
}

export default function ProdutosForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [imagemPreview, setImagemPreview] = useState('');
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [, setProdutoAtual] = useState<Produto | null>(null);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: { nome: '', descricao: '', categoria: '', preco_venda: '', preco_custo: '', unidade: 'un', ncm: '', estoque_atual: '', estoque_minimo: '', ativo: true, adicionais_ids: [], max_adicionais: 0 },
  });

  useEffect(() => {
    getAdicionais().then((res) => setAdicionais(res.data.filter((a: Adicional) => a.ativo))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    getProduto(Number(id)).then((res) => {
      if (cancelled) return;
      const p = res.data;
      setProdutoAtual(p);
      if (p.imagem) setImagemPreview(getImagemUrl(p.imagem));
      reset({
        nome: p.nome, descricao: p.descricao ?? '', categoria: p.categoria,
        preco_venda: p.preco_venda.toString(), preco_custo: (p.preco_custo ?? 0).toString(),
        unidade: p.unidade ?? 'un', ncm: p.ncm ?? '', estoque_atual: (p.estoque_atual ?? 0).toString(),
        estoque_minimo: (p.estoque_minimo ?? 0).toString(), ativo: p.ativo,
        adicionais_ids: p.adicionais_ids || [],
        max_adicionais: p.max_adicionais || 0,
      });
    }).catch(() => { if (!cancelled) setApiError('Erro ao carregar'); });
    return () => { cancelled = true; };
  }, [id, isEditing, reset]);

  const handleUploadImagem = async (file: File) => {
    if (!isEditing || !id) {
      setApiError('Salve o produto primeiro, depois adicione uma imagem');
      return;
    }
    setUploadingImagem(true);
    try {
      const res = await uploadProdutoImagem(Number(id), file);
      setProdutoAtual(res.data);
      setImagemPreview(getImagemUrl(res.data.imagem));
    } catch (err: unknown) {
      setApiError((err as Error).message || 'Erro ao fazer upload');
    } finally {
      setUploadingImagem(false);
    }
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setSaving(true);
    setApiError('');
    try {
      if (isEditing) {
        await updateProduto(Number(id), toProduto(data));
      } else {
        await createProduto(toProduto(data));
      }
      navigate('/app/produtos');
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
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/app/produtos')}>Voltar</Button>
        <Typography variant="h4">{isEditing ? 'Editar Produto' : 'Novo Produto'}</Typography>
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
                <Controller name="categoria" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Categoria" size="small" select required error={!!errors.categoria} helperText={errors.categoria?.message}>
                    {categorias.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="unidade" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Unidade" size="small" select>
                    {['un', 'kg', 'g', 'L', 'ml', 'cx'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="ncm" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="NCM" size="small" placeholder="21069090" slotProps={{ htmlInput: { maxLength: 8 } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller name="descricao" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Descrição" size="small" multiline rows={2} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="preco_venda" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Preço de Venda" size="small" type="number" required
                    error={!!errors.preco_venda} helperText={errors.preco_venda?.message} slotProps={{ htmlInput: { step: '0.01' } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="preco_custo" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Preço de Custo" size="small" type="number" slotProps={{ htmlInput: { step: '0.01' } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="estoque_atual" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Estoque Atual" size="small" type="number" />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="estoque_minimo" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Estoque Mínimo" size="small" type="number" />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="adicionais_ids" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Adicionais Disponíveis</InputLabel>
                    <Select multiple value={field.value || []} onChange={field.onChange} input={<OutlinedInput label="Adicionais Disponíveis" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((id: number) => {
                            const a = adicionais.find((ad) => ad.id === id);
                            return a ? <Chip key={id} label={a.nome} size="small" /> : null;
                          })}
                        </Box>
                      )}>
                      {adicionais.map((a) => (
                        <MenuItem key={a.id} value={a.id!}>{a.nome} — R$ {(a.preco ?? 0).toFixed(2)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="max_adicionais" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Limite de Adicionais" size="small" type="number"
                    value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))}
                    helperText="0 = ilimitado" slotProps={{ htmlInput: { min: 0 } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller name="ativo" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Ativo" />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Imagem do Produto</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={imagemPreview} sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}>
                    {!imagemPreview && <CloudUpload />}
                  </Avatar>
                  <Box>
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                      ref={fileInputRef} style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImagem(file);
                      }} />
                    <Button variant="outlined" size="small" component="span"
                      disabled={uploadingImagem || !isEditing}
                      onClick={() => fileInputRef.current?.click()}
                      startIcon={uploadingImagem ? <CircularProgress size={16} /> : <CloudUpload />}>
                      {uploadingImagem ? 'Enviando...' : 'Selecionar Imagem'}
                    </Button>
                    {!isEditing && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Salve o produto primeiro para poder adicionar imagem
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate('/app/produtos')}>Cancelar</Button>
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
