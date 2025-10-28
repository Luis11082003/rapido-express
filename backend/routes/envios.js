const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 1. Obtener todos los estados
router.get('/estados', (req, res) => {
    const query = 'SELECT id_estado, nombre_estado FROM Estados ORDER BY nombre_estado';
    
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo estados:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Error interno del servidor',
                tipo: 'error'
            });
        }
        console.log(`${results.length} estados cargados`);
        res.json({
            success: true,
            data: results,
            message: `${results.length} estados cargados correctamente`
        });
    });
});

// 2. Obtener ciudades por estado usando PROCEDURE
router.get('/ciudades/:id_estado', (req, res) => {
    const id_estado = req.params.id_estado;
    
    console.log(`Solicitando ciudades para estado ID: ${id_estado}`);

    // Validar que el id_estado sea un número válido
    if (!id_estado || isNaN(id_estado)) {
        console.error('ID de estado inválido:', id_estado);
        return res.status(400).json({ 
            success: false,
            message: 'ID de estado inválido',
            tipo: 'error',
            data: []
        });
    }

    const estadoId = parseInt(id_estado);

    pool.query('CALL sp_ObtenerCiudadesPorEstado(?)', [estadoId], (err, results) => {
        if (err) {
            console.error('Error ejecutando sp_ObtenerCiudadesPorEstado:', err);
            console.error('Detalles del error:', err.message);
            
            // Intentar con consulta directa como respaldo
            console.log('Intentando consulta directa como respaldo...');
            const queryDirecta = 'SELECT id_ciudad, nombre_ciudad FROM Ciudades WHERE id_estado = ? ORDER BY nombre_ciudad';
            
            pool.query(queryDirecta, [estadoId], (errDirecto, resultadosDirectos) => {
                if (errDirecto) {
                    console.error('Error en consulta directa también:', errDirecto);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error al cargar ciudades: ' + err.message,
                        tipo: 'error',
                        data: []
                    });
                }
                
                console.log(`${resultadosDirectos.length} ciudades cargadas via CONSULTA DIRECTA (respaldo)`);
                
                res.json({
                    success: true,
                    data: resultadosDirectos,
                    message: `${resultadosDirectos.length} ciudades cargadas (usando respaldo)`,
                    tipo: 'success',
                    usandoRespaldo: true
                });
            });
            return;
        }
        
        // Manejar diferentes estructuras de respuesta del PROCEDURE
        let ciudades = [];
        if (Array.isArray(results) && results.length > 0) {
            ciudades = results[0] || [];
        }
        
        console.log(`${ciudades.length} ciudades cargadas via PROCEDURE para estado ${estadoId}`);
        
        res.json({
            success: true,
            data: ciudades,
            message: ciudades.length > 0 
                ? `${ciudades.length} ciudades cargadas correctamente`
                : 'No se encontraron ciudades para este estado',
            tipo: 'success'
        });
    });
});

// 3. Ruta alternativa para ciudades (consulta directa)
router.get('/ciudades-directo/:id_estado', (req, res) => {
    const id_estado = req.params.id_estado;
    
    console.log(`Solicitando ciudades DIRECTO para estado ID: ${id_estado}`);
    
    const query = 'SELECT id_ciudad, nombre_ciudad FROM Ciudades WHERE id_estado = ? ORDER BY nombre_ciudad';
    
    pool.query(query, [parseInt(id_estado)], (err, results) => {
        if (err) {
            console.error('Error en consulta directa de ciudades:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Error al cargar ciudades: ' + err.message,
                tipo: 'error',
                data: []
            });
        }
        
        console.log(`${results.length} ciudades cargadas via consulta directa`);
        
        res.json({
            success: true,
            data: results,
            message: `${results.length} ciudades cargadas correctamente`,
            tipo: 'success'
        });
    });
});

