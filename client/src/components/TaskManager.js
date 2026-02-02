'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Tag, 
  Progress, 
  Space, 
  Row, 
  Col, 
  Statistic, 
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import TaskChart from './TaskChart';
import ReportGenerator from './ReportGenerator';
import SubtaskManager from './SubtaskManager';

const { Header, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [statistics, setStatistics] = useState({});
  const [chartVisible, setChartVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Cargar tareas al montar el componente
  useEffect(() => {
    loadTasks();
    loadStatistics();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      message.error('Error al cargar las tareas');
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get('/api/tasks/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? moment(task.start_date) : null,
      due_date: task.due_date ? moment(task.due_date) : null,
      tags: task.tags || []
    });
    setModalVisible(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      message.success('Tarea eliminada exitosamente');
      loadTasks();
      loadStatistics();
    } catch (error) {
      message.error('Error al eliminar la tarea');
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.progress_percentage = 100;
        updateData.completed_date = new Date().toISOString();
      } else if (newStatus === 'in_progress') {
        updateData.start_date = new Date().toISOString();
      }

      await axios.put(`/api/tasks/${taskId}`, updateData);
      message.success('Estado actualizado exitosamente');
      loadTasks();
      loadStatistics();
    } catch (error) {
      message.error('Error al actualizar el estado');
      console.error('Error updating status:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const taskData = {
        ...values,
        start_date: values.start_date ? values.start_date.toISOString() : null,
        due_date: values.due_date ? values.due_date.toISOString() : null,
        tags: values.tags || []
      };

      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask.id}`, taskData);
        message.success('Tarea actualizada exitosamente');
      } else {
        await axios.post('/api/tasks', taskData);
        message.success('Tarea creada exitosamente');
      }

      setModalVisible(false);
      form.resetFields();
      loadTasks();
      loadStatistics();
    } catch (error) {
      message.error('Error al guardar la tarea');
      console.error('Error saving task:', error);
    }
  };

  // Manejar vista detallada de tarea
  const handleViewTaskDetails = (task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  // Manejar actualización de progreso desde subtareas
  const handleProgressUpdate = async (taskId, newProgress) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { 
        progress_percentage: newProgress 
      });
      
      // Actualizar la tarea en el estado local
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, progress_percentage: newProgress }
          : task
      ));
      
      // Actualizar la tarea seleccionada si es la misma
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, progress_percentage: newProgress });
      }
      
      loadStatistics();
    } catch (error) {
      console.error('Error actualizando progreso:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'in_progress': return 'blue';
      case 'completed': return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'default';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      default: return priority;
    }
  };

  const columns = [
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: 'Progreso',
      dataIndex: 'progress_percentage',
      key: 'progress_percentage',
      width: 120,
      render: (progress) => (
        <Progress percent={progress || 0} size="small" />
      ),
    },
    {
      title: 'Fecha Límite',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTaskDetails(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Iniciar tarea">
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'in_progress')}
              />
            </Tooltip>
          )}
          {record.status === 'in_progress' && (
            <Tooltip title="Completar tarea">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'completed')}
                style={{ backgroundColor: '#52c41a' }}
              />
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditTask(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Estás seguro de eliminar esta tarea?"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#1890ff' }}>
              Administrador de Tareas
            </h1>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => setChartVisible(true)}
              >
                Gráficos
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setReportVisible(true)}
              >
                Reportes
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateTask}
              >
                Nueva Tarea
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: '24px' }}>
        {/* Estadísticas */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total de Tareas"
                value={statistics.total || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pendientes"
                value={statistics.pending || 0}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="En Progreso"
                value={statistics.in_progress || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completadas"
                value={statistics.completed || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla de tareas */}
        <Card>
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} tareas`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Content>

      {/* Modal para crear/editar tarea */}
      <Modal
        title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: 'Por favor ingresa el título' }]}
          >
            <Input placeholder="Título de la tarea" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
          >
            <TextArea rows={3} placeholder="Descripción de la tarea" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Prioridad"
                initialValue="medium"
              >
                <Select>
                  <Option value="low">Baja</Option>
                  <Option value="medium">Media</Option>
                  <Option value="high">Alta</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="progress_percentage"
                label="Progreso (%)"
                initialValue={0}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimated_hours"
                label="Horas Estimadas"
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="actual_hours"
                label="Horas Reales"
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Fecha de Inicio"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="due_date"
                label="Fecha Límite"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label="Etiquetas"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Agregar etiquetas"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notas"
          >
            <TextArea rows={2} placeholder="Notas adicionales" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTask ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de gráficos */}
      <Modal
        title="Gráficos de Progreso"
        open={chartVisible}
        onCancel={() => setChartVisible(false)}
        footer={null}
        width={800}
      >
        <TaskChart tasks={tasks} statistics={statistics} />
      </Modal>

      {/* Modal de reportes */}
      <Modal
        title="Generar Reportes"
        open={reportVisible}
        onCancel={() => setReportVisible(false)}
        footer={null}
        width={600}
      >
        <ReportGenerator tasks={tasks} />
      </Modal>

      {/* Modal de detalles de tarea con subtareas */}
      <Modal
        title={`Detalles de Tarea: ${selectedTask?.title || ''}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedTask && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Descripción:</strong> {selectedTask.description || 'Sin descripción'}</p>
                  <p><strong>Estado:</strong> <Tag color={getStatusColor(selectedTask.status)}>{getStatusText(selectedTask.status)}</Tag></p>
                  <p><strong>Prioridad:</strong> <Tag color={getPriorityColor(selectedTask.priority)}>{getPriorityText(selectedTask.priority)}</Tag></p>
                </Col>
                <Col span={12}>
                  <p><strong>Progreso:</strong></p>
                  <Progress percent={selectedTask.progress_percentage || 0} />
                  <p><strong>Fecha Límite:</strong> {selectedTask.due_date ? moment(selectedTask.due_date).format('DD/MM/YYYY') : 'Sin fecha límite'}</p>
                </Col>
              </Row>
            </Card>
            
            <SubtaskManager 
              taskId={selectedTask.id}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default TaskManager;