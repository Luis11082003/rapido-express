// URL base del API - Backend en Azure App Service
const API_BASE = 'https://rapido-express-backend.azurewebsites.net/api';

// Elementos del DOM
const clienteSelect = document.getElementById('cliente');
const estadoSelect = document.getElementById('estado');
const ciudadSelect = document.getElementById('ciudad');
const descripcionTextarea = document.getElementById('descripcion');
const btnRegistrar = document.getElementById('btnRegistrar');
const alertDiv = document.getElementById('alert');
const envioForm = document.getElementById('envioForm');

// Mostrar alerta
function mostrarAlerta(mensaje, tipo = 'success') {
    alertDiv.textContent = mensaje;
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos para success
    if (tipo === 'success') {
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }
}

// Ocultar alerta
function ocultarAlerta() {
    alertDiv.style.display = 'none';
}

// Cargar datos desde el API
async function cargarDatos() {
    try {
        mostrarAlerta('Cargando datos...', 'warning');
        
        // Cargar clientes y estados en paralelo
        const [clientesResponse, estadosResponse] = await Promise.all([
            fetch(`${API_BASE}/clientes`),
            fetch(`${API_BASE}/estados`)
        ]);

        // Verificar respuestas
        if (!clientesResponse.ok) {
            throw new Error(`Error clientes: ${clientesResponse.status}`);
        }
        if (!estadosResponse.ok) {
            throw new Error(`Error estados: ${estadosResponse.status}`);
        }

        const clientesData = await clientesResponse.json();
        const estadosData = await estadosResponse.json();

        // Verificar estructura de respuesta
        if (!clientesData.success) {
            throw new Error(clientesData.message || 'Error en datos de clientes');
        }
        if (!estadosData.success) {
            throw new Error(estadosData.message || 'Error en datos de estados');
        }

        // Llenar select de clientes
        clienteSelect.innerHTML = '<option value="">Seleccione un cliente...</option>';
        clientesData.data.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id_cliente;
            option.textContent = `${cliente.nombre} (${cliente.correo})`;
            clienteSelect.appendChild(option);
        });

        // Llenar select de estados
        estadoSelect.innerHTML = '<option value="">Seleccione un estado...</option>';
        estadosData.data.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.id_estado;
            option.textContent = estado.nombre_estado;
            estadoSelect.appendChild(option);
        });

        ocultarAlerta();
        console.log('Datos cargados correctamente');

    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarAlerta(`Error al cargar datos: ${error.message}`, 'error');
    }
}

// Cargar ciudades cuando se selecciona un estado
async function cargarCiudades(idEstado) {
    try {
        ciudadSelect.disabled = true;
        ciudadSelect.innerHTML = '<option value="">Cargando ciudades...</option>';

        const response = await fetch(`${API_BASE}/ciudades/${idEstado}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error en datos de ciudades');
        }

        ciudadSelect.innerHTML = '<option value="">Seleccione una ciudad...</option>';
        
        if (data.data && data.data.length > 0) {
            data.data.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.id_ciudad;
                option.textContent = ciudad.nombre_ciudad;
                ciudadSelect.appendChild(option);
            });
            ciudadSelect.disabled = false;
        } else {
            ciudadSelect.innerHTML = '<option value="">No hay ciudades para este estado</option>';
            ciudadSelect.disabled = true;
        }

    } catch (error) {
        console.error('Error cargando ciudades:', error);
        ciudadSelect.innerHTML = '<option value="">Error al cargar ciudades</option>';
        ciudadSelect.disabled = true;
        mostrarAlerta(`Error al cargar ciudades: ${error.message}`, 'error');
    }
}

// Registrar envío
async function registrarEnvio(datos) {
    try {
        btnRegistrar.disabled = true;
        btnRegistrar.textContent = 'Registrando...';

        const response = await fetch(`${API_BASE}/registrar-envio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        // Mostrar resultado
        mostrarAlerta(result.message, result.tipo);
        
        // Limpiar formulario si fue exitoso
        if (result.tipo === 'success') {
            envioForm.reset();
            ciudadSelect.disabled = true;
            ciudadSelect.innerHTML = '<option value="">Primero seleccione un estado...</option>';
        }

    } catch (error) {
        console.error('Error registrando envío:', error);
        mostrarAlerta(`Error al registrar envío: ${error.message}`, 'error');
    } finally {
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Registrar Envío';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos al iniciar
    cargarDatos();

    // Cuando cambia el estado, cargar ciudades
    estadoSelect.addEventListener('change', function() {
        const estadoId = this.value;
        ciudadSelect.disabled = true;
        
        if (estadoId) {
            cargarCiudades(estadoId);
        } else {
            ciudadSelect.innerHTML = '<option value="">Primero seleccione un estado...</option>';
        }
    });

    // Enviar formulario
    envioForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            id_cliente: clienteSelect.value,
            id_ciudad: ciudadSelect.value,
            descripcion: descripcionTextarea.value
        };

        // Validaciones adicionales
        if (!formData.id_cliente) {
            mostrarAlerta('Por favor seleccione un cliente', 'warning');
            return;
        }
        if (!formData.id_ciudad) {
            mostrarAlerta('Por favor seleccione una ciudad', 'warning');
            return;
        }
        if (!formData.descripcion.trim()) {
            mostrarAlerta('Por favor ingrese una descripción', 'warning');
            return;
        }

        registrarEnvio(formData);
    });
});

// Manejar errores no capturados
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    mostrarAlerta('Error inesperado en la aplicación', 'error');
});