// 4. Ruta de diagnóstico completa
router.get('/ciudades-debug/:id_estado', (req, res) => {
    const id_estado = req.params.id_estado;
    
    console.log('=== DIAGNOSTICO CIUDADES ===');
    console.log('Parametro recibido:', id_estado);
    
    const estadoId = parseInt(id_estado);
    
    // 1. Primero probar consulta directa
    const queryDirecta = 'SELECT id_ciudad, nombre_ciudad FROM Ciudades WHERE id_estado = ? ORDER BY nombre_ciudad';
    
    pool.query(queryDirecta, [estadoId], (err, resultadosDirectos) => {
        if (err) {
            console.error('Error en consulta directa:', err);
            return res.json({
                success: false,
                message: 'Error en consulta directa: ' + err.message,
                tipo: 'error'
            });
        }
        
        console.log('Consulta directa - Resultados:', resultadosDirectos);
        
        // 2. Luego probar el PROCEDURE
        pool.query('CALL sp_ObtenerCiudadesPorEstado(?)', [estadoId], (err, resultadosProcedure) => {
            if (err) {
                console.error('Error en PROCEDURE:', err);
                return res.json({
                    success: false,
                    message: 'Error en PROCEDURE: ' + err.message,
                    tipo: 'error',
                    data: resultadosDirectos,
                    usandoRespaldo: true
                });
            }
            
            let ciudadesProcedure = [];
            if (Array.isArray(resultadosProcedure) && resultadosProcedure.length > 0) {
                ciudadesProcedure = resultadosProcedure[0] || [];
            }
            
            console.log('PROCEDURE - Ciudades procesadas:', ciudadesProcedure);
            
            res.json({
                success: true,
                message: 'Diagnóstico completado',
                data: ciudadesProcedure,
                diagnostico: {
                    consultaDirectaFunciona: true,
                    procedureFunciona: true,
                    coinciden: JSON.stringify(resultadosDirectos) === JSON.stringify(ciudadesProcedure),
                    cantidadDirecta: resultadosDirectos.length,
                    cantidadProcedure: ciudadesProcedure.length
                }
            });
        });
    });
});

// 5. Verificar el PROCEDURE específico de ciudades
router.get('/verificar-procedure-ciudades', (req, res) => {
    const query = `
        SELECT ROUTINE_NAME, ROUTINE_DEFINITION
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? 
        AND ROUTINE_NAME = 'sp_ObtenerCiudadesPorEstado'
        AND ROUTINE_TYPE = 'PROCEDURE'
    `;
    
    pool.query(query, [process.env.DB_NAME || 'rapido_express'], (err, procedures) => {
        if (err) {
            console.error('Error verificando PROCEDURE ciudades:', err);
            return res.json({
                success: false,
                message: 'Error verificando procedure: ' + err.message
            });
        }
        
        if (procedures.length === 0) {
            console.error('PROCEDURE sp_ObtenerCiudadesPorEstado NO existe');
            return res.json({
                success: false,
                message: 'El PROCEDURE sp_ObtenerCiudadesPorEstado no existe en la base de datos',
                procedureExiste: false
            });
        }
        
        console.log('PROCEDURE sp_ObtenerCiudadesPorEstado encontrado');
        res.json({
            success: true,
            message: 'PROCEDURE encontrado correctamente',
            procedureExiste: true,
            procedure: procedures[0]
        });
    });
});

// 6. Obtener todos los clientes
router.get('/clientes', (req, res) => {
    const query = 'SELECT id_cliente, nombre, correo FROM Clientes ORDER BY nombre';
    
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo clientes:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Error interno del servidor',
                tipo: 'error'
            });
        }
        console.log(`${results.length} clientes cargados`);
        res.json({
            success: true,
            data: results,
            message: `${results.length} clientes cargados correctamente`
        });
    });
});

