import { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import Store from '@mui/icons-material/Store';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Print from '@mui/icons-material/Print';
import People from '@mui/icons-material/People';
import Receipt from '@mui/icons-material/Receipt';
import Settings from '@mui/icons-material/Settings';
import Chat from '@mui/icons-material/Chat';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import LocationOn from '@mui/icons-material/LocationOn';
import Estabelecimento from './Estabelecimento';
import CardapioDigital from './CardapioDigital';
import ConfigPedidos from './ConfigPedidos';
import Impressoras from './Impressoras';
import MeusClientes from './MeusClientes';
import MeusPedidos from './MeusPedidos';
import BotConfig from '../BotConfig/BotConfig';
import FocusConfig from './FocusConfig';
import RegioesAtendimento from './RegioesAtendimento';
import AdicionaisConfig from './AdicionaisConfig';

const tabs = [
  { label: 'Informações do Estabelecimento', icon: <Store />, component: <Estabelecimento /> },
  { label: 'Regiões de Atendimento', icon: <LocationOn />, component: <RegioesAtendimento /> },
  { label: 'Cardápio Digital', icon: <RestaurantMenu />, component: <CardapioDigital /> },
  { label: 'Config. de Pedidos', icon: <ShoppingCart />, component: <ConfigPedidos /> },
  { label: 'Impressoras', icon: <Print />, component: <Impressoras /> },
  { label: 'Meus Clientes', icon: <People />, component: <MeusClientes /> },
  { label: 'Meus Pedidos', icon: <Receipt />, component: <MeusPedidos /> },
  { label: 'WhatsApp Bot', icon: <Chat />, component: <BotConfig /> },
  { label: 'Focus NFe', icon: <ReceiptLong />, component: <FocusConfig /> },
  { label: 'Adicionais', icon: <AddCircleOutlined />, component: <AdicionaisConfig /> },
];

export default function Configuracoes() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Settings />
        <Typography variant="h4">Configurações</Typography>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map((t, i) => (
          <Tab key={i} label={t.label} icon={t.icon} iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none' }} />
        ))}
      </Tabs>

      {tabs[tabIndex].component}
    </Box>
  );
}

