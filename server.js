const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Obtener todos los clubes
app.get('/api/clubes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clubes');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los clubes' });
  }
});

// Crear un nuevo club
app.post('/api/clubes', async (req, res) => {
  const { nombre, categoria, cupo_maximo, imagen_url, descripcion } = req.body;

  if (!nombre || !categoria || !cupo_maximo) {
    return res.status(400).json({ error: 'Nombre, categoría y cupo máximo son obligatorios' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO clubes (nombre, categoria, cupo_maximo, cupo_actual, imagen_url, descripcion) VALUES (?, ?, ?, 0, ?, ?)',
      [nombre, categoria, cupo_maximo, imagen_url || '', descripcion || '']
    );

    res.json({ message: 'Club creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el club' });
  }
});

// Inscribir a un estudiante en un club
app.post('/api/estudiantes', async (req, res) => {
  const { club_id, nombre, seccion } = req.body;

  if (!club_id || !nombre || !seccion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const [club] = await pool.query('SELECT cupo_maximo, cupo_actual FROM clubes WHERE id = ?', [club_id]);
    
    if (club.length === 0) {
      return res.status(404).json({ error: 'El club no existe' });
    }

    if (club[0].cupo_actual >= club[0].cupo_maximo) {
      return res.status(400).json({ error: 'El club ya no tiene cupos disponibles' });
    }

    await pool.query(
      'INSERT INTO estudiantes (club_id, nombre, seccion) VALUES (?, ?, ?)',
      [club_id, nombre, seccion]
    );

    await pool.query(
      'UPDATE clubes SET cupo_actual = cupo_actual + 1 WHERE id = ?',
      [club_id]
    );

    res.json({ message: 'Inscripción exitosa' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la inscripción' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});