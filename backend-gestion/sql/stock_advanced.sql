-- =============================================
-- TABLAS PARA CONTROL DE STOCK AVANZADO
-- =============================================

-- Tabla de depósitos/almacenes
CREATE TABLE IF NOT EXISTS depositos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    creado_por INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de números de serie
CREATE TABLE IF NOT EXISTS series_producto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    deposito_id INTEGER REFERENCES depositos(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'vendido', 'utilizado', 'baja')),
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
    costo DECIMAL(10, 2),
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_baja TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- agregar deposito_id a productos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'deposito_id') THEN
        ALTER TABLE productos ADD COLUMN deposito_id INTEGER REFERENCES depositos(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'track_lotes') THEN
        ALTER TABLE productos ADD COLUMN track_lotes BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'track_series') THEN
        ALTER TABLE productos ADD COLUMN track_series BOOLEAN DEFAULT false;
    END IF;
END $$;

-- agregar deposito_id a lotes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes' AND column_name = 'deposito_id') THEN
        ALTER TABLE lotes ADD COLUMN deposito_id INTEGER REFERENCES depositos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Tabla de movimientos entre depósitos
CREATE TABLE IF NOT EXISTS movimientos_deposito (
    id SERIAL PRIMARY KEY,
    deposito_origen_id INTEGER NOT NULL REFERENCES depositos(id),
    deposito_destino_id INTEGER NOT NULL REFERENCES depositos(id),
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    numero_lote VARCHAR(50),
    numero_serie VARCHAR(100),
    usuario_id INTEGER REFERENCES usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar depósito principal si no existe
INSERT INTO depositos (nombre, direccion) 
SELECT 'Depósito Principal', 'Dirección Principal'
WHERE NOT EXISTS (SELECT 1 FROM depositos WHERE nombre = 'Depósito Principal');

-- Indices
CREATE INDEX IF NOT EXISTS idx_series_producto ON series_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_series_estado ON series_producto(estado);
CREATE INDEX IF NOT EXISTS idx_series_serie ON series_producto(numero_serie);
CREATE INDEX IF NOT EXISTS idx_lotes_producto ON lotes(producto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_fecha ON lotes(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_deposito ON movimientos_deposito(deposito_origen_id, deposito_destino_id);