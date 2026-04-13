import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Proveedores from './pages/Proveedores';
import Ventas from './pages/Ventas';
import Cajas from './pages/Cajas';
import StockBajo from './pages/StockBajo';
import Depositos from './pages/Depositos';
import Lotes from './pages/Lotes';
import Series from './pages/Series';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="productos" element={<Productos />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="cajas" element={<Cajas />} />
        <Route path="stock-bajo" element={<StockBajo />} />
        <Route path="depositos" element={<Depositos />} />
        <Route path="lotes" element={<Lotes />} />
        <Route path="series" element={<Series />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}