const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const enviosRoutes = require('./routes/envios');

const app = express();

// IMPORTANTE para Azure usar process.env.PORT
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging de todas las peticiones
app.use((req, res, next) => {
    console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Rutas API
app.use('/api', enviosRoutes);

// Ruta para verificar estado del servidor
app.get('/status', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor de Rápido Express funcionando',
        timestamp: new Date().toISOString(),
        environment: process.env.nodeenv || 'development',
        database: process.env.dbname || 'rapido_express',
        port: PORT
    });
});

// Ruta principal y manejo de SPA (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Manejo de errores 404 para rutas API
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Ruta API no encontrada',
        message: `La ruta ${req.originalUrl} no existe`
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error('❌ Error general:', err);
    res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        message: process.env.nodeenv === 'development' ? err.message : 'Error interno del servidor'
    });
});

// IMPORTANTE para Azure escuchar en '0.0.0.0'
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto: ${PORT}`);
    console.log(`Entorno: ${process.env.nodeenv || 'development'}`);
    console.log(`Base de datos: ${process.env.dbname || 'rapido_express'}`);
    console.log('Frontend servido desde: ../frontend');
    console.log('API disponible en: /api/*');
    console.log('Status check: /status');
});