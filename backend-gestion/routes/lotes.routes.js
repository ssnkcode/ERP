const express = require('express');
const router = express.Router();
const lotesController = require('../controllers/lotes.controller');

router.get('/', lotesController.getAll);
router.get('/proximos-vencer', lotesController.getProximosVencer);
router.get('/:id', lotesController.getById);
router.post('/', lotesController.create);
router.put('/:id', lotesController.update);
router.delete('/:id', lotesController.delete);
router.put('/:id/ajustar', lotesController.ajustarStock);

module.exports = router;