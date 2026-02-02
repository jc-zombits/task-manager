const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');

// Rutas para tareas
router.get('/', getAllTasks);
router.get('/statistics', getTaskStats); // Cambiado de /stats a /statistics
router.get('/:id', getTaskById); // Esta ruta debe ir después de las rutas específicas
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;