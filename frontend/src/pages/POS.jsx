import { useState, useEffect, useRef } from 'react';
import { productosService, ventasService, clientesService, cajasService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function POS() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [clienteModal, setClienteModal] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const inputRef = useRef(null);
  const barcodeRef = useRef(null);

  useEffect(() => {
    verificarCaja();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (busqueda.length >= 2) {
      buscarProductos();
    }
  }, [busqueda]);

  const verificarCaja = async () => {
    try {
      const { data } = await cajasService.getAbierta();
      setCajaAbierta(!!data);
    } catch (error) {
      setCajaAbierta(false);
    } finally {
      setLoading(false);
    }
  };

  const buscarProductos = async () => {
    try {
      const { data } = await productosService.buscar(busqueda);
      setProductos(data.slice(0, 20));
    } catch (error) {
      console.error(error);
    }
  };

  const agregarProducto = (producto) => {
    const existe = carrito.find(p => p.id === producto.id);
    if (existe) {
      if (existe.cantidad < producto.stock) {
        setCarrito(carrito.map(p => 
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        ));
      }
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    setBusqueda('');
    setProductos([]);
    inputRef.current?.focus();
  };

  const actualizarCantidad = (id, cantidad) => {
    if (cantidad < 1) {
      setCarrito(carrito.filter(p => p.id !== id));
    } else {
      setCarrito(carrito.map(p => p.id === id ? { ...p, cantidad } : p));
    }
  };

  const quitarProducto = (id) => {
    setCarrito(carrito.filter(p => p.id !== id));
  };

  const subtotal = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  const descuento = 0;
  const total = subtotal - descuento;

  const cambio = parseFloat(montoRecibido) - total;

  const handleBarcode = async (e) => {
    if (e.key === 'Enter' && busqueda) {
      try {
        const { data } = await productosService.buscar(busqueda);
        if (data.length > 0) {
          agregarProducto(data[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const buscarClientes = async () => {
    if (busquedaCliente.length >= 2) {
      try {
        const { data } = await clientesService.getAll();
        const filtrados = data.filter(c => 
          c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
          c.documento?.includes(busquedaCliente)
        );
        setClientes(filtrados.slice(0, 10));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const seleccionarCliente = (c) => {
    setCliente(c);
    setClienteModal(false);
    setBusquedaCliente('');
  };

  const completarVenta = async () => {
    if (carrito.length === 0) return;
    if (metodoPago !== 'cuenta' && cambio < 0) return;

    setProcesando(true);
    try {
      const { data: cajaAbierta } = await cajasService.getAbierta();
      await ventasService.create({
        detalles: carrito.map(p => ({ 
          producto_id: p.id, 
          cantidad: p.cantidad, 
          precio_unitario: p.precio 
        })),
        cliente_id: cliente?.id,
        metodo_pago: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : total,
        caja_id: cajaAbierta?.id
      });
      setCarrito([]);
      setCliente(null);
      setMontoRecibido('');
      alert('Venta completada!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al procesar venta');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  if (!cajaAbierta) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: 'var(--warning)' }}>Caja cerrada</h2>
          <p style={{ margin: '1rem 0' }}>Debes abrir la caja para vender</p>
          <a href="/cajas" className="btn btn-primary">Ir a Cajas</a>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container">
      <div className="pos-productos">
        <div className="pos-busqueda">
          <input
            ref={inputRef}
            type="text"
            className="input"
            placeholder="Buscar producto o escanear código de barras..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleBarcode}
          />
          <button 
            className="btn btn-secondary pos-barcode"
            onClick={() => barcodeRef.current?.focus()}
            title="Escanear"
          >
            ⊕
          </button>
          <input
            ref={barcodeRef}
            type="text"
            className="input"
            placeholder="Código de barras"
            style={{ display: 'none' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setBusqueda(e.target.value);
              }
            }}
          />
        </div>

        {productos.length > 0 && (
          <div className="pos-resultados">
            {productos.map(p => (
              <button
                key={p.id}
                className="pos-producto-item"
                onClick={() => agregarProducto(p)}
                disabled={p.stock <= 0}
              >
                <span className="pos-producto-nombre">{p.nombre}</span>
                <span className="pos-producto-precio">${p.precio}</span>
                <span className="pos-producto-stock">{p.stock}u</span>
              </button>
            ))}
          </div>
        )}

        <div className="pos-productos-grid">
          {carrito.length === 0 ? (
            <div className="pos-empty">
              Busca un producto para agregar
            </div>
          ) : (
            carrito.map(p => (
              <div key={p.id} className="pos-carrito-item">
                <div className="pos-carrito-info">
                  <span className="pos-carrito-nombre">{p.nombre}</span>
                  <span className="pos-carrito-precio">${p.precio} c/u</span>
                </div>
                <div className="pos-carrito-cantidad">
                  <button 
                    className="pos-cantidad-btn"
                    onClick={() => actualizarCantidad(p.id, p.cantidad - 1)}
                  >
                    −
                  </button>
                  <span>{p.cantidad}</span>
                  <button 
                    className="pos-cantidad-btn"
                    onClick={() => actualizarCantidad(p.id, p.cantidad + 1)}
                    disabled={p.cantidad >= p.stock}
                  >
                    +
                  </button>
                </div>
                <span className="pos-carrito-subtotal">${p.precio * p.cantidad}</span>
                <button 
                  className="pos-carrito-quitar"
                  onClick={() => quitarProducto(p.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pos-resumen">
        <div className="pos-cliente">
          {cliente ? (
            <div className="pos-cliente-seleccionado">
              <span>{cliente.nombre}</span>
              <button onClick={() => setCliente(null)}>×</button>
            </div>
          ) : (
            <button 
              className="btn btn-secondary btn-block"
              onClick={() => setClienteModal(true)}
            >
              + Cliente
            </button>
          )}
        </div>

        <div className="pos-totales">
          <div className="pos-total-row">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          {descuento > 0 && (
            <div className="pos-total-row pos-descuento">
              <span>Descuento</span>
              <span>-${descuento.toLocaleString()}</span>
            </div>
          )}
          <div className="pos-total-row pos-total">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>

        <div className="pos-metodos">
          <label className="form-label">Método de pago</label>
          <div className="pos-metodos-grid">
            <button
              className={`pos-metodo-btn ${metodoPago === 'efectivo' ? 'active' : ''}`}
              onClick={() => setMetodoPago('efectivo')}
            >
              Efectivo
            </button>
            <button
              className={`pos-metodo-btn ${metodoPago === 'transferencia' ? 'active' : ''}`}
              onClick={() => setMetodoPago('transferencia')}
            >
              Transferencia
            </button>
            <button
              className={`pos-metodo-btn ${metodoPago === 'tarjeta' ? 'active' : ''}`}
              onClick={() => setMetodoPago('tarjeta')}
            >
              Tarjeta
            </button>
            <button
              className={`pos-metodo-btn ${metodoPago === 'cuenta' ? 'active' : ''}`}
              onClick={() => setMetodoPago('cuenta')}
            >
              Cuenta
            </button>
          </div>
        </div>

        {metodoPago === 'efectivo' && (
          <div className="pos-efectivo">
            <label className="form-label">Monto recibido</label>
            <input
              type="number"
              className="input"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              placeholder="0"
            />
            {montoRecibido && cambio >= 0 && (
              <div className="pos-cambio">
                Cambio: ${cambio.toLocaleString()}
              </div>
            )}
          </div>
        )}

        <button
          className="btn btn-primary btn-block pos-vender"
          onClick={completarVenta}
          disabled={procesando || carrito.length === 0 || (metodoPago === 'efectivo' && cambio < 0)}
        >
          {procesando ? 'Procesando...' : `Vender $${total.toLocaleString()}`}
        </button>
      </div>

      {clienteModal && (
        <div className="modal-overlay" onClick={() => setClienteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Seleccionar Cliente</h3>
              <button onClick={() => setClienteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="input"
                placeholder="Buscar cliente..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  buscarClientes();
                }}
              />
              <div className="modal-lista">
                {clientes.map(c => (
                  <button
                    key={c.id}
                    className="modal-item"
                    onClick={() => seleccionarCliente(c)}
                  >
                    <span>{c.nombre}</span>
                    <span>{c.documento}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}