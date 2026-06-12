import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert,
} from '@mui/material';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import { getRelatorioVendas } from '../../api/relatorios';
import { getNPSResumo } from '../../api/nps';
import { RelatorioVendas } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Relatorios() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dataInicio, setDataInicio] = useState(firstDay);
  const [dataFim, setDataFim] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [relatorio, setRelatorio] = useState<RelatorioVendas | null>(null);
  const [npsResumo, setNpsResumo] = useState<{ total: number; media: number; nps: number; promotores: number; detratores: number; neutros: number } | null>(null);

  const handleExportPdf = () => {
    if (!relatorio) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Relatório de Vendas', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${dataInicio} a ${dataFim}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 34, { align: 'center' });

    doc.setFontSize(12);
    doc.text('Resumo', 14, 44);
    autoTable(doc, {
      startY: 48,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Vendas', `R$ ${relatorio.total_vendas.toFixed(2)}`],
        ['Total Recebido', `R$ ${relatorio.total_recebido.toFixed(2)}`],
        ['Descontos', `R$ ${relatorio.total_descontos.toFixed(2)}`],
        ['Qtd. Pedidos', String(relatorio.quantidade_pedidos)],
        ['Ticket Médio', `R$ ${relatorio.ticket_medio.toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
    });

    const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    autoTable(doc, {
      startY: lastY + 10,
      head: [['Forma de Pagamento', 'Total']],
      body: relatorio.vendas_por_forma_pagamento.map((v) => [v.forma, `R$ ${v.total.toFixed(2)}`]),
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
    });

    const lastY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    autoTable(doc, {
      startY: lastY2 + 10,
      head: [['Produto', 'Quantidade', 'Total']],
      body: relatorio.produtos_mais_vendidos.map((p) => [p.produto, String(p.quantidade), `R$ ${p.total.toFixed(2)}`]),
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
    });

    if (npsResumo && npsResumo.total > 0) {
      const lastY3 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
      autoTable(doc, {
        startY: lastY3 + 10,
        head: [['Satisfação (NPS)', 'Valor']],
        body: [
          ['NPS Score', String(npsResumo.nps)],
          ['Promotores', String(npsResumo.promotores)],
          ['Neutros', String(npsResumo.neutros)],
          ['Detratores', String(npsResumo.detratores)],
          ['Média', npsResumo.media?.toFixed(1)],
          ['Total', String(npsResumo.total)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210] },
      });
    }

    doc.save(`relatorio-vendas-${dataInicio}-a-${dataFim}.pdf`);
  };

  const handleGerar = async () => {
    setLoading(true);
    setError('');
    try {
      const [vendasRes, npsRes] = await Promise.all([
        getRelatorioVendas({ data_inicio: dataInicio, data_fim: dataFim }),
        getNPSResumo(),
      ]);
      setRelatorio(vendasRes.data);
      setNpsResumo(npsRes.data);
    } catch {
      setError('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Relatórios e Métricas</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Data Início" type="date" size="small"
                value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Data Fim" type="date" size="small"
                value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button fullWidth variant="contained" onClick={handleGerar} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : 'Gerar Relatório'}
                </Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={handleExportPdf}
                  disabled={!relatorio || loading}>
                  PDF
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {relatorio && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>Vendas</Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Total de Vendas</Typography>
                <Typography variant="h5">R$ {relatorio.total_vendas.toFixed(2)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Total Recebido</Typography>
                <Typography variant="h5">R$ {relatorio.total_recebido.toFixed(2)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Descontos</Typography>
                <Typography variant="h5">R$ {relatorio.total_descontos.toFixed(2)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Qtd. Pedidos</Typography>
                <Typography variant="h5">{relatorio.quantidade_pedidos}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card><CardContent>
                <Typography variant="body2" color="text.secondary">Ticket Médio</Typography>
                <Typography variant="h5">R$ {relatorio.ticket_medio.toFixed(2)}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Vendas por Forma de Pagamento</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Forma</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {relatorio.vendas_por_forma_pagamento.map((v, i) => (
                      <TableRow key={i}><TableCell>{v.forma}</TableCell><TableCell align="right">R$ {v.total.toFixed(2)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Produtos Mais Vendidos</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Quantidade</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {relatorio.produtos_mais_vendidos.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.produto}</TableCell>
                        <TableCell align="right">{p.quantidade}</TableCell>
                        <TableCell align="right">R$ {p.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {npsResumo && npsResumo.total > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Pesquisa de Satisfação (NPS)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="body2" color="text.secondary">NPS Score</Typography>
                    <Typography variant="h5">{npsResumo.nps}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="body2" color="success.main">Promotores</Typography>
                    <Typography variant="h5">{npsResumo.promotores}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="body2" color="warning.main">Neutros</Typography>
                    <Typography variant="h5">{npsResumo.neutros}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="body2" color="error.main">Detratores</Typography>
                    <Typography variant="h5">{npsResumo.detratores}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="body2" color="text.secondary">Média</Typography>
                    <Typography variant="h5">{npsResumo.media?.toFixed(1)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                    <Typography variant="h5">{npsResumo.total}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
