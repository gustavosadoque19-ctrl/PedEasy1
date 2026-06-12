import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Alert, CircularProgress, Chip } from '@mui/material';
import { getFocusConfig } from '../../api/nfe';
import { FocusConfig as FocusConfigType } from '../../types';

export default function FocusConfig() {
  const [config, setConfig] = useState<FocusConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getFocusConfig().then((res) => { if (!cancelled) setConfig(res.data as FocusConfigType); }).catch(() => { if (!cancelled) setError('Erro ao carregar config'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Focus NFe</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A integração com a Focus NFe permite emitir NFC-e diretamente do PedEasy.
            Configure as variáveis de ambiente no servidor backend para ativar.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 140 }}>Token Focus:</Typography>
              <Chip label={config?.token ? 'Configurado' : 'Não configurado'} size="small"
                color={config?.token ? 'success' : 'error'} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 140 }}>Ambiente:</Typography>
              <Chip label={config?.ambiente || '-'} size="small" color={config?.ambiente === 'producao' ? 'warning' : 'info'} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 140 }}>Cidade / UF:</Typography>
              <Typography variant="body2">{config?.cidade || '-'} / {config?.uf || '-'}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Variáveis de Ambiente Necessárias</Typography>
          <Box component="pre" sx={{
            bgcolor: 'grey.100', p: 2, borderRadius: 1, fontSize: 13, overflow: 'auto',
          }}>
            {`FOCUS_TOKEN=seu_token_aqui
FOCUS_CIDADE=Sao Paulo
FOCUS_UF=SP
FOCUS_API_URL=https://api.focusnfe.com.br`}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Token de homologação começa com <Chip label="test" size="small" />. 
            Token de produção começa com <Chip label="live" size="small" />.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
