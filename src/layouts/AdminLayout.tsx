import { Outlet, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Shield from '@mui/icons-material/Shield';

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#1e293b', color: '#f1f5f9' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/app')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Shield sx={{ mr: 1, color: '#38bdf8' }} />
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Admin PedEasy</Typography>
          <Button color="inherit" onClick={() => navigate('/app')}>Voltar ao App</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
