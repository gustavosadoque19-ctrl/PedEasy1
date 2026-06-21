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
import { getClientes, deleteCliente } from '../../api/clientes';
import { Cliente } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { useSnackbar } from '../../hooks/useSnackbar';

export default function ClientesList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getClientes();
        if (!cancelled) setClientes(Array.isArray(res.data) ? res.data : []);
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
      const res = await getClientes();
      if (!mountedRef.current) return;
      setClientes(Array.isArray(res.data) ? res.data : []);
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
      await deleteCliente(deleteTarget.id);
      setDeleteTarget(null);
      snackbar.success('Cliente excluído com sucesso');
      load();
    } catch {
      snackbar.error('Erro ao excluir cliente');
    }
  };

  const filtered = useMemo(() => clientes.filter((c) =>
    c.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.documento.includes(debouncedSearch) ||
    c.telefone.includes(debouncedSearch)
  ), [clientes, debouncedSearch]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Clientes</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/clientes/novo')}>
          Novo Cliente
        </Button>
      </Box>
      <Card>
        <CardContent>
          <TextField
            fullWidth size="small" placeholder="Buscar por nome, documento ou telefone..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> } }}
            sx={{ mb: 2 }}
          />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={32} /></Box>
          ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Documento</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>{cliente.nome}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{cliente.documento}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{cliente.email}</TableCell>
                    <TableCell>
                      <Chip label={cliente.ativo ? 'Ativo' : 'Inativo'} size="small" color={cliente.ativo ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" aria-label="Editar cliente" onClick={() => navigate(`/app/clientes/${cliente.id}`)}><Edit /></IconButton>
                      <IconButton size="small" aria-label="Excluir cliente" color="error" onClick={() => setDeleteTarget(cliente)}><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center">Nenhum cliente encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          )}
          <TablePagination
            component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }
          } />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteTarget} title="Excluir Cliente"
        message={`Deseja realmente excluir ${deleteTarget?.nome}?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
