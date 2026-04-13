import { useState, useEffect } from 'react';
import { statisticsService } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState('dia');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [periodo]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await statisticsService.dashboard(periodo);
      setData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!data) return <div className="loading">No hay datos disponibles</div>;

  return (
    <div className="container">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="periodo-selector">
        <button 
          className={`periodo-btn ${periodo === 'dia' ? 'active' : ''}`} 
          onClick={() => setPeriodo('dia')}
        >
          Hoy
        </button>
        <button 
          className={`periodo-btn ${periodo === 'semana' ? 'active' : ''}`} 
          onClick={() => setPeriodo('semana')}
        >
          Semana
        </button>
        <button 
          className={`periodo-btn ${periodo === 'mes' ? 'active' : ''}`} 
          onClick={() => setPeriodo('mes')}
        >
          Mes
        </button>
      </div>
      
      <div className="grid stats-grid">
        <div className="card stats-card">
          <h3>Ventas</h3>
          <p className="stats-value">{data.ventas.cantidad}</p>
          <p className="stats-label">Total: ${data.ventas.total?.toLocaleString() || 0}</p>
        </div>
        
        <div className="card stats-card">
          <h3>Productos Vendidos</h3>
          <p className="stats-value">{data.productos_vendidos || 0}</p>
        </div>
        
        <div className="card stats-card">
          <h3>Clientes Nuevos</h3>
          <p className="stats-value">{data.clientes_nuevos || 0}</p>
        </div>
        
        <div className="card stats-card">
          <h3>Caja</h3>
          <p className="stats-value" style={{ fontSize: '1.25rem' }}>
            {data.caja_abierta ? 'Abierta' : 'Cerrada'}
          </p>
        </div>
      </div>
    </div>
  );
}