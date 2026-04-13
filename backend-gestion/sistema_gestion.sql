-- =============================================
-- 1. CREAR BASE DE DATOS
-- =============================================
CREATE DATABASE sistema_gestion;
\c sistema_gestion;

-- =============================================
-- 2. TABLAS PRINCIPALES
-- =============================================

-- Tabla de usuarios (con roles)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'vendedor', 'gerente')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ruc VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    puntos_acumulados INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    costo DECIMAL(10, 2) CHECK (costo >= 0),
    stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER,
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    ubicacion VARCHAR(50),
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_proveedor ON productos(proveedor_id);

-- Tabla de cajas (apertura/cierre)
CREATE TABLE cajas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    monto_inicial DECIMAL(10, 2) NOT NULL CHECK (monto_inicial >= 0),
    monto_final DECIMAL(10, 2),
    monto_esperado DECIMAL(10, 2),
    diferencia DECIMAL(10, 2),
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    notas_cierre TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(20) UNIQUE NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    impuesto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'mixto')),
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    caja_id INTEGER REFERENCES cajas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda de ventas por fecha
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_folio ON ventas(folio);

-- Tabla de detalle de ventas
CREATE TABLE ventas_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda rápida en detalle
CREATE INDEX idx_ventas_detalle_venta ON ventas_detalle(venta_id);
CREATE INDEX idx_ventas_detalle_producto ON ventas_detalle(producto_id);

-- =============================================
-- 3. TABLAS ADICIONALES PARA FUTURAS MEJORAS
-- =============================================

-- Trazabilidad de movimientos de stock
CREATE TABLE movimientos_stock (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    referencia_tipo VARCHAR(50), -- 'venta', 'compra', 'inventario'
    referencia_id INTEGER,
    usuario_id INTEGER REFERENCES usuarios(id),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_stock(created_at);

-- Tabla de lotes (para trazabilidad avanzada)
CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    codigo_lote VARCHAR(50) NOT NULL,
    fecha_vencimiento DATE,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para usuarios
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para productos
CREATE TRIGGER update_productos_updated_at 
    BEFORE UPDATE ON productos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para clientes
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar movimientos de stock
CREATE OR REPLACE FUNCTION registrar_movimiento_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.stock_actual != NEW.stock_actual THEN
        INSERT INTO movimientos_stock (
            producto_id, 
            tipo_movimiento, 
            cantidad, 
            stock_anterior, 
            stock_nuevo, 
            usuario_id
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.stock_actual > OLD.stock_actual THEN 'entrada'
                ELSE 'salida'
            END,
            ABS(NEW.stock_actual - OLD.stock_actual),
            OLD.stock_actual,
            NEW.stock_actual,
            NULL -- Se puede setear con un contexto de aplicación
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar movimientos de stock
CREATE TRIGGER trigger_movimientos_stock
    AFTER UPDATE OF stock_actual ON productos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_movimiento_stock();

-- =============================================
-- 5. DATOS DE PRUEBA (Opcional)
-- =============================================

-- Insertar usuario admin por defecto (contraseña: admin123)
INSERT INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Administrador', 'admin@sistema.com', '$2b$10$YourHashHere', 'admin');

-- Insertar proveedor de prueba
INSERT INTO proveedores (nombre, ruc, telefono, email) 
VALUES ('Proveedor Principal', '20123456789', '555-1234', 'ventas@proveedor.com');

-- Insertar cliente genérico (para ventas sin cliente registrado)
INSERT INTO clientes (nombre, documento, telefono) 
VALUES ('Cliente General', '999999999', '000000000');

-- Insertar productos de ejemplo
INSERT INTO productos (codigo_barras, nombre, precio, costo, stock_actual, stock_minimo, proveedor_id) 
VALUES 
('7501234567890', 'Producto Ejemplo 1', 100.00, 70.00, 50, 10, 1),
('7501234567891', 'Producto Ejemplo 2', 200.00, 140.00, 30, 5, 1),
('7501234567892', 'Producto Ejemplo 3', 150.00, 100.00, 20, 8, 1);

-- =============================================
-- 6. CONSULTAS ÚTILES PARA VALIDACIÓN
-- =============================================

-- Vista para productos con stock bajo
CREATE VIEW productos_stock_bajo AS
SELECT * FROM productos 
WHERE stock_actual <= stock_minimo AND activo = true;

-- Vista para ventas del día
CREATE VIEW ventas_hoy AS
SELECT * FROM ventas 
WHERE DATE(fecha) = CURRENT_DATE;

-- Vista para caja actual abierta
CREATE VIEW caja_abierta_actual AS
SELECT c.*, u.nombre as usuario_nombre
FROM cajas c
JOIN usuarios u ON c.usuario_id = u.id
WHERE c.estado = 'abierta'
ORDER BY c.fecha_apertura DESC
LIMIT 1;