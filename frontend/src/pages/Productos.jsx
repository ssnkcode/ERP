import { useState, useEffect } from 'react';
import { productosService } from '../services/api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    precio: '',
    stock: '',
    stock_minimo: '',
    categoria: '',
    descripcion: ''
  });

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const { data } = await productosService.getAll();
      setProductos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buscar = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editar) {
        await productosService.update(editar, form);
      } else {
        await productosService.create(form);
      }
      setMostrarModal(false);
      setEditar(null);
      setForm({ nombre: '', codigo: '', precio: '', stock: '', stock_minimo: '', categoria: '', descripcion: '' });
      loadProductos();
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
    if (!confirm('¿Eliminar producto?')) return;
    try {
      await productosService.delete(id);
      loadProductos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Productos</h1>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nuevo
        </button>
      </div>

      <input
        type="text"
        className="input"
        placeholder="Buscar productos..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Stock Mín</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {buscar.map(p => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>${p.precio}</td>
                <td>
                  <span className={p.stock <= p.stock_minimo ? 'text-danger' : ''}>
                    {p.stock}
                  </span>
                </td>
                <td>{p.stock_minimo}</td>
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
              <h3>{editar ? 'Editar' : 'Nuevo'} Producto</h3>
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código</label>
                  <input
                    type="text"
                    className="input"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="input"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Mínimo</label>
                  <input
                    type="number"
                    className="input"
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <input
                  type="text"
                  className="input"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="input"
                  rows="3"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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