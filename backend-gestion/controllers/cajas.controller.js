// controllers/cajas.controller.js
const pool = require('../config/database');

const cajasController = {
    async getCajaAbierta(req, res) {
        try {
            const result = await pool.query('SELECT * FROM caja_abierta_actual');
            res.json(result.rows[0] || null);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async aperturaCaja(req, res) {
        const { monto_inicial } = req.body;
        const usuario_id = req.user.id;
        
        try {
            const cajaAbierta = await pool.query('SELECT * FROM caja_abierta_actual');
            if (cajaAbierta.rows.length > 0) {
                return res.status(400).json({ error: 'Ya hay una caja abierta' });
            }
            
            const result = await pool.query(
                `INSERT INTO cajas (usuario_id, monto_inicial, estado)
                 VALUES ($1, $2, 'abierta')
                 RETURNING *`,
                [usuario_id, monto_inicial]
            );
            
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async cierreCaja(req, res) {
        const { id } = req.params;
        const { monto_final, notas_cierre } = req.body;
        
        try {
            // Obtener ventas del día de esta caja
            const ventasResult = await pool.query(
                `SELECT SUM(total) as total_ventas FROM ventas 
                 WHERE caja_id = $1 AND estado = 'completada'`,
                [id]
            );
            
            const cajaResult = await pool.query(
                'SELECT monto_inicial FROM cajas WHERE id = $1',
                [id]
            );
            
            const monto_inicial = cajaResult.rows[0].monto_inicial;
            const total_ventas = parseFloat(ventasResult.rows[0].total_ventas || 0);
            const monto_esperado = monto_inicial + total_ventas;
            const diferencia = monto_final - monto_esperado;
            
            const result = await pool.query(
                `UPDATE cajas 
                 SET fecha_cierre = CURRENT_TIMESTAMP,
                     monto_final = $1,
                     monto_esperado = $2,
                     diferencia = $3,
                     estado = 'cerrada',
                     notas_cierre = $4
                 WHERE id = $5 RETURNING *`,
                [monto_final, monto_esperado, diferencia, notas_cierre, id]
            );
            
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getHistorialCajas(req, res) {
        try {
            const result = await pool.query(
                `SELECT c.*, u.nombre as usuario_nombre
                 FROM cajas c
                 JOIN usuarios u ON c.usuario_id = u.id
                 ORDER BY c.fecha_apertura DESC
                 LIMIT 50`
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = cajasController;