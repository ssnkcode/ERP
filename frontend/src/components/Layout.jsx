import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  const menu = [
    { path: '/', label: 'Dashboard', roles: ['admin', 'vendedor', 'gerente'] },
    { path: '/pos', label: 'Punto de Venta', roles: ['admin', 'vendedor', 'gerente'] },
    { path: '/productos', label: 'Productos', roles: ['admin', 'gerente'] },
    { path: '/clientes', label: 'Clientes', roles: ['admin', 'gerente'] },
    { path: '/proveedores', label: 'Proveedores', roles: ['admin', 'gerente'] },
    { path: '/ventas', label: 'Ventas', roles: ['admin', 'vendedor', 'gerente'] },
    { path: '/cajas', label: 'Cajas', roles: ['admin', 'gerente'] },
    { path: '/stock-bajo', label: 'Stock Bajo', roles: ['admin', 'gerente'] },
    { path: '/depositos', label: 'Depositos', roles: ['admin', 'gerente'] },
    { path: '/lotes', label: 'Lotes', roles: ['admin', 'gerente'] },
    { path: '/series', label: 'Series', roles: ['admin', 'gerente'] },
  ];

  const menuFiltered = menu.filter(m => m.roles.includes(user?.rol));

  return (
    <>
      <button 
        className="menu-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
      
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
      
      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-logo">Gestión</h2>
          </div>
          <nav className="sidebar-nav">
            {menuFiltered.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className="sidebar-link"
                onClick={handleLinkClick}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user?.nombre}</span>
            <button onClick={handleLogout} className="sidebar-logout">Salir</button>
          </div>
        </aside>
        
        <main className="main">
          <div className="main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}