import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, InputAdornment, Chip, IconButton, CircularProgress,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import Edit from '@mui/icons-material/Edit';
import { getClientes } from '../../api/clientes';
import { Cliente } from '../../types';

export default function MeusClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getClientes();
        if (!cancelled) setClientes(res.data);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; mountedRef.current = false; };
  }, []);

  const filtered = clientes.filter((c) =>
    !search || c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.documento?.includes(search) || c.telefone?.includes(search)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total: {clientes.length} cliente(s)
        </Typography>
        <TextField size="small" placeholder="Buscar cliente..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
          sx={{ width: 280 }} />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>Status</TableCell>
                  <TableCell sx={{ textAlign: 'center' }} width={100}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>Nenhum cliente encontrado</TableCell></TableRow>
                ) : filtered.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.nome}</TableCell>
                    <TableCell>{c.documento || '-'}</TableCell>
                    <TableCell>{c.telefone || '-'}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip label={c.ativo ? 'Ativo' : 'Inativo'} size="small" color={c.ativo ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton size="small" onClick={() => navigate(`/app/clientes/${c.id}`)}><Edit fontSize="small" /></IconButton>
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
