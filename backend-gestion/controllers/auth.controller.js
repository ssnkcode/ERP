const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
    async register(req, res) {
        const { nombre, email, password, rol } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
        }

        try {
            const existingUser = await pool.query(
                'SELECT id FROM usuarios WHERE email = $1',
                [email]
            );
            
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const result = await pool.query(
                `INSERT INTO usuarios (nombre, email, password_hash, rol)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, nombre, email, rol, activo, created_at`,
                [nombre, email, passwordHash, rol || 'vendedor']
            );

            const user = result.rows[0];
            const token = jwt.sign(
                { id: user.id, nombre: user.nombre, rol: user.rol },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son requeridos' });
        }

        try {
            const result = await pool.query(
                'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const user = result.rows[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: user.id, nombre: user.nombre, rol: user.rol },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({
                message: 'Login exitoso',
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol
                },
                token
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getProfile(req, res) {
        try {
            const result = await pool.query(
                'SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = $1',
                [req.usuario.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = authController;