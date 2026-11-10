import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Cursos from './pages/Cursos';
import Constancias from './pages/Constancias';
import ReporteDetalle from './pages/ReporteDetalle';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#005293] flex items-center justify-center p-4">
        <button
          onClick={() => setIsAuthenticated(true)}
          className="bg-[#B8006B] hover:bg-[#a0005d] text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-[#B8006B]/30 cursor-pointer transition-all"
        >
          Iniciar Sesión Institucional PLAi
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/constancias" element={<Constancias />} />
          <Route path="/reporte-detalle" element={<ReporteDetalle />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}