const pool = require('../config/database');

const depositosController = {
    async getAll(req, res) {
        try {
            const result = await pool.query(`
                SELECT d.*, 
                (SELECT COUNT(*) FROM productos WHERE deposito_id = d.id) as productos_count
                FROM depositos d
                WHERE d.activo = true
                ORDER BY d.nombre`);
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const result = await pool.query('SELECT * FROM depositos WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Depósito no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req, res) {
        try {
            const { nombre, direccion, observaciones, activo } = req.body;
            const result = await pool.query(`
                INSERT INTO depositos (nombre, direccion, observaciones, activo, creado_por)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [nombre, direccion, observaciones, activo !== false, req.usuario.id]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre, direccion, observaciones, activo } = req.body;
            const result = await pool.query(`
                UPDATE depositos 
                SET nombre = $1, direccion = $2, observaciones = $3, activo = $4, updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *`,
                [nombre, direccion, observaciones, activo, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Depósito no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await pool.query(
                'UPDATE depositos SET activo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Depósito no encontrado' });
            }
            res.json({ message: 'Depósito eliminado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getInventario(req, res) {
        try {
            const { id } = req.params;
            const result = await pool.query(`
                SELECT p.*, 
                COALESCE(SUM(CASE WHEN l.deposito_id = $1 THEN l.stock_actual ELSE 0 END), 0) as stock_deposito
                FROM productos p
                LEFT JOIN lotes l ON p.id = l.producto_id
                WHERE p.activo = true
                GROUP BY p.id
                ORDER BY p.nombre`, [id]);
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = depositosController;