const{Pool}= require('pg');
const { get } = require('../routes/router');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'password',
    database: 'documents_bd',
    port: 5432
});

const getDocuments = async (req, res) => {
   const response = await pool.query('SELECT * FROM documents');
   res.json(response.rows);
   res.send('users');
}


const getDocumentById = async (req, res) => {
    const id = req.params.id
    const response = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    res.json(response.rows);
}

const createDocument = async (req, res) => {
    const {id,content} = req.body;

    const response = await pool.query('INSERT INTO documents (id, content) VALUES ($1, $2)',[id,content]);
    console.log(response);
    res.json({
        message: 'Document created successfully',
        body: {
            document: id,content
        }
    });
}

const deleteDocument = async (req, res) => {
    const id = req.params.id
    const response = await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    console.log(response);
    res.json(`Document with id ${id} deleted successfully`);
}

const updateDocument = async (req, res) => {
    const id = req.params.id
    const {content} = req.body;
    const response = await pool.query('UPDATE documents SET content = $1 WHERE id = $2', [content, id]);
    console.log(response);
    res.json(`Document with id ${id} updated successfully`);
}

module.exports = {
    getDocuments,
    createDocument,
    getDocumentById,
    deleteDocument,
    updateDocument
};