// 7. Registrar nuevo envío
router.post('/registrar-envio', (req, res) => {
    const { id_cliente, id_ciudad, descripcion } = req.body;

    console.log('Datos recibidos para envío:', { id_cliente, id_ciudad, descripcion });

    // Validaciones
    if (!id_cliente || !id_ciudad || !descripcion) {
        return res.json({
            success: false,
            message: 'Todos los campos son obligatorios',
            tipo: 'warning'
        });
    }

    if (descripcion.trim().length < 3) {
        return res.json({
            success: false,
            message: 'La descripción debe tener al menos 3 caracteres',
            tipo: 'warning'
        });
    }

    console.log('Ejecutando PROCEDURE sp_RegistrarEnvio...');
    
    pool.query('CALL sp_RegistrarEnvio(?, ?, ?, @resultado)', [id_cliente, id_ciudad, descripcion.trim()], (err) => {
        if (err) {
            console.error('Error ejecutando sp_RegistrarEnvio:', err);
            return res.json({
                success: false,
                message: 'Error interno del servidor: ' + err.message,
                tipo: 'error'
            });
        }
        
        // Obtener el resultado del PROCEDURE
        pool.query('SELECT @resultado as resultado', (err, results) => {
            if (err) {
                console.error('Error obteniendo resultado:', err);
                return res.json({
                    success: false,
                    message: 'Error obteniendo resultado: ' + err.message,
                    tipo: 'error'
                });
            }
            
            const mensaje = results[0].resultado;
            console.log('Resultado del PROCEDURE:', mensaje);

            // Determinar el tipo de mensaje según el resultado
            let tipo = 'success'; // Verde/palomita por defecto
            
            if (mensaje.includes('Cliente no encontrado') || mensaje.includes('Ciudad no válida')) {
                tipo = 'warning'; // Icono de advertencia
            } else if (mensaje.includes('Error interno')) {
                tipo = 'error'; // Rojo/tache
            }

            // Respuesta estructurada para el frontend
            res.json({
                success: tipo === 'success',
                message: mensaje,
                tipo: tipo,
                datos: {
                    id_cliente: id_cliente,
                    id_ciudad: id_ciudad,
                    descripcion: descripcion,
                    timestamp: new Date().toISOString()
                }
            });
        });
    });
});

// 8. Obtener todos los envíos registrados
router.get('/envios', (req, res) => {
    const query = `
        SELECT e.*, c.nombre as cliente_nombre, ci.nombre_ciudad, est.nombre_estado
        FROM Envios e
        JOIN Clientes c ON e.id_cliente = c.id_cliente
        JOIN Ciudades ci ON e.id_ciudad = ci.id_ciudad
        JOIN Estados est ON ci.id_estado = est.id_estado
        ORDER BY e.fecha_creacion DESC
        LIMIT 50
    `;
    
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo envíos:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Error interno del servidor',
                tipo: 'error'
            });
        }
        console.log(`${results.length} envíos cargados`);
        res.json({
            success: true,
            data: results,
            message: `${results.length} envíos cargados correctamente`
        });
    });
});

// 9. Verificar todos los PROCEDURES
router.get('/verificar-procedures', (req, res) => {
    const query = `
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
    `;
    
    pool.query(query, [process.env.DB_NAME || 'rapido_express'], (err, procedures) => {
        if (err) {
            console.error('Error verificando PROCEDURES:', err);
            return res.json({
                success: false,
                message: 'Error verificando procedimientos: ' + err.message,
                tipo: 'error'
            });
        }
        
        const procedureNames = procedures.map(p => p.ROUTINE_NAME);
        console.log('PROCEDURES encontrados:', procedureNames);
        
        // Verificar que tenemos los procedures necesarios
        const proceduresRequeridos = ['sp_ObtenerCiudadesPorEstado', 'sp_RegistrarEnvio'];
        const faltantes = proceduresRequeridos.filter(p => !procedureNames.includes(p));
        
        res.json({
            success: faltantes.length === 0,
            procedures: procedureNames,
            proceduresRequeridos: proceduresRequeridos,
            faltantes: faltantes,
            message: faltantes.length === 0 
                ? `Todos los procedures necesarios están disponibles (${procedureNames.length} total)`
                : `Faltan procedures: ${faltantes.join(', ')}`
        });
    });
});

module.exports = router;