import { Box, Button, Container, Grid, Typography, Card, CardContent, Chip, AppBar, Toolbar, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Fastfood from '@mui/icons-material/Fastfood';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import QrCode from '@mui/icons-material/QrCode';
import People from '@mui/icons-material/People';
import Assessment from '@mui/icons-material/Assessment';
import WhatsApp from '@mui/icons-material/WhatsApp';
import Star from '@mui/icons-material/Star';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

const features = [
  { icon: <RestaurantMenu />, title: 'Cardápio Digital', desc: 'Cardápio online com fotos, categorias e adicionais. Cliente pede pelo celular.' },
  { icon: <ShoppingCart />, title: 'Gestão de Pedidos', desc: 'Acompanhe pedidos em tempo real. Mesa, delivery, balcão e comanda.' },
  { icon: <QrCode />, title: 'Pagamentos Online', desc: 'PIX e cartão de crédito via Pagar.me. Receba sem maquininha.' },
  { icon: <People />, title: 'Mesas & Comandas', desc: 'Gerencie mesas, abra comandas, adicione itens e feche a conta.' },
  { icon: <Assessment />, title: 'Relatórios', desc: 'Vendas por período, formas de pagamento, produtos mais vendidos.' },
  { icon: <WhatsApp />, title: 'Integração WhatsApp', desc: 'Notificações automáticas e chatbot para seus clientes.' },
];

const planos = [
  {
    slug: 'free', nome: 'Free', preco: '0', desc: 'Para começar', cor: 'grey',
    features: [
      'Até 100 pedidos/mês', '2 funcionários', '10 mesas', 'Relatórios básicos', 'Cardápio digital', 'Suporte comunidade',
    ],
  },
  {
    slug: 'pro', nome: 'Pro', preco: '97', desc: 'Para crescer', cor: 'primary',
    destaque: true,
    features: [
      'Pedidos ilimitados', 'Até 10 funcionários', 'Mesas ilimitadas', '100 NFC-e/mês', 'WhatsApp Bot', 'Relatórios avançados', 'Suporte por email',
    ],
  },
  {
    slug: 'enterprise', nome: 'Enterprise', preco: '297', desc: 'Para grandes redes', cor: 'secondary',
    features: [
      'Tudo do Pro', 'Funcionários ilimitados', 'NFC-e ilimitadas', 'Suporte prioritário', 'Domínio personalizado', 'Onboarding dedicado',
    ],
  },
];

function Pricing() {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'grey.50' }} id="precos">
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            Planos e Preços
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Escolha o plano ideal para seu restaurante. Cancele quando quiser.
          </Typography>
        </Box>
        <Grid container spacing={4} sx={{ alignItems: 'flex-end' }}>
          {planos.map((plano) => (
            <Grid size={{ xs: 12, md: 4 }} key={plano.slug}>
              <Card sx={{
                position: 'relative',
                border: plano.destaque ? 2 : 0,
                borderColor: 'primary.main',
                borderRadius: 4,
                overflow: 'visible',
              }}>
                {plano.destaque && (
                  <Chip label="MAIS POPULAR" color="primary" size="small" sx={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    fontWeight: 700, px: 2,
                  }} />
                )}
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{plano.nome}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{plano.desc}</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography component="span" variant="h3" sx={{ fontWeight: 800 }}>
                      R$ {plano.preco}
                    </Typography>
                    {plano.preco !== '0' && (
                      <Typography component="span" variant="body1" color="text.secondary">/mês</Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'left', mb: 4 }}>
                    {plano.features.map((f) => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <Star sx={{ fontSize: 14, color: plano.destaque ? 'primary.main' : 'text.disabled' }} />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    fullWidth variant={plano.destaque ? 'contained' : 'outlined'}
                    size="large" onClick={() => navigate('/signup')}
                    endIcon={plano.destaque ? <KeyboardArrowRight /> : undefined}
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {plano.preco === '0' ? 'Começar Grátis' : 'Assinar Agora'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function Features() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }} id="funcionalidades">
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            Tudo que seu restaurante precisa
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Do cardápio digital à nota fiscal. Um sistema completo para gestão do seu negócio.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {features.map((f) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.title}>
              <Card sx={{ height: '100%', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    {f.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <Box sx={{
      position: 'relative',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1d4ed8 100%)',
      color: 'white',
      overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
      <Box sx={{ position: 'absolute', bottom: -150, left: -150, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ py: { xs: 12, md: 16 }, textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
          <Fastfood sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2.25rem', md: '3.75rem' }, letterSpacing: '-1px' }}>
            Gestão inteligente para seu restaurante
          </Typography>
          <Typography variant="h6" sx={{ mb: 6, opacity: 0.85, fontWeight: 400, lineHeight: 1.7 }}>
            PedEasy é o sistema completo de gestão para restaurantes, lanchonetes e food trucks.
            Cardápio digital, pedidos, mesas, pagamentos e NFC-e em um só lugar.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" onClick={() => navigate('/signup')}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.200' }, py: 1.5, px: 5, borderRadius: 2, fontWeight: 700 }}>
              Começar Grátis
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}
              sx={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', '&:hover': { borderColor: 'white' }, py: 1.5, px: 5, borderRadius: 2 }}>
              Já tenho conta
            </Button>
          </Box>
          <Box sx={{ mt: 6, display: 'flex', gap: { xs: 2, md: 6 }, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Teste grátis', value: '7 dias' },
              { label: 'Sem cartão', value: 'de crédito' },
              { label: 'Cancele quando', value: 'quiser' },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Box>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Toolbar>
          <Fastfood sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }} color="primary">PedEasy</Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            <Button color="inherit" onClick={() => { const el = document.getElementById('funcionalidades'); el?.scrollIntoView({ behavior: 'smooth' }); }}>Funcionalidades</Button>
            <Button color="inherit" onClick={() => { const el = document.getElementById('precos'); el?.scrollIntoView({ behavior: 'smooth' }); }}>Preços</Button>
            <Button variant="outlined" onClick={() => navigate('/login')} sx={{ ml: 2 }}>Entrar</Button>
            <Button variant="contained" onClick={() => navigate('/signup')}>Teste Grátis</Button>
          </Box>
          <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={() => navigate('/login')}>Entrar</IconButton>
        </Toolbar>
      </AppBar>
      <Hero />
      <Features />
      <Pricing />
      <Box sx={{ bgcolor: '#1e293b', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Fastfood sx={{ color: 'primary.light', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>PedEasy</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Sistema de gestão para restaurantes.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Links</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Button color="inherit" size="small" onClick={() => navigate('/signup')} sx={{ justifyContent: 'flex-start', textTransform: 'none', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                  Criar Conta
                </Button>
                <Button color="inherit" size="small" onClick={() => navigate('/login')} sx={{ justifyContent: 'flex-start', textTransform: 'none', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                  Login
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Contato</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>suporte@pedy.app</Typography>
            </Grid>
          </Grid>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, opacity: 0.5 }}>
            © {new Date().getFullYear()} PedEasy. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
