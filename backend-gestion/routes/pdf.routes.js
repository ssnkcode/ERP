// routes/pdf.routes.js
const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdf.controller');

router.get('/factura/:ventaId', pdfController.generarFacturaPDF);

module.exports = router;