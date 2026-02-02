'use client';

import React, { useState } from 'react';
import { 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Row, 
  Col, 
  Card,
  message,
  Divider
} from 'antd';
import { 
  FileExcelOutlined, 
  FilePdfOutlined, 
  DownloadOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ReportGenerator = ({ tasks }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (format) => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const params = {
        format,
        status: values.status,
        priority: values.priority,
        start_date: values.dateRange ? values.dateRange[0].toISOString() : null,
        end_date: values.dateRange ? values.dateRange[1].toISOString() : null,
      };

      // Filtrar parámetros nulos
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const endpoint = format === 'excel' ? '/api/reports/excel' : '/api/reports/pdf';
      
      const response = await axios.get(endpoint, {
        params,
        responseType: 'blob'
      });

      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const fileName = `reporte_tareas_${moment().format('YYYY-MM-DD')}.${extension}`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success(`Reporte ${format.toUpperCase()} descargado exitosamente`);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const getTaskSummary = () => {
    const values = form.getFieldsValue();
    let filteredTasks = [...tasks];

    // Aplicar filtros
    if (values.status) {
      filteredTasks = filteredTasks.filter(task => task.status === values.status);
    }
    
    if (values.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === values.priority);
    }
    
    if (values.dateRange && values.dateRange.length === 2) {
      const startDate = values.dateRange[0];
      const endDate = values.dateRange[1];
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = moment(task.created_at);
        return taskDate.isBetween(startDate, endDate, 'day', '[]');
      });
    }

    return {
      total: filteredTasks.length,
      pending: filteredTasks.filter(t => t.status === 'pending').length,
      inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
      avgProgress: filteredTasks.length > 0 
        ? Math.round(filteredTasks.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / filteredTasks.length)
        : 0
    };
  };

  const summary = getTaskSummary();

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: undefined,
          priority: undefined,
          dateRange: null
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Filtrar por Estado"
            >
              <Select placeholder="Todos los estados" allowClear>
                <Option value="pending">Pendiente</Option>
                <Option value="in_progress">En Progreso</Option>
                <Option value="completed">Completada</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Filtrar por Prioridad"
            >
              <Select placeholder="Todas las prioridades" allowClear>
                <Option value="low">Baja</Option>
                <Option value="medium">Media</Option>
                <Option value="high">Alta</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="dateRange"
          label="Rango de Fechas"
        >
          <RangePicker 
            style={{ width: '100%' }}
            placeholder={['Fecha inicio', 'Fecha fin']}
          />
        </Form.Item>
      </Form>

      <Divider />

      {/* Resumen de datos filtrados */}
      <Card title="Resumen de Datos a Exportar" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {summary.total}
              </div>
              <div style={{ color: '#666' }}>Total</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                {summary.pending}
              </div>
              <div style={{ color: '#666' }}>Pendientes</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {summary.inProgress}
              </div>
              <div style={{ color: '#666' }}>En Progreso</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {summary.completed}
              </div>
              <div style={{ color: '#666' }}>Completadas</div>
            </div>
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col span={24} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
              Progreso Promedio: {summary.avgProgress}%
            </div>
          </Col>
        </Row>
      </Card>

      {/* Botones de descarga */}
      <Row gutter={16}>
        <Col span={12}>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            size="large"
            block
            loading={loading}
            onClick={() => handleGenerateReport('excel')}
            style={{ 
              height: '60px', 
              fontSize: '16px',
              backgroundColor: '#52c41a',
              borderColor: '#52c41a'
            }}
          >
            <div>
              <div>Descargar Excel</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Archivo .xlsx con datos detallados
              </div>
            </div>
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            size="large"
            block
            loading={loading}
            onClick={() => handleGenerateReport('pdf')}
            style={{ 
              height: '60px', 
              fontSize: '16px',
              backgroundColor: '#ff4d4f',
              borderColor: '#ff4d4f'
            }}
          >
            <div>
              <div>Descargar PDF</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Reporte formateado para impresión
              </div>
            </div>
          </Button>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Información del Reporte:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li>Los reportes incluyen todas las tareas que coincidan con los filtros seleccionados</li>
          <li>El archivo Excel contiene datos detallados en formato de tabla</li>
          <li>El archivo PDF incluye gráficos y estadísticas resumidas</li>
          <li>Los archivos se descargarán automáticamente al hacer clic en los botones</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportGenerator;