// routes/productos.routes.js
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

router.get('/', productosController.getProductos);
router.get('/buscar', productosController.buscarProductos);
router.get('/stock-bajo', productosController.getStockBajo);
router.get('/:id', productosController.getProductoById);
router.post('/', productosController.createProducto);
router.put('/:id', productosController.updateProducto);
router.put('/:id/stock', productosController.actualizarStock);
router.delete('/:id', productosController.deleteProducto);

module.exports = router;