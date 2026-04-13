// controllers/proveedores.controller.js
const pool = require('../config/database');

const proveedoresController = {
    async getProveedores(req, res) {
        try {
            const result = await pool.query(
                'SELECT * FROM proveedores WHERE activo = true ORDER BY id'
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getProveedorById(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'SELECT * FROM proveedores WHERE id = $1',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createProveedor(req, res) {
        const { nombre, ruc, telefono, email, direccion, contacto_nombre, contacto_telefono } = req.body;
        try {
            const result = await pool.query(
                `INSERT INTO proveedores 
                 (nombre, ruc, telefono, email, direccion, contacto_nombre, contacto_telefono)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [nombre, ruc, telefono, email, direccion, contacto_nombre, contacto_telefono]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateProveedor(req, res) {
        const { id } = req.params;
        const updates = req.body;
        try {
            const setClause = Object.keys(updates)
                .map((key, idx) => `${key} = $${idx + 2}`)
                .join(', ');
            
            const values = [id, ...Object.values(updates)];
            
            const result = await pool.query(
                `UPDATE proveedores SET ${setClause} WHERE id = $1 RETURNING *`,
                values
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteProveedor(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'UPDATE proveedores SET activo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            res.json({ message: 'Proveedor eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = proveedoresController;