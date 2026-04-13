const express = require('express');
const router = express.Router();
const depositosController = require('../controllers/depositos.controller');

router.get('/', depositosController.getAll);
router.get('/:id', depositosController.getById);
router.post('/', depositosController.create);
router.put('/:id', depositosController.update);
router.delete('/:id', depositosController.delete);
router.get('/:id/inventario', depositosController.getInventario);

module.exports = router;