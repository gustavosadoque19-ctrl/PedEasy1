import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Chip, Snackbar,
} from '@mui/material';
import { getFidelidadeConfig, saveFidelidadeConfig, getFidelidadeClientes } from '../../api/fidelidade';
import { FidelidadeConfig, FidelidadeCliente } from '../../types';

export default function Fidelidade() {
  const [config, setConfig] = useState<FidelidadeConfig>({ pontos_por_real: 1, pontos_minimo_resgate: 100, valor_resgate_por_ponto: 0.05, ativo: true });
  const [clientes, setClientes] = useState<FidelidadeCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cfgRes, cliRes] = await Promise.all([getFidelidadeConfig(), getFidelidadeClientes()]);
        if (!cancelled) setConfig(cfgRes.data);
        if (!cancelled) setClientes(cliRes.data);
      } catch {
        if (!cancelled) setError('Erro ao carregar dados');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFidelidadeConfig(config);
      setSnack('Configuração salva!');
    } catch {
      setError('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Programa de Fidelidade</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Configuração</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Pontos por R$ 1,00" type="number" size="small"
                    value={config.pontos_por_real}
                    onChange={(e) => setConfig({ ...config, pontos_por_real: Math.max(0.1, Number(e.target.value)) })}
                    slotProps={{ htmlInput: { step: 0.1 } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Pontos mínimos para resgate" type="number" size="small"
                    value={config.pontos_minimo_resgate}
                    onChange={(e) => setConfig({ ...config, pontos_minimo_resgate: Math.max(1, Number(e.target.value)) })} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Valor por ponto (R$)" type="number" size="small"
                    value={config.valor_resgate_por_ponto}
                    onChange={(e) => setConfig({ ...config, valor_resgate_por_ponto: Math.max(0.01, Number(e.target.value)) })}
                    slotProps={{ htmlInput: { step: 0.01 } }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel control={
                    <Switch checked={config.ativo} onChange={(e) => setConfig({ ...config, ativo: e.target.checked })} />
                  } label="Programa de fidelidade ativo" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? <CircularProgress size={20} /> : 'Salvar Configuração'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Clientes</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Pontos</TableCell>
                      <TableCell align="right">Total Gasto</TableCell>
                      <TableCell align="right">Valor para Resgate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientes.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">Nenhum cliente no programa</TableCell></TableRow>
                    )}
                    {clientes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.cliente_nome || `Cliente #${c.cliente_id}`}</TableCell>
                        <TableCell align="right">
                          <Chip label={`${c.pontos} pts`} color="warning" size="small" />
                        </TableCell>
                        <TableCell align="right">R$ {c.total_gasto.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          R$ {(c.pontos * config.valor_resgate_por_ponto).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
