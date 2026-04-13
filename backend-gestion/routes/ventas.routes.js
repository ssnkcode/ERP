// routes/ventas.routes.js
const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');

router.get('/', ventasController.getVentas);
router.get('/hoy', ventasController.getVentasHoy);
router.get('/:id', ventasController.getVentaById);
router.post('/', ventasController.createVenta);
router.post('/:id/cancelar', ventasController.cancelarVenta);

module.exports = router;