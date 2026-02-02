-- Tabla para subtareas/items de cada tarea principal
CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para mejorar performance en consultas por task_id
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);

-- Función para actualizar el progreso automáticamente
CREATE OR REPLACE FUNCTION update_task_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tasks 
    SET progress_percentage = (
        SELECT CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE is_completed = true) * 100.0) / COUNT(*))
        END
        FROM subtasks 
        WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.task_id, OLD.task_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el progreso cuando se modifica una subtarea
DROP TRIGGER IF EXISTS trigger_update_task_progress ON subtasks;
CREATE TRIGGER trigger_update_task_progress
    AFTER INSERT OR UPDATE OR DELETE ON subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_progress();