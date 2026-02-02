'use client';

import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <title>Administrador de Tareas</title>
        <meta name="description" content="Sistema de administración de tareas" />
      </head>
      <body>
        <ConfigProvider locale={esES}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
