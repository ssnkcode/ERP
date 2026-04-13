const pool = require('../config/database');

const seriesController = {
    async getAll(req, res) {
        try {
            const { producto_id, deposito_id, estado } = req.query;
            let query = `
                SELECT s.*, p.nombre as producto_nombre, p.codigo_barras,
                d.nombre as deposito_nombre, prov.nombre as proveedor_nombre
                FROM series_producto s
                JOIN productos p ON s.producto_id = p.id
                LEFT JOIN depositos d ON s.deposito_id = d.id
                LEFT JOIN proveedores prov ON s.proveedor_id = prov.id
                WHERE 1=1`;
            const params = [];
            let paramCount = 1;

            if (producto_id) {
                query += ` AND s.producto_id = $${paramCount++}`;
                params.push(producto_id);
            }
            if (deposito_id) {
                query += ` AND s.deposito_id = $${paramCount++}`;
                params.push(deposito_id);
            }
            if (estado) {
                query += ` AND s.estado = $${paramCount++}`;
                params.push(estado);
            }

            query += ` ORDER BY s.fecha_ingreso DESC`;
            
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
                SELECT s.*, p.nombre as producto_nombre, d.nombre as deposito_nombre
                FROM series_producto s
                JOIN productos p ON s.producto_id = p.id
                LEFT JOIN depositos d ON s.deposito_id = d.id
                WHERE s.id = $1`, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Serie no encontrada' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async buscarPorSerie(req, res) {
        try {
            const { numero_serie } = req.params;
            const result = await pool.query(`
                SELECT s.*, p.nombre as producto_nombre
                FROM series_producto s
                JOIN productos p ON s.producto_id = p.id
                WHERE s.numero_serie ILIKE $1`, [`%${numero_serie}%`]);
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req, res) {
        try {
            const { producto_id, numero_serie, deposito_id, proveedor_id, costo } = req.body;
            const result = await pool.query(`
                INSERT INTO series_producto (producto_id, numero_serie, deposito_id, proveedor_id, costo)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [producto_id, numero_serie, deposito_id, proveedor_id, costo]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'El número de serie ya existe' });
            }
            res.status(500).json({ error: error.message });
        }
    },

    async createLote(req, res) {
        try {
            const { producto_id, series, deposito_id, proveedor_id, costo, fecha_ingreso } = req.body;
            
            if (!series || !Array.isArray(series)) {
                return res.status(400).json({ error: 'Debe ingresar un array de números de serie' });
            }

            const values = series.map(s => 
                `(${producto_id}, '${s}', ${deposito_id || 'NULL'}, ${proveedor_id || 'NULL'}, ${costo || 'NULL'})`
            ).join(',');

            const result = await pool.query(`
                INSERT INTO series_producto (producto_id, numero_serie, deposito_id, proveedor_id, costo)
                VALUES ${values}
                RETURNING id, numero_serie`);

            res.status(201).json({ message: `${result.rows.length} series creadas`, series: result.rows });
        } catch (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Uno o más números de serie ya existen' });
            }
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { deposito_id, estado, proveedor_id, costo } = req.body;
            const result = await pool.query(`
                UPDATE series_producto 
                SET deposito_id = $1, estado = $2, proveedor_id = $3, costo = $4, updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *`,
                [deposito_id, estado, proveedor_id, costo, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Serie no encontrada' });
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
                "UPDATE series_producto SET estado = 'baja', fecha_baja = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", 
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Serie no encontrada' });
            }
            res.json({ message: 'Serie dada de baja' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getDisponibles(req, res) {
        try {
            const { producto_id } = req.query;
            let query = `
                SELECT s.*, p.nombre as producto_nombre
                FROM series_producto s
                JOIN productos p ON s.producto_id = p.id
                WHERE s.estado = 'disponible'`;
            const params = [];

            if (producto_id) {
                query += ` AND s.producto_id = $1`;
                params.push(producto_id);
            }

            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async transferir(req, res) {
        try {
            const { id } = req.params;
            const { deposito_id, observaciones } = req.body;
            const result = await pool.query(`
                UPDATE series_producto 
                SET deposito_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *`,
                [deposito_id, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Serie no encontrada' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = seriesController;