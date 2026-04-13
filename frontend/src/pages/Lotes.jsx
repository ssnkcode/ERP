import { useState, useEffect } from 'react';
import { lotesService, productosService, depositosService } from '../services/api';

export default function Lotes() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ producto_id: '', deposito_id: '', proximos_vencer: false });
  const [productos, setProductos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [form, setForm] = useState({
    producto_id: '',
    codigo_lote: '',
    fecha_vencimiento: '',
    stock_actual: '',
    deposito_id: ''
  });

  useEffect(() => {
    loadData();
  }, [filtro]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotesRes, productosRes, depositosRes] = await Promise.all([
        lotesService.getAll(filtro),
        productosService.getAll(),
        depositosService.getAll()
      ]);
      setLotes(lotesRes.data);
      setProductos(productosRes.data);
      setDepositos(depositosRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        stock_actual: parseInt(form.stock_actual) || 0
      };
      if (editar) {
        await lotesService.update(editar, data);
      } else {
        await lotesService.create(data);
      }
      setMostrarModal(false);
      setEditar(null);
      setForm({ producto_id: '', codigo_lote: '', fecha_vencimiento: '', stock_actual: '', deposito_id: '' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEditar = (l) => {
    setEditar(l.id);
    setForm({
      producto_id: l.producto_id,
      codigo_lote: l.codigo_lote,
      fecha_vencimiento: l.fecha_vencimiento?.split('T')[0] || '',
      stock_actual: l.stock_actual,
      deposito_id: l.deposito_id || ''
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar lote?')) return;
    try {
      await lotesService.delete(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const getDaysUntilExpiry = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return dias;
  };

  const getBadgeClass = (dias) => {
    if (dias === null) return '';
    if (dias < 0) return 'badge-danger';
    if (dias <= 30) return 'badge-warning';
    return 'badge-success';
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Lotes</h1>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nuevo Lote
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: '1rem', gap: '0.5rem' }}>
        <select
          className="input"
          value={filtro.producto_id}
          onChange={(e) => setFiltro({ ...filtro, producto_id: e.target.value })}
        >
          <option value="">Todos los productos</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <select
          className="input"
          value={filtro.deposito_id}
          onChange={(e) => setFiltro({ ...filtro, deposito_id: e.target.value })}
        >
          <option value="">Todos los depósitos</option>
          {depositos.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        <button
          className={`btn ${filtro.proximos_vencer ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltro({ ...filtro, proximos_vencer: !filtro.proximos_vencer })}
        >
          Próximos a vencer
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Stock</th>
              <th>Deposito</th>
              <th>Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lotes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No hay lotes</td>
              </tr>
            ) : (
              lotes.map(l => {
                const dias = getDaysUntilExpiry(l.fecha_vencimiento);
                return (
                  <tr key={l.id}>
                    <td>{l.codigo_lote}</td>
                    <td>{l.producto_nombre}</td>
                    <td>{l.stock_actual}</td>
                    <td>{l.deposito_nombre || '-'}</td>
                    <td>
                      {l.fecha_vencimiento ? (
                        <span className={`badge ${getBadgeClass(dias)}`}>
                          {new Date(l.fecha_vencimiento).toLocaleDateString()} ({dias} días)
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEditar(l)}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(l.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => { setMostrarModal(false); setEditar(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editar ? 'Editar' : 'Nuevo'} Lote</h3>
              <button onClick={() => { setMostrarModal(false); setEditar(null); }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Producto *</label>
                <select
                  className="input"
                  value={form.producto_id}
                  onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Código Lote *</label>
                <input
                  type="text"
                  className="input"
                  value={form.codigo_lote}
                  onChange={(e) => setForm({ ...form, codigo_lote: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="input"
                    value={form.stock_actual}
                    onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Depósito</label>
                  <select
                    className="input"
                    value={form.deposito_id}
                    onChange={(e) => setForm({ ...form, deposito_id: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {depositos.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Vencimiento</label>
                <input
                  type="date"
                  className="input"
                  value={form.fecha_vencimiento}
                  onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}