const { pool } = require('../config/database');
const moment = require('moment');

// Obtener todas las tareas
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
    }

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una tarea por ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nueva tarea
const createTask = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    
    const {
      title,
      description,
      status = 'pending',
      priority = 'medium',
      progress_percentage = 0,
      estimated_hours,
      actual_hours = 0,
      start_date,
      due_date,
      tags,
      notes
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    console.log('Valores a insertar:', {
      title,
      description,
      status,
      priority,
      progress_percentage,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      tags,
      notes
    });

    const query = `
      INSERT INTO tasks (
        title, description, status, priority, progress_percentage,
        estimated_hours, actual_hours, start_date, due_date, tags, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      title,
      description,
      status,
      priority,
      progress_percentage,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      tags,
      notes
    ];

    console.log('Query SQL:', query);
    console.log('Valores del query:', values);

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando tarea:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

// Actualizar tarea
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      progress_percentage,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      completed_date,
      tags,
      notes
    } = req.body;

    // Verificar si la tarea existe
    const existingTask = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Si el estado cambia a 'completed', establecer completed_date
    let finalCompletedDate = completed_date;
    if (status === 'completed' && existingTask.rows[0].status !== 'completed') {
      finalCompletedDate = new Date();
    } else if (status !== 'completed') {
      finalCompletedDate = null;
    }

    const query = `
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        progress_percentage = COALESCE($5, progress_percentage),
        estimated_hours = COALESCE($6, estimated_hours),
        actual_hours = COALESCE($7, actual_hours),
        start_date = COALESCE($8, start_date),
        due_date = COALESCE($9, due_date),
        completed_date = $10,
        tags = COALESCE($11, tags),
        notes = COALESCE($12, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      title,
      description,
      status,
      priority,
      progress_percentage,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      finalCompletedDate,
      tags,
      notes,
      id
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar tarea
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de tareas
const getTaskStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        AVG(progress_percentage) as avg_progress,
        COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'completed' THEN 1 END) as overdue
      FROM tasks
    `;

    const result = await pool.query(statsQuery);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
};