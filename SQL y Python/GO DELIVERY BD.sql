CREATE DATABASE IF NOT EXISTS Go_Delivery
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE Go_Delivery;

DROP TABLE IF EXISTS detalle_pedidos;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS comercios;
DROP TABLE IF EXISTS repartidores;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    tipo ENUM('cliente', 'repartidor', 'comercio') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE clientes (
    id_cliente INT PRIMARY KEY,
    telefono VARCHAR(20),
    direccion TEXT,
    CONSTRAINT fk_clientes_usuarios
        FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE repartidores (
    id_repartidor INT PRIMARY KEY,
    telefono VARCHAR(20),
    vehiculo VARCHAR(100),
    matricula VARCHAR(10),
    cedula VARCHAR(100),
    CONSTRAINT fk_repartidores_usuarios
        FOREIGN KEY (id_repartidor) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comercios (
    id_comercio INT PRIMARY KEY,
    nombre_local VARCHAR(100) NOT NULL,
    direccion TEXT,
    tipo VARCHAR(50),
    CONSTRAINT fk_comercios_usuarios
        FOREIGN KEY (id_comercio) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    comercio_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    CONSTRAINT fk_productos_comercios
        FOREIGN KEY (comercio_id) REFERENCES comercios(id_comercio)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    repartidor_id INT NULL,
    comercio_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('pendiente', 'aceptado', 'en_camino', 'entregado', 'cancelado') DEFAULT 'pendiente',
    CONSTRAINT fk_pedidos_clientes
        FOREIGN KEY (cliente_id) REFERENCES clientes(id_cliente)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_repartidores
        FOREIGN KEY (repartidor_id) REFERENCES repartidores(id_repartidor)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_comercios
        FOREIGN KEY (comercio_id) REFERENCES comercios(id_comercio)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detalle_pedidos (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_pedidos_pedidos
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_pedidos_productos
        FOREIGN KEY (producto_id) REFERENCES productos(id_producto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO usuarios (nombre, email, contraseña, tipo) VALUES
('Juan Perez', 'juan@mail.com', '123456', 'cliente'),
('Pedro Gomez', 'pedro@mail.com', '123456', 'repartidor'),
('Pizza Store', 'pizza@mail.com', '123456', 'comercio');

INSERT INTO clientes (id_cliente, telefono, direccion) VALUES
(1, '0981123456', 'Asunción');

INSERT INTO repartidores (id_repartidor, telefono, vehiculo, matricula, cedula) VALUES
(2, '0981765432', 'Moto', 'ABC123', '1234567');

INSERT INTO comercios (id_comercio, nombre_local, direccion, tipo) VALUES
(3, 'Pizza Store', 'Centro de Asunción', 'Comida rápida');

INSERT INTO productos (comercio_id, nombre, descripcion, precio) VALUES
(3, 'Pizza Muzzarella', 'Pizza clásica con queso', 35000),
(3, 'Hamburguesa', 'Carne, queso y pan', 25000),
(3, 'Gaseosa', 'Bebida fría', 10000);