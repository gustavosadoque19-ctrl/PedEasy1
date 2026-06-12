import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, CircularProgress, Alert, Snackbar, Select, MenuItem, InputLabel, FormControl, Chip, Switch, FormControlLabel,
} from '@mui/material';
import Save from '@mui/icons-material/Save';
import Refresh from '@mui/icons-material/Refresh';
import axios from '../../api/axios';

const BOT_API = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';

interface BotConfigData {
  bot_ativo: boolean;
  tom: string;
  boasVindas: string;
  ajuda: string;
  cardapioHeader: string;
  cardapioFooter: string;
  pedidoNaoEncontrado: string;
  nenhumPedido: string;
  meusPedidosHeader: string;
  meusPedidosFooter: string;
  cadastroSolicitado: string;
  cadastroConfirmado: string;
  pedidoPronto: string;
  erroGeral: string;
  erroBackend: string;
}

const TONES: Record<string, { label: string; emoji: string; messages: Partial<BotConfigData> }> = {
  normal: {
    label: 'Normal',
    emoji: '🤖',
    messages: {
      boasVindas: '🤖 *PedEasy - Assistente Virtual*\nOlá! Eu sou o assistente do *PedEasy*.\n\nComandos disponíveis:\n📋 *cardapio* - Ver o cardápio\n🔍 *pedido #NUMERO* - Consultar status de um pedido\n📦 *meus pedidos* - Listar seus pedidos\n📝 *cadastro* - Cadastrar seu contato\n❓ *ajuda* - Mostrar esta mensagem\n\nDigite um comando para começar!',
      ajuda: '*Comandos disponíveis:*\n\n📋 *cardapio*\nMostra todos os produtos do cardápio organizados por categoria.\n\n🔍 *pedido #123*\nConsulta o status, itens e valor de um pedido específico.\n\n📦 *meus pedidos*\nLista todos os pedidos realizados com seu número.\n\n📝 *cadastro*\nFaz seu cadastro no sistema para agilizar pedidos.\n\n❓ *ajuda*\nExibe esta mensagem de ajuda.',
      cardapioHeader: '📋 *CARDÁPIO PEDEASY*\n\n',
      cardapioFooter: '\n💬 Para pedir, entre em contato conosco!',
      pedidoNaoEncontrado: '❌ Pedido não encontrado. Verifique o número informado.',
      nenhumPedido: '📭 Nenhum pedido encontrado para este contato.',
      meusPedidosHeader: '📦 *SEUS PEDIDOS*\n\n',
      meusPedidosFooter: '\n🔍 Digite *pedido #NUMERO* para ver detalhes.',
      cadastroSolicitado: '📝 Para fazer seu cadastro, preciso do seu *nome completo*:',
      cadastroConfirmado: '✅ Cadastro realizado com sucesso, *{nome}!*\n\nAgora você pode consultar seus pedidos pelo WhatsApp.',
      pedidoPronto: '✅ *Pedido #{{id}} Pronto!*\n\n{itens}\n\n📋 *Total:* R$ {{total}}\n\nSeu pedido já está pronto! 🎉',
      erroGeral: '😔 Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
      erroBackend: '🔧 Sistema temporariamente indisponível. Tente novamente em instantes.',
    },
  },
  natalino: {
    label: 'Natalino',
    emoji: '🎄',
    messages: {
      boasVindas: '🎅 *PedEasy - Assistente de Natal*\nHo ho ho! 🎄 Bem-vindo ao *PedEasy*!\n\nComandos disponíveis:\n📋 *cardapio* - Ver o cardápio\n🔍 *pedido #NUMERO* - Consultar status de um pedido\n📦 *meus pedidos* - Listar seus pedidos\n📝 *cadastro* - Cadastrar seu contato\n❓ *ajuda* - Mostrar esta mensagem\n\nDigite um comando para começar! 🎁',
      ajuda: '*Comandos disponíveis:* 🎄\n\n📋 *cardapio*\nMostra todos os produtos do cardápio organizados por categoria.\n\n🔍 *pedido #123*\nConsulta o status, itens e valor de um pedido específico.\n\n📦 *meus pedidos*\nLista todos os pedidos realizados com seu número.\n\n📝 *cadastro*\nFaz seu cadastro no sistema.\n\n❓ *ajuda*\nExibe esta mensagem de ajuda.',
      cardapioHeader: '🎄 *CARDÁPIO ESPECIAL DE NATAL* 🎄\n\n',
      cardapioFooter: '\n🎅 Faça seu pedido e tenha um Feliz Natal! 🎁',
      pedidoNaoEncontrado: '❄️ Pedido não encontrado nas listas do Papai Noel. Verifique o número.',
      nenhumPedido: '🎁 Nenhum pedido encontrado para este contato.',
      meusPedidosHeader: '🎄 *SEUS PEDIDOS DE NATAL* 🎄\n\n',
      meusPedidosFooter: '\n🔍 Digite *pedido #NUMERO* para ver detalhes.',
      cadastroSolicitado: '🎅 Para entrar na lista do Papai Noel, preciso do seu *nome completo*:',
      cadastroConfirmado: '🎁 Cadastro confirmado, *{nome}!*\n\nVocê está na lista do Papai Noel! 🎅\n\nAgora você pode consultar seus pedidos pelo WhatsApp.',
      pedidoPronto: '🎄 *Pedido #{{id}} Pronto!* 🎄\n\n{itens}\n\n📋 *Total:* R$ {{total}}\n\nSeu pedido já está prontinho! Venha buscar! 🎅🎁',
      erroGeral: '😔 Ho ho ho... Desculpe, ocorreu um erro. Tente novamente mais tarde.',
      erroBackend: '🔧 O trenó do Papai Noel quebrou! Sistema temporariamente indisponível. Tente novamente.',
    },
  },
  junino: {
    label: 'Junino',
    emoji: '🌽',
    messages: {
      boasVindas: '🌽 *PedEasy - Arraiá Virtual*\nÔxe! Bem-vindo ao *PedEasy*! 🔥\n\nComandos disponíveis:\n📋 *cardapio* - Ver o cardápio\n🔍 *pedido #NUMERO* - Consultar status de um pedido\n📦 *meus pedidos* - Listar seus pedidos\n📝 *cadastro* - Cadastrar seu contato\n❓ *ajuda* - Mostrar esta mensagem\n\nDigite um comando para começar, cumpade! 🎉',
      ajuda: '*Comandos disponíveis:* 🌽\n\n📋 *cardapio*\nMostra os produtos do arraiá.\n\n🔍 *pedido #123*\nConsulta o status de um pedido.\n\n📦 *meus pedidos*\nLista seus pedidos.\n\n📝 *cadastro*\nFaz seu cadastro.\n\n❓ *ajuda*\nExibe esta mensagem.',
      cardapioHeader: '🌽 *CARDÁPIO DO ARRAIÁ* 🔥\n\n',
      cardapioFooter: '\n💬 Manda ver no pedido, cumpade! 🎉',
      pedidoNaoEncontrado: '🌽 Esse pedido não foi encontrado no arraiá. Verifique o número.',
      nenhumPedido: '📭 Nenhum pedido encontrado pra esse contato.',
      meusPedidosHeader: '🌽 *SEUS PEDIDOS DO ARRAIÁ* 🔥\n\n',
      meusPedidosFooter: '\n🔍 Digite *pedido #NUMERO* pra ver detalhes.',
      cadastroSolicitado: '📝 Pra fazer seu cadastro no arraiá, preciso do seu *nome completo*:',
      cadastroConfirmado: '✅ Cadastro feito, *{nome}!*\n\nAgora você pode consultar seus pedidos pelo WhatsApp! 🌽',
      pedidoPronto: '🔥 *Pedido #{{id}} Pronto!* 🔥\n\n{itens}\n\n📋 *Total:* R$ {{total}}\n\nSeu pedido tá prontinho, cumpade! Vem buscar! 🌽🎉',
      erroGeral: '😔 Ocorreu um erro no arraiá. Tente novamente mais tarde.',
      erroBackend: '🔧 A fogueira apagou! Sistema temporariamente indisponível. Tente novamente.',
    },
  },
  pascoa: {
    label: 'Páscoa',
    emoji: '🐰',
    messages: {
      boasVindas: '🐰 *PedEasy - Assistente de Páscoa*\nOlá! Seja bem-vindo ao *PedEasy*! 🥚\n\nComandos disponíveis:\n📋 *cardapio* - Ver o cardápio\n🔍 *pedido #NUMERO* - Consultar status de um pedido\n📦 *meus pedidos* - Listar seus pedidos\n📝 *cadastro* - Cadastrar seu contato\n❓ *ajuda* - Mostrar esta mensagem\n\nDigite um comando para começar! 🐣',
      ajuda: '*Comandos disponíveis:* 🐰\n\n📋 *cardapio*\nMostra todos os produtos do cardápio.\n\n🔍 *pedido #123*\nConsulta o status de um pedido.\n\n📦 *meus pedidos*\nLista seus pedidos.\n\n📝 *cadastro*\nFaz seu cadastro.\n\n❓ *ajuda*\nExibe esta mensagem.',
      cardapioHeader: '🥚 *CARDÁPIO DE PÁSCOA* 🐰\n\n',
      cardapioFooter: '\n🐣 Faça seu pedido e tenha uma Feliz Páscoa! 🥚',
      pedidoNaoEncontrado: '🥚 Ovos de Páscoa virados! Pedido não encontrado. Verifique o número.',
      nenhumPedido: '🐣 Nenhum pedido encontrado para este contato.',
      meusPedidosHeader: '🐰 *SEUS PEDIDOS DE PÁSCOA* 🥚\n\n',
      meusPedidosFooter: '\n🔍 Digite *pedido #NUMERO* para ver detalhes.',
      cadastroSolicitado: '🐣 Para ganhar seu ovo de Páscoa, preciso do seu *nome completo*:',
      cadastroConfirmado: '🥚 Cadastro confirmado, *{nome}!*\n\nO coelhinho já sabe quem você é! 🐰\n\nAgora você pode consultar seus pedidos pelo WhatsApp.',
      pedidoPronto: '🐰 *Pedido #{{id}} Pronto!* 🐰\n\n{itens}\n\n📋 *Total:* R$ {{total}}\n\nSeu pedido está prontinho, venha buscar! 🥚🐣',
      erroGeral: '😔 O coelhinho se atrapalhou! Ocorreu um erro. Tente novamente.',
      erroBackend: '🔧 Os ovos de Páscoa quebraram! Sistema temporariamente indisponível.',
    },
  },
  halloween: {
    label: 'Halloween',
    emoji: '🎃',
    messages: {
      boasVindas: '🎃 *PedEasy - Assistente do Halloween*\n👻 Bem-vindo ao *PedEasy*... se você tiver coragem! 🦇\n\nComandos disponíveis:\n📋 *cardapio* - Ver o cardápio\n🔍 *pedido #NUMERO* - Consultar status de um pedido\n📦 *meus pedidos* - Listar seus pedidos\n📝 *cadastro* - Cadastrar seu contato\n❓ *ajuda* - Mostrar esta mensagem\n\nDigite um comando... se atrever! 🕸️',
      ajuda: '*Comandos disponíveis:* 🎃\n\n📋 *cardapio*\nMostra o cardápio assustador.\n\n🔍 *pedido #123*\nConsulta o status de um pedido.\n\n📦 *meus pedidos*\nLista seus pedidos.\n\n📝 *cadastro*\nFaz seu cadastro.\n\n❓ *ajuda*\nExibe esta mensagem.',
      cardapioHeader: '🕸️ *CARDÁPIO DO HALLOWEEN* 🎃\n\n',
      cardapioFooter: '\n🦇 Peça seu pedido... ou assombre! 👻',
      pedidoNaoEncontrado: '👻 Esse pedido desapareceu nas sombras! Verifique o número.',
      nenhumPedido: '🕸️ Nenhum pedido encontrado para este contato... que misterioso!',
      meusPedidosHeader: '🎃 *SEUS PEDIDOS ASSOMBRADOS* 👻\n\n',
      meusPedidosFooter: '\n🔍 Digite *pedido #NUMERO* para ver detalhes.',
      cadastroSolicitado: '🦇 Antes de virar fantasma, preciso do seu *nome completo*:',
      cadastroConfirmado: '🎃 Cadastro confirmado, *{nome}!*\n\nAgora você faz parte do mundo das trevas! 👻\n\nConsulte seus pedidos pelo WhatsApp.',
      pedidoPronto: '👻 *Pedido #{{id}} Pronto!* 👻\n\n{itens}\n\n📋 *Total:* R$ {{total}}\n\nSeu pedido está... PRONTO! 🎃 Venha buscar antes que desapareça! 🦇',
      erroGeral: '😈 Uma força sombria causou um erro. Tente novamente... se puder!',
      erroBackend: '🔧 Os fantasmas derrubaram o sistema! Temporariamente indisponível.',
    },
  },
};

