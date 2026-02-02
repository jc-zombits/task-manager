const { pool } = require('../config/database');

// Obtener todas las subtareas de una tarea
const getSubtasksByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY order_index ASC, created_at ASC',
      [taskId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo subtareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear una nueva subtarea
const createSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description = '', order_index = 0 } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'El título es requerido' });
    }
    
    const result = await pool.query(
      'INSERT INTO subtasks (task_id, title, description, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [taskId, title, description, order_index]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando subtarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar una subtarea
const updateSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_completed, order_index } = req.body;
    
    const result = await pool.query(
      `UPDATE subtasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           is_completed = COALESCE($3, is_completed),
           order_index = COALESCE($4, order_index),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [title, description, is_completed, order_index, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando subtarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar subtarea como completada/no completada
const toggleSubtaskCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE subtasks 
       SET is_completed = NOT is_completed,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cambiando estado de subtarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar una subtarea
const deleteSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM subtasks WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' });
    }
    
    res.json({ message: 'Subtarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando subtarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar todas las subtareas de una tarea
const deleteAllSubtasksByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM subtasks WHERE task_id = $1 RETURNING *',
      [taskId]
    );
    
    res.json({ 
      message: `${result.rows.length} subtareas eliminadas exitosamente`,
      deletedCount: result.rows.length
    });
  } catch (error) {
    console.error('Error eliminando subtareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reordenar subtareas
const reorderSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { subtasks } = req.body; // Array de { id, order_index }
    
    // Actualizar el order_index de cada subtarea
    for (const subtask of subtasks) {
      await pool.query(
        'UPDATE subtasks SET order_index = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND task_id = $3',
        [subtask.order_index, subtask.id, taskId]
      );
    }
    
    // Obtener las subtareas actualizadas
    const result = await pool.query(
      'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY order_index ASC, created_at ASC',
      [taskId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error reordenando subtareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getSubtasksByTaskId,
  createSubtask,
  updateSubtask,
  toggleSubtaskCompletion,
  deleteSubtask,
  deleteAllSubtasksByTaskId,
  reorderSubtasks
};