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
    const { id, content, name, font, department,header,footer,pageFormat,preview } = req.body;

    const response = await pool.query(
        `INSERT INTO documents (id, content, name, font, department,header,footer,pageFormat,preview)
         VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9)`,
        [id, content, name, font, department,header,footer,pageFormat,preview]
    );

    console.log(response);

    res.json({
        message: 'Document created successfully',
        body: {
            id,
            content,
            name,
            font,
            department,
            header,
            footer,
            pageFormat,
            preview
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
    const id = req.params.id;
    
    // Extraemos todos los campos que vienen del body
    const { 
        name, 
        content, 
        department, 
        font, 
        header, 
        footer, 
        pageformat, 
        preview 
    } = req.body;

    try {
        const query = `
            UPDATE documents 
            SET name = $1, 
                content = $2, 
                department = $3, 
                font = $4, 
                header = $5, 
                footer = $6, 
                pageformat = $7, 
                preview = $8
            WHERE id = $9
        `;

        const values = [
            name, 
            content, 
            department, 
            font, 
            header, 
            footer, 
            pageformat, 
            preview, 
            id
        ];

        const response = await pool.query(query, values);

        if (response.rowCount === 0) {
            return res.status(404).json({ message: "Plantilla no encontrada" });
        }

        res.json({ message: `Plantilla ${id} actualizada correctamente` });
        
    } catch (error) {
        console.error("Error en updateDocument:", error);
        res.status(500).json({ error: "Error interno del servidor al actualizar" });
    }
}

const createReport = async (req, res) => {
    const {
        id,
        baseTemplate,
        consecutive,
        header,
        content,
        footer,
        preview,
        state,
        created_by,
        reviewed_by
    } = req.body;

    try {
        const response = await pool.query(
            `INSERT INTO reports (
                id, "baseTemplate", consecutive, header, content, footer, preview,
                state, created_at, last_modification, created_by, reviewed_by
            )
             VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $9, $10
             ) RETURNING *`,
            [
                id,
                baseTemplate,
                consecutive,
                header,
                content,
                footer,
                preview ?? null,
                state ?? null,
                created_by ?? null,
                reviewed_by ?? null
            ]
        );

        console.log("Reporte creado:", response.rows[0]);

        res.status(201).json({
            message: 'Reporte registrado exitosamente',
            body: response.rows[0]
        });
    } catch (error) {
        console.error("Error al insertar en reports:", error);
        
        // Manejo básico de error por si el ID ya existe
        if (error.code === '23505') {
            return res.status(400).json({ message: `El ID ${id} ya existe.` });
        }

        res.status(500).json({
            message: 'Error en el servidor al crear el reporte',
            error: error.message
        });
    }
}

const getReports = async (req, res) => {
    try {
        // Consultamos todos los registros de la tabla reports
        // Usamos comillas dobles si quieres traer la columna con su nombre exacto
        const response = await pool.query('SELECT * FROM reports');
        
        // Enviamos el arreglo de objetos directamente
        res.status(200).json(response.rows);
    } catch (error) {
        console.error("Error al obtener reportes:", error);
        res.status(500).json({
            message: "Error al obtener la lista de reportes",
            error: error.message
        });
    }
};

const getReportById = async (req, res) => {
    const id = req.params.id;
    try {
        // Consultamos el reporte específico
        const response = await pool.query(
            'SELECT * FROM reports WHERE id = $1',[id]
        );

        if (response.rows.length === 0) {
            return res.status(404).json({ message: 'Reporte no encontrado' });
        }

        // Devolvemos el primer (y único) resultado
        res.json(response.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener el reporte',
            error: error.message
        });
    }
};

const deleteReport = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM reports WHERE id = $1', [id]);
        
        // Es vital responder con un JSON para que response.ok sea true en el frontend
        res.status(200).json({ 
            message: `Reporte ${id} eliminado correctamente`,
            rowCount: result.rowCount 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el reporte" });
    }
};

const updateReport = async (req, res) => {
    const id = req.params.id;
    const {
        baseTemplate,
        consecutive,
        header,
        content,
        footer,
        preview,
        state,
        reviewed_by
    } = req.body;

    try {
        const query = `
            UPDATE reports 
            SET "baseTemplate" = $1, 
                consecutive = $2, 
                header = $3, 
                content = $4, 
                footer = $5,
                preview = $6,
                state = $7,
                reviewed_by = $8,
                last_modification = CURRENT_TIMESTAMP
            WHERE id = $9
        `;

        const values = [
            baseTemplate,
            consecutive,
            header,
            content,
            footer,
            preview ?? null,
            state ?? null,
            reviewed_by ?? null,
            id
        ];

        const response = await pool.query(query, values);

        if (response.rowCount === 0) {
            return res.status(404).json({ message: "Reporte no encontrado" });
        }

        res.json({ message: `Reporte ${id} actualizado correctamente` });
        
    } catch (error) {
        // Esto es lo que imprimió el error en tu terminal
        console.error("Error en updateReport:", error); 
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

const getUsers = async (req, res) => {
    try {
        const response = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
        res.status(200).json(response.rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error al obtener la lista de usuarios" });
    }
};

const getUserById = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [id]);
        if (response.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(response.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el usuario' });
    }
};

const createUser = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const response = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
            [username, password, role]
        );
        res.status(201).json({
            message: 'Usuario creado exitosamente',
            body: response.rows[0]
        });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        if (error.code === '23505') { // Error de duplicado (si username es UNIQUE)
            return res.status(400).json({ message: `El nombre de usuario ${username} ya existe.` });
        }
        res.status(500).json({ message: 'Error en el servidor al crear el usuario' });
    }
};

const updateUser = async (req, res) => {
    const id = req.params.id;
    const { username, password, role } = req.body;
    try {
        const query = `
            UPDATE users 
            SET username = $1, 
                password = $2, 
                role = $3 
            WHERE id = $4
        `;
        const values = [username, password, role, id];
        const response = await pool.query(query, values);

        if (response.rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json({ message: `Usuario ${id} actualizado correctamente` });
    } catch (error) {
        console.error("Error en updateUser:", error);
        res.status(500).json({ error: "Error interno al actualizar usuario" });
    }
};

const deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json({ message: `Usuario ${id} eliminado correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el usuario" });
    }
};

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Buscamos el usuario por su nombre exacto
        const response = await pool.query(
            'SELECT id, username, password, role FROM users WHERE username = $1', 
            [username]
        );

        // 2. Si no hay filas, el usuario no existe
        if (response.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "El usuario no existe en el sistema." 
            });
        }

        const user = response.rows[0];

        // 3. Comparación directa (sin cifrado)
        if (user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: "La contraseña es incorrecta." 
            });
        }

        // 4. Si coincide, enviamos la información útil para el frontend
        res.status(200).json({
            success: true,
            message: "Acceso concedido",
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Error en el proceso de login:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error técnico en el servidor." 
        });
    }
};

module.exports = {
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
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    createUser,
    loginUser
};