import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Typography, Chip, useMediaQuery, useTheme } from '@mui/material';
import Menu from '@mui/icons-material/Menu';
import Settings from '@mui/icons-material/Settings';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)} sx={{ mr: 2 }}>
                <Menu />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flex: 1, color: 'text.primary' }}>PedEasy</Typography>
            {user && (
              <>
                <IconButton aria-label="Configurações" onClick={() => navigate('/configuracoes')} sx={{ mr: 1 }} color="inherit">
                  <Settings />
                </IconButton>
                <Chip label={`${user.nome} (${user.cargo})`} size="small" color="primary" variant="outlined" />
              </>
            )}
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, p: { xs: 1.5, sm: 3 }, bgcolor: 'background.default', overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
