// routes/cajas.routes.js
const express = require('express');
const router = express.Router();
const cajasController = require('../controllers/cajas.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/abierta', authMiddleware, cajasController.getCajaAbierta);
router.post('/apertura', authMiddleware, cajasController.aperturaCaja);
router.post('/:id/cierre', authMiddleware, cajasController.cierreCaja);
router.get('/historial', authMiddleware, cajasController.getHistorialCajas);

module.exports = router;