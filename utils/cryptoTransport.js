const CryptoJS = require('crypto-js');

/**
 * Cifrado simétrico AES (formato OpenSSL de CryptoJS) para el cuerpo JSON en tránsito.
 * Misma lógica en cliente (navegador) si se usa el mismo secreto y crypto-js.
 */
function encryptJsonPayload(obj, secret) {
    return CryptoJS.AES.encrypt(JSON.stringify(obj), secret).toString();
}

function decryptJsonPayload(encString, secret) {
    const decrypted = CryptoJS.AES.decrypt(encString, secret).toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
        throw new Error('No se pudo descifrar el payload');
    }
    return JSON.parse(decrypted);
}

module.exports = {
    encryptJsonPayload,
    decryptJsonPayload
};
