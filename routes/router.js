const {Router} = require('express');

const router = Router();
const {getDocuments,createDocument,getDocumentById,deleteDocument,updateDocument} = require('../controllers/index.controller');

router.get('/documents' , getDocuments);
router.get('/documents/:id' , getDocumentById);
router.post('/documents', createDocument);
router.delete('/documents/:id', deleteDocument);
router.put('/documents/:id', updateDocument);

module.exports = router;
