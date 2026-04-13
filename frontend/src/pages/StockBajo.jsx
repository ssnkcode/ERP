import { useState, useEffect } from 'react';
import { productosService, statisticsService } from '../services/api';

export default function StockBajo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const { data } = await productosService.stockBajo();
      setProductos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarStock = async (id, nuevoStock) => {
    try {
      await productosService.actualizarStock(id, { stock: nuevoStock });
      loadProductos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al actualizar stock');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Stock Bajo</h1>

      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="card stats-card">
          <h3>Productos</h3>
          <p className="stats-value">{productos.length}</p>
          <p className="stats-label">con stock bajo</p>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Diferencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No hay productos con stock bajo
                </td>
              </tr>
            ) : (
              productos.map(p => (
                <tr key={p.id} style={{ background: 'rgba(220, 38, 38, 0.05)' }}>
                  <td>{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>
                    <span className="badge badge-danger">{p.stock}</span>
                  </td>
                  <td>{p.stock_minimo}</td>
                  <td>
                    <span className={p.stock < p.stock_minimo ? 'text-danger' : 'text-warning'}>
                      {p.stock - p.stock_minimo}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const nuevoStock = prompt('Nuevo stock:', p.stock);
                        if (nuevoStock && !isNaN(nuevoStock)) {
                          actualizarStock(p.id, parseInt(nuevoStock));
                        }
                      }}
                    >
                      Atualizar Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}