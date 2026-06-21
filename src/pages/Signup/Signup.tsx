import { useState, useRef } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Fastfood from '@mui/icons-material/Fastfood';
import { useAuth } from '../../contexts/AuthContext';
import ReCaptcha, { ReCaptchaHandle } from '../../components/ReCaptcha';

export default function Signup() {
  const [tenantName, setTenantName] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupTenant } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef<ReCaptchaHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (senha !== confirmar) {
      setError('Senhas não conferem');
      return;
    }
    if (senha.length < 8 || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
      setError('Senha deve ter no mínimo 8 caracteres, com pelo menos 1 letra maiúscula e 1 número');
      return;
    }

    const recaptchaToken = captchaRef.current?.getToken();
    if (!recaptchaToken) {
      setError('Confirme que você não é um robô');
      return;
    }

    setLoading(true);
    try {
      await signupTenant({ tenant_name: tenantName, nome, email, senha, recaptcha_token: recaptchaToken });
      navigate('/app/onboarding');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro ao criar conta');
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 2 }}>
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Fastfood sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">Criar Conta</Typography>
            <Typography variant="body2" color="text.secondary">
              Comece seu teste grátis de 7 dias
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Nome do estabelecimento
            </Typography>
            <TextField fullWidth size="small" value={tenantName} onChange={(e) => setTenantName(e.target.value)}
              sx={{ mb: 2.5 }} required placeholder="Ex: Restaurante do Zé" />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Seu nome
            </Typography>
            <TextField fullWidth size="small" value={nome} onChange={(e) => setNome(e.target.value)}
              sx={{ mb: 2.5 }} required placeholder="Seu nome completo" />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Email
            </Typography>
            <TextField fullWidth size="small" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }} required placeholder="seu@email.com" />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Senha
            </Typography>
            <TextField fullWidth size="small" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              sx={{ mb: 2.5 }} required placeholder="Mínimo 6 caracteres" />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Confirmar senha
            </Typography>
            <TextField fullWidth size="small" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
              sx={{ mb: 2.5 }} required placeholder="Repita a senha" />
            <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'center' }}>
              <ReCaptcha ref={captchaRef} />
            </Box>
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.5, mb: 1 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Criar Conta Grátis'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} variant="body2" to="/login">
                Já tem conta? Faça login
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
