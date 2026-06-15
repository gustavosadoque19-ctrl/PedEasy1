import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';

type CheckoutFormState = {
  nome: string; telefone: string; endereco: string; numero: string;
  bairro: string; complemento: string; forma_pagamento: string;
  troco_para: string; observacao: string;
};
import {
  Box, Typography, Card, CardContent, Grid, Button, IconButton, Drawer,
  Divider, Badge, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Snackbar,
  Chip, CircularProgress, Checkbox, FormGroup, FormControlLabel,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import Delete from '@mui/icons-material/Delete';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Close from '@mui/icons-material/Close';
import LocalPizza from '@mui/icons-material/LocalPizza';
import Store from '@mui/icons-material/Store';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { getProdutosCardapio, criarPedidoDelivery, getDeliveryConfig } from '../../api/cardapio';
import { getImagemUrl } from '../../api/produtos';
import { getAdicionais } from '../../api/adicionais';
import { Produto, PedidoItem, Adicional } from '../../types';

const APP_PREFIX = 'app_config_';
const CART_KEY = 'cardapio_carrinho';
const CLIENTE_KEY = 'cardapio_cliente';

interface ProdutoCardapio extends Produto {
  adicionais_disponiveis: Adicional[];
}

interface CartItem {
  key: string;
  produto: Produto;
  quantidade: number;
  adicionais: Adicional[];
  observacao: string;
}

interface DeliveryConfig {
  taxa_entrega: number;
  tempo_estimado: string;
  horario_funcionamento: string;
  horarios: { dia: string; abertura: string; fechamento: string; fechado: boolean }[];
}

function getConfig(key: string, def: string = '') {
  return localStorage.getItem(APP_PREFIX + key) || def;
}

function getCartKey(produtoId: number, adicionais: Adicional[], observacao: string): string {
  const adicIds = adicionais.map((a) => a.id).sort().join(',');
  return `${produtoId}|${adicIds}|${observacao}`;
}

function groupAdicionaisByCategoria(adicionais: Adicional[]): Map<string, Adicional[]> {
  const map = new Map<string, Adicional[]>();
  for (const a of adicionais) {
    const cat = a.categoria_nome || 'Outros';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(a);
  }
  return map;
}

export default function CardapioPage() {
  const [produtos, setProdutos] = useState<ProdutoCardapio[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      if (c) {
        const items = JSON.parse(c);
        return items.map((i: CartItem) => ({
          ...i,
          key: i.key || getCartKey(i.produto.id!, i.adicionais || [], i.observacao || ''),
          adicionais: i.adicionais || [],
          observacao: i.observacao || '',
        }));
      }
      return [];
    } catch { return []; }
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  interface ConfirmItem {
    quantidade: number;
    produto_nome: string;
    total?: number;
    preco_unitario: number;
    adicionais: { nome: string }[];
    observacao: string;
  }
  const [confirmPedido, setConfirmPedido] = useState<{ itens: ConfirmItem[]; id: number; valor_total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState('');
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({ taxa_entrega: 0, tempo_estimado: '30-50 min', horario_funcionamento: '', horarios: [] });
  const [regioes] = useState<{ id: number; nome: string; valor: number; ativo: boolean }[]>(() => {
    try { const s = localStorage.getItem('app_config_regioes'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [regiaoId, setRegiaoId] = useState(0);
  const [destaques] = useState<number[]>(() => {
    try { const s = localStorage.getItem(APP_PREFIX + 'produtos_destaque'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [promocoes] = useState<{ id: number; titulo: string; descricao: string; cor: string; validoAte?: string }[]>(() => {
    try { const s = localStorage.getItem(APP_PREFIX + 'promocoes'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeProduto, setCustomizeProduto] = useState<ProdutoCardapio | null>(null);
  const [selectedAdicionais, setSelectedAdicionais] = useState<number[]>([]);
  const [itemObservacao, setItemObservacao] = useState('');

  const mountedRef = useRef(true);
  const nomeEst = getConfig('nome_estabelecimento', 'PedEasy');
  const telefoneEst = getConfig('telefone', '');
  const horarioEst = (() => {
    if (deliveryConfig.horarios.length > 0) {
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const hoje = diasSemana[new Date().getDay()];
      const hojeObj = deliveryConfig.horarios.find(h => h.dia === hoje);
      if (hojeObj && !hojeObj.fechado && hojeObj.abertura && hojeObj.fechamento) {
        return `Hoje: ${hojeObj.abertura}h - ${hojeObj.fechamento}h`;
      }
      return deliveryConfig.horario_funcionamento;
    }
    return deliveryConfig.horario_funcionamento || getConfig('horario_funcionamento', '');
  })();

  const [form, setForm] = useState<CheckoutFormState>(() => {
    try {
      const saved = localStorage.getItem(CLIENTE_KEY);
      if (saved) return { ...JSON.parse(saved), troco_para: '', observacao: '' } as CheckoutFormState;
    } catch { /* ignore */ }
    return { nome: '', telefone: '', endereco: '', numero: '', bairro: '', complemento: '',
      forma_pagamento: 'dinheiro', troco_para: '', observacao: '' };
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [prodRes, cfgRes, adicRes] = await Promise.all([
          getProdutosCardapio(),
          getDeliveryConfig(),
          getAdicionais(),
        ]);
        if (!cancelled) {
          const todosAdicionais = adicRes.data || [];
          const produtosComAdicionais = (prodRes.data as Produto[]).map((p) => ({
            ...p,
            adicionais_disponiveis: (p.adicionais_ids || [])
              .map((id) => todosAdicionais.find((a) => a.id === id))
              .filter(Boolean) as Adicional[],
          }));
          setProdutos(produtosComAdicionais as ProdutoCardapio[]);
          setDeliveryConfig({
            ...cfgRes.data,
            horarios: cfgRes.data.horarios || [],
          });
          const regioesAtivas = regioes.filter((r) => r.ativo);
          if (regioesAtivas.length === 1) setRegiaoId(regioesAtivas[0].id);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; mountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const dados = {
      nome: form.nome,
      telefone: form.telefone,
      endereco: form.endereco,
      numero: form.numero,
      bairro: form.bairro,
      complemento: form.complemento,
      forma_pagamento: form.forma_pagamento,
    };
    if (dados.nome || dados.telefone || dados.endereco) {
      localStorage.setItem(CLIENTE_KEY, JSON.stringify(dados));
    }
  }, [form.nome, form.telefone, form.endereco, form.numero, form.bairro, form.complemento, form.forma_pagamento]);

  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];
  const itensCount = cart.reduce((s, i) => s + i.quantidade, 0);
  const totalItens = cart.reduce((s, i) => {
    const adicTotal = i.adicionais.reduce((a, ad) => a + ad.preco, 0);
    return s + (i.produto.preco_venda + adicTotal) * i.quantidade;
  }, 0);
  const regiaoSelecionada = regioes.find((r) => r.id === regiaoId);
  const taxaEntrega = regiaoSelecionada ? regiaoSelecionada.valor : deliveryConfig.taxa_entrega;
  const totalPedido = totalItens + taxaEntrega;
  const promosAtivas = promocoes.filter((p) => !p.validoAte || new Date(p.validoAte) > new Date());
  const filteredProdutos = categoriaAtiva === 'todas' ? produtos : produtos.filter((p) => p.categoria === categoriaAtiva);

  const addToCart = (produto: Produto) => {
    const pc = produto as ProdutoCardapio;
    if (pc.adicionais_disponiveis && pc.adicionais_disponiveis.length > 0) {
      setCustomizeProduto(pc);
      setSelectedAdicionais([]);
      setItemObservacao('');
      setCustomizeOpen(true);
      return;
    }
    const key = getCartKey(produto.id!, [], '');
    setCart((prev) => {
      const exist = prev.find((i) => getCartKey(i.produto.id!, i.adicionais, i.observacao) === key);
      if (exist) {
        return prev.map((i) => getCartKey(i.produto.id!, i.adicionais, i.observacao) === key ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { key, produto, quantidade: 1, adicionais: [], observacao: '' }];
    });
    setSnack(`${produto.nome} adicionado ao carrinho`);
  };

  const confirmAddToCart = () => {
    if (!customizeProduto) return;
    const selected = customizeProduto.adicionais_disponiveis.filter((a) => selectedAdicionais.includes(a.id!));
    const key = getCartKey(customizeProduto.id!, selected, itemObservacao);
    setCart((prev) => {
      const exist = prev.find((i) => getCartKey(i.produto.id!, i.adicionais, i.observacao) === key);
      if (exist) {
        return prev.map((i) => getCartKey(i.produto.id!, i.adicionais, i.observacao) === key ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { key, produto: customizeProduto, quantidade: 1, adicionais: selected, observacao: itemObservacao }];
    });
    setCustomizeOpen(false);
    setSnack(`${customizeProduto.nome} adicionado ao carrinho`);
  };

  const toggleAdicional = (adicionalId: number) => {
    setSelectedAdicionais((prev) => {
      if (prev.includes(adicionalId)) {
        return prev.filter((id) => id !== adicionalId);
      }
      const max = customizeProduto?.max_adicionais || 0;
      if (max > 0 && prev.length >= max) {
        setSnack(`Máximo de ${max} adicional(is) atingido`);
        return prev;
      }
      return [...prev, adicionalId];
    });
  };

  const updateQty = (key: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.key === key ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i).filter((i) => i.quantidade > 0));
  };

  const removeItem = (key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  const handleCheckout = async () => {
    const enderecoCompleto = `${form.endereco}, ${form.numero}${form.bairro ? ` - ${form.bairro}` : ''}${form.complemento ? ` (${form.complemento})` : ''}`;
    if (!form.nome || !form.telefone || !form.endereco) {
      setSnack('Preencha nome, telefone e endereço');
      return;
    }
    const regioesAtivas = regioes.filter((r) => r.ativo);
    if (regioesAtivas.length > 0 && regiaoId === 0) {
      setSnack('Selecione uma região de entrega');
      return;
    }
    setSubmitting(true);
    try {
      const itens: PedidoItem[] = cart.map((i) => ({
        produto_id: i.produto.id!,
        produto_nome: i.produto.nome,
        quantidade: i.quantidade,
        preco_unitario: i.produto.preco_venda,
        total: (i.produto.preco_venda + i.adicionais.reduce((s, a) => s + a.preco, 0)) * i.quantidade,
        observacao: i.observacao,
        adicionais: i.adicionais,
      }));
      const res = await criarPedidoDelivery({
        cliente_nome: form.nome,
        cliente_telefone: form.telefone,
        endereco_entrega: enderecoCompleto,
        forma_pagamento: form.forma_pagamento,
        observacao: form.observacao,
        itens,
        taxa_entrega: taxaEntrega,
        troco_para: form.forma_pagamento === 'dinheiro' ? (parseFloat(form.troco_para) || 0) : 0,
      });
      setConfirmPedido(res.data);
      setCart([]);
      setCheckoutOpen(false);
      setConfirmOpen(true);
    } catch {
      setSnack('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getItemTotal = (item: CartItem) => {
    const adicTotal = item.adicionais.reduce((s, a) => s + a.preco, 0);
    return (item.produto.preco_venda + adicTotal) * item.quantidade;
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10 }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 2.5 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Store sx={{ fontSize: 36 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{nomeEst}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {horarioEst && `${horarioEst} — `}{telefoneEst && `${telefoneEst}`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, mt: 2 }}>
          {/* Promoções */}
          {promosAtivas.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {promosAtivas.map((p) => (
                <Card key={p.id} variant="outlined" sx={{ bgcolor: p.cor || '#FFF8E1', borderColor: '#FF8F00', borderLeft: '4px solid #FF8F00' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{p.titulo}</Typography>
                    {p.descricao && <Typography variant="caption" color="text.secondary">{p.descricao}</Typography>}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Destaques */}
          {destaques.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Destaques</Typography>
              <Grid container spacing={1}>
                {produtos.filter((p) => destaques.includes(p.id!)).map((p) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}>
                    <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={() => addToCart(p)}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                        <Box sx={{ width: 80, height: 80, mx: 'auto', mb: 0.5, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {p.imagem ? (
                            <Box component="img" src={getImagemUrl(p.imagem)} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
                          ) : (
                            <LocalPizza sx={{ fontSize: 32, color: '#94a3b8' }} />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{p.nome}</Typography>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>R$ {(p.preco_venda ?? 0).toFixed(2)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Categorias */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2, overflow: 'auto', pb: 0.5 }}>
            <Chip label="Todas" size="small" color={categoriaAtiva === 'todas' ? 'primary' : 'default'}
              onClick={() => setCategoriaAtiva('todas')} sx={{ fontWeight: 600 }} />
            {categorias.map((cat) => (
              <Chip key={cat} label={cat} size="small" color={categoriaAtiva === cat ? 'primary' : 'default'}
                onClick={() => setCategoriaAtiva(cat)} sx={{ fontWeight: 600 }} />
            ))}
          </Box>

          {/* Produtos */}
          <Grid container spacing={1.5}>
            {filteredProdutos.map((p) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 3 } }}>
                  <CardContent sx={{ flex: 1, p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: 120, height: 120, mb: 1, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.imagem ? (
                        <Box component="img" src={getImagemUrl(p.imagem)} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
                      ) : (
                        <LocalPizza sx={{ fontSize: 48, color: '#94a3b8' }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, mb: 0.5 }}>{p.nome}</Typography>
                    {p.descricao && (
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.descricao}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>R$ {(p.preco_venda ?? 0).toFixed(2)}</Typography>
                      <IconButton size="small" color="primary" aria-label="Adicionar" onClick={() => addToCart(p)} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                        <Add sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* FAB Carrinho */}
      {itensCount > 0 && (
        <Fab color="primary" aria-label="Carrinho" onClick={() => setCartOpen(true)}
          sx={{ position: 'fixed', bottom: 80, right: 20 }}>
          <Badge badgeContent={itensCount} color="error">
            <ShoppingCart />
          </Badge>
        </Fab>
      )}

      {/* Drawer Carrinho */}
      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 380 }, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Seu Carrinho</Typography>
            <IconButton onClick={() => setCartOpen(false)}><Close /></IconButton>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
            {cart.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Carrinho vazio</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {cart.map((item) => (
                  <Card key={item.key} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {item.produto.imagem ? (
                          <Box component="img" src={getImagemUrl(item.produto.imagem)} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
                        ) : (
                          <LocalPizza sx={{ fontSize: 24, color: '#94a3b8' }} />
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.produto.nome}</Typography>
                        {item.adicionais.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                            + {item.adicionais.map((a) => a.nome).join(', ')}
                          </Typography>
                        )}
                        {item.observacao && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic', lineHeight: 1.3 }}>
                            Obs: {item.observacao}
                          </Typography>
                        )}
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                          R$ {getItemTotal(item).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <IconButton size="small" aria-label="Remover" onClick={() => updateQty(item.key, -1)} sx={{ p: 0.3 }}>
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{item.quantidade}</Typography>
                        <IconButton size="small" aria-label="Adicionar" onClick={() => updateQty(item.key, 1)} sx={{ p: 0.3 }}>
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton size="small" aria-label="Excluir" color="error" onClick={() => removeItem(item.key)} sx={{ p: 0.3, ml: 0.5 }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
          <Divider />
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Subtotal</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>R$ {totalItens.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Taxa de Entrega</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {regiaoSelecionada ? regiaoSelecionada.nome + ': ' : ''}{taxaEntrega > 0 ? `R$ ${taxaEntrega.toFixed(2)}` : 'Grátis'}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography variant="body1" color="primary" sx={{ fontWeight: 800 }}>R$ {totalPedido.toFixed(2)}</Typography>
            </Box>
            <Button fullWidth variant="contained" size="large" disabled={cart.length === 0}
              onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
              Fechar Pedido
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog Personalizar */}
      <Dialog open={customizeOpen} onClose={() => setCustomizeOpen(false)} maxWidth="xs" fullWidth>
        {customizeProduto && (
          <>
            <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {customizeProduto.imagem ? (
                  <Box component="img" src={getImagemUrl(customizeProduto.imagem)} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
                ) : (
                  <LocalPizza sx={{ fontSize: 24, color: '#94a3b8' }} />
                )}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{customizeProduto.nome}</Typography>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                  Base: R$ {(customizeProduto.preco_venda ?? 0).toFixed(2)}
                </Typography>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ py: 2 }}>
              {customizeProduto.max_adicionais !== undefined && customizeProduto.max_adicionais > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                  Selecione até {customizeProduto.max_adicionais} adicional(is)
                </Typography>
              )}
              {(() => {
                const grupos = groupAdicionaisByCategoria(customizeProduto.adicionais_disponiveis);
                const sections: React.ReactNode[] = [];
                let idx = 0;
                for (const [catNome, adicionais] of grupos) {
                  sections.push(
                    <Box key={catNome} sx={{ mb: idx < grupos.size - 1 ? 2 : 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                        {catNome}
                      </Typography>
                      <FormGroup>
                        {adicionais.map((a) => {
                          const selected = selectedAdicionais.includes(a.id!);
                          const max = customizeProduto.max_adicionais || 0;
                          const disabled = !selected && max > 0 && selectedAdicionais.length >= max;
                          return (
                            <FormControlLabel
                              key={a.id}
                              control={<Checkbox size="small" checked={selected} disabled={disabled} onChange={() => toggleAdicional(a.id!)} />}
                              label={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                  <Typography variant="body2">{a.nome}</Typography>
                                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    +R$ {(a.preco ?? 0).toFixed(2)}
                                  </Typography>
                                </Box>
                              }
                              sx={{ width: '100%', mx: 0, '& .MuiFormControlLabel-label': { width: '100%' } }}
                            />
                          );
                        })}
                      </FormGroup>
                    </Box>
                  );
                  idx++;
                }
                return sections;
              })()}
              <TextField fullWidth label="Observação para este item" size="small" multiline rows={2} value={itemObservacao}
                onChange={(e) => setItemObservacao(e.target.value)} sx={{ mt: 2 }}
                placeholder="Ex: ponto da carne, sem cebola..." />
              <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 1.5, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Total do item</Typography>
                <Typography variant="body1" color="primary" sx={{ fontWeight: 800 }}>
                  R$ {((customizeProduto.preco_venda ?? 0) + customizeProduto.adicionais_disponiveis.filter((a) => selectedAdicionais.includes(a.id!)).reduce((s, a) => s + (a.preco ?? 0), 0)).toFixed(2)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={() => setCustomizeOpen(false)} color="inherit">Cancelar</Button>
              <Button variant="contained" onClick={confirmAddToCart}>
                Adicionar ao Carrinho
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog Checkout */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Finalizar Pedido</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Seu Nome *" size="small" value={form.nome}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, nome: e.target.value }))} />
            <TextField fullWidth label="Telefone / WhatsApp *" size="small" value={form.telefone}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, telefone: e.target.value }))}
              placeholder="(11) 99999-8888" />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth label="Endereço *" size="small" value={form.endereco}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                placeholder="Rua, Avenida..." sx={{ flex: 2 }} />
              <TextField fullWidth label="Número" size="small" value={form.numero}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, numero: e.target.value }))} sx={{ flex: 1 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Região de Entrega</InputLabel>
                <Select<number> value={regiaoId} label="Região de Entrega"
                  onChange={(e: SelectChangeEvent<number>) => {
                    const id = Number(e.target.value);
                    setRegiaoId(id);
                    const reg = regioes.find((r) => r.id === id);
                    if (reg && !form.bairro) setForm((p) => ({ ...p, bairro: reg.nome }));
                  }}>
                  <MenuItem value={0}>Sem região definida</MenuItem>
                  {regioes.filter((r) => r.ativo).map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.nome} — R$ {(r.valor ?? 0).toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth label="Bairro" size="small" value={form.bairro}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, bairro: e.target.value }))} />
              <TextField fullWidth label="Complemento" size="small" value={form.complemento}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, complemento: e.target.value }))} />
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Forma de Pagamento</InputLabel>
              <Select value={form.forma_pagamento} label="Forma de Pagamento"
                onChange={(e: SelectChangeEvent<string>) => setForm((p) => ({ ...p, forma_pagamento: e.target.value }))}>
                <MenuItem value="dinheiro">Dinheiro</MenuItem>
                <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                <MenuItem value="pix">PIX</MenuItem>
              </Select>
            </FormControl>
            {form.forma_pagamento === 'dinheiro' && (
              <TextField fullWidth label="Troco para quanto?" size="small" type="text" inputMode="decimal" value={form.troco_para}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, troco_para: e.target.value }))} />
            )}
            <TextField fullWidth label="Observação" size="small" multiline rows={2} value={form.observacao}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, observacao: e.target.value }))}
              placeholder="Alguma observação para o pedido?" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCheckoutOpen(false)} color="inherit">Voltar</Button>
          <Button variant="contained" onClick={handleCheckout} disabled={submitting || (regioes.filter((r) => r.ativo).length > 0 && regiaoId === 0)}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : `Confirmar Pedido — R$ ${totalPedido.toFixed(2)}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmação */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Pedido Confirmado!</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Pedido #{confirmPedido?.id}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {deliveryConfig.tempo_estimado && `Tempo estimado: ${deliveryConfig.tempo_estimado}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Acompanhe o status pelo WhatsApp: {telefoneEst || 'em breve'}
          </Typography>
          <Box sx={{ bgcolor: '#F5F5F5', borderRadius: 2, p: 2, mb: 2, textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Resumo</Typography>
            {confirmPedido?.itens?.map((item, i: number) => (
              <Box key={i} sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{item.quantidade}x {item.produto_nome}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>                R$ {((item.total ?? 0) || item.quantidade * (item.preco_unitario ?? 0)).toFixed(2)}</Typography>
                </Box>
                {item.adicionais && item.adicionais.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 2 }}>
                    + {item.adicionais.map((a) => a.nome).join(', ')}
                  </Typography>
                )}
                {item.observacao && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 2, fontStyle: 'italic' }}>
                    Obs: {item.observacao}
                  </Typography>
                )}
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>R$ {confirmPedido?.valor_total?.toFixed(2)}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="contained" onClick={() => setConfirmOpen(false)}>Continuar no Cardápio</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
