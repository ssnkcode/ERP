import { useState, useEffect } from 'react';
import { depositosService } from '../services/api';

export default function Depositos() {
  const [depositos, setDepositos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [form, setForm] = useState({ nombre: '', direccion: '', observaciones: '' });

  useEffect(() => {
    loadDepositos();
  }, []);

  const loadDepositos = async () => {
    setLoading(true);
    try {
      const { data } = await depositosService.getAll();
      setDepositos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editar) {
        await depositosService.update(editar, form);
      } else {
        await depositosService.create(form);
      }
      setMostrarModal(false);
      setEditar(null);
      setForm({ nombre: '', direccion: '', observaciones: '' });
      loadDepositos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEditar = (d) => {
    setEditar(d.id);
    setForm(d);
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar depósito?')) return;
    try {
      await depositosService.delete(id);
      loadDepositos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Depósitos</h1>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nuevo
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {depositos.map(d => (
          <div key={d.id} className="card">
            <h3>{d.nombre}</h3>
            {d.direccion && <p style={{ marginTop: '0.5rem', color: 'var(--text)' }}>{d.direccion}</p>}
            <p style={{ marginTop: '0.5rem' }}>
              <span className="badge badge-success">{d.productos_count || 0} productos</span>
            </p>
            <div className="table-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => handleEditar(d)}>
                Editar
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(d.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {depositos.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            No hay depósitos. Crea el primero.
          </div>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => { setMostrarModal(false); setEditar(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editar ? 'Editar' : 'Nuevo'} Depósito</h3>
              <button onClick={() => { setMostrarModal(false); setEditar(null); }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <textarea
                  className="input"
                  rows="2"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="input"
                  rows="2"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}