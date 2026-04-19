const { encryptJsonPayload, decryptJsonPayload } = require('../utils/cryptoTransport');

const HEADER_PAYLOAD_ENCRYPTED = 'x-payload-encrypted';
const HEADER_ENCRYPT_RESPONSE = 'x-encrypt-response';

function getSecret() {
    const s = process.env.API_CRYPTO_SECRET;
    if (!s || String(s).length < 16) {
        return null;
    }
    return String(s);
}

/**
 * Si el cliente envía el header x-payload-encrypted: 1 y el body { "enc": "..." },
 * reemplaza req.body por el JSON descifrado. Sin ese header, no hace nada.
 */
function decryptRequestMiddleware(req, res, next) {
    if (req.get(HEADER_PAYLOAD_ENCRYPTED) !== '1') {
        return next();
    }

    const secret = getSecret();
    if (!secret) {
        return res.status(503).json({
            error: 'Cifrado no disponible',
            message: 'Defina API_CRYPTO_SECRET en el entorno (mínimo 16 caracteres).'
        });
    }

    const enc = req.body && typeof req.body.enc === 'string' ? req.body.enc : null;
    if (!enc) {
        return res.status(400).json({
            error: 'Cuerpo cifrado inválido',
            message: 'Se espera un objeto JSON con la propiedad "enc" (string).'
        });
    }

    try {
        req.body = decryptJsonPayload(enc, secret);
        console.log(
            '[apiCrypto] Descifrado OK →',
            req.method,
            req.originalUrl || req.url,
            `(payload ${enc.length} chars)`
        );
        return next();
    } catch (e) {
        console.warn('[apiCrypto] Error al descifrar:', req.method, req.originalUrl || req.url, e.message);
        return res.status(400).json({
            error: 'Error al descifrar',
            message: e.message
        });
    }
}

/**
 * Si el cliente pide x-encrypt-response: 1, intercepta res.json y devuelve { enc: "..." }.
 */
function encryptResponseMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function wrapJson(body) {
        if (req.get(HEADER_ENCRYPT_RESPONSE) !== '1') {
            return originalJson(body);
        }

        const secret = getSecret();
        if (!secret) {
            return originalJson({
                error: 'Cifrado no disponible',
                message: 'Defina API_CRYPTO_SECRET en el entorno (mínimo 16 caracteres).'
            });
        }

        try {
            const enc = encryptJsonPayload(body, secret);
            console.log(
                '[apiCrypto] Cifrado OK →',
                req.method,
                req.originalUrl || req.url,
                `(salida ${enc.length} chars)`
            );
            return originalJson({ enc });
        } catch (e) {
            console.error('[apiCrypto] Error al cifrar respuesta:', req.method, req.originalUrl || req.url, e.message);
            return originalJson({
                error: 'Error al cifrar la respuesta',
                message: e.message
            });
        }
    };
    next();
}

module.exports = {
    decryptRequestMiddleware,
    encryptResponseMiddleware,
    HEADER_PAYLOAD_ENCRYPTED,
    HEADER_ENCRYPT_RESPONSE
};
