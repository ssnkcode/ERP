// controllers/clientes.controller.js
const pool = require('../config/database');

const clientesController = {
    async getClientes(req, res) {
        try {
            const result = await pool.query(
                'SELECT * FROM clientes WHERE activo = true ORDER BY id'
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getClienteById(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'SELECT * FROM clientes WHERE id = $1',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createCliente(req, res) {
        const { nombre, documento, telefono, email, direccion } = req.body;
        try {
            const result = await pool.query(
                `INSERT INTO clientes (nombre, documento, telefono, email, direccion)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [nombre, documento, telefono, email, direccion]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateCliente(req, res) {
        const { id } = req.params;
        const { nombre, documento, telefono, email, direccion } = req.body;
        try {
            const result = await pool.query(
                `UPDATE clientes 
                 SET nombre = $1, documento = $2, telefono = $3, email = $4, direccion = $5
                 WHERE id = $6 RETURNING *`,
                [nombre, documento, telefono, email, direccion, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteCliente(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'UPDATE clientes SET activo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            res.json({ message: 'Cliente eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = clientesController;