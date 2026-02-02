const { pool } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Asegurar que el directorio de reportes existe
const ensureReportsDir = () => {
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  return reportsDir;
};

// Generar reporte en Excel
const generateExcelReport = async (req, res) => {
  try {
    const { status, priority, startDate, endDate } = req.query;
    
    // Construir query con filtros
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

    if (startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const tasks = result.rows;

    // Crear workbook de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Tareas');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Título', key: 'title', width: 30 },
      { header: 'Descripción', key: 'description', width: 40 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Prioridad', key: 'priority', width: 15 },
      { header: 'Progreso (%)', key: 'progress_percentage', width: 15 },
      { header: 'Horas Estimadas', key: 'estimated_hours', width: 18 },
      { header: 'Horas Reales', key: 'actual_hours', width: 15 },
      { header: 'Fecha Inicio', key: 'start_date', width: 20 },
      { header: 'Fecha Vencimiento', key: 'due_date', width: 20 },
      { header: 'Fecha Completado', key: 'completed_date', width: 20 },
      { header: 'Fecha Creación', key: 'created_at', width: 20 },
      { header: 'Tags', key: 'tags', width: 25 },
      { header: 'Notas', key: 'notes', width: 30 }
    ];

    // Estilo del header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Agregar datos
    tasks.forEach(task => {
      worksheet.addRow({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        progress_percentage: task.progress_percentage,
        estimated_hours: task.estimated_hours,
        actual_hours: task.actual_hours,
        start_date: task.start_date ? moment(task.start_date).format('DD/MM/YYYY HH:mm') : '',
        due_date: task.due_date ? moment(task.due_date).format('DD/MM/YYYY HH:mm') : '',
        completed_date: task.completed_date ? moment(task.completed_date).format('DD/MM/YYYY HH:mm') : '',
        created_at: moment(task.created_at).format('DD/MM/YYYY HH:mm'),
        tags: task.tags ? task.tags.join(', ') : '',
        notes: task.notes
      });
    });

    // Agregar estadísticas al final
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        AVG(progress_percentage) as avg_progress
      FROM tasks
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    // Agregar hoja de estadísticas
    const statsWorksheet = workbook.addWorksheet('Estadísticas');
    statsWorksheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor', key: 'value', width: 15 }
    ];

    statsWorksheet.getRow(1).font = { bold: true };
    statsWorksheet.addRow({ metric: 'Total de Tareas', value: stats.total_tasks });
    statsWorksheet.addRow({ metric: 'Tareas Pendientes', value: stats.pending_tasks });
    statsWorksheet.addRow({ metric: 'Tareas en Progreso', value: stats.in_progress_tasks });
    statsWorksheet.addRow({ metric: 'Tareas Completadas', value: stats.completed_tasks });
    statsWorksheet.addRow({ metric: 'Progreso Promedio (%)', value: Math.round(stats.avg_progress || 0) });

    // Guardar archivo
    const reportsDir = ensureReportsDir();
    const filename = `reporte_tareas_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    const filepath = path.join(reportsDir, filename);

    await workbook.xlsx.writeFile(filepath);

    // Enviar archivo
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error enviando archivo:', err);
      }
      // Eliminar archivo después de enviarlo
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ error: 'Error generando reporte Excel' });
  }
};

// Generar reporte en PDF
const generatePDFReport = async (req, res) => {
  try {
    const { status, priority, startDate, endDate } = req.query;
    
    // Construir query con filtros (mismo que Excel)
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

    if (startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const tasks = result.rows;

    // Crear documento PDF
    const doc = new PDFDocument();
    const reportsDir = ensureReportsDir();
    const filename = `reporte_tareas_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
    const filepath = path.join(reportsDir, filename);

    doc.pipe(fs.createWriteStream(filepath));

    // Título
    doc.fontSize(20).text('Reporte de Tareas', { align: 'center' });
    doc.fontSize(12).text(`Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown();

    // Estadísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        AVG(progress_percentage) as avg_progress
      FROM tasks
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    doc.fontSize(14).text('Estadísticas Generales:', { underline: true });
    doc.fontSize(10);
    doc.text(`Total de Tareas: ${stats.total_tasks}`);
    doc.text(`Tareas Pendientes: ${stats.pending_tasks}`);
    doc.text(`Tareas en Progreso: ${stats.in_progress_tasks}`);
    doc.text(`Tareas Completadas: ${stats.completed_tasks}`);
    doc.text(`Progreso Promedio: ${Math.round(stats.avg_progress || 0)}%`);
    doc.moveDown();

    // Lista de tareas
    doc.fontSize(14).text('Detalle de Tareas:', { underline: true });
    doc.fontSize(10);

    tasks.forEach((task, index) => {
      if (index > 0) doc.moveDown();
      
      doc.text(`${index + 1}. ${task.title}`, { continued: false, font: 'Helvetica-Bold' });
      if (task.description) {
        doc.text(`   Descripción: ${task.description}`);
      }
      doc.text(`   Estado: ${task.status} | Prioridad: ${task.priority} | Progreso: ${task.progress_percentage}%`);
      
      if (task.estimated_hours) {
        doc.text(`   Horas Estimadas: ${task.estimated_hours}${task.actual_hours ? ` | Horas Reales: ${task.actual_hours}` : ''}`);
      }
      
      if (task.due_date) {
        doc.text(`   Fecha Vencimiento: ${moment(task.due_date).format('DD/MM/YYYY HH:mm')}`);
      }
      
      if (task.tags && task.tags.length > 0) {
        doc.text(`   Tags: ${task.tags.join(', ')}`);
      }
      
      doc.text(`   Creado: ${moment(task.created_at).format('DD/MM/YYYY HH:mm')}`);
    });

    doc.end();

    // Esperar a que el archivo se complete y enviarlo
    doc.on('end', () => {
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error enviando archivo PDF:', err);
        }
        // Eliminar archivo después de enviarlo
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 5000);
      });
    });

  } catch (error) {
    console.error('Error generando reporte PDF:', error);
    res.status(500).json({ error: 'Error generando reporte PDF' });
  }
};

module.exports = {
  generateExcelReport,
  generatePDFReport
};