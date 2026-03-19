'use client';

import React from 'react';
import { Row, Col, Card } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const TaskChart = ({ tasks, statistics }) => {
  // Configuración del gráfico de pastel para estados
  const statusPieOptions = {
    chart: {
      type: 'pie',
      height: 300
    },
    title: {
      text: 'Distribución por Estado'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %'
        }
      }
    },
    series: [{
      name: 'Tareas',
      colorByPoint: true,
      data: [
        {
          name: 'Pendientes',
          y: statistics.pending_tasks || 0,
          color: '#fa8c16'
        },
        {
          name: 'En Progreso',
          y: statistics.in_progress_tasks || 0,
          color: '#1890ff'
        },
        {
          name: 'Completadas',
          y: statistics.completed_tasks || 0,
          color: '#52c41a'
        }
      ]
    }]
  };

  // Configuración del gráfico de barras para prioridades
  const priorityData = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});

  const priorityBarOptions = {
    chart: {
      type: 'column',
      height: 300
    },
    title: {
      text: 'Tareas por Prioridad'
    },
    xAxis: {
      categories: ['Baja', 'Media', 'Alta'],
      title: {
        text: 'Prioridad'
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Número de Tareas'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>{point.y}</b></td></tr>',
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: [{
      name: 'Tareas',
      data: [
        {
          y: priorityData.low || 0,
          color: '#52c41a'
        },
        {
          y: priorityData.medium || 0,
          color: '#fa8c16'
        },
        {
          y: priorityData.high || 0,
          color: '#ff4d4f'
        }
      ]
    }]
  };

  // Configuración del gráfico de progreso promedio
  const progressData = tasks.map(task => ({
    name: task.title,
    y: task.progress_percentage || 0
  })).sort((a, b) => b.y - a.y).slice(0, 10); // Top 10 tareas con más progreso

  const progressBarOptions = {
    chart: {
      type: 'bar',
      height: 400
    },
    title: {
      text: 'Progreso de Tareas (Top 10)'
    },
    xAxis: {
      categories: progressData.map(item => item.name),
      title: {
        text: null
      }
    },
    yAxis: {
      min: 0,
      max: 100,
      title: {
        text: 'Progreso (%)',
        align: 'high'
      },
      labels: {
        overflow: 'justify'
      }
    },
    tooltip: {
      valueSuffix: '%'
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          format: '{y}%'
        }
      }
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'top',
      x: -40,
      y: 80,
      floating: true,
      borderWidth: 1,
      backgroundColor: '#FFFFFF',
      shadow: true
    },
    credits: {
      enabled: false
    },
    series: [{
      name: 'Progreso',
      data: progressData.map(item => ({
        y: item.y,
        color: item.y === 100 ? '#52c41a' : item.y >= 50 ? '#1890ff' : '#fa8c16'
      }))
    }]
  };

  // Gráfico de línea temporal (tareas creadas por mes)
  const getMonthlyData = () => {
    const monthlyData = {};
    tasks.forEach(task => {
      const month = new Date(task.created_at).toISOString().slice(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    return {
      categories: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
      }),
      data: sortedMonths.map(month => monthlyData[month])
    };
  };

  const monthlyData = getMonthlyData();

  const timelineOptions = {
    chart: {
      type: 'line',
      height: 300
    },
    title: {
      text: 'Tareas Creadas por Mes'
    },
    xAxis: {
      categories: monthlyData.categories
    },
    yAxis: {
      title: {
        text: 'Número de Tareas'
      }
    },
    plotOptions: {
      line: {
        dataLabels: {
          enabled: true
        },
        enableMouseTracking: true
      }
    },
    series: [{
      name: 'Tareas Creadas',
      data: monthlyData.data,
      color: '#1890ff'
    }]
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Estado de Tareas">
            <HighchartsReact
              highcharts={Highcharts}
              options={statusPieOptions}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Prioridades">
            <HighchartsReact
              highcharts={Highcharts}
              options={priorityBarOptions}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Progreso de Tareas">
            <HighchartsReact
              highcharts={Highcharts}
              options={progressBarOptions}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Tendencia Temporal">
            <HighchartsReact
              highcharts={Highcharts}
              options={timelineOptions}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TaskChart;