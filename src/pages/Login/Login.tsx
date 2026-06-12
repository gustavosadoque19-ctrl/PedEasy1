import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, useMediaQuery, useTheme, Paper } from '@mui/material';
import Fastfood from '@mui/icons-material/Fastfood';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import LocalOffer from '@mui/icons-material/LocalOffer';
import People from '@mui/icons-material/People';
import { useAuth } from '../../contexts/AuthContext';

function MobileLogin() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('server_url') || 'http://localhost:3000/api');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginDev } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    localStorage.setItem('server_url', serverUrl);
    try {
      await login(usuario, senha);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro ao conectar. Verifique servidor e credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Fastfood sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">PedEasy</Typography>
            <Typography variant="body2" color="text.secondary">Faça login para continuar</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Servidor" size="small" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Usuário" size="small" value={usuario} onChange={(e) => setUsuario(e.target.value)} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Senha" type="password" size="small" value={senha} onChange={(e) => setSenha(e.target.value)} sx={{ mb: 3 }} required />
            {import.meta.env.DEV && <Button fullWidth variant="outlined" size="large" onClick={loginDev} sx={{ mb: 1 }}>Acesso Admin (Dev)</Button>}
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            Configure o IP do servidor para conectar dos celulares
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function DesktopLogin() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('server_url') || 'http://localhost:3000/api');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginDev } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    localStorage.setItem('server_url', serverUrl);
    try {
      await login(usuario, senha);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro ao conectar. Verifique servidor e credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'grey.100' }}>
      <Box sx={{
        flex: '1 1 55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
        color: 'white',
        p: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480 }}>
          <Fastfood sx={{ fontSize: 80, mb: 2, color: 'rgba(255,255,255,0.9)' }} />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
            PedEasy
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, mb: 6, opacity: 0.9 }}>
            Sistema de Gestão para Restaurantes
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, textAlign: 'left' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <RestaurantMenu />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Cardápio Digital</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>Gerencie produtos e categorias</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <LocalOffer />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Gestão de Pedidos</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>Acompanhe pedidos em tempo real</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <People />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Clientes & Fidelidade</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>Cadastro e programa de pontos</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{
        flex: '1 1 45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}>
        <Paper elevation={0} sx={{ maxWidth: 420, width: '100%', p: 5, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Bem-vindo</Typography>
            <Typography variant="body2" color="text.secondary">
              Faça login com suas credenciais
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Servidor
            </Typography>
            <TextField fullWidth size="small" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} sx={{ mb: 2.5 }} placeholder="http://localhost:3000/api" />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Usuário
            </Typography>
            <TextField fullWidth size="small" value={usuario} onChange={(e) => setUsuario(e.target.value)} sx={{ mb: 2.5 }} required placeholder="Digite seu usuário" />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Senha
            </Typography>
            <TextField fullWidth size="small" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} sx={{ mb: 3.5 }} required placeholder="Digite sua senha" />
            {import.meta.env.DEV && (
              <Button fullWidth variant="outlined" size="medium" onClick={loginDev} sx={{ mb: 1.5 }}>
                Acesso Admin (Dev)
              </Button>
            )}
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.5 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default function Login() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return isMobile ? <MobileLogin /> : <DesktopLogin />;
}
