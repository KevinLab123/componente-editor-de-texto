const {Router} = require('express');

const router = Router();
const {getDocuments,createDocument,getDocumentById,deleteDocument,updateDocument,createReport,getReports,getReportById, deleteReport} = require('../controllers/index.controller');

router.get('/documents' , getDocuments);
router.get('/documents/:id' , getDocumentById);
router.post('/documents', createDocument);
router.delete('/documents/:id', deleteDocument);
router.put('/documents/:id', updateDocument);

// Rutas de Reportes
// Definimos el endpoint para crear reportes
router.post('/reports', createReport);
router.get('/reports' , getReports);
router.get('/reports/:id' , getReportById);
router.delete('/reports/:id', deleteReport)

module.exports = router;
