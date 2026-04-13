const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/series.controller');

router.get('/', seriesController.getAll);
router.get('/disponibles', seriesController.getDisponibles);
router.get('/buscar/:numero_serie', seriesController.buscarPorSerie);
router.get('/:id', seriesController.getById);
router.post('/', seriesController.create);
router.post('/lote', seriesController.createLote);
router.put('/:id', seriesController.update);
router.delete('/:id', seriesController.delete);
router.put('/:id/transferir', seriesController.transferir);

module.exports = router;