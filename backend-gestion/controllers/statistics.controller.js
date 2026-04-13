const pool = require('../config/database');

const statisticsController = {
    async getDashboard(req, res) {
        const { periodo = 'dia' } = req.query;
        
        let fechaInicio;
        const now = new Date();
        
        if (periodo === 'dia') {
            fechaInicio = new Date(now.setHours(0, 0, 0, 0));
        } else if (periodo === 'semana') {
            fechaInicio = new Date(now.setDate(now.getDate() - 7));
        } else if (periodo === 'mes') {
            fechaInicio = new Date(now.setMonth(now.getMonth() - 1));
        } else {
            fechaInicio = new Date(now.setHours(0, 0, 0, 0));
        }

        try {
            const ventasStats = await pool.query(
                `SELECT 
                    COUNT(*) as total_ventas,
                    COALESCE(SUM(total), 0) as total_vendido,
                    COALESCE(SUM(subtotal), 0) as subtotal,
                    COALESCE(SUM(impuesto), 0) as impuesto
                 FROM ventas 
                 WHERE fecha >= $1 AND estado = 'completada'`,
                [fechaInicio]
            );

            const productosVendidos = await pool.query(
                `SELECT 
                    SUM(vd.cantidad) as total_items
                 FROM ventas_detalle vd
                 JOIN ventas v ON vd.venta_id = v.id
                 WHERE v.fecha >= $1 AND v.estado = 'completada'`,
                [fechaInicio]
            );

            const clientesNuevos = await pool.query(
                `SELECT COUNT(*) as clientes_nuevos
                 FROM clientes
                 WHERE created_at >= $1`,
                [fechaInicio]
            );

            const boxAbierta = await pool.query('SELECT * FROM caja_abierta_actual');

            res.json({
                periodo,
                ventas: {
                    cantidad: parseInt(ventasStats.rows[0].total_ventas),
                    total: parseFloat(ventasStats.rows[0].total_vendido),
                    subtotal: parseFloat(ventasStats.rows[0].subtotal),
                    impuesto: parseFloat(ventasStats.rows[0].impuesto)
                },
                productos_vendidos: parseInt(productosVendidos.rows[0].total_items || 0),
                clientes_nuevos: parseInt(clientesNuevos.rows[0].clientes_nuevos),
                caja_abierta: boxAbierta.rows[0] || null
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getTopProductos(req, res) {
        const { limite = 10, periodo = 'dia' } = req.query;
        
        let fechaInicio;
        const now = new Date();
        
        if (periodo === 'dia') {
            fechaInicio = new Date(now.setHours(0, 0, 0, 0));
        } else if (periodo === 'semana') {
            fechaInicio = new Date(now.setDate(now.getDate() - 7));
        } else if (periodo === 'mes') {
            fechaInicio = new Date(now.setMonth(now.getMonth() - 1));
        } else {
            fechaInicio = new Date(now.setHours(0, 0, 0, 0));
        }

        try {
            const result = await pool.query(
                `SELECT 
                    p.id,
                    p.codigo_barras,
                    p.nombre,
                    SUM(vd.cantidad) as cantidad_vendida,
                    SUM(vd.subtotal) as total_vendido
                 FROM ventas_detalle vd
                 JOIN ventas v ON vd.venta_id = v.id
                 JOIN productos p ON vd.producto_id = p.id
                 WHERE v.fecha >= $1 AND v.estado = 'completada'
                 GROUP BY p.id, p.codigo_barras, p.nombre
                 ORDER BY cantidad_vendida DESC
                 LIMIT $2`,
                [fechaInicio, limite]
            );

            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getVentasPorMetodoPago(req, res) {
        const { periodo = 'dia' } = req.query;
        
        let fechaInicio;
        const now = new Date();
        
        if (periodo === 'dia') {
            fechaInicio = new Date(now.setHours(0, 0, 0, 0));
        } else if (periodo === 'semana') {
            fechaInicio = new Date(now.setDate(now.getDate() - 7));
        } else if (periodo === 'mes') {
            fechaInicio = new Date(now.setMonth(now.getMonth() - 1));
        } else {
            fechaInicio = new Date(now.setHours(0, 0, 0, 0));
        }

        try {
            const result = await pool.query(
                `SELECT 
                    metodo_pago,
                    COUNT(*) as cantidad,
                    SUM(total) as total
                 FROM ventas 
                 WHERE fecha >= $1 AND estado = 'completada'
                 GROUP BY metodo_pago`,
                [fechaInicio]
            );

            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getStockBajo(req, res) {
        try {
            const result = await pool.query(
                `SELECT 
                    id,
                    codigo_barras,
                    nombre,
                    stock_actual,
                    stock_minimo,
                    ubicacion
                 FROM productos 
                 WHERE activo = true AND stock_actual <= stock_minimo
                 ORDER BY stock_actual ASC`
            );

            const total = result.rows.length;

            res.json({
                total,
                alert: total > 0,
                productos: result.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = statisticsController;