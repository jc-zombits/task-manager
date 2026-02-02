const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const setupSubtasks = async () => {
  try {
    console.log('🔧 Configurando tabla de subtareas...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../sql/create_subtasks_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL
    await pool.query(sql);
    
    console.log('✅ Tabla de subtareas creada exitosamente');
    console.log('✅ Trigger de actualización automática de progreso configurado');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configurando subtareas:', error);
    process.exit(1);
  }
};

setupSubtasks();