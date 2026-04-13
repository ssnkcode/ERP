// controllers/ventas.controller.js
const pool = require('../config/database');

const ventasController = {
    async getVentas(req, res) {
        try {
            const result = await pool.query(
                `SELECT v.*, u.nombre as usuario_nombre, c.nombre as cliente_nombre
                 FROM ventas v
                 LEFT JOIN usuarios u ON v.usuario_id = u.id
                 LEFT JOIN clientes c ON v.cliente_id = c.id
                 ORDER BY v.fecha DESC
                 LIMIT 100`
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getVentasHoy(req, res) {
        try {
            const result = await pool.query('SELECT * FROM ventas_hoy');
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getVentaById(req, res) {
        const { id } = req.params;
        try {
            const ventaResult = await pool.query(
                `SELECT v.*, u.nombre as usuario_nombre, c.nombre as cliente_nombre
                 FROM ventas v
                 LEFT JOIN usuarios u ON v.usuario_id = u.id
                 LEFT JOIN clientes c ON v.cliente_id = c.id
                 WHERE v.id = $1`,
                [id]
            );
            
            if (ventaResult.rows.length === 0) {
                return res.status(404).json({ error: 'Venta no encontrada' });
            }
            
            const detallesResult = await pool.query(
                `SELECT vd.*, p.nombre as producto_nombre, p.codigo_barras
                 FROM ventas_detalle vd
                 JOIN productos p ON vd.producto_id = p.id
                 WHERE vd.venta_id = $1`,
                [id]
            );
            
            res.json({
                venta: ventaResult.rows[0],
                detalles: detallesResult.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createVenta(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { cliente_id, metodo_pago, detalles, caja_id } = req.body;
            const usuario_id = req.usuario.id;
            
            // Generar folio único
            const folio = `FAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Calcular totales
            let subtotal = 0;
            for (const item of detalles) {
                subtotal += item.cantidad * item.precio_unitario;
            }
            const impuesto = subtotal * 0.16; // 16% IVA
            const total = subtotal + impuesto;
            
            // Insertar venta
            const ventaResult = await client.query(
                `INSERT INTO ventas 
                 (folio, usuario_id, cliente_id, subtotal, impuesto, total, metodo_pago, caja_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [folio, usuario_id, cliente_id || null, subtotal, impuesto, total, metodo_pago, caja_id]
            );
            
            const ventaId = ventaResult.rows[0].id;
            
            // Insertar detalles y actualizar stock
            for (const item of detalles) {
                await client.query(
                    `INSERT INTO ventas_detalle 
                     (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [ventaId, item.producto_id, item.cantidad, item.precio_unitario, item.cantidad * item.precio_unitario]
                );
                
                // Actualizar stock
                await client.query(
                    `UPDATE productos 
                     SET stock_actual = stock_actual - $1 
                     WHERE id = $2 AND stock_actual >= $1`,
                    [item.cantidad, item.producto_id]
                );
            }
            
            await client.query('COMMIT');
            
            res.status(201).json(ventaResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
        }
    },

    async cancelarVenta(req, res) {
        const { id } = req.params;
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Obtener detalles de la venta
            const detalles = await client.query(
                'SELECT * FROM ventas_detalle WHERE venta_id = $1',
                [id]
            );
            
            // Restaurar stock
            for (const item of detalles.rows) {
                await client.query(
                    'UPDATE productos SET stock_actual = stock_actual + $1 WHERE id = $2',
                    [item.cantidad, item.producto_id]
                );
            }
            
            // Cancelar venta
            const result = await client.query(
                'UPDATE ventas SET estado = $1 WHERE id = $2 RETURNING *',
                ['cancelada', id]
            );
            
            await client.query('COMMIT');
            res.json(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
        }
    }
};

module.exports = ventasController;