const MESSAGE_FIELDS: { key: keyof BotConfigData; label: string; multiline: boolean; rows?: number }[] = [
  { key: 'boasVindas', label: 'Mensagem de Boas-Vindas', multiline: true, rows: 5 },
  { key: 'ajuda', label: 'Mensagem de Ajuda / Comandos', multiline: true, rows: 5 },
  { key: 'cardapioHeader', label: 'Cabeçalho do Cardápio', multiline: true, rows: 2 },
  { key: 'cardapioFooter', label: 'Rodapé do Cardápio', multiline: true, rows: 2 },
  { key: 'pedidoNaoEncontrado', label: 'Pedido Não Encontrado', multiline: false },
  { key: 'nenhumPedido', label: 'Nenhum Pedido Encontrado', multiline: true, rows: 2 },
  { key: 'meusPedidosHeader', label: 'Cabeçalho Meus Pedidos', multiline: true, rows: 2 },
  { key: 'meusPedidosFooter', label: 'Rodapé Meus Pedidos', multiline: true, rows: 2 },
  { key: 'cadastroSolicitado', label: 'Solicitar Nome para Cadastro', multiline: true, rows: 2 },
  { key: 'cadastroConfirmado', label: 'Cadastro Confirmado (use {nome})', multiline: true, rows: 2 },
  { key: 'pedidoPronto', label: 'Pedido Pronto (use {{id}} {{total}} {itens})', multiline: true, rows: 3 },
  { key: 'erroGeral', label: 'Mensagem de Erro Geral', multiline: true, rows: 2 },
  { key: 'erroBackend', label: 'Mensagem de Erro do Sistema', multiline: true, rows: 2 },
];

