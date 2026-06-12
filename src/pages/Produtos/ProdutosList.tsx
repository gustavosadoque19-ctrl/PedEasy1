import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TablePagination, CircularProgress,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import { Avatar } from '@mui/material';
import { getProdutos, deleteProduto, getImagemUrl } from '../../api/produtos';
import { Produto } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { useSnackbar } from '../../hooks/useSnackbar';
import Fastfood from '@mui/icons-material/Fastfood';

export default function ProdutosList() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getProdutos();
        if (!cancelled) setProdutos(res.data);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProdutos();
      if (!mountedRef.current) return;
      setProdutos(res.data);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteProduto(deleteTarget.id);
      setDeleteTarget(null);
      snackbar.success('Produto excluído com sucesso');
      load();
    } catch { snackbar.error('Erro ao excluir produto'); }
  };

  const filtered = useMemo(() => produtos.filter((p) =>
    p.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) || p.categoria.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [produtos, debouncedSearch]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Produtos / Cardápio</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/produtos/novo')}>Novo Produto</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField fullWidth size="small" placeholder="Buscar por nome ou categoria..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> } }} sx={{ mb: 2 }}
          />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={32} /></Box>
          ) : (
            <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50, display: { xs: 'none', md: 'table-cell' } }}></TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Categoria</TableCell>
                    <TableCell>Preço Venda</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Estoque</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Avatar src={p.imagem ? getImagemUrl(p.imagem) : undefined} sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}>
                          {!p.imagem && <Fastfood sx={{ fontSize: 18 }} />}
                        </Avatar>
                      </TableCell>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.categoria}</TableCell>
                      <TableCell>R$ {p.preco_venda.toFixed(2)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Chip label={`${p.estoque_atual} ${p.unidade}`} size="small"
                          color={p.estoque_atual <= p.estoque_minimo ? 'warning' : 'success'} />
                      </TableCell>
                      <TableCell><Chip label={p.ativo ? 'Ativo' : 'Inativo'} size="small" color={p.ativo ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Editar produto" onClick={() => navigate(`/produtos/${p.id}`)}><Edit /></IconButton>
                        <IconButton size="small" aria-label="Excluir produto" color="error" onClick={() => setDeleteTarget(p)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={4} align="center">Nenhum produto encontrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
            </>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog open={!!deleteTarget} title="Excluir Produto" message={`Deseja realmente excluir ${deleteTarget?.nome}?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Box>
  );
}
