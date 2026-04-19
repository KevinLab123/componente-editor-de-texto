require('dotenv').config();

const express = require('express');
const {
    decryptRequestMiddleware,
    encryptResponseMiddleware
} = require('./middleware/apiCrypto');

const app = express();
const cors = require('cors');
app.use(cors());

//middlewares funciones ejecutadas antes de llegar a las rutas
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: false, limit: '200mb' }));

// Cifrado opcional del cuerpo/respuesta (sin headers no altera el comportamiento)
app.use(decryptRequestMiddleware);
app.use(encryptResponseMiddleware);

//routes
app.use(require('./routes/router'));

app.listen(3000);
console.log('Server is running on port 3000');
