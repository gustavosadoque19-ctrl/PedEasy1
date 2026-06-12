import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Switch, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Snackbar,
} from '@mui/material';
import WhatsApp from '@mui/icons-material/WhatsApp';
import Instagram from '@mui/icons-material/Instagram';
import Facebook from '@mui/icons-material/Facebook';

interface CanalConfig {
  nome: string;
  icon: React.ReactNode;
  ativo: boolean;
  token: string;
  webhook: string;
}

export default function AtendimentoVirtual() {
  const [snack, setSnack] = useState('');

  const [canais, setCanais] = useState<CanalConfig[]>([
    { nome: 'WhatsApp', icon: <WhatsApp />, ativo: true, token: '', webhook: '' },
    { nome: 'Instagram', icon: <Instagram />, ativo: false, token: '', webhook: '' },
    { nome: 'Facebook', icon: <Facebook />, ativo: false, token: '', webhook: '' },
  ]);

  const [mensagens] = useState([
    { canal: 'WhatsApp', cliente: 'Maria Silva', mensagem: 'Bom dia! Gostaria de fazer um pedido', data: '07/06 14:23', status: 'respondido' as const },
    { canal: 'WhatsApp', cliente: 'João Santos', mensagem: 'Qual o horário de funcionamento?', data: '07/06 14:10', status: 'pendente' as const },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = localStorage.getItem('atendimento_canais');
        if (stored && !cancelled) setCanais(JSON.parse(stored));
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSalvarCanais = () => {
    localStorage.setItem('atendimento_canais', JSON.stringify(canais));
    setSnack('Configurações salvas!');
  };

  const toggleCanal = (index: number) => {
    setCanais((prev) => prev.map((c, i) => i === index ? { ...c, ativo: !c.ativo } : c));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Atendimento Virtual</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: { xs: 0, md: 3 } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Canais</Typography>
              {canais.map((canal, i) => (
                <Box key={canal.nome} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {canal.icon}
                    <Typography>{canal.nome}</Typography>
                  </Box>
                  <Switch checked={canal.ativo} onChange={() => toggleCanal(i)} />
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Configuração</Typography>
              {canais.map((canal, i) => (
                <Box key={canal.nome} sx={{ mb: 2, display: canal.ativo ? 'block' : 'none' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>{canal.nome}</Typography>
                  <TextField fullWidth label="Token de Acesso" size="small" sx={{ mb: 1 }}
                    value={canal.token}
                    onChange={(e) => setCanais((prev) => prev.map((c, j) => j === i ? { ...c, token: e.target.value } : c))} />
                  <TextField fullWidth label="Webhook URL" size="small"
                    value={canal.webhook}
                    onChange={(e) => setCanais((prev) => prev.map((c, j) => j === i ? { ...c, webhook: e.target.value } : c))} />
                </Box>
              ))}
              <Button variant="contained" onClick={handleSalvarCanais} sx={{ mt: 1 }}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Mensagens Recentes</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Canal</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Mensagem</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mensagens.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Chip icon={m.canal === 'WhatsApp' ? <WhatsApp /> : m.canal === 'Instagram' ? <Instagram /> : <Facebook />}
                            label={m.canal} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{m.cliente}</TableCell>
                        <TableCell sx={{ maxWidth: { xs: 150, md: 250 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.mensagem}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.data}</TableCell>
                        <TableCell>
                          <Chip label={m.status} color={m.status === 'respondido' ? 'success' : 'warning'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
