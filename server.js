const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'go_delivery',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'La parte visual')));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderPage({ title, stylesheet, body, script = '' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/${stylesheet}">
</head>
<body>
${body}
${script}
</body>
</html>`;
}

async function fetchPedidosPorEstado(estadoSql) {
  const [rows] = await pool.query(
    `SELECT pe.id_pedido,
            pe.descripcion,
            pe.estado,
            c.nombre AS cliente_nombre,
            co.nombre_local AS comercio_nombre,
            COALESCE((
              SELECT GROUP_CONCAT(pr.nombre SEPARATOR ', ')
              FROM detalle_pedidos dp
              INNER JOIN productos pr ON pr.id_producto = dp.producto_id
              WHERE dp.pedido_id = pe.id_pedido
            ), 'Sin productos') AS productos
     FROM pedidos pe
     INNER JOIN clientes cl ON cl.id_cliente = pe.cliente_id
     INNER JOIN usuarios c ON c.id_usuario = cl.id_cliente
     INNER JOIN comercios co ON co.id_comercio = pe.comercio_id
     WHERE pe.estado ${estadoSql}
     ORDER BY pe.id_pedido DESC`
  );

  return rows;
}

function renderPedidoCardRepartidor(pedido) {
  const acciones = [];

  if (pedido.estado === 'aceptado') {
    acciones.push(`
      <form action="/tomar_pedido" method="POST">
        <input type="hidden" name="id" value="${pedido.id_pedido}">
        <button>Tomar pedido</button>
      </form>`);
  }

  if (pedido.estado === 'en_camino') {
    acciones.push(`
      <form action="/entregar_pedido" method="POST">
        <input type="hidden" name="id" value="${pedido.id_pedido}">
        <button>Marcar como entregado</button>
      </form>`);
  }

  return `
    <article class="estado-${pedido.estado === 'en_camino' ? 'en-camino' : pedido.estado}">
      <h3>Pedido #${pedido.id_pedido}</h3>
      <p>Cliente: ${escapeHtml(pedido.cliente_nombre)}</p>
      <p>Comercio: ${escapeHtml(pedido.comercio_nombre)}</p>
      <p>Producto: ${escapeHtml(pedido.productos)}</p>
      <p class="estado">Estado: ${escapeHtml(pedido.estado)}</p>
      ${acciones.join('\n')}
    </article>`;
}

function renderPedidoCardComercio(pedido) {
  const acciones = [];

  if (pedido.estado === 'pendiente') {
    acciones.push(`
      <form action="/aceptar_pedido" method="POST">
        <input type="hidden" name="id" value="${pedido.id_pedido}">
        <button class="btn-aceptar">Aceptar</button>
      </form>`);
  }

  if (pedido.estado === 'pendiente') {
    acciones.push(`
      <form action="/rechazar_pedido" method="POST">
        <input type="hidden" name="id" value="${pedido.id_pedido}">
        <button class="btn-rechazar">Rechazar</button>
      </form>`);
  }

  return `
    <article class="estado-${pedido.estado}">
      <h3>Pedido #${pedido.id_pedido}</h3>
      <p>Cliente: ${escapeHtml(pedido.cliente_nombre)}</p>
      <p>Producto: ${escapeHtml(pedido.productos)}</p>
      <p class="estado">Estado: ${escapeHtml(pedido.estado)}</p>
      ${acciones.join('\n')}
    </article>`;
}

app.get('/', (_req, res) => {
  res.redirect('/login.html');
});

app.get('/inicio_repartidor.html', async (_req, res) => {
  try {
    const pedidos = await fetchPedidosPorEstado("IN ('aceptado', 'en_camino')");
    const cards = pedidos.length > 0
      ? pedidos.map(renderPedidoCardRepartidor).join('\n')
      : '<p style="text-align:center;padding:24px;">No hay pedidos para repartir.</p>';

    res.send(renderPage({
      title: 'Repartidor',
      stylesheet: 'repartidor.css',
      body: `
        <h1>Pedidos disponibles</h1>
        <div class="container">${cards}</div>
        <script src="/repartidor.js"></script>`,
    }));
  } catch (error) {
    res.status(500).send(`<pre>${escapeHtml(error.message)}</pre>`);
  }
});

app.get('/inicio_comercio.html', async (_req, res) => {
  try {
    const pedidos = await fetchPedidosPorEstado("= 'pendiente'");
    const cards = pedidos.length > 0
      ? pedidos.map(renderPedidoCardComercio).join('\n')
      : '<p style="text-align:center;padding:24px;">No hay pedidos pendientes.</p>';

    res.send(renderPage({
      title: 'Comercio',
      stylesheet: 'comercio.css',
      body: `
        <h1>Pedidos Recibidos</h1>
        <div class="container">${cards}</div>
        <script src="/comercio.js"></script>`,
    }));
  } catch (error) {
    res.status(500).send(`<pre>${escapeHtml(error.message)}</pre>`);
  }
});

app.get('/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: rows[0].ok });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/usuarios', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, email, tipo FROM usuarios ORDER BY id_usuario'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/usuarios', async (req, res) => {
  const { nombre, email, contraseña, tipo } = req.body;

  if (!nombre || !email || !contraseña || !tipo) {
    return res.status(400).json({
      message: 'nombre, email, contraseña y tipo son obligatorios',
    });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, contraseña, tipo) VALUES (?, ?, ?, ?)',
      [nombre, email, contraseña, tipo]
    );

    res.status(201).json({
      message: 'Usuario creado',
      id_usuario: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/productos', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id_producto, p.nombre, p.precio, p.descripcion, p.comercio_id, c.nombre_local
       FROM productos p
       INNER JOIN comercios c ON c.id_comercio = p.comercio_id
       ORDER BY p.id_producto`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/productos', async (req, res) => {
  const { comercio_id, nombre, precio, descripcion } = req.body;

  if (!comercio_id || !nombre || precio === undefined) {
    return res.status(400).json({
      message: 'comercio_id, nombre y precio son obligatorios',
    });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO productos (comercio_id, nombre, precio, descripcion) VALUES (?, ?, ?, ?)',
      [comercio_id, nombre, precio, descripcion || null]
    );

    res.status(201).json({
      message: 'Producto creado',
      id_producto: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/pedidos', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pe.id_pedido, pe.descripcion, pe.estado, pe.comercio_id, pe.cliente_id, pe.repartidor_id,
              c.nombre AS cliente_nombre, co.nombre_local AS comercio_nombre
       FROM pedidos pe
       INNER JOIN clientes cl ON cl.id_cliente = pe.cliente_id
       INNER JOIN usuarios c ON c.id_usuario = cl.id_cliente
       INNER JOIN comercios co ON co.id_comercio = pe.comercio_id
       ORDER BY pe.id_pedido`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/pedidos', async (req, res) => {
  const { cliente_id, comercio_id, descripcion, repartidor_id = null } = req.body;

  if (!cliente_id || !comercio_id || !descripcion) {
    return res.status(400).json({
      message: 'cliente_id, comercio_id y descripcion son obligatorios',
    });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pedidos (cliente_id, repartidor_id, comercio_id, descripcion, estado) VALUES (?, ?, ?, ?, ?)',
      [cliente_id, repartidor_id, comercio_id, descripcion, 'pendiente']
    );

    res.status(201).json({
      message: 'Pedido creado',
      id_pedido: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;

  if (!email || !contraseña) {
    return res.status(400).json({ message: 'email y contraseña son obligatorios' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, email, tipo FROM usuarios WHERE email = ? AND contraseña = ?',
      [email, contraseña]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const usuario = rows[0];
    const redirects = {
      cliente: '/inicio_usuario.html',
      repartidor: '/inicio_repartidor.html',
      comercio: '/inicio_comercio.html',
    };

    res.json({
      message: 'Login correcto',
      user: usuario,
      redirectTo: redirects[usuario.tipo] || '/inicio_usuario.html',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/aceptar_pedido', async (req, res) => {
  await pool.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', ['aceptado', req.body.id]);
  res.redirect(req.get('referer') || '/inicio_comercio.html');
});

app.post('/rechazar_pedido', async (req, res) => {
  await pool.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', ['cancelado', req.body.id]);
  res.redirect(req.get('referer') || '/inicio_comercio.html');
});

app.post('/tomar_pedido', async (req, res) => {
  await pool.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', ['en_camino', req.body.id]);
  res.redirect(req.get('referer') || '/inicio_repartidor.html');
});

app.post('/entregar_pedido', async (req, res) => {
  await pool.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', ['entregado', req.body.id]);
  res.redirect(req.get('referer') || '/inicio_repartidor.html');
});

const candidatePorts = process.env.PORT
  ? [Number(process.env.PORT)]
  : [3001, 3002, 3003];

function startServer(index = 0) {
  const currentPort = candidatePorts[index];

  const server = app.listen(currentPort, () => {
    console.log(`API lista en http://localhost:${currentPort}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && index < candidatePorts.length - 1) {
      console.log(`Puerto ${currentPort} ocupado, probando ${candidatePorts[index + 1]}...`);
      startServer(index + 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });
}

startServer();