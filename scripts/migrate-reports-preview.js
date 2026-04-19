/**
 * Añade la columna preview (TEXT) a la tabla reports si no existe.
 * Ejecutar desde la raíz del proyecto: node scripts/migrate-reports-preview.js
 */
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.PG_HOST || "localhost",
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "password",
    database: process.env.PG_DATABASE || "documents_bd",
    port: Number(process.env.PG_PORT) || 5432
});

async function run() {
    await pool.query(`
        ALTER TABLE reports
        ADD COLUMN IF NOT EXISTS preview TEXT;
    `);
    console.log("OK: columna reports.preview lista.");
    await pool.end();
}

run().catch((err) => {
    console.error("Error en migración:", err.message);
    process.exit(1);
});
