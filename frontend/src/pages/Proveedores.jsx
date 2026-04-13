import { useState, useEffect } from 'react';
import { proveedoresService } from '../services/api';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
    contacto: ''
  });

  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    setLoading(true);
    try {
      const { data } = await proveedoresService.getAll();
      setProveedores(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buscar = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.documento?.includes(busqueda)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editar) {
        await proveedoresService.update(editar, form);
      } else {
        await proveedoresService.create(form);
      }
      setMostrarModal(false);
      setEditar(null);
      setForm({ nombre: '', documento: '', telefono: '', email: '', direccion: '', contacto: '' });
      loadProveedores();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEditar = (p) => {
    setEditar(p.id);
    setForm(p);
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar proveedor?')) return;
    try {
      await proveedoresService.delete(id);
      loadProveedores();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Proveedores</h1>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nuevo
        </button>
      </div>

      <input
        type="text"
        className="input"
        placeholder="Buscar proveedores..."
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
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {buscar.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.documento}</td>
                <td>{p.telefono}</td>
                <td>{p.email}</td>
                <td>{p.contacto}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEditar(p)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(p.id)}>
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
              <h3>{editar ? 'Editar' : 'Nuevo'} Proveedor</h3>
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
                <label className="form-label">Contacto</label>
                <input
                  type="text"
                  className="input"
                  value={form.contacto}
                  onChange={(e) => setForm({ ...form, contacto: e.target.value })}
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