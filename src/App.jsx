import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import PageRenderer from './pages/PageRenderer';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/*" element={<PageRenderer />} />
      </Routes>
    </AppShell>
  );
}

