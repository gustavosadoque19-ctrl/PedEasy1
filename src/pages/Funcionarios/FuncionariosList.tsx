import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Card, CardContent, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TablePagination, CircularProgress,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Search from '@mui/icons-material/Search';
import { getFuncionarios, deleteFuncionario, getPendentes, aprovarFuncionario, type FuncionarioSemSenha } from '../../api/funcionarios';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { useSnackbar } from '../../hooks/useSnackbar';

export default function FuncionariosList() {
  const [funcionarios, setFuncionarios] = useState<FuncionarioSemSenha[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregar, setErroCarregar] = useState('');
  const [pendentes, setPendentes] = useState<FuncionarioSemSenha[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<FuncionarioSemSenha | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.permissao === 'admin';

  async function carregar() {
    setErroCarregar('');
    try {
      const [resFunc, resPend] = await Promise.all([
        getFuncionarios(),
        isAdmin ? getPendentes() : Promise.resolve(undefined),
      ]);
      setFuncionarios(resFunc.data);
      if (resPend) setPendentes(resPend.data);
    } catch {
      setErroCarregar('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const handleAprovar = async (id: number) => {
    try {
      await aprovarFuncionario(id);
      setPendentes((prev) => prev.filter((p) => p.id !== id));
      snackbar.success('Funcionário aprovado');
    } catch {
      snackbar.error('Erro ao aprovar funcionário');
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteFuncionario(deleteTarget.id);
      setDeleteTarget(null);
      snackbar.success('Funcionário excluído');
      carregar();
    } catch {
      snackbar.error('Erro ao excluir funcionário');
    }
  }, [deleteTarget]);

  const filtered = useMemo(() => funcionarios.filter((f) =>
    (f.nome?.toLowerCase() ?? '').includes(debouncedSearch.toLowerCase())
    || (f.cargo?.toLowerCase() ?? '').includes(debouncedSearch.toLowerCase())
  ), [funcionarios, debouncedSearch]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Funcionários</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/funcionarios/novo')}>Novo Funcionário</Button>
      </Box>

      {erroCarregar && <Alert severity="error" sx={{ mb: 2 }}>{erroCarregar}</Alert>}

      <Card>
        <CardContent>
          <TextField fullWidth size="small" placeholder="Buscar por nome ou cargo..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> } }} sx={{ mb: 2 }}
          />

          {pendentes.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>{pendentes.length}</strong> funcionário(s) aguardando aprovação
            </Alert>
          )}

          {pendentes.length > 0 && (
            <Card variant="outlined" sx={{ mb: 2, borderColor: 'warning.light' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="subtitle2" color="warning.dark" sx={{ mb: 1 }}>Pendentes de Aprovação</Typography>
                {pendentes.map((f) => (
                  <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="body2">{f.nome ?? ''}</Typography>
                      <Typography variant="caption" color="text.secondary">@{f.usuario ?? ''} &middot; {f.cargo ?? ''}</Typography>
                    </Box>
                    <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleAprovar(f.id!)}>
                      Aprovar
                    </Button>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={32} /></Box>
          ) : (
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
                      <TableCell>{f.nome ?? ''}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{f.usuario ?? ''}</TableCell>
                      <TableCell>{f.cargo ?? ''}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{f.telefone ?? ''}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Chip label={f.permissao ?? ''} size="small" variant="outlined" /></TableCell>
                      <TableCell><Chip label={f.ativo ? 'Ativo' : 'Inativo'} size="small" color={f.ativo ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Editar" onClick={() => navigate(`/funcionarios/${f.id}`)}><Edit /></IconButton>
                        <IconButton size="small" aria-label="Excluir" color="error" onClick={() => setDeleteTarget(f)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center">Nenhum funcionário encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </CardContent>
      </Card>

      <ConfirmDialog open={!!deleteTarget} title="Excluir Funcionário"
        message={`Deseja realmente excluir ${deleteTarget?.nome ?? 'este funcionário'}?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Box>
  );
}
