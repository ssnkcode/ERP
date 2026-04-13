const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');

router.get('/dashboard', statisticsController.getDashboard);
router.get('/top-productos', statisticsController.getTopProductos);
router.get('/ventas-metodo-pago', statisticsController.getVentasPorMetodoPago);
router.get('/stock-bajo', statisticsController.getStockBajo);

module.exports = router;