function applyTone(tone: string): Partial<BotConfigData> | null {
  const preset = TONES[tone];
  if (!preset) return null;
  return { bot_ativo: true, tom: tone, ...preset.messages };
}

export default function BotConfig() {
  const [config, setConfig] = useState<BotConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');
  const [tone, setTone] = useState('normal');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BOT_API}/config`);
      const data = res.data as BotConfigData;
      setConfig(data);
      setTone(data.tom || 'normal');
    } catch {
      setError('Não foi possível conectar ao bot. Verifique se o bot está rodando e a URL está correta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${BOT_API}/config`);
        if (!cancelled) {
          const data = res.data as BotConfigData;
          setConfig(data);
          setTone(data.tom || 'normal');
        }
      } catch {
        if (!cancelled) setError('Não foi possível conectar ao bot. Verifique se o bot está rodando e a URL está correta.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (key: keyof BotConfigData, value: string) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const handleToneChange = (newTone: string) => {
    const preset = applyTone(newTone);
    if (preset) {
      setConfig({ ...config, ...preset } as BotConfigData);
      setTone(newTone);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    try {
      await axios.put(`${BOT_API}/config`, config);
      setSnack('Configuração salva com sucesso!');
    } catch {
      setError('Erro ao salvar. Verifique a conexão com o bot.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Configuração do WhatsApp Bot</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => load()}>Recarregar</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving || !config}>
            {saving ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : config ? (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Status do Bot</Typography>
              <FormControlLabel
                control={<Switch checked={config.bot_ativo} onChange={(e) => setConfig({ ...config, bot_ativo: e.target.checked })} />}
                label={config.bot_ativo ? 'Bot Ativo' : 'Bot Desativado'}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Quando desativado, o bot não iniciará a conexão com o WhatsApp e não responderá a mensagens.
                As alterações neste campo terão efeito após reiniciar o bot.
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>Tom das Mensagens</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecione um tema para as mensagens. As mensagens serão preenchidas automaticamente com o tom escolhido.
                Você pode personalizar cada campo manualmente após selecionar o tom.
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Tom / Tema</InputLabel>
                <Select value={tone} label="Tom / Tema" onChange={(e) => handleToneChange(e.target.value)}>
                  {Object.entries(TONES).map(([key, t]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                        {key === tone && <Chip label="Ativo" size="small" color="primary" sx={{ ml: 1 }} />}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Mensagens do Bot</Typography>
              <Grid container spacing={2}>
                {MESSAGE_FIELDS.map((f) => (
                  <Grid size={{ xs: 12, md: f.multiline ? 12 : 6 }} key={f.key}>
                    <TextField fullWidth label={f.label} size="small" multiline={f.multiline} rows={f.rows || 1}
                      value={config[f.key] || ''}
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')}
        message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
