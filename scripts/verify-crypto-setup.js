/**
 * Verifica que API_CRYPTO_SECRET y cryptoTransport funcionen (sin levantar el servidor).
 */
require('dotenv').config();
const { encryptJsonPayload, decryptJsonPayload } = require('../utils/cryptoTransport');

const secret = process.env.API_CRYPTO_SECRET;
if (!secret || secret.length < 16) {
    console.error('Falta API_CRYPTO_SECRET en .env (mínimo 16 caracteres).');
    process.exit(1);
}

const sample = { prueba: true, mensaje: 'Hola desde el cifrado' };
const enc = encryptJsonPayload(sample, secret);
const out = decryptJsonPayload(enc, secret);

if (JSON.stringify(sample) !== JSON.stringify(out)) {
    console.error('El descifrado no coincide con el original.');
    process.exit(1);
}

console.log('OK: cifrado/descifrado correcto con la clave del .env');
console.log('Ejemplo de payload cifrado (primeros 80 caracteres):', enc.slice(0, 80) + '...');
