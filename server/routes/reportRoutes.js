const express = require('express');
const router = express.Router();
const {
  generateExcelReport,
  generatePDFReport
} = require('../controllers/reportController');

// Rutas para reportes
router.get('/excel', generateExcelReport);
router.get('/pdf', generatePDFReport);

module.exports = router;