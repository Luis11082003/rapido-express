const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DBHOST || 'localhost',
    user: process.env.DBUSER || 'root',
    password: process.env.DBPASSWORD || '1108',
    database: process.env.DBNAME || 'rapido_express',
    port: process.env.DBPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    ssl: process.env.NODEENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        console.log('🔧 Configuración usada:', {
            host: process.env.DBHOST || 'localhost',
            user: process.env.DBUSER || 'root', 
            database: process.env.DBNAME || 'rapido_express',
            port: process.env.DBPORT || 3306
        });
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
    console.log('📊 Base de datos:', process.env.DBNAME || 'rapido_express');
    connection.release();
});

module.exports = {
    pool,
    promisePool: pool.promise()
};