const express = require('express');
const router = express.Router();
const {
  getSubtasksByTaskId,
  createSubtask,
  updateSubtask,
  toggleSubtaskCompletion,
  deleteSubtask,
  deleteAllSubtasksByTaskId,
  reorderSubtasks
} = require('../controllers/subtaskController');

// Rutas para subtareas
router.get('/task/:taskId', getSubtasksByTaskId);           // GET /api/subtasks/task/:taskId
router.post('/task/:taskId', createSubtask);               // POST /api/subtasks/task/:taskId
router.put('/task/:taskId/reorder', reorderSubtasks);      // PUT /api/subtasks/task/:taskId/reorder
router.delete('/task/:taskId', deleteAllSubtasksByTaskId); // DELETE /api/subtasks/task/:taskId
router.put('/:id', updateSubtask);                         // PUT /api/subtasks/:id
router.patch('/:id/toggle', toggleSubtaskCompletion);      // PATCH /api/subtasks/:id/toggle
router.delete('/:id', deleteSubtask);                      // DELETE /api/subtasks/:id

module.exports = router;