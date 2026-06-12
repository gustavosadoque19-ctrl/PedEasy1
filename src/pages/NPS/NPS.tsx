import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, Rating,
} from '@mui/material';
import { getNPS, getNPSResumo } from '../../api/nps';
import { NPSPesquisa } from '../../types';

export default function NPS() {
  const [pesquisas, setPesquisas] = useState<NPSPesquisa[]>([]);
  const [resumo, setResumo] = useState<{ total: number; media: number; nps: number; promotores: number; detratores: number; neutros: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pesqRes, resumoRes] = await Promise.all([getNPS(), getNPSResumo()]);
        if (!cancelled) setPesquisas(pesqRes.data);
        if (!cancelled) setResumo(resumoRes.data);
      } catch {
        if (!cancelled) setError('Erro ao carregar dados NPS');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getCategoria = (nota: number) => {
    if (nota >= 9) return { label: 'Promotor', color: 'success' as const };
    if (nota >= 7) return { label: 'Neutro', color: 'warning' as const };
    return { label: 'Detrator', color: 'error' as const };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Pesquisa de Satisfação (NPS)</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          {resumo && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ bgcolor: '#E3F2FD' }}><CardContent>
                  <Typography variant="body2" color="text.secondary">NPS Score</Typography>
                  <Typography variant="h4">{resumo.nps}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ bgcolor: '#E8F5E9' }}><CardContent>
                  <Typography variant="body2" color="text.secondary">Promotores</Typography>
                  <Typography variant="h4" color="success.main">{resumo.promotores}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ bgcolor: '#FFF3E0' }}><CardContent>
                  <Typography variant="body2" color="text.secondary">Neutros</Typography>
                  <Typography variant="h4" color="warning.main">{resumo.neutros}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ bgcolor: '#FFEBEE' }}><CardContent>
                  <Typography variant="body2" color="text.secondary">Detratores</Typography>
                  <Typography variant="h4" color="error.main">{resumo.detratores}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card><CardContent>
                  <Typography variant="body2" color="text.secondary">Média</Typography>
                  <Typography variant="h4">{resumo.media?.toFixed(1)}</Typography>
                </CardContent></Card>
              </Grid>
            </Grid>
          )}

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Avaliações ({pesquisas.length})</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell>Categoria</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Comentário</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Origem</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pesquisas.length === 0 && (
                      <TableRow><TableCell colSpan={3} align="center">Nenhuma avaliação recebida</TableCell></TableRow>
                    )}
                    {pesquisas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.cliente_nome || 'Anônimo'}</TableCell>
                        <TableCell>
                          <Rating value={p.nota} readOnly size="small" max={10} />
                        </TableCell>
                        <TableCell>
                          <Chip label={getCategoria(p.nota).label} color={getCategoria(p.nota).color} size="small" />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.comentario || '-'}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.origem}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
