import { useState, useEffect } from 'react';
import { clientesService } from '../services/api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const { data } = await clientesService.getAll();
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buscar = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.documento?.includes(busqueda)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editar) {
        await clientesService.update(editar, form);
      } else {
        await clientesService.create(form);
      }
      setMostrarModal(false);
      setEditar(null);
      setForm({ nombre: '', documento: '', telefono: '', email: '', direccion: '' });
      loadClientes();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEditar = (c) => {
    setEditar(c.id);
    setForm(c);
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
      await clientesService.delete(id);
      loadClientes();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nuevo
        </button>
      </div>

      <input
        type="text"
        className="input"
        placeholder="Buscar clientes..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {buscar.map(c => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.documento}</td>
                <td>{c.telefono}</td>
                <td>{c.email}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEditar(c)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(c.id)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => { setMostrarModal(false); setEditar(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editar ? 'Editar' : 'Nuevo'} Cliente</h3>
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
                <label className="form-label">Documento</label>
                <input
                  type="text"
                  className="input"
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="input"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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