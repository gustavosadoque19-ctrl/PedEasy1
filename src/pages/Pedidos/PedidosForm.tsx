import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Autocomplete,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import { getPedido, createPedido, updatePedido } from '../../api/pedidos';
import { getProdutos } from '../../api/produtos';
import { getClientes } from '../../api/clientes';
import { Produto, Cliente } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { pedidoSchema, PedidoFormData } from '../../lib/validation';

export default function PedidosForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema) as any,
    defaultValues: {
      cliente_id: undefined, funcionario_id: user?.id || 0, tipo: 'mesa',
      mesa: '', status: 'aberto', forma_pagamento: 'dinheiro',
      valor_total: 0, desconto: 0, observacao: '', itens: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' });

  const addItem = useCallback(() => {
    append({ produto_id: 0, produto_nome: '', quantidade: 1, preco_unitario: 0, total: 0, observacao: '', ncm: '' });
  }, [append]);

  const recalcTotal = useCallback((itens: PedidoFormData['itens']) => {
    const valor_total = itens.reduce((sum, item) => sum + (item.total || 0), 0);
    setValue('valor_total', valor_total);
  }, [setValue]);

  const handleProdutoChange = useCallback((index: number, produtoId: number) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (produto) {
      setValue(`itens.${index}.produto_id`, produto.id!);
      setValue(`itens.${index}.produto_nome`, produto.nome);
      setValue(`itens.${index}.preco_unitario`, produto.preco_venda);
      setValue(`itens.${index}.total`, produto.preco_venda * (watch(`itens.${index}.quantidade`) || 1));
      setValue(`itens.${index}.ncm`, produto.ncm || '');
    }
    recalcTotal(watch('itens'));
  }, [produtos, setValue, watch, recalcTotal]);

  const handleQtyChange = useCallback((index: number, qty: number) => {
    const q = Math.max(0, qty || 0);
    const preco = watch(`itens.${index}.preco_unitario`) || 0;
    setValue(`itens.${index}.quantidade`, q);
    setValue(`itens.${index}.total`, q * preco);
    recalcTotal(watch('itens'));
  }, [setValue, watch, recalcTotal]);

  const handlePriceChange = useCallback((index: number, price: number) => {
    const p = Math.max(0, price || 0);
    const qty = watch(`itens.${index}.quantidade`) || 0;
    setValue(`itens.${index}.preco_unitario`, p);
    setValue(`itens.${index}.total`, qty * p);
    recalcTotal(watch('itens'));
  }, [setValue, watch, recalcTotal]);

  useEffect(() => {
    let cancelled = false;
    getProdutos().then((res) => { if (!cancelled) setProdutos(res.data); }).catch(() => {});
    getClientes().then((res) => { if (!cancelled) setClientes(res.data); }).catch(() => {});
    if (isEditing) {
      setLoading(true);
      getPedido(Number(id)).then((res) => {
        if (cancelled) return;
        const p = res.data;
        reset({
          cliente_id: p.cliente_id, funcionario_id: p.funcionario_id, tipo: p.tipo,
          mesa: p.mesa || '', status: p.status, forma_pagamento: p.forma_pagamento,
          valor_total: p.valor_total, desconto: p.desconto, observacao: p.observacao,
          itens: p.itens,
        });
      }).catch(() => { if (!cancelled) setApiError('Erro ao carregar'); }).finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [id, isEditing, reset]);

  const onSubmit = async (data: PedidoFormData) => {
    setSaving(true);
    setApiError('');
    try {
      if (isEditing) {
        await updatePedido(Number(id), data as any);
      } else {
        await createPedido(data as any);
      }
      navigate('/pedidos');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setApiError(apiErr.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const tipo = watch('tipo');

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/pedidos')}>Voltar</Button>
        <Typography variant="h4">{isEditing ? 'Editar Pedido' : 'Novo Pedido'}</Typography>
      </Box>
      {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
      {errors.itens?.message && <Alert severity="warning" sx={{ mb: 2 }}>{errors.itens.message}</Alert>}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit as any)}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="tipo" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Tipo" size="small" select autoFocus>
                    {['mesa', 'comanda', 'delivery', 'balcao'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              {tipo === 'mesa' && (
                <Grid size={{ xs: 12, md: 2 }}>
                  <Controller name="mesa" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Mesa" size="small" />
                  )} />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: tipo === 'mesa' ? 4 : 5 }}>
                <Controller name="cliente_id" control={control} render={({ field }) => (
                  <Autocomplete
                    options={clientes} getOptionLabel={(c) => `${c.nome} (${c.documento})`}
                    value={clientes.find((c) => c.id === field.value) || null}
                    onChange={(_, v) => field.onChange(v?.id || undefined)}
                    renderInput={(params) => <TextField {...params} label="Cliente" size="small" />}
                  />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Controller name="forma_pagamento" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Forma Pagamento" size="small" select>
                    {['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'vale_refeicao'].map((f) => (
                      <MenuItem key={f} value={f}>{f.replace(/_/g, ' ').toUpperCase()}</MenuItem>
                    ))}
                  </TextField>
                )} />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 1 }}>Itens do Pedido</Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell width={100}>Qtd</TableCell>
                    <TableCell width={120}>Preço Unit.</TableCell>
                    <TableCell width={100}>Total</TableCell>
                    <TableCell width={100}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((fieldItem, index) => (
                    <TableRow key={fieldItem.id}>
                      <TableCell>
                        <Controller name={`itens.${index}.produto_id`} control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size="small" select
                              onChange={(e) => { field.onChange(Number(e.target.value)); handleProdutoChange(index, Number(e.target.value)); }}
                              error={!!errors.itens?.[index]?.produto_id}
                              helperText={errors.itens?.[index]?.produto_id?.message}>
                              {produtos.filter((p) => p.ativo).map((p) => (
                                <MenuItem key={p.id} value={p.id!}>{p.nome} - R$ {(p.preco_venda ?? 0).toFixed(2)}</MenuItem>
                              ))}
                            </TextField>
                          )} />
                      </TableCell>
                      <TableCell>
                        <Controller name={`itens.${index}.quantidade`} control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size="small" type="text" inputMode="decimal"
                              onChange={(e) => { const v = parseFloat(e.target.value) || 0; field.onChange(v); handleQtyChange(index, v); }} />
                          )} />
                      </TableCell>
                      <TableCell>
                        <Controller name={`itens.${index}.preco_unitario`} control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size="small" type="text" inputMode="decimal"
                              onChange={(e) => { const v = parseFloat(e.target.value) || 0; field.onChange(v); handlePriceChange(index, v); }} />
                          )} />
                      </TableCell>
                      <TableCell>
                        <Controller name={`itens.${index}.total`} control={control}
                          render={({ field }) => (
                            <Typography>R$ {(field.value || 0).toFixed(2)}</Typography>
                          )} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => remove(index)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button startIcon={<Add />} onClick={addItem} size="small" sx={{ mb: 2 }}>Adicionar Item</Button>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller name="desconto" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Desconto (R$)" size="small" type="text" inputMode="decimal"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller name="observacao" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Observação" size="small" />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Typography variant="h5" color="primary.main">
                  Total: R$ {((watch('valor_total') || 0) - (watch('desconto') || 0)).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate('/pedidos')}>Cancelar</Button>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
                {saving ? <CircularProgress size={20} /> : 'Salvar Pedido'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
