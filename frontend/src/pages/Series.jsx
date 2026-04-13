import { useState, useEffect } from 'react';
import { seriesService, productosService, depositosService, proveedoresService } from '../services/api';

export default function Series() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ producto_id: '', deposito_id: '', estado: '' });
  const [productos, setProductos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarLote, setMostrarLote] = useState(false);
  const [form, setForm] = useState({
    producto_id: '',
    numero_serie: '',
    deposito_id: '',
    proveedor_id: '',
    costo: ''
  });
  const [seriesArray, setSeriesArray] = useState([]);

  useEffect(() => {
    loadData();
  }, [filtro]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [seriesRes, productosRes, depositosRes, proveedoresRes] = await Promise.all([
        seriesService.getAll(filtro),
        productosService.getAll(),
        depositosService.getAll(),
        proveedoresService.getAll()
      ]);
      setSeries(seriesRes.data);
      setProductos(productosRes.data);
      setDepositos(depositosRes.data);
      setProveedores(proveedoresRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await seriesService.create(form);
      setMostrarModal(false);
      setForm({ producto_id: '', numero_serie: '', deposito_id: '', proveedor_id: '', costo: '' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleSubmitLote = async (e) => {
    e.preventDefault();
    try {
      const parsed = seriesArray.map(s => s.trim()).filter(s => s);
      if (parsed.length === 0) {
        return alert('Ingrese al menos un número de serie');
      }
      await seriesService.createLote({
        producto_id: form.producto_id,
        series: parsed,
        deposito_id: form.deposito_id,
        proveedor_id: form.proveedor_id,
        costo: form.costo
      });
      setMostrarLote(false);
      setMostrarModal(false);
      setForm({ producto_id: '', numero_serie: '', deposito_id: '', proveedor_id: '', costo: '' });
      setSeriesArray([]);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Dar de baja esta serie?')) return;
    try {
      await seriesService.delete(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al dar de baja');
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'disponible': return 'badge-success';
      case 'vendido': return 'badge-warning';
      case 'utilizado': return 'badge-danger';
      case 'baja': return 'badge-danger';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Series</h1>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nueva Serie
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
        <select
          className="input"
          value={filtro.estado}
          onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}
        >
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="vendido">Vendido</option>
          <option value="utilizado">Utilizado</option>
          <option value="baja">Dado de baja</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Número de Serie</th>
              <th>Producto</th>
              <th>Depósito</th>
              <th>Estado</th>
              <th>Ingreso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {series.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No hay series</td>
              </tr>
            ) : (
              series.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.numero_serie}</td>
                  <td>{s.producto_nombre}</td>
                  <td>{s.deposito_nombre || '-'}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(s.estado)}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td>{new Date(s.fecha_ingreso).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      {s.estado === 'disponible' && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(s.id)}>
                          Dar baja
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

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => { setMostrarModal(false); setMostrarLote(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Serie</h3>
              <button onClick={() => { setMostrarModal(false); setMostrarLote(false); }}>×</button>
            </div>
            {!mostrarLote ? (
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
                  <label className="form-label">Número de Serie *</label>
                  <input
                    type="text"
                    className="input"
                    value={form.numero_serie}
                    onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Depósito</label>
                    <select
                      className="input"
                      value={form.deposito_id}
                      onChange={(e) => setForm({ ...form, deposito_id: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {depositos.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.costo}
                      onChange={(e) => setForm({ ...form, costo: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-block">Guardar</button>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => setMostrarLote(true)}
                >
                  + Importar varias series
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitLote} className="modal-body">
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
                  <label className="form-label">Números de Serie (uno por línea) *</label>
                  <textarea
                    className="input"
                    rows="8"
                    placeholder="IMEI123456789&#10;IMEI123456790&#10;IMEI123456791"
                    value={seriesArray.join('\n')}
                    onChange={(e) => setSeriesArray(e.target.value.split('\n'))}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Depósito</label>
                    <select
                      className="input"
                      value={form.deposito_id}
                      onChange={(e) => setForm({ ...form, deposito_id: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {depositos.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.costo}
                      onChange={(e) => setForm({ ...form, costo: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  Importar {seriesArray.filter(s => s.trim()).length} series
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => setMostrarLote(false)}
                >
                  Volver
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}