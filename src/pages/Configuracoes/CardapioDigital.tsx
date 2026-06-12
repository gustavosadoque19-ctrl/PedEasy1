import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Snackbar, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Star from '@mui/icons-material/Star';
import QrCode from '@mui/icons-material/QrCode';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import Share from '@mui/icons-material/Share';
import { getProdutos } from '../../api/produtos';
import { getDeliveryConfig, saveDeliveryConfig } from '../../api/cardapio';
import { Produto } from '../../types';

const PREFIX = 'app_config_';

interface Promocao {
  id: number;
  titulo: string;
  descricao: string;
  produtos: string;
  validoAte: string;
  tipo: string;
  cor: string;
}

export default function CardapioDigital() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [destaques, setDestaques] = useState<number[]>(() => {
    try { const stored = localStorage.getItem(PREFIX + 'produtos_destaque'); return stored ? JSON.parse(stored) : []; } catch { return []; }
  });
  const [cardapioAtivo, setCardapioAtivo] = useState(() => localStorage.getItem(PREFIX + 'cardapio_ativo') !== 'false');
  const [promocoes, setPromocoes] = useState<Promocao[]>(() => {
    try { const stored = localStorage.getItem(PREFIX + 'promocoes'); return stored ? JSON.parse(stored) : []; } catch { return []; }
  });
  const [openPromo, setOpenPromo] = useState(false);
  const [editPromo, setEditPromo] = useState<Promocao | null>(null);
  const [snack, setSnack] = useState('');
  const [openPreview, setOpenPreview] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [deliveryConfig, setDeliveryConfig] = useState<{
    taxa_entrega: number; tempo_estimado: string;
    horarios: { dia: string; abertura: string; fechamento: string; fechado: boolean }[];
  }>({ taxa_entrega: 0, tempo_estimado: '30-50 min', horarios: [] });
  const [savingDelivery, setSavingDelivery] = useState(false);

  const mountedRef = useRef(true);

  const cardapioUrl = `${window.location.origin}/cardapio`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [prodRes, cfgRes] = await Promise.all([
          getProdutos(),
          getDeliveryConfig(),
        ]);
        if (!cancelled) setProdutos(prodRes.data.filter((p: Produto) => p.ativo !== false));
        if (!cancelled) setDeliveryConfig({
          taxa_entrega: cfgRes.data.taxa_entrega ?? 0,
          tempo_estimado: cfgRes.data.tempo_estimado || '30-50 min',
          horarios: cfgRes.data.horarios || [],
        });
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; mountedRef.current = false; };
  }, []);

  const toggleDestaque = async (produtoId: number) => {
    let novos = [...destaques];
    if (novos.includes(produtoId)) {
      novos = novos.filter((id) => id !== produtoId);
    } else {
      if (novos.length >= 8) { setSnack('Máximo de 8 produtos em destaque'); return; }
      novos.push(produtoId);
    }
    setDestaques(novos);
    localStorage.setItem(PREFIX + 'produtos_destaque', JSON.stringify(novos));
  };

  const saveCardapioAtivo = (val: boolean) => {
    setCardapioAtivo(val);
    localStorage.setItem(PREFIX + 'cardapio_ativo', String(val));
    setSnack(val ? 'Cardápio ativado!' : 'Cardápio desativado!');
  };

  const handleSavePromo = () => {
    if (!editPromo) return;
    let lista: Promocao[];
    if (editPromo.id === -1) {
      lista = [...promocoes, { ...editPromo, id: Date.now() }];
    } else {
      lista = promocoes.map((p) => p.id === editPromo.id ? editPromo : p);
    }
    setPromocoes(lista);
    localStorage.setItem(PREFIX + 'promocoes', JSON.stringify(lista));
    setOpenPromo(false);
    setEditPromo(null);
    setSnack('Promoção salva!');
  };

  const deletePromo = (id: number) => {
    const lista = promocoes.filter((p) => p.id !== id);
    setPromocoes(lista);
    localStorage.setItem(PREFIX + 'promocoes', JSON.stringify(lista));
    setSnack('Promoção removida!');
  };

  const handleSaveDelivery = async () => {
    setSavingDelivery(true);
    try {
      await saveDeliveryConfig(deliveryConfig);
      setSnack('Configurações de delivery salvas!');
    } catch {
      setSnack('Erro ao salvar configurações');
    } finally {
      setSavingDelivery(false);
    }
  };

  const updateHorario = (index: number, field: string, value: string | boolean) => {
    const h = [...deliveryConfig.horarios];
    (h[index] as Record<string, string | boolean>)[field] = value;
    setDeliveryConfig({ ...deliveryConfig, horarios: h });
  };

  const compartilharCardapio = async () => {
    try {
      await navigator.share({ title: 'Cardápio Digital', url: cardapioUrl });
    } catch {
      navigator.clipboard.writeText(cardapioUrl);
      setSnack('Link copiado para área de transferência!');
    }
  };

  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel control={<Switch checked={cardapioAtivo} onChange={(e) => saveCardapioAtivo(e.target.checked)} />}
            label="Cardápio Digital Ativo" />
          <Chip label="Online" color="success" size="small" variant={cardapioAtivo ? 'filled' : 'outlined'} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Compartilhar link do cardápio">
            <IconButton aria-label="Compartilhar cardápio" onClick={compartilharCardapio}><Share /></IconButton>
          </Tooltip>
          <Tooltip title="Visualizar cardápio">
            <IconButton aria-label="Visualizar cardápio" onClick={() => setOpenPreview(true)}><Visibility /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Produtos em Destaque</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecione até 8 produtos para aparecerem como destaque no cardápio digital.
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
              ) : (
                <>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Filtrar por categoria</InputLabel>
                    <Select value={categoriaFiltro} label="Filtrar por categoria"
                      onChange={(e) => setCategoriaFiltro(e.target.value)}>
                      <MenuItem value="todas">Todas as categorias</MenuItem>
                      {categorias.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Grid container spacing={1}>
                    {(categoriaFiltro === 'todas' ? produtos : produtos.filter((p) => p.categoria === categoriaFiltro)).map((p) => {
                      const isDestaque = destaques.includes(p.id!);
                      return (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}>
                          <Chip
                            label={p.nome}
                            icon={isDestaque ? <Star /> : undefined}
                            variant={isDestaque ? 'filled' : 'outlined'}
                            color={isDestaque ? 'warning' : 'default'}
                            onClick={() => toggleDestaque(p.id!)}
                            sx={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Promoções</Typography>
                <Button size="small" variant="outlined" startIcon={<Add />}
                  onClick={() => { setEditPromo({ id: -1, titulo: '', descricao: '', produtos: '', validoAte: '', tipo: 'desconto', cor: '#FFF8E1' }); setOpenPromo(true); }}>
                  Nova Promoção
                </Button>
              </Box>
              {promocoes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nenhuma promoção cadastrada.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {promocoes.map((promo) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={promo.id}>
                      <Card variant="outlined" sx={{ bgcolor: promo.cor || '#FFF8E1', borderColor: '#FF8F00' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{promo.titulo}</Typography>
                              <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                                {promo.tipo === 'desconto' ? 'Desconto' : 'Oferta'}
                              </Typography>
                            </Box>
                            <Box>
                              <IconButton size="small" aria-label="Editar" onClick={() => { setEditPromo(promo); setOpenPromo(true); }}><Edit fontSize="small" /></IconButton>
                              <IconButton size="small" aria-label="Remover" color="error" onClick={() => deletePromo(promo.id)}><Delete fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{promo.descricao}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                            Produtos: {promo.produtos || 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            Válido até: {promo.validoAte || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>QR Code do Cardápio</Typography>
              <Box sx={{
                width: 180, height: 180, mx: 'auto', mb: 2,
                border: 2, borderColor: 'divider', borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'white',
              }}>
                <QrCode sx={{ fontSize: 120, color: 'primary.main' }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-all' }}>
                {cardapioUrl}
              </Typography>
              <Button fullWidth size="small" variant="outlined" onClick={compartilharCardapio} startIcon={<Share />}>
                Compartilhar Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Estatísticas</Typography>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Produtos Ativos</Typography>
                <Typography variant="h5">{produtos.length}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Em Destaque</Typography>
                <Typography variant="h5">{destaques.length} / 8</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Promoções Ativas</Typography>
                <Typography variant="h5">{promocoes.length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Configuração de Delivery */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Configuração de Delivery</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField fullWidth label="Taxa de Entrega (R$)" type="text" inputMode="decimal" size="small"
                value={deliveryConfig.taxa_entrega}
                onChange={(e) => setDeliveryConfig({ ...deliveryConfig, taxa_entrega: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField fullWidth label="Tempo Estimado" size="small"
                value={deliveryConfig.tempo_estimado}
                onChange={(e) => setDeliveryConfig({ ...deliveryConfig, tempo_estimado: e.target.value })}
                placeholder="ex: 30-50 min" />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>Horários de Funcionamento</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {deliveryConfig.horarios.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Nenhum horário configurado.</Typography>
            ) : (
              deliveryConfig.horarios.map((h, i) => (
                <Box key={h.dia} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ minWidth: 80, fontWeight: 500 }}>{h.dia}</Typography>
                  <TextField type="time" size="small" value={h.abertura}
                    disabled={h.fechado}
                    onChange={(e) => updateHorario(i, 'abertura', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 140 }} />
                  <Typography variant="body2">até</Typography>
                  <TextField type="time" size="small" value={h.fechamento}
                    disabled={h.fechado}
                    onChange={(e) => updateHorario(i, 'fechamento', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 140 }} />
                  <FormControlLabel control={
                    <Switch checked={h.fechado} size="small"
                      onChange={(e) => updateHorario(i, 'fechado', e.target.checked)} />
                  } label="Fechado" sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }} />
                </Box>
              ))
            )}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleSaveDelivery} disabled={savingDelivery}>
              {savingDelivery ? <CircularProgress size={20} color="inherit" /> : 'Salvar Configurações de Delivery'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openPromo} onClose={() => setOpenPromo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editPromo?.id === -1 ? 'Nova Promoção' : 'Editar Promoção'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Título" size="small" value={editPromo?.titulo || ''}
              onChange={(e) => setEditPromo((p) => p ? { ...p, titulo: e.target.value } : null)} />
            <TextField fullWidth label="Descrição" size="small" multiline rows={3} value={editPromo?.descricao || ''}
              onChange={(e) => setEditPromo((p) => p ? { ...p, descricao: e.target.value } : null)} />
            <TextField fullWidth label="Produtos (nomes separados por vírgula)" size="small" value={editPromo?.produtos || ''}
              onChange={(e) => setEditPromo((p) => p ? { ...p, produtos: e.target.value } : null)} />
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={editPromo?.tipo || 'desconto'} label="Tipo"
                onChange={(e) => setEditPromo((p) => p ? { ...p, tipo: e.target.value } : null)}>
                <MenuItem value="desconto">Desconto</MenuItem>
                <MenuItem value="oferta">Oferta Especial</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Cor de fundo</InputLabel>
              <Select value={editPromo?.cor || '#FFF8E1'} label="Cor de fundo"
                onChange={(e) => setEditPromo((p) => p ? { ...p, cor: e.target.value } : null)}>
                <MenuItem value="#FFF8E1">Amarelo</MenuItem>
                <MenuItem value="#E3F2FD">Azul</MenuItem>
                <MenuItem value="#E8F5E9">Verde</MenuItem>
                <MenuItem value="#FFF3E0">Laranja</MenuItem>
                <MenuItem value="#FCE4EC">Rosa</MenuItem>
                <MenuItem value="#F3E5F5">Roxo</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Válido até" type="date" size="small" value={editPromo?.validoAte || ''}
              onChange={(e) => setEditPromo((p) => p ? { ...p, validoAte: e.target.value } : null)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPromo(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSavePromo} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Visualização do Cardápio</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2 }}>
            {destaques.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Destaques</Typography>
                <Grid container spacing={1}>
                  {produtos.filter((p) => destaques.includes(p.id!)).map((p) => (
                    <Grid size={{ xs: 6 }} key={p.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="subtitle2">{p.nome}</Typography>
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                            R$ {p.preco_venda.toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            {promocoes.filter((p) => !p.validoAte || new Date(p.validoAte) > new Date()).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" color="secondary" sx={{ mb: 2 }}>Promoções</Typography>
                {promocoes.filter((p) => !p.validoAte || new Date(p.validoAte) > new Date()).map((p) => (
                  <Card key={p.id} variant="outlined" sx={{ mb: 1, bgcolor: p.cor || '#FFF8E1' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2">{p.titulo}</Typography>
                      <Typography variant="body2" color="text.secondary">{p.descricao}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
            <Typography variant="h6" sx={{ mb: 2 }}>Cardápio</Typography>
            {categorias.map((cat) => (
              <Box key={cat} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>{cat}</Typography>
                {produtos.filter((p) => p.categoria === cat).map((p) => (
                  <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="body2">{p.nome}</Typography>
                      {p.descricao && <Typography variant="caption" color="text.secondary">{p.descricao}</Typography>}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>R$ {p.preco_venda.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)} color="inherit">Fechar</Button>
          <Button onClick={compartilharCardapio} startIcon={<Share />} variant="contained">Compartilhar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
