import { useState, useEffect } from 'react';
import { cajasService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Cajas() {
  const { user } = useAuth();
  const [cajaActual, setCajaActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarApertura, setMostrarApertura] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [aperturaForm, setAperturaForm] = useState({ monto_inicial: '' });
  const [cierreForm, setCierreForm] = useState({ monto_final: '', observaciones: '' });

  useEffect(() => {
    loadCajas();
  }, []);

  const loadCajas = async () => {
    setLoading(true);
    try {
      const { data } = await cajasService.getAbierta();
      setCajaActual(data);
    } catch (error) {
      setCajaActual(null);
    }
    try {
      const { data } = await cajasService.historial();
      setHistorial(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const abrirCaja = async (e) => {
    e.preventDefault();
    try {
      await cajasService.apertura({ monto_inicial: parseFloat(aperturaForm.monto_inicial) });
      setMostrarApertura(false);
      setAperturaForm({ monto_inicial: '' });
      loadCajas();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al abrir caja');
    }
  };

  const cerrarCaja = async (e) => {
    e.preventDefault();
    try {
      await cajasService.cierre(cajaActual.id, {
        monto_final: parseFloat(cierreForm.monto_final),
        observaciones: cierreForm.observaciones
      });
      setMostrarCierre(false);
      setCierreForm({ monto_final: '', observaciones: '' });
      loadCajas();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al cerrar caja');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Cajas</h1>

      {cajaActual ? (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Caja Abierta</h3>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Apertura:</strong> ${cajaActual.monto_inicial}
          </p>
          <p>
            <strong>Usuario:</strong> {cajaActual.usuario?.nombre}
          </p>
          <p>
            <strong>Fecha:</strong> {new Date(cajaActual.fecha_apertura).toLocaleString()}
          </p>
          <button 
            className="btn btn-danger" 
            style={{ marginTop: '1rem' }}
            onClick={() => setMostrarCierre(true)}
          >
            Cerrar Caja
          </button>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <h3>Caja Cerrada</h3>
          <p style={{ marginTop: '0.5rem' }}>No hay caja abierta</p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1rem' }}
            onClick={() => setMostrarApertura(true)}
          >
            Abrir Caja
          </button>
        </div>
      )}

      <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Historial</h2>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Usuario</th>
              <th>Inicial</th>
              <th>Final</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  No hay historique
                </td>
              </tr>
            ) : (
              historial.map(c => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{new Date(c.fecha_apertura).toLocaleDateString()}</td>
                  <td>{c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleDateString() : '-'}</td>
                  <td>{c.usuario?.nombre}</td>
                  <td>${c.monto_inicial}</td>
                  <td>{c.monto_final ? `$${c.monto_final}` : '-'}</td>
                  <td>
                    <span className={`badge ${c.estado === 'abierta' ? 'badge-success' : 'badge-warning'}`}>
                      {c.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarApertura && (
        <div className="modal-overlay" onClick={() => setMostrarApertura(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Abrir Caja</h3>
              <button onClick={() => setMostrarApertura(false)}>×</button>
            </div>
            <form onSubmit={abrirCaja} className="modal-body">
              <div className="form-group">
                <label className="form-label">Monto Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={aperturaForm.monto_inicial}
                  onChange={(e) => setAperturaForm({ monto_inicial: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Abrir Caja
              </button>
            </form>
          </div>
        </div>
      )}

      {mostrarCierre && (
        <div className="modal-overlay" onClick={() => setMostrarCierre(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cerrar Caja</h3>
              <button onClick={() => setMostrarCierre(false)}>×</button>
            </div>
            <form onSubmit={cerrarCaja} className="modal-body">
              <div className="form-group">
                <label className="form-label">Monto Final</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={cierreForm.monto_final}
                  onChange={(e) => setCierreForm({ ...cierreForm, monto_final: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="input"
                  rows="3"
                  value={cierreForm.observaciones}
                  onChange={(e) => setCierreForm({ ...cierreForm, observaciones: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Cerrar Caja
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}