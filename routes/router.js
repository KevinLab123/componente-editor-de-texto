const { Router } = require('express');
const router = Router();

// Importamos todas las funciones, incluyendo las nuevas de usuarios
const {
    getDocuments,
    createDocument,
    getDocumentById,
    deleteDocument,
    updateDocument,
    createReport,
    getReports,
    getReportById,
    deleteReport,
    updateReport,
    // Nuevas funciones de usuarios
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser //
} = require('../controllers/index.controller');

// --- Rutas de Documentos (Plantillas) ---
router.get('/documents', getDocuments);
router.get('/documents/:id', getDocumentById);
router.post('/documents', createDocument);
router.delete('/documents/:id', deleteDocument);
router.put('/documents/:id', updateDocument);

// --- Rutas de Reportes ---
router.post('/reports', createReport);
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.delete('/reports/:id', deleteReport);
router.put('/reports/:id', updateReport);

// --- Rutas de Usuarios ---
router.get('/users', getUsers);            // Listar todos los usuarios
router.get('/users/:id', getUserById);     // Obtener un usuario por ID
router.post('/users', createUser);         // Crear nuevo usuario
router.put('/users/:id', updateUser);      // Actualizar usuario
router.delete('/users/:id', deleteUser);   // Eliminar usuario
// --- Rutas de Autenticación ---
router.post('/login', loginUser);
module.exports = router;