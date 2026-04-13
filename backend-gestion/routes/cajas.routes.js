// routes/cajas.routes.js
const express = require('express');
const router = express.Router();
const cajasController = require('../controllers/cajas.controller');

router.get('/abierta', cajasController.getCajaAbierta);
router.post('/apertura', cajasController.aperturaCaja);
router.post('/:id/cierre', cajasController.cierreCaja);
router.get('/historial', cajasController.getHistorialCajas);

module.exports = router;