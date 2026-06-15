import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Refresh from '@mui/icons-material/Refresh';
import Cancel from '@mui/icons-material/Cancel';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import QrCode from '@mui/icons-material/QrCode';
import { getNFeList, emitirNFe, cancelarNFe, consultarNFe } from '../../api/nfe';
import { NFe } from '../../types';

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pendente: 'warning', autorizada: 'success', cancelada: 'error', rejeitada: 'default',
};

export default function NFeList() {
  const [nfeList, setNfeList] = useState<NFe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emitindo, setEmitindo] = useState(false);
  const [consultando, setConsultando] = useState<number | null>(null);
  const [pedidoId, setPedidoId] = useState('');
  const [openEmitir, setOpenEmitir] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<NFe | null>(null);
  const [motivoCancel, setMotivoCancel] = useState('');

  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getNFeList();
        if (!cancelled) setNfeList(res.data);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await getNFeList();
      if (!mountedRef.current) return;
      setNfeList(res.data);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleEmitir = async () => {
    if (!pedidoId) return;
    setEmitindo(true);
    setError('');
    try {
      await emitirNFe(Number(pedidoId));
      setOpenEmitir(false);
      setPedidoId('');
      load();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detalhe?: string; error?: string } } };
      setError(apiErr.response?.data?.detalhe || apiErr.response?.data?.error || 'Erro ao emitir');
    } finally {
      setEmitindo(false);
    }
  };

  const handleConsultar = async (nfe: NFe) => {
    if (!nfe.id) return;
    setConsultando(nfe.id);
    try {
      await consultarNFe(nfe.id);
      load();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Erro ao consultar');
    } finally {
      setConsultando(null);
    }
  };

  const handleCancelar = async () => {
    if (!cancelTarget?.id || !motivoCancel) return;
    try {
      await cancelarNFe(cancelTarget.id, motivoCancel);
      setCancelTarget(null);
      setMotivoCancel('');
      load();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detalhe?: string; error?: string } } };
      setError(apiErr.response?.data?.detalhe || apiErr.response?.data?.error || 'Erro ao cancelar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>NFC-e (Focus NFe)</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Atualizar</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenEmitir(true)}>Emitir NFC-e</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>NFC-e</TableCell>
                    <TableCell>Pedido</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Chave Acesso</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nfeList.map((nfe) => (
                    <TableRow key={nfe.id} hover>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{nfe.numero_nf || '-'}</TableCell>
                      <TableCell>#{nfe.pedido_id}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12, display: { xs: 'none', md: 'table-cell' } }}>
                        {nfe.chave_acesso || '-'}
                      </TableCell>
                      <TableCell>R$ {(nfe.valor ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label={nfe.status} size="small" color={statusColors[nfe.status] || 'default'} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{nfe.createdAt ? new Date(nfe.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {nfe.url_danfe && (
                            <Tooltip title="Abrir DANFE">
                              <IconButton size="small" aria-label="Abrir DANFE" href={nfe.url_danfe} target="_blank">
                                <PictureAsPdf fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {nfe.url_qrcode && (
                            <Tooltip title="QR Code">
                              <IconButton size="small" aria-label="QR Code" href={nfe.url_qrcode} target="_blank">
                                <QrCode fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(nfe.status === 'pendente' || nfe.status === 'rejeitada') && (
                            <Tooltip title="Consultar status">
                              <IconButton size="small" aria-label="Consultar status" onClick={() => handleConsultar(nfe)} disabled={consultando === nfe.id}>
                                {consultando === nfe.id ? <CircularProgress size={16} /> : <Refresh fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
                          {nfe.status === 'autorizada' && (
                            <Tooltip title="Cancelar NFC-e">
                              <IconButton size="small" aria-label="Cancelar NFC-e" color="error" onClick={() => setCancelTarget(nfe)}>
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {nfeList.length === 0 && <TableRow><TableCell colSpan={4} align="center">Nenhuma NFC-e encontrada</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={openEmitir} onClose={() => setOpenEmitir(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Emitir NFC-e</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Informe o número do pedido para emitir a NFC-e via Focus NFe.
          </Typography>
          <TextField fullWidth label="Nº do Pedido" type="number" size="small" autoFocus
            value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmitir(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleEmitir} variant="contained" disabled={emitindo || !pedidoId}>
            {emitindo ? <CircularProgress size={20} /> : 'Emitir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar NFC-e</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cancelando a NFC-e #{cancelTarget?.numero_nf || cancelTarget?.id} (Pedido #{cancelTarget?.pedido_id})
          </Typography>
          <TextField fullWidth label="Motivo do Cancelamento" size="small" multiline rows={3} autoFocus
            value={motivoCancel} onChange={(e) => setMotivoCancel(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} color="inherit">Voltar</Button>
          <Button onClick={handleCancelar} variant="contained" color="error" disabled={!motivoCancel}>Cancelar NFC-e</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
