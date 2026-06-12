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
import { getFuncionarios, deleteFuncionario } from '../../api/funcionarios';
import { Funcionario } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { useSnackbar } from '../../hooks/useSnackbar';

export default function FuncionariosList() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<Funcionario | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getFuncionarios();
        if (!cancelled) setFuncionarios(res.data);
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
      const res = await getFuncionarios();
      if (!mountedRef.current) return;
      setFuncionarios(res.data);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try { await deleteFuncionario(deleteTarget.id); setDeleteTarget(null); snackbar.success('Funcionário excluído com sucesso'); load(); } catch { snackbar.error('Erro ao excluir funcionário'); }
  };

  const filtered = useMemo(() => funcionarios.filter((f) =>
    f.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) || f.cargo.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [funcionarios, debouncedSearch]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Funcionários</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/funcionarios/novo')}>Novo Funcionário</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField fullWidth size="small" placeholder="Buscar por nome ou cargo..." value={search}
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
                    <TableCell>Nome</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Usuário</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Telefone</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Permissão</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((f) => (
                    <TableRow key={f.id} hover>
                      <TableCell>{f.nome}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{f.usuario}</TableCell>
                      <TableCell>{f.cargo}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{f.telefone}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Chip label={f.permissao} size="small" variant="outlined" /></TableCell>
                      <TableCell><Chip label={f.ativo ? 'Ativo' : 'Inativo'} size="small" color={f.ativo ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Editar funcionário" onClick={() => navigate(`/funcionarios/${f.id}`)}><Edit /></IconButton>
                        <IconButton size="small" aria-label="Excluir funcionário" color="error" onClick={() => setDeleteTarget(f)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={4} align="center">Nenhum funcionário encontrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
            </>
          )}
          <TablePagination component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </CardContent>
      </Card>
      <ConfirmDialog open={!!deleteTarget} title="Excluir Funcionário" message={`Deseja realmente excluir ${deleteTarget?.nome}?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Box>
  );
}
