const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.dbhost || 'localhost',
    user: process.env.dbuser || 'root',
    password: process.env.dbpassword || '1108',
    database: process.env.dbname || 'rapido_express',
    port: process.env.dbport || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    ssl: process.env.nodeenv === 'production' ? { rejectUnauthorized: false } : false
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
        console.log('Configuración usada:', {
            host: process.env.dbhost || 'localhost',
            user: process.env.dbuser || 'root', 
            database: process.env.dbname || 'rapido_express',
            port: process.env.dbport || 3306
        });
        return;
    }
    console.log('Conectado a la base de datos MySQL');
    console.log('Base de datos:', process.env.dbname || 'rapido_express');
    connection.release();
});

module.exports = {
    pool,
    promisePool: pool.promise()
};