import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box,
  Typography, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import Dashboard from '@mui/icons-material/Dashboard';
import People from '@mui/icons-material/People';
import Fastfood from '@mui/icons-material/Fastfood';
import Badge from '@mui/icons-material/Badge';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Inventory from '@mui/icons-material/Inventory';
import PointOfSale from '@mui/icons-material/PointOfSale';
import Assessment from '@mui/icons-material/Assessment';
import Description from '@mui/icons-material/Description';
import Logout from '@mui/icons-material/Logout';
import TableRestaurant from '@mui/icons-material/TableRestaurant';
import Discount from '@mui/icons-material/Discount';
import Stars from '@mui/icons-material/Stars';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ShoppingCartCheckout from '@mui/icons-material/ShoppingCartCheckout';
import Payments from '@mui/icons-material/Payments';
import Link from '@mui/icons-material/Link';
import Chat from '@mui/icons-material/Chat';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Shield from '@mui/icons-material/Shield';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 260;

interface MenuGroup {
  label?: string;
  items: { text: string; icon: React.ReactNode; path: string }[];
}

const menuGroups: MenuGroup[] = [
  {
    items: [{ text: 'Dashboard', icon: <Dashboard />, path: '/' }],
  },
  {
    label: 'Operacional',
    items: [
      { text: 'Mesas', icon: <TableRestaurant />, path: '/mesas' },
      { text: 'Pedidos', icon: <ShoppingCart />, path: '/pedidos' },
      { text: 'Caixa', icon: <PointOfSale />, path: '/caixa' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { text: 'Clientes', icon: <People />, path: '/clientes' },
      { text: 'Produtos', icon: <Fastfood />, path: '/produtos' },
      { text: 'Funcionários', icon: <Badge />, path: '/funcionarios' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { text: 'Estoque', icon: <Inventory />, path: '/estoque' },
      { text: 'Cupons', icon: <Discount />, path: '/cupons' },
      { text: 'Fidelidade', icon: <Stars />, path: '/fidelidade' },
      { text: 'NPS', icon: <ThumbUpAlt />, path: '/nps' },
      { text: 'Carrinhos', icon: <ShoppingCartCheckout />, path: '/carrinhos' },
      { text: 'Pagamentos', icon: <Payments />, path: '/pagamentos' },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { text: 'Relatórios', icon: <Assessment />, path: '/relatorios' },
      { text: 'NFe', icon: <Description />, path: '/nfe' },
    ],
  },
  {
    label: 'Integrações',
    items: [
      { text: 'Integrações', icon: <Link />, path: '/integracoes' },
      { text: 'Atendimento', icon: <Chat />, path: '/atendimento' },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const content = (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Fastfood sx={{ color: '#38bdf8', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2, fontWeight: 800, color: '#f1f5f9' }}>PedEasy</Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: '#334155' }} />
      <Box sx={{ flex: 1, overflow: 'auto', px: 1, py: 1 }}>
        {menuGroups.map((group) => (
          <Box key={group.label || 'top'}>
            {group.label && (
              <Typography variant="caption" sx={{ px: 1.5, pt: 1.5, pb: 0.5, display: 'block', color: '#64748b', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {group.label}
              </Typography>
            )}
            <List dense disablePadding>
              {group.items.map((item) => (
                <ListItemButton
                  key={item.path}
                  selected={location.pathname === item.path}
                  onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
                  sx={{ borderRadius: 2, mb: 0.3, py: 0.6, color: '#cbd5e1', '&:hover': { bgcolor: '#334155' }, '&.Mui-selected': { bgcolor: '#2563eb', color: '#fff', '&:hover': { bgcolor: '#1d4ed8' }, '& .MuiListItemIcon-root': { color: '#fff' } } }}
                >
                  <ListItemIcon sx={{ minWidth: 36, fontSize: 20, color: '#64748b' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} slotProps={{ primary: { sx: { fontSize: '0.88rem' } } }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>
      <Divider sx={{ borderColor: '#334155' }} />
      <List sx={{ px: 1, py: 1 }}>
        {(user as any)?.permissao === 'superadmin' && (
          <ListItemButton onClick={() => navigate('/admin')}
            sx={{ borderRadius: 2, mb: 0.5, color: '#38bdf8', '&:hover': { bgcolor: '#334155' } }}>
            <ListItemIcon sx={{ minWidth: 36, color: '#38bdf8' }}><Shield /></ListItemIcon>
            <ListItemText primary="Admin" slotProps={{ primary: { sx: { fontSize: '0.88rem', fontWeight: 600 } } }} />
          </ListItemButton>
        )}
      </List>
      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton component="a" href="/cardapio" target="_blank"
          sx={{ borderRadius: 2, color: '#cbd5e1', '&:hover': { bgcolor: '#334155' } }}>
          <ListItemIcon sx={{ minWidth: 36, color: '#64748b' }}><OpenInNew /></ListItemIcon>
          <ListItemText primary="Cardápio Digital" slotProps={{ primary: { sx: { fontSize: '0.88rem' } } }} />
        </ListItemButton>
        <ListItemButton onClick={logout} sx={{ borderRadius: 2, color: '#cbd5e1', '&:hover': { bgcolor: '#334155' } }}>
          <ListItemIcon sx={{ minWidth: 36, color: '#64748b' }}><Logout /></ListItemIcon>
          <ListItemText primary="Sair" slotProps={{ primary: { sx: { fontSize: '0.88rem' } } }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: '#1e293b', color: '#cbd5e1' },
      }}
    >
      {content}
    </Drawer>
  );
}
