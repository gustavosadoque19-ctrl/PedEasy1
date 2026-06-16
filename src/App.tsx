import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import theme from './theme';
import { ErrorBoundary } from './components/ErrorBoundary';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const Login = lazy(() => import('./pages/Login/Login'));
const Signup = lazy(() => import('./pages/Signup/Signup'));
const Planos = lazy(() => import('./pages/Planos/Planos'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const ClientesList = lazy(() => import('./pages/Clientes/ClientesList'));
const ClientesForm = lazy(() => import('./pages/Clientes/ClientesForm'));
const ProdutosList = lazy(() => import('./pages/Produtos/ProdutosList'));
const ProdutosForm = lazy(() => import('./pages/Produtos/ProdutosForm'));
const FuncionariosList = lazy(() => import('./pages/Funcionarios/FuncionariosList'));
const FuncionariosForm = lazy(() => import('./pages/Funcionarios/FuncionariosForm'));
const PedidosList = lazy(() => import('./pages/Pedidos/PedidosList'));
const PedidosForm = lazy(() => import('./pages/Pedidos/PedidosForm'));
const PedidosView = lazy(() => import('./pages/Pedidos/PedidosView'));
const EstoqueList = lazy(() => import('./pages/Estoque/EstoqueList'));
const CaixaDashboard = lazy(() => import('./pages/Caixa/CaixaDashboard'));
const Relatorios = lazy(() => import('./pages/Relatorios/Relatorios'));
const NFeList = lazy(() => import('./pages/NFe/NFeList'));
const BotConfig = lazy(() => import('./pages/BotConfig/BotConfig'));
const Configuracoes = lazy(() => import('./pages/Configuracoes/Configuracoes'));
const Mesas = lazy(() => import('./pages/Mesas/Mesas'));
const Cupons = lazy(() => import('./pages/Cupons/Cupons'));
const Fidelidade = lazy(() => import('./pages/Fidelidade/Fidelidade'));
const NPagina = lazy(() => import('./pages/NPS/NPS'));
const Carrinhos = lazy(() => import('./pages/Carrinhos/Carrinhos'));
const Pagamentos = lazy(() => import('./pages/Pagamentos/Pagamentos'));
const Integracoes = lazy(() => import('./pages/Integracoes/Integracoes'));
const AtendimentoVirtual = lazy(() => import('./pages/AtendimentoVirtual/AtendimentoVirtual'));
const CardapioPage = lazy(() => import('./pages/Cardapio/Cardapio'));
const Assinatura = lazy(() => import('./pages/Saas/Assinatura'));
const Onboarding = lazy(() => import('./pages/Saas/Onboarding'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Admin = lazy(() => import('./pages/Admin/Admin'));

function PageFallback() {
  return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
        <Route path="/login" element={<ErrorBoundary>{isAuthenticated ? <Navigate to="/app" /> : <Login />}</ErrorBoundary>} />
        <Route path="/signup" element={<ErrorBoundary>{isAuthenticated ? <Navigate to="/app" /> : <Signup />}</ErrorBoundary>} />
        <Route path="/cardapio" element={<ErrorBoundary><CardapioPage /></ErrorBoundary>} />
        <Route path="/cardapio/:slug" element={<ErrorBoundary><CardapioPage /></ErrorBoundary>} />
        <Route path="/app" element={<PrivateRoute><TenantProvider><MainLayout /></TenantProvider></PrivateRoute>}>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="planos" element={<ErrorBoundary><Planos /></ErrorBoundary>} />
          <Route path="assinatura" element={<ErrorBoundary><Assinatura /></ErrorBoundary>} />
          <Route path="onboarding" element={<ErrorBoundary><Onboarding /></ErrorBoundary>} />
          <Route path="clientes" element={<ErrorBoundary><ClientesList /></ErrorBoundary>} />
          <Route path="clientes/novo" element={<ErrorBoundary><ClientesForm /></ErrorBoundary>} />
          <Route path="clientes/:id" element={<ErrorBoundary><ClientesForm /></ErrorBoundary>} />
          <Route path="produtos" element={<ErrorBoundary><ProdutosList /></ErrorBoundary>} />
          <Route path="produtos/novo" element={<ErrorBoundary><ProdutosForm /></ErrorBoundary>} />
          <Route path="produtos/:id" element={<ErrorBoundary><ProdutosForm /></ErrorBoundary>} />
          <Route path="funcionarios" element={<ErrorBoundary><FuncionariosList /></ErrorBoundary>} />
          <Route path="funcionarios/novo" element={<ErrorBoundary><FuncionariosForm /></ErrorBoundary>} />
          <Route path="funcionarios/:id" element={<ErrorBoundary><FuncionariosForm /></ErrorBoundary>} />
          <Route path="pedidos" element={<ErrorBoundary><PedidosList /></ErrorBoundary>} />
          <Route path="pedidos/novo" element={<ErrorBoundary><PedidosForm /></ErrorBoundary>} />
          <Route path="pedidos/visualizar/:id" element={<ErrorBoundary><PedidosView /></ErrorBoundary>} />
          <Route path="pedidos/:id" element={<ErrorBoundary><PedidosForm /></ErrorBoundary>} />
          <Route path="estoque" element={<ErrorBoundary><EstoqueList /></ErrorBoundary>} />
          <Route path="caixa" element={<ErrorBoundary><CaixaDashboard /></ErrorBoundary>} />
          <Route path="relatorios" element={<ErrorBoundary><Relatorios /></ErrorBoundary>} />
          <Route path="nfe" element={<ErrorBoundary><NFeList /></ErrorBoundary>} />
          <Route path="bot" element={<ErrorBoundary><BotConfig /></ErrorBoundary>} />
          <Route path="configuracoes" element={<ErrorBoundary><Configuracoes /></ErrorBoundary>} />
          <Route path="mesas" element={<ErrorBoundary><Mesas /></ErrorBoundary>} />
          <Route path="cupons" element={<ErrorBoundary><Cupons /></ErrorBoundary>} />
          <Route path="fidelidade" element={<ErrorBoundary><Fidelidade /></ErrorBoundary>} />
          <Route path="nps" element={<ErrorBoundary><NPagina /></ErrorBoundary>} />
          <Route path="carrinhos" element={<ErrorBoundary><Carrinhos /></ErrorBoundary>} />
          <Route path="pagamentos" element={<ErrorBoundary><Pagamentos /></ErrorBoundary>} />
          <Route path="integracoes" element={<ErrorBoundary><Integracoes /></ErrorBoundary>} />
          <Route path="atendimento" element={<ErrorBoundary><AtendimentoVirtual /></ErrorBoundary>} />
        </Route>
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<ErrorBoundary><Admin /></ErrorBoundary>} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
