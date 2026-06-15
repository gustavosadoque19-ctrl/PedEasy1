import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Chip, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { getCarrinhosAbandonados, atualizarCarrinho, enviarLembreteCarrinho } from '../../api/carrinhos';
import { CarrinhoAbandonado } from '../../types';

export default function Carrinhos() {
  const [carrinhos, setCarrinhos] = useState<CarrinhoAbandonado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCarrinhosAbandonados();
        if (!cancelled) setCarrinhos(res.data);
      } catch {
        if (!cancelled) setError('Erro ao carregar carrinhos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCarrinhosAbandonados();
      setCarrinhos(res.data);
    } catch {
      setError('Erro ao carregar carrinhos');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarLembrete = async (id: number) => {
    try {
      await enviarLembreteCarrinho(id);
      await atualizarCarrinho(id, { whatsapp_enviado: true });
      setSnack('Lembrete enviado ao cliente!');
      load();
    } catch {
      setError('Erro ao enviar lembrete');
    }
  };

  const handleMarcarRecuperado = async (id: number) => {
    try {
      await atualizarCarrinho(id, { status: 'recuperado' });
      setSnack('Carrinho marcado como recuperado!');
      load();
    } catch {
      setError('Erro ao atualizar');
    }
  };

  const statusColor: Record<string, 'warning' | 'success' | 'error'> = {
    pendente: 'warning', recuperado: 'success', perdido: 'error',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Recuperação de Carrinhos Abandonados</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Telefone</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Itens</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>WhatsApp</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carrinhos.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">Nenhum carrinho abandonado</TableCell></TableRow>
                  )}
                  {carrinhos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.cliente_nome || 'Visitante'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.cliente_telefone || '-'}</TableCell>
                      <TableCell align="right">R$ {(c.valor_total ?? 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.itens?.length || 0} itens</TableCell>
                      <TableCell>
                        <Chip label={c.status} color={statusColor[c.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {c.whatsapp_enviado ? (
                          <Chip label="Enviado" color="info" size="small" />
                        ) : (
                          <Chip label="Não enviado" variant="outlined" size="small" />
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell align="right">
                      {c.status === 'pendente' && (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Button size="small" variant="outlined" startIcon={<WhatsApp />}
                            onClick={() => handleEnviarLembrete(c.id!)} disabled={c.whatsapp_enviado}>
                            Lembrete
                          </Button>
                          <Button size="small" variant="contained" color="success"
                            onClick={() => handleMarcarRecuperado(c.id!)}>
                            Recuperado
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
