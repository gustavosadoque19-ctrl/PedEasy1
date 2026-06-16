import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, InputAdornment, Chip, IconButton, CircularProgress,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import Visibility from '@mui/icons-material/Visibility';
import Edit from '@mui/icons-material/Edit';
import { getPedidos } from '../../api/pedidos';
import { Pedido } from '../../types';
import { statusLabels, statusColors } from '../../constants/pedido';

export default function MeusPedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPedidos();
        if (!cancelled) {
          const ordenados = (res.data || []).sort((a: Pedido, b: Pedido) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setPedidos(ordenados);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; mountedRef.current = false; };
  }, []);

  const filtered = pedidos.filter((p) => {
    const matchSearch = !search ||
      String(p.id).includes(search) ||
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.mesa?.includes(search);
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus;
    return matchSearch && matchStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Total: {pedidos.length} pedido(s)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder="Buscar por ID, cliente, mesa..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
            sx={{ width: 250 }} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
        {['todos', 'aberto', 'em_preparo', 'pronto', 'entregue', 'fechado', 'cancelado'].map((s) => (
          <Chip key={s}
            label={s === 'todos' ? 'Todos' : statusLabels[s]}
            color={filtroStatus === s ? 'primary' : 'default'}
            variant={filtroStatus === s ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setFiltroStatus(s)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Cliente/Mesa</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell sx={{ textAlign: 'center' }} width={80}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>Nenhum pedido encontrado</TableCell></TableRow>
                ) : filtered.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>
                      <Chip label={p.tipo === 'mesa' ? `Mesa ${p.mesa}` : p.tipo} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{p.cliente_nome || '-'}</TableCell>
                    <TableCell>R$ {(p.valor_total ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={statusLabels[p.status]} size="small" color={statusColors[p.status]} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton size="small" aria-label="Visualizar pedido" onClick={() => navigate(`/app/pedidos/visualizar/${p.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="Editar pedido" onClick={() => navigate(`/app/pedidos/${p.id}`)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
