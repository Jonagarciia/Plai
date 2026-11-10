import React, { useEffect, useState } from 'react';
import { BookOpen, Users, FileText, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_cursos: 0,
    estudiantes_activos: 0,
    reportes_procesados: 0
  });

  const [cursosRecientes, setCursosRecientes] = useState<any[]>([]);

  useEffect(() => {
    // 1. Obtener Métricas Dinámicas Reales desde la API
    fetch('http://127.0.0.1:8000/api/v1/estadisticas')
      .then((res) => res.json())
      .then((data) => {
        setStats({
          total_cursos: data.total_cursos || 0,
          estudiantes_activos: data.estudiantes_activos || 0,
          reportes_procesados: data.reportes_procesados || 0
        });
      })
      .catch(() => setStats({ total_cursos: 0, estudiantes_activos: 0, reportes_procesados: 0 }));

    // 2. Obtener Cursos Recientes
    fetch('http://127.0.0.1:8000/api/v1/cursos')
      .then((res) => res.json())
      .then((data) => {
        setCursosRecientes((data.cursos || []).slice(0, 5));
      })
      .catch(() => setCursosRecientes([]));
  }, []);

  return (
    <div className="space-y-6 min-h-screen">
      {/* Encabezado Principal */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#B8006B]/10 text-[#B8006B] px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-[#B8006B]" />
            <span>Plataforma Abierta de Innovación</span>
          </div>
          <h1 className="text-3xl font-black text-[#005293] tracking-tight">Panel de control</h1>
          <p className="text-slate-500 text-sm mt-1">
            Resumen general del catálogo de la oferta educativa y reportes procesados.
          </p>
        </div>

        <button
          onClick={() => navigate('/cursos')}
          className="flex items-center gap-2 bg-[#B8006B] hover:bg-[#a0005d] text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-md shadow-[#B8006B]/20 transition-all cursor-pointer"
        >
          <span>Ir al Catálogo de Cursos</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 3 Tarjetas de Métricas integradas con los colores del Logo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta 1: Cursos activos (Azul PLAi) */}
        <div className="bg-white p-6 rounded-2xl border border-[#005293]/20 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-[#005293]/10 text-[#005293] rounded-2xl">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Cursos activos</p>
            <h3 className="text-2xl font-black text-[#005293] mt-0.5">{stats.total_cursos}</h3>
          </div>
        </div>

        {/* Tarjeta 2: Estudiantes activos (Verde Lima PLAi) */}
        <div className="bg-white p-6 rounded-2xl border border-[#8FB63D]/30 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-[#8FB63D]/20 text-[#698a24] rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Estudiantes activos</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {stats.estudiantes_activos} <span className="text-sm font-bold text-slate-500">estudiantes</span>
            </h3>
          </div>
        </div>

        {/* Tarjeta 3: Reportes procesados (Naranja PLAi) */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8731E]/30 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-[#D8731E]/15 text-[#D8731E] rounded-2xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Reportes procesados</p>
            <h3 className="text-2xl font-black text-[#D8731E] mt-0.5">
              {stats.reportes_procesados} <span className="text-sm font-bold text-[#B8006B]">reportes</span>
            </h3>
          </div>
        </div>

      </div>

      {/* Tabla: Cursos recientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Clock size={18} className="text-[#005293]" />
          <h3 className="text-sm font-bold text-[#005293]">Cursos recientes</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="p-4 pl-6">Nombre</th>
                <th className="p-4">Código</th>
                <th className="p-4">Código implementación</th>
                <th className="p-4">Modalidad</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Estudiantes</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {cursosRecientes.length > 0 ? (
                cursosRecientes.map((curso) => (
                  <tr key={curso.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">{curso.nombre}</td>
                    <td className="p-4 font-mono text-slate-500">{curso.codigo_curso}</td>
                    <td className="p-4 font-mono text-[#005293] font-semibold">{curso.codigo_implementacion}</td>
                    <td className="p-4">{curso.modalidad}</td>
                    <td className="p-4">
                      <span className="bg-[#8FB63D]/20 text-[#506b1a] px-2.5 py-1 rounded-full font-bold">
                        {curso.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-900">{curso.estudiantes || 0}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate('/reporte-detalle', { state: { curso } })}
                        className="bg-[#B8006B] hover:bg-[#a0005d] text-white font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                      >
                        Procesar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-normal">
                    No hay cursos registrados en el catálogo actualmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}