const pool = require('../config/database');

const lotesController = {
    async getAll(req, res) {
        try {
            const { producto_id, deposito_id, proximos_vencer } = req.query;
            let query = `
                SELECT l.*, p.nombre as producto_nombre, p.codigo_barras,
                d.nombre as deposito_nombre
                FROM lotes l
                JOIN productos p ON l.producto_id = p.id
                LEFT JOIN depositos d ON l.deposito_id = d.id
                WHERE 1=1`;
            const params = [];
            let paramCount = 1;

            if (producto_id) {
                query += ` AND l.producto_id = $${paramCount++}`;
                params.push(producto_id);
            }
            if (deposito_id) {
                query += ` AND l.deposito_id = $${paramCount++}`;
                params.push(deposito_id);
            }
            if (proximos_vencer) {
                query += ` AND l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'`;
            }

            query += ` ORDER BY l.fecha_vencimiento ASC NULLS LAST`;
            
            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const result = await pool.query(`
                SELECT l.*, p.nombre as producto_nombre, d.nombre as deposito_nombre
                FROM lotes l
                JOIN productos p ON l.producto_id = p.id
                LEFT JOIN depositos d ON l.deposito_id = d.id
                WHERE l.id = $1`, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Lote no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req, res) {
        try {
            const { producto_id, codigo_lote, fecha_vencimiento, stock_actual, deposito_id } = req.body;
            const result = await pool.query(`
                INSERT INTO lotes (producto_id, codigo_lote, fecha_vencimiento, stock_actual, deposito_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [producto_id, codigo_lote, fecha_vencimiento, stock_actual || 0, deposito_id]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { codigo_lote, fecha_vencimiento, stock_actual, deposito_id } = req.body;
            const result = await pool.query(`
                UPDATE lotes 
                SET codigo_lote = $1, fecha_vencimiento = $2, stock_actual = $3, deposito_id = $4
                WHERE id = $5
                RETURNING *`,
                [codigo_lote, fecha_vencimiento, stock_actual, deposito_id, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Lote no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await pool.query('DELETE FROM lotes WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Lote no encontrado' });
            }
            res.json({ message: 'Lote eliminado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getProximosVencer(req, res) {
        try {
            const result = await pool.query(`
                SELECT l.*, p.nombre as producto_nombre, d.nombre as deposito_nombre
                FROM lotes l
                JOIN productos p ON l.producto_id = p.id
                LEFT JOIN depositos d ON l.deposito_id = d.id
                WHERE l.stock_actual > 0 
                AND l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
                AND l.fecha_vencimiento >= CURRENT_DATE
                ORDER BY l.fecha_vencimiento ASC`);
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async ajustarStock(req, res) {
        try {
            const { id } = req.params;
            const { stock_actual, motivo } = req.body;
            
            const result = await pool.query(`
                UPDATE lotes 
                SET stock_actual = $1
                WHERE id = $2
                RETURNING *`,
                [stock_actual, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Lote no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = lotesController;