// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const pool = require('./config/database');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar tablas y datos necesarios
const initDatabase = async () => {
    try {
        // Verificar si tabla depositos existe
        const tableCheck = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'depositos'
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log('Creando tablas...');
            
            // Tabla depositos
            await pool.query(`
                CREATE TABLE IF NOT EXISTS depositos (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    direccion TEXT,
                    observaciones TEXT,
                    activo BOOLEAN DEFAULT true,
                    creado_por INTEGER REFERENCES usuarios(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Agregar columnas a productos
            await pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS deposito_id INTEGER REFERENCES depositos(id)`);
            await pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS track_lotes BOOLEAN DEFAULT false`);
            await pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS track_series BOOLEAN DEFAULT false`);
            
            // Agregar columna a lotes
            await pool.query(`ALTER TABLE lotes ADD COLUMN IF NOT EXISTS deposito_id INTEGER REFERENCES depositos(id)`);
            
            // Tabla series_producto
            await pool.query(`
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
                )
            `);
            
            // Tabla movimientos_stock si no existe
            await pool.query(`
                CREATE TABLE IF NOT EXISTS movimientos_stock (
                    id SERIAL PRIMARY KEY,
                    producto_id INTEGER NOT NULL REFERENCES productos(id),
                    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
                    cantidad INTEGER NOT NULL,
                    stock_anterior INTEGER NOT NULL,
                    stock_nuevo INTEGER NOT NULL,
                    referencia_tipo VARCHAR(50),
                    referencia_id INTEGER,
                    usuario_id INTEGER REFERENCES usuarios(id),
                    notas TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Crear índice si no existe
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_series_producto_producto ON series_producto(producto_id)`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_series_producto_estado ON series_producto(estado)`);
            
            // Insertar depósito principal
            await pool.query(`INSERT INTO depositos (nombre, direccion) VALUES ('Depósito Principal', 'Principal') ON CONFLICT DO NOTHING`);
            
            console.log('Tablas creadas correctamente');
        }
        
        // Crear usuario admin si no existe
        const adminCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', ['admin@admin.com']);
        if (adminCheck.rows.length === 0) {
            const passwordHash = await bcrypt.hash('admin123', 10);
            await pool.query(
                `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)`,
                ['Administrador', 'admin@admin.com', passwordHash, 'admin']
            );
            console.log('Usuario admin creado: admin@admin.com / admin123');
        }
    } catch (error) {
        console.log('Error al inicializar base de datos:', error.message);
    }
};

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const clientesRoutes = require('./routes/clientes.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');
const ventasRoutes = require('./routes/ventas.routes');
const cajasRoutes = require('./routes/cajas.routes');
const pdfRoutes = require('./routes/pdf.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const depositosRoutes = require('./routes/depositos.routes');
const lotesRoutes = require('./routes/lotes.routes');
const seriesRoutes = require('./routes/series.routes');

// Importar middleware
const authMiddleware = require('./middlewares/auth.middleware');

// Usar rutas públicas
app.use('/api/auth', authRoutes);

// Usar rutas protegidas
app.use('/api/productos', authMiddleware, productosRoutes);
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/proveedores', authMiddleware, proveedoresRoutes);
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/cajas', authMiddleware, cajasRoutes);
app.use('/api/pdf', authMiddleware, pdfRoutes);
app.use('/api/estadisticas', authMiddleware, statisticsRoutes);
app.use('/api/depositos', authMiddleware, depositosRoutes);
app.use('/api/lotes', authMiddleware, lotesRoutes);
app.use('/api/series', authMiddleware, seriesRoutes);

const PORT = process.env.PORT || 3000;
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
});