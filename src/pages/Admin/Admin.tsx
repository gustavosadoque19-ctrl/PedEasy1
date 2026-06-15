import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, TablePagination, Button,
} from '@mui/material';
import Edit from '@mui/icons-material/Edit';
import Add from '@mui/icons-material/Add';
import Groups from '@mui/icons-material/Groups';
import CheckCircle from '@mui/icons-material/CheckCircle';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import Block from '@mui/icons-material/Block';
import Business from '@mui/icons-material/Business';
import { getMetricas, getTenants, updateTenant, createTenant, Metricas, AdminTenant } from '../../api/admin';
import { useSnackbar } from '../../hooks/useSnackbar';
import TenantEditDialog from './TenantEditDialog';
import TenantCreateDialog from './TenantCreateDialog';

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  trial: 'warning',
  canceled: 'default',
  suspended: 'error',
};

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  trial: 'Trial',
  canceled: 'Cancelado',
  suspended: 'Suspenso',
};

export default function Admin() {
  const snackbar = useSnackbar();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [editTenant, setEditTenant] = useState<AdminTenant | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([getMetricas(), getTenants()]).then(([m, t]) => {
      setMetricas(m);
      setTenants(t);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(
    () => tenants.filter((t) =>
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.pagarme_subscription_id || '').toLowerCase().includes(search.toLowerCase())
    ),
    [tenants, search]
  );

  const handleSaveTenant = async (id: number, data: { plano: string; status: string }) => {
    const updated = await updateTenant(id, data as any);
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, ...updated } : t));
    const [m] = await Promise.all([getMetricas()]);
    setMetricas(m);
    snackbar.success('Tenant atualizado');
  };

  const handleCreateTenant = async (data: { nome: string; email: string; senha: string; plano: string }) => {
    await createTenant(data);
    snackbar.success('Cliente criado com sucesso');
    setCreateOpen(false);
    loadData();
  };

  if (loading && tenants.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Clientes SaaS</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Novo Cliente
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total', value: metricas?.total ?? 0, icon: <Business />, color: '#3b82f6' },
          { label: 'Ativos', value: metricas?.ativos ?? 0, icon: <CheckCircle />, color: '#22c55e' },
          { label: 'Trial', value: metricas?.trial ?? 0, icon: <HourglassEmpty />, color: '#eab308' },
          { label: 'Suspensos', value: metricas?.suspensos ?? 0, icon: <Block />, color: '#ef4444' },
          { label: 'Planos', value: metricas?.planos ? Object.entries(metricas.planos).map(([k, v]) => `${k}: ${v}`).join(', ') : '', icon: <Groups />, color: '#8b5cf6' },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: item.color }}>{item.icon}</Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TextField
        fullWidth size="small" placeholder="Buscar por nome, slug ou subscription ID..."
        value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Usuários</TableCell>
              <TableCell>Subscription ID</TableCell>
              <TableCell>Trial até</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t.nome}</TableCell>
                <TableCell><code>{t.slug}</code></TableCell>
                <TableCell><Chip label={t.plano} size="small" color={t.plano === 'enterprise' ? 'warning' : t.plano === 'pro' ? 'primary' : 'default'} /></TableCell>
                <TableCell><Chip label={statusLabel[t.status] || t.status} size="small" color={statusColor[t.status]} /></TableCell>
                <TableCell>{t.usuarios}</TableCell>
                <TableCell>{t.pagarme_subscription_id ? <code style={{ fontSize: '0.75rem' }}>{t.pagarme_subscription_id}</code> : '-'}</TableCell>
                <TableCell>{t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString() : '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setEditTenant(t)}><Edit /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center"><Typography color="text.secondary" sx={{ py: 3 }}>Nenhum cliente encontrado</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage} rowsPerPageOptions={[rowsPerPage]}
        />
      </TableContainer>

      <TenantEditDialog
        open={!!editTenant}
        tenant={editTenant}
        onSave={handleSaveTenant}
        onClose={() => setEditTenant(null)}
      />
      <TenantCreateDialog
        open={createOpen}
        onSave={handleCreateTenant}
        onClose={() => setCreateOpen(false)}
      />
    </Box>
  );
}
