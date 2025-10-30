const express = require('express');
const cors = require('cors');

const app = express();

// CORS para TODOS los orígenes
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta básica de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Backend Rápido Express - FUNCIONANDO',
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        message: 'Servidor funcionando correctamente'
    });
});

// Ruta de debug
app.get('/debug', (req, res) => {
    res.json({
        server: 'Rápido Express Backend',
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
        port: PORT,
        cors: 'ENABLED FOR ALL ORIGINS'
    });
});

// RUTAS API SIMULADAS (sin base de datos por ahora)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '✅ API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/clientes', (req, res) => {
    const clientes = [
        { id_cliente: 1, nombre: 'Cliente Demo 1', correo: 'cliente1@test.com' },
        { id_cliente: 2, nombre: 'Cliente Demo 2', correo: 'cliente2@test.com' },
        { id_cliente: 3, nombre: 'Cliente Demo 3', correo: 'cliente3@test.com' }
    ];
    
    res.json({
        success: true,
        data: clientes,
        message: `${clientes.length} clientes cargados (modo demo)`
    });
});

app.get('/api/estados', (req, res) => {
    const estados = [
        { id_estado: 1, nombre_estado: 'Ciudad de México' },
        { id_estado: 2, nombre_estado: 'Jalisco' },
        { id_estado: 3, nombre_estado: 'Nuevo León' }
    ];
    
    res.json({
        success: true,
        data: estados,
        message: `${estados.length} estados cargados (modo demo)`
    });
});

app.get('/api/ciudades/:id_estado', (req, res) => {
    const ciudades = [
        { id_ciudad: 1, nombre_ciudad: 'Ciudad de México' },
        { id_ciudad: 2, nombre_ciudad: 'Guadalajara' },
        { id_ciudad: 3, nombre_ciudad: 'Monterrey' }
    ];
    
    res.json({
        success: true,
        data: ciudades,
        message: `${ciudades.length} ciudades cargadas (modo demo)`
    });
});

app.post('/api/registrar-envio', (req, res) => {
    const { id_cliente, id_ciudad, descripcion } = req.body;
    
    console.log('📦 Envío recibido:', { id_cliente, id_ciudad, descripcion });
    
    res.json({
        success: true,
        message: '✅ Envío registrado exitosamente (modo demo)',
        tipo: 'success',
        datos: {
            id_envio: Math.floor(Math.random() * 1000),
            id_cliente,
            id_ciudad,
            descripcion,
            fecha: new Date().toISOString()
        }
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 BACKEND INICIADO CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌍 URL: https://rapido-express-backend.azurewebsites.net`);
    console.log(`🕐 Hora: ${new Date().toLocaleString()}`);
    console.log('✅ CORS: Habilitado para todos los orígenes');
    console.log('📊 API: Disponible en /api/*');
    console.log('='.repeat(60));
});