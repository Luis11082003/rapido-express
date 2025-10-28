-- Eliminar procedimientos existentes si los hay
DROP PROCEDURE IF EXISTS sp_ObtenerCiudadesPorEstado;
DROP PROCEDURE IF EXISTS sp_RegistrarEnvio;

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS rapido_express;
USE rapido_express;

-- Tabla de Estados
CREATE TABLE IF NOT EXISTS Estados (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado VARCHAR(100) NOT NULL
);

-- Tabla de Ciudades
CREATE TABLE IF NOT EXISTS Ciudades (
    id_ciudad INT AUTO_INCREMENT PRIMARY KEY,
    id_estado INT NOT NULL,
    nombre_ciudad VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_estado) REFERENCES Estados(id_estado)
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS Clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    correo VARCHAR(200) NOT NULL
);

-- Tabla de Envíos
CREATE TABLE IF NOT EXISTS Envios (
    id_envio INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_ciudad_destino INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    estatus VARCHAR(50) DEFAULT 'Registrado',
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente),
    FOREIGN KEY (id_ciudad_destino) REFERENCES Ciudades(id_ciudad)
);

-- Insertar datos de ejemplo
INSERT IGNORE INTO Estados (id_estado, nombre_estado) VALUES 
(1, 'Ciudad de México'),
(2, 'Jalisco'),
(3, 'Nuevo León'),
(4, 'Puebla');

INSERT IGNORE INTO Ciudades (id_ciudad, id_estado, nombre_ciudad) VALUES 
(1, 1, 'Alcaldía Cuauhtémoc'),
(2, 1, 'Alcaldía Miguel Hidalgo'),
(3, 2, 'Guadalajara'),
(4, 2, 'Zapopan'),
(5, 3, 'Monterrey'),
(6, 3, 'San Pedro Garza García'),
(7, 4, 'Puebla'),
(8, 4, 'Atlixco');

INSERT IGNORE INTO Clientes (id_cliente, nombre, correo) VALUES 
(1, 'Juan Pérez', 'juan@email.com'),
(2, 'María García', 'maria@email.com'),
(3, 'Carlos López', 'carlos@email.com');

-- Procedimiento almacenado para obtener ciudades por estado
DELIMITER //
CREATE PROCEDURE sp_ObtenerCiudadesPorEstado(IN id_estado_param INT)
BEGIN
    SELECT id_ciudad, nombre_ciudad 
    FROM Ciudades 
    WHERE id_estado = id_estado_param 
    ORDER BY nombre_ciudad;
END //
DELIMITER ;

-- Procedimiento almacenado para registrar envío con transacción
DELIMITER //
CREATE PROCEDURE sp_RegistrarEnvio(
    IN p_id_cliente INT,
    IN p_id_ciudad INT,
    IN p_descripcion VARCHAR(255),
    OUT p_resultado VARCHAR(100)
)
BEGIN
    DECLARE cliente_existe INT DEFAULT 0;
    DECLARE ciudad_existe INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 'Error interno en la transacción';
    END;
    
    START TRANSACTION;
    
    -- Verificar si el cliente existe
    SELECT COUNT(*) INTO cliente_existe FROM Clientes WHERE id_cliente = p_id_cliente;
    
    -- Verificar si la ciudad existe
    SELECT COUNT(*) INTO ciudad_existe FROM Ciudades WHERE id_ciudad = p_id_ciudad;
    
    IF cliente_existe = 0 THEN
        SET p_resultado = 'Cliente no encontrado';
        ROLLBACK;
    ELSEIF ciudad_existe = 0 THEN
        SET p_resultado = 'Ciudad no válida';
        ROLLBACK;
    ELSE
        -- Insertar el envío
        INSERT INTO Envios (id_cliente, id_ciudad_destino, descripcion)
        VALUES (p_id_cliente, p_id_ciudad, p_descripcion);
        
        SET p_resultado = 'Envío registrado correctamente';
        COMMIT;
    END IF;
END //
DELIMITER ;