// controllers/productos.controller.js
const pool = require('../config/database');

const productosController = {
    // Obtener todos los productos
    async getProductos(req, res) {
        try {
            const result = await pool.query(
                'SELECT * FROM productos WHERE activo = true ORDER BY id'
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Buscar productos (por código de barras o nombre)
    async buscarProductos(req, res) {
        const { q } = req.query;
        try {
            const result = await pool.query(
                `SELECT * FROM productos 
                 WHERE activo = true 
                 AND (codigo_barras ILIKE $1 OR nombre ILIKE $1)
                 LIMIT 20`,
                [`%${q}%`]
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener productos con stock bajo
    async getStockBajo(req, res) {
        try {
            const result = await pool.query(
                'SELECT * FROM productos_stock_bajo ORDER BY stock_actual ASC'
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener producto por ID
    async getProductoById(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'SELECT * FROM productos WHERE id = $1',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Crear nuevo producto
    async createProducto(req, res) {
        const {
            codigo_barras, nombre, descripcion, precio, costo,
            stock_actual, stock_minimo, stock_maximo, unidad_medida,
            ubicacion, proveedor_id
        } = req.body;

        try {
            const result = await pool.query(
                `INSERT INTO productos 
                 (codigo_barras, nombre, descripcion, precio, costo, 
                  stock_actual, stock_minimo, stock_maximo, unidad_medida, 
                  ubicacion, proveedor_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [codigo_barras, nombre, descripcion, precio, costo,
                 stock_actual || 0, stock_minimo || 5, stock_maximo,
                 unidad_medida || 'unidad', ubicacion, proveedor_id]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Actualizar producto
    async updateProducto(req, res) {
        const { id } = req.params;
        const updates = req.body;
        
        try {
            const setClause = Object.keys(updates)
                .map((key, idx) => `${key} = $${idx + 2}`)
                .join(', ');
            
            const values = [id, ...Object.values(updates)];
            
            const result = await pool.query(
                `UPDATE productos SET ${setClause} WHERE id = $1 RETURNING *`,
                values
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Actualizar stock específicamente
    async actualizarStock(req, res) {
        const { id } = req.params;
        const { cantidad, tipo } = req.body; // tipo: 'sumar', 'restar', 'set'

        try {
            let query;
            if (tipo === 'sumar') {
                query = `UPDATE productos SET stock_actual = stock_actual + $1 WHERE id = $2 RETURNING *`;
            } else if (tipo === 'restar') {
                query = `UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2 AND stock_actual >= $1 RETURNING *`;
            } else {
                query = `UPDATE productos SET stock_actual = $1 WHERE id = $2 RETURNING *`;
            }

            const result = await pool.query(query, [cantidad, id]);
            
            if (result.rows.length === 0) {
                return res.status(400).json({ error: 'Stock insuficiente o producto no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Eliminar producto (soft delete)
    async deleteProducto(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'UPDATE productos SET activo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ message: 'Producto eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = productosController;