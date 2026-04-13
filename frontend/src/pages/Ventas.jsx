import { useState, useEffect } from 'react';
import { ventasService, pdfService } from '../services/api';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('dia');
  const [verDetalle, setVerDetalle] = useState(null);

  useEffect(() => {
    loadVentas();
  }, [filtro]);

  const loadVentas = async () => {
    setLoading(true);
    try {
      const { data } = await ventasService.getAll();
      const filtradas = data.filter(v => {
        if (filtro === 'dia') {
          const hoy = new Date().toDateString();
          return new Date(v.fecha).toDateString() === hoy;
        }
        return true;
      });
      setVentas(filtradas);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarVenta = async (id) => {
    if (!confirm('¿Cancelar venta?')) return;
    try {
      await ventasService.cancelar(id);
      loadVentas();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al cancelar');
    }
  };

  const totalVentas = ventas.reduce((acc, v) => acc + v.total, 0);

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Ventas</h1>

      <div className="periodo-selector">
        <button 
          className={`periodo-btn ${filtro === 'dia' ? 'active' : ''}`}
          onClick={() => setFiltro('dia')}
        >
          Hoy
        </button>
        <button 
          className={`periodo-btn ${filtro === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          Todas
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Cantidad</h3>
            <p className="stats-value">{ventas.length}</p>
          </div>
          <div className="stats-card">
            <h3>Total</h3>
            <p className="stats-value">${totalVentas.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No hay ventas
                </td>
              </tr>
            ) : (
              ventas.map(v => (
                <tr key={v.id}>
                  <td>#{v.id}</td>
                  <td>{new Date(v.fecha).toLocaleString()}</td>
                  <td>${v.total}</td>
                  <td>{v.metodo_pago}</td>
                  <td>
                    <span className={`badge ${v.estado === 'cancelada' ? 'badge-danger' : 'badge-success'}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => setVerDetalle(v)}
                      >
                        Ver
                      </button>
                      <a 
                        href={pdfService.generarFactura(v.id)} 
                        target="_blank"
                        className="btn btn-sm btn-primary"
                      >
                        PDF
                      </a>
                      {v.estado !== 'cancelada' && (
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => cancelarVenta(v.id)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {verDetalle && (
        <div className="modal-overlay" onClick={() => setVerDetalle(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Venta #{verDetalle.id}</h3>
              <button onClick={() => setVerDetalle(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Fecha:</strong> {new Date(verDetalle.fecha).toLocaleString()}</p>
              <p><strong>Estado:</strong> {verDetalle.estado}</p>
              <p><strong>Método de pago:</strong> {verDetalle.metodo_pago}</p>
              
              <h4 style={{ marginTop: '1rem' }}>Productos</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {verDetalle.productos?.map((p, i) => (
                    <tr key={i}>
                      <td>{p.nombre}</td>
                      <td>{p.cantidad}</td>
                      <td>${p.precio}</td>
                      <td>${p.precio * p.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="pos-total-row pos-total" style={{ marginTop: '1rem' }}>
                <span>Total</span>
                <span>${verDetalle.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}