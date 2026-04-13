import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
};

export const productosService = {
  getAll: () => api.get('/productos'),
  getById: (id) => api.get(`/productos/${id}`),
  buscar: (q) => api.get(`/productos/buscar?q=${q}`),
  stockBajo: () => api.get('/productos/stock-bajo'),
  create: (data) => api.post('/productos', data),
  update: (id, data) => api.put(`/productos/${id}`, data),
  actualizarStock: (id, data) => api.put(`/productos/${id}/stock`, data),
  delete: (id) => api.delete(`/productos/${id}`)
};

export const clientesService = {
  getAll: () => api.get('/clientes'),
  getById: (id) => api.get(`/clientes/${id}`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  delete: (id) => api.delete(`/clientes/${id}`)
};

export const proveedoresService = {
  getAll: () => api.get('/proveedores'),
  getById: (id) => api.get(`/proveedores/${id}`),
  create: (data) => api.post('/proveedores', data),
  update: (id, data) => api.put(`/proveedores/${id}`, data),
  delete: (id) => api.delete(`/proveedores/${id}`)
};

export const ventasService = {
  getAll: () => api.get('/ventas'),
  getHoy: () => api.get('/ventas/hoy'),
  getById: (id) => api.get(`/ventas/${id}`),
  create: (data) => api.post('/ventas', data),
  cancelar: (id) => api.post(`/ventas/${id}/cancelar`)
};

export const cajasService = {
  getAbierta: () => api.get('/cajas/abierta'),
  apertura: (data) => api.post('/cajas/apertura', data),
  cierre: (id, data) => api.post(`/cajas/${id}/cierre`, data),
  historial: () => api.get('/cajas/historial')
};

export const statisticsService = {
  dashboard: (periodo = 'dia') => api.get(`/estadisticas/dashboard?periodo=${periodo}`),
  topProductos: (limite = 10, periodo = 'dia') => api.get(`/estadisticas/top-productos?limite=${limite}&periodo=${periodo}`),
  stockBajo: () => api.get('/estadisticas/stock-bajo'),
  ventasMetodoPago: (periodo = 'dia') => api.get(`/estadisticas/ventas-metodo-pago?periodo=${periodo}`)
};

export const pdfService = {
  generarFactura: (ventaId) => `${API_URL}/pdf/factura/${ventaId}`
};

export const depositosService = {
  getAll: () => api.get('/depositos'),
  getById: (id) => api.get(`/depositos/${id}`),
  create: (data) => api.post('/depositos', data),
  update: (id, data) => api.put(`/depositos/${id}`, data),
  delete: (id) => api.delete(`/depositos/${id}`),
  getInventario: (id) => api.get(`/depositos/${id}/inventario`)
};

export const lotesService = {
  getAll: (params) => api.get('/lotes', { params }),
  getById: (id) => api.get(`/lotes/${id}`),
  create: (data) => api.post('/lotes', data),
  update: (id, data) => api.put(`/lotes/${id}`, data),
  delete: (id) => api.delete(`/lotes/${id}`),
  getProximosVencer: () => api.get('/lotes/proximos-vencer'),
  ajustarStock: (id, data) => api.put(`/lotes/${id}/ajustar`, data)
};

export const seriesService = {
  getAll: (params) => api.get('/series', { params }),
  getById: (id) => api.get(`/series/${id}`),
  buscar: (numero_serie) => api.get(`/series/buscar/${numero_serie}`),
  create: (data) => api.post('/series', data),
  createLote: (data) => api.post('/series/lote', data),
  update: (id, data) => api.put(`/series/${id}`, data),
  delete: (id) => api.delete(`/series/${id}`),
  getDisponibles: (producto_id) => api.get('/series/disponibles', { params: { producto_id } }),
  transferir: (id, data) => api.put(`/series/${id}/transferir`, data)
};

export default api;