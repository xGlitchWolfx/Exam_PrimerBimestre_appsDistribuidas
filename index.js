const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Conexion a MySQL con tu base de datos cine
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'cine',
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err.message);
    return;
  }

  console.log('Conexion exitosa a MySQL');
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRUD Peliculas</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 30px;
      background: #f4f4f4;
    }

    h1 {
      margin-bottom: 10px;
    }

    form, table {
      background: white;
      padding: 15px;
      border: 1px solid #ccc;
      margin-top: 15px;
    }

    input, button {
      padding: 8px;
      margin: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
    }

    th {
      background: #e8e8e8;
    }

    button {
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>CRUD de Peliculas</h1>

  <form id="formulario">
    <input type="hidden" id="id">
    <input type="text" id="titulo" placeholder="Titulo" required>
    <input type="text" id="director" placeholder="Director">
    <input type="number" id="anio" placeholder="anio">
    <input type="text" id="genero" placeholder="Genero">
    <button type="submit">Guardar</button>
    <button type="button" onclick="limpiarFormulario()">Limpiar</button>
  </form>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Titulo</th>
        <th>Director</th>
        <th>Anio</th>
        <th>Genero</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody id="tablaPeliculas"></tbody>
  </table>

  <script>
    const formulario = document.getElementById('formulario');
    const tablaPeliculas = document.getElementById('tablaPeliculas');

    async function cargarPeliculas() {
      const respuesta = await fetch('/api/peliculas');
      const peliculas = await respuesta.json();

      tablaPeliculas.innerHTML = '';

      peliculas.forEach((pelicula) => {
        tablaPeliculas.innerHTML += \`
          <tr>
            <td>\${pelicula.id}</td>
            <td>\${pelicula.titulo}</td>
            <td>\${pelicula.director || ''}</td>
            <td>\${pelicula.anio || ''}</td>
            <td>\${pelicula.genero || ''}</td>
            <td>
              <button onclick='editarPelicula(\${JSON.stringify(pelicula)})'>Editar</button>
              <button onclick="eliminarPelicula(\${pelicula.id})">Eliminar</button>
            </td>
          </tr>
        \`;
      });
    }

    formulario.addEventListener('submit', async (event) => {
      event.preventDefault();

      const id = document.getElementById('id').value;
      const pelicula = {
        titulo: document.getElementById('titulo').value,
        director: document.getElementById('director').value,
        anio: document.getElementById('anio').value,
        genero: document.getElementById('genero').value,
      };

      if (id) {
        await fetch(\`/api/peliculas/\${id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pelicula),
        });
      } else {
        await fetch('/api/peliculas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pelicula),
        });
      }

      limpiarFormulario();
      cargarPeliculas();
    });

    function editarPelicula(pelicula) {
      document.getElementById('id').value = pelicula.id;
      document.getElementById('titulo').value = pelicula.titulo;
      document.getElementById('director').value = pelicula.director || '';
      document.getElementById('anio').value = pelicula.anio || '';
      document.getElementById('genero').value = pelicula.genero || '';
    }

    async function eliminarPelicula(id) {
      await fetch(\`/api/peliculas/\${id}\`, { method: 'DELETE' });
      cargarPeliculas();
    }

    function limpiarFormulario() {
      formulario.reset();
      document.getElementById('id').value = '';
    }

    cargarPeliculas();
  </script>
</body>
</html>
  `);
});

app.get('/api/peliculas', (req, res) => {
  connection.query('SELECT * FROM peliculas', (err, results) => {
    if (err) {
      res.status(500).send('Error en consulta SQL');
      return;
    }

    res.json(results);
  });
});

app.post('/api/peliculas', (req, res) => {
  const { titulo, director, anio, genero } = req.body;
  const sql = 'INSERT INTO peliculas (titulo, director, anio, genero) VALUES (?, ?, ?, ?)';

  connection.query(sql, [titulo, director, anio, genero], (err, result) => {
    if (err) {
      res.status(500).send('Error al crear pelicula');
      return;
    }

    res.json({ id: result.insertId, titulo, director, anio, genero });
  });
});

app.put('/api/peliculas/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, director, anio, genero } = req.body;
  const sql = 'UPDATE peliculas SET titulo = ?, director = ?, anio = ?, genero = ? WHERE id = ?';

  connection.query(sql, [titulo, director, anio, genero, id], (err) => {
    if (err) {
      res.status(500).send('Error al actualizar pelicula');
      return;
    }

    res.json({ mensaje: 'Pelicula actualizada' });
  });
});

app.delete('/api/peliculas/:id', (req, res) => {
  const { id } = req.params;

  connection.query('DELETE FROM peliculas WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).send('Error al eliminar pelicula');
      return;
    }

    res.json({ mensaje: 'Pelicula eliminada' });
  });
});

app.listen(port, () => {
  console.log(`Servidor web corriendo en http://localhost:${port}`);
});
