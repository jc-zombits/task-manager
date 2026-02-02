'use client';

import React, { useState, useEffect } from 'react';
import { 
  List, 
  Checkbox, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Card, 
  Progress, 
  Popconfirm,
  message,
  Form,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  DragOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;
const { TextArea } = Input;

const SubtaskManager = ({ taskId, onProgressUpdate }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Cargar subtareas
  const loadSubtasks = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/subtasks/task/${taskId}`);
      setSubtasks(response.data);
    } catch (error) {
      console.error('Error cargando subtareas:', error);
      message.error('Error al cargar las subtareas');
    } finally {
      setLoading(false);
    }
  };

  // Calcular progreso
  const calculateProgress = () => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(subtask => subtask.is_completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  // Crear nueva subtarea
  const createSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      message.warning('Por favor ingresa un título para la subtarea');
      return;
    }

    try {
      const response = await axios.post(`/api/subtasks/task/${taskId}`, {
        title: newSubtaskTitle.trim(),
        order_index: subtasks.length
      });
      
      setSubtasks([...subtasks, response.data]);
      setNewSubtaskTitle('');
      message.success('Subtarea creada exitosamente');
      
      // Notificar cambio de progreso
      if (onProgressUpdate) {
        onProgressUpdate(calculateProgress());
      }
    } catch (error) {
      console.error('Error creando subtarea:', error);
      message.error('Error al crear la subtarea');
    }
  };

  // Alternar completado de subtarea
  const toggleSubtaskCompletion = async (subtaskId) => {
    try {
      const response = await axios.patch(`/api/subtasks/${subtaskId}/toggle`);
      
      setSubtasks(subtasks.map(subtask => 
        subtask.id === subtaskId ? response.data : subtask
      ));
      
      message.success('Estado actualizado');
      
      // Notificar cambio de progreso
      if (onProgressUpdate) {
        const updatedSubtasks = subtasks.map(subtask => 
          subtask.id === subtaskId ? response.data : subtask
        );
        const completed = updatedSubtasks.filter(s => s.is_completed).length;
        const progress = updatedSubtasks.length > 0 ? Math.round((completed / updatedSubtasks.length) * 100) : 0;
        onProgressUpdate(progress);
      }
    } catch (error) {
      console.error('Error actualizando subtarea:', error);
      message.error('Error al actualizar el estado');
    }
  };

  // Eliminar subtarea
  const deleteSubtask = async (subtaskId) => {
    try {
      await axios.delete(`/api/subtasks/${subtaskId}`);
      setSubtasks(subtasks.filter(subtask => subtask.id !== subtaskId));
      message.success('Subtarea eliminada');
      
      // Notificar cambio de progreso
      if (onProgressUpdate) {
        const updatedSubtasks = subtasks.filter(subtask => subtask.id !== subtaskId);
        const completed = updatedSubtasks.filter(s => s.is_completed).length;
        const progress = updatedSubtasks.length > 0 ? Math.round((completed / updatedSubtasks.length) * 100) : 0;
        onProgressUpdate(progress);
      }
    } catch (error) {
      console.error('Error eliminando subtarea:', error);
      message.error('Error al eliminar la subtarea');
    }
  };

  // Editar subtarea
  const editSubtask = (subtask) => {
    setEditingSubtask(subtask);
    form.setFieldsValue({
      title: subtask.title,
      description: subtask.description || ''
    });
    setIsModalVisible(true);
  };

  // Guardar edición
  const saveSubtaskEdit = async (values) => {
    try {
      const response = await axios.put(`/api/subtasks/${editingSubtask.id}`, values);
      
      setSubtasks(subtasks.map(subtask => 
        subtask.id === editingSubtask.id ? response.data : subtask
      ));
      
      setIsModalVisible(false);
      setEditingSubtask(null);
      form.resetFields();
      message.success('Subtarea actualizada');
    } catch (error) {
      console.error('Error actualizando subtarea:', error);
      message.error('Error al actualizar la subtarea');
    }
  };

  useEffect(() => {
    loadSubtasks();
  }, [taskId]);

  const progress = calculateProgress();
  const completedCount = subtasks.filter(s => s.is_completed).length;

  return (
    <Card 
      title={
        <Space>
          <CheckCircleOutlined />
          <span>Subtareas ({completedCount}/{subtasks.length})</span>
        </Space>
      }
      extra={
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
          format={(percent) => `${percent}%`}
        />
      }
      style={{ marginTop: 16 }}
    >
      {/* Barra de progreso principal */}
      <div style={{ marginBottom: 16 }}>
        <Progress 
          percent={progress}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          format={(percent) => (
            <span style={{ color: '#666' }}>
              {completedCount}/{subtasks.length} completadas
            </span>
          )}
        />
      </div>

      {/* Lista de subtareas */}
      <List
        loading={loading}
        dataSource={subtasks}
        locale={{ emptyText: 'No hay subtareas aún' }}
        renderItem={(subtask) => (
          <List.Item
            key={subtask.id}
            style={{
              backgroundColor: subtask.is_completed ? '#f6ffed' : '#fff',
              border: subtask.is_completed ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
              borderRadius: 6,
              marginBottom: 8,
              padding: '12px 16px'
            }}
            actions={[
              <Button
                key="edit"
                type="text"
                icon={<EditOutlined />}
                onClick={() => editSubtask(subtask)}
                size="small"
              />,
              <Popconfirm
                key="delete"
                title="¿Estás seguro de eliminar esta subtarea?"
                onConfirm={() => deleteSubtask(subtask.id)}
                okText="Sí"
                cancelText="No"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Checkbox
                  checked={subtask.is_completed}
                  onChange={() => toggleSubtaskCompletion(subtask.id)}
                />
              }
              title={
                <Text 
                  delete={subtask.is_completed}
                  style={{ 
                    color: subtask.is_completed ? '#52c41a' : '#262626',
                    fontWeight: subtask.is_completed ? 'normal' : '500'
                  }}
                >
                  {subtask.title}
                </Text>
              }
              description={
                subtask.description && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {subtask.description}
                  </Text>
                )
              }
            />
            {subtask.is_completed && (
              <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
            )}
          </List.Item>
        )}
      />

      {/* Agregar nueva subtarea */}
      <div style={{ marginTop: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Agregar nueva subtarea..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onPressEnter={createSubtask}
            style={{ flex: 1 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={createSubtask}
            disabled={!newSubtaskTitle.trim()}
          >
            Agregar
          </Button>
        </Space.Compact>
      </div>

      {/* Modal de edición */}
      <Modal
        title="Editar Subtarea"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingSubtask(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveSubtaskEdit}
        >
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: 'El título es requerido' }]}
          >
            <Input placeholder="Título de la subtarea" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Descripción (opcional)"
          >
            <TextArea 
              rows={3} 
              placeholder="Descripción detallada de la subtarea"
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Guardar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SubtaskManager;