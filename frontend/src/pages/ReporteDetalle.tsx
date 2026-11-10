import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  Download, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  Award 
} from 'lucide-react';

export default function ReporteDetalle() {
  const location = useLocation();
  const navigate = useNavigate();

  const [cursos, setCursos] = useState<any[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<any | null>(null);
  const [pestanaActiva, setPestanaActiva] = useState<'asistencias' | 'calificaciones' | 'constancias'>('asistencias');
  
  const [reporteProcesado, setReporteProcesado] = useState<any | null>(null);
  const [cargando, setCargando] = useState(false);
  const [criterioCalif, setCriterioCalif] = useState('80');

  // Cargar lista de cursos
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/cursos')
      .then((res) => res.json())
      .then((data) => {
        const lista = data.cursos || [];
        setCursos(lista);
        if (location.state?.curso) {
          setCursoSeleccionado(location.state.curso);
          setCriterioCalif(location.state.curso.calificacion_minima || '80');
        } else if (lista.length > 0) {
          setCursoSeleccionado(lista[0]);
          setCriterioCalif(lista[0].calificacion_minima || '80');
        }
      })
      .catch(() => setCursos([]));
  }, [location.state]);

  // Manejar el cambio de curso
  const handleSeleccionarCurso = (id: number) => {
    const cursoEncontrado = cursos.find((c) => c.id === id);
    if (cursoEncontrado) {
      setCursoSeleccionado(cursoEncontrado);
      setCriterioCalif(cursoEncontrado.calificacion_minima || '80');
      setReporteProcesado(null);
    }
  };

  // Subir archivo a backend según la pestaña
  const handleSubirReporte = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cursoSeleccionado) return;

    setCargando(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('curso_nombre', cursoSeleccionado.nombre);

    let endpoint = 'http://127.0.0.1:8000/api/v1/reportes/asistencias';
    if (pestanaActiva === 'calificaciones') {
      endpoint = 'http://127.0.0.1:8000/api/v1/reportes/calificaciones';
      formData.append('criterio_aprobacion', criterioCalif);
    } else if (pestanaActiva === 'constancias') {
      endpoint = 'http://127.0.0.1:8000/api/v1/reportes/constancias';
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || 'Error al procesar el archivo');
        setCargando(false);
        return;
      }

      setReporteProcesado(data);
      setCargando(false);
    } catch {
      alert('Error de conexión con el servidor backend');
      setCargando(false);
    }
  };

  // ─── FUNCIÓN DE EXPORTACIÓN A EXCEL LIMPIA CON TABLA REAL ───
  const handleDescargarExcelLimpio = () => {
    if (!reporteProcesado || !reporteProcesado.datos || reporteProcesado.datos.length === 0) return;

    const tituloCurso = cursoSeleccionado?.nombre || 'Curso';
    const nombreLimpio = tituloCurso.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fechaHoy = new Date().toLocaleDateString('es-MX');

    let headersHTML = '';
    let filasHTML = '';

    if (pestanaActiva === 'asistencias') {
      headersHTML = `
        <tr style="background-color: #005293; color: #FFFFFF; font-weight: bold; font-family: Arial, sans-serif;">
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Nombre</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Apellido</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Correo Electrónico</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Asistencias del Curso</th>
        </tr>
      `;
      filasHTML = reporteProcesado.datos.map((est: any, idx: number) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; font-family: Arial, sans-serif;">
          <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">${est.nombre}</td>
          <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">${est.apellido}</td>
          <td style="padding: 8px; border: 1px solid #E2E8F0; color: #005293;">${est.correo}</td>
          <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #005293;">${est.asistencias_curso}</td>
        </tr>
      `).join('');
    } else if (pestanaActiva === 'calificaciones') {
      headersHTML = `
        <tr style="background-color: #B8006B; color: #FFFFFF; font-weight: bold; font-family: Arial, sans-serif;">
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Nombre</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Apellido</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Correo Electrónico</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Calificación Final</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Criterio Requerido</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Estatus</th>
        </tr>
      `;
      filasHTML = reporteProcesado.datos.map((est: any, idx: number) => {
        const esAprobado = est.aprobado;
        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; font-family: Arial, sans-serif;">
            <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">${est.nombre}</td>
            <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">${est.apellido}</td>
            <td style="padding: 8px; border: 1px solid #E2E8F0; color: #005293;">${est.correo}</td>
            <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold;">${est.calificacion_real}</td>
            <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center;">${est.criterio_requerido}</td>
            <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; background-color: ${esAprobado ? '#E2F0D9' : '#FCE8E6'}; color: ${esAprobado ? '#385723' : '#A50E0E'};">${est.estatus}</td>
          </tr>
        `;
      }).join('');
    } else if (pestanaActiva === 'constancias') {
      headersHTML = `
        <tr style="background-color: #005293; color: #FFFFFF; font-weight: bold; font-family: Arial, sans-serif;">
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Nombre</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Apellido</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Correo Electrónico</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Código de Constancia</th>
          <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Fecha de Descarga</th>
        </tr>
      `;
      filasHTML = reporteProcesado.datos.map((est: any, idx: number) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; font-family: Arial, sans-serif;">
          <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">${est.nombre}</td>
          <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">${est.apellido}</td>
          <td style="padding: 8px; border: 1px solid #E2E8F0; color: #005293;">${est.correo}</td>
          <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #D8731E;">${est.codigo_constancia}</td>
          <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center;">${est.fecha_descarga}</td>
        </tr>
      `).join('');
    }

    const templateHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Reporte Moodle</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <div style="margin-bottom: 12px;">
            <h2 style="color: #005293; margin: 0;">PLAi - Plataforma Abierta de Innovación</h2>
            <h3 style="color: #334155; margin: 4px 0 0 0;">Reporte de ${pestanaActiva.toUpperCase()}: ${tituloCurso}</h3>
            <p style="color: #64748B; font-size: 11px; margin: 2px 0 10px 0;">Fecha: ${fechaHoy} | Registros: ${reporteProcesado.datos.length}</p>
          </div>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>${headersHTML}</thead>
            <tbody>${filasHTML}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([templateHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${pestanaActiva}_${nombreLimpio}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xs gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cursos')}
            className="p-3 bg-slate-100 hover:bg-[#005293] text-slate-700 hover:text-white rounded-2xl transition-all cursor-pointer flex items-center justify-center shadow-xs"
            title="Volver al Catálogo"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8006B] bg-[#B8006B]/10 px-3 py-1 rounded-full">
              Procesamiento de Moodle
            </span>
            <h1 className="text-2xl font-black text-[#005293] tracking-tight mt-1">
              {cursoSeleccionado ? cursoSeleccionado.nombre : 'Cargando curso...'}
            </h1>
            <p className="text-xs text-slate-500">
              Código: <span className="font-mono text-[#005293] font-bold">{cursoSeleccionado?.codigo_curso || 'N/A'}</span> | 
              Implementación: <span className="font-mono text-slate-700 font-bold">{cursoSeleccionado?.codigo_implementacion || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Seleccionar Curso */}
        <div className="w-full sm:w-80">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Seleccionar Curso del Catálogo:
          </label>
          <select
            value={cursoSeleccionado?.id || ''}
            onChange={(e) => handleSeleccionarCurso(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#005293] cursor-pointer"
          >
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.codigo_implementacion})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pestañas de Reportes */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => { setPestanaActiva('asistencias'); setReporteProcesado(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs rounded-t-2xl border-b-2 transition-all cursor-pointer ${
            pestanaActiva === 'asistencias'
              ? 'border-[#005293] text-[#005293] bg-white shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar size={16} />
          <span>1. Reporte de Asistencias</span>
        </button>

        <button
          onClick={() => { setPestanaActiva('calificaciones'); setReporteProcesado(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs rounded-t-2xl border-b-2 transition-all cursor-pointer ${
            pestanaActiva === 'calificaciones'
              ? 'border-[#B8006B] text-[#B8006B] bg-white shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>2. Reporte de Calificaciones</span>
        </button>

        <button
          onClick={() => { setPestanaActiva('constancias'); setReporteProcesado(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs rounded-t-2xl border-b-2 transition-all cursor-pointer ${
            pestanaActiva === 'constancias'
              ? 'border-[#D8731E] text-[#D8731E] bg-white shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award size={16} />
          <span>3. Reporte de Constancias</span>
        </button>
      </div>

      {/* Área de Carga */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        {pestanaActiva === 'calificaciones' && (
          <div className="max-w-xs mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Criterio / Nota Mínima de Aprobación:</label>
            <input
              type="text"
              value={criterioCalif}
              onChange={(e) => setCriterioCalif(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-[#B8006B] outline-none focus:ring-2 focus:ring-[#B8006B]"
            />
          </div>
        )}

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 relative hover:bg-slate-50 transition-all">
          <input
            type="file"
            accept=".xlsx, .xls, .csv, .xlsm"
            onChange={handleSubirReporte}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud size={36} className="mx-auto text-[#005293] mb-2" />
          <p className="text-sm font-bold text-slate-800">
            Sube el archivo Moodle de <span className="capitalize font-black text-[#005293]">{pestanaActiva}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Soporta exportaciones en formato CSV, XLS o XLSX de Moodle.</p>
        </div>
      </div>

      {/* Tabla de Resultados */}
      {reporteProcesado && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#005293]">
                Resultado de {pestanaActiva.toUpperCase()}: {reporteProcesado.curso_nombre}
              </h3>
              <p className="text-xs text-slate-400">Total de alumnos procesados: {reporteProcesado.total_registros}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDescargarExcelLimpio}
                className="flex items-center gap-1.5 bg-[#8FB63D] hover:bg-[#7ea232] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                <Download size={15} />
                <span>Descargar Excel Limpio (.xls)</span>
              </button>
              <button
                onClick={() => setReporteProcesado(null)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCw size={15} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#005293] text-white text-xs uppercase">
                  <th className="p-3.5 pl-4">Nombre</th>
                  <th className="p-3.5">Apellido</th>
                  <th className="p-3.5">Correo Electrónico</th>
                  {pestanaActiva === 'asistencias' && <th className="p-3.5 text-center">Asistencias del Curso</th>}
                  {pestanaActiva === 'calificaciones' && (
                    <>
                      <th className="p-3.5 text-center">Calificación Final</th>
                      <th className="p-3.5 text-center">Criterio Requerido</th>
                      <th className="p-3.5 text-center">Estatus</th>
                    </>
                  )}
                  {pestanaActiva === 'constancias' && (
                    <>
                      <th className="p-3.5 text-center">Código Constancia</th>
                      <th className="p-3.5 text-center">Fecha Descarga</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {reporteProcesado.datos.map((est: any) => (
                  <tr key={est.id} className="hover:bg-slate-50">
                    <td className="p-3.5 pl-4 font-bold text-slate-900">{est.nombre}</td>
                    <td className="p-3.5 font-bold text-slate-900">{est.apellido}</td>
                    <td className="p-3.5 font-mono text-slate-500">{est.correo}</td>
                    
                    {pestanaActiva === 'asistencias' && (
                      <td className="p-3.5 text-center font-bold text-[#005293]">{est.asistencias_curso}</td>
                    )}

                    {pestanaActiva === 'calificaciones' && (
                      <>
                        <td className="p-3.5 text-center font-bold text-slate-900">{est.calificacion_real}</td>
                        <td className="p-3.5 text-center text-slate-500">{est.criterio_requerido}</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            est.aprobado ? 'bg-[#8FB63D]/20 text-[#425d10]' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {est.estatus}
                          </span>
                        </td>
                      </>
                    )}

                    {pestanaActiva === 'constancias' && (
                      <>
                        <td className="p-3.5 text-center font-mono font-bold text-[#D8731E]">{est.codigo_constancia}</td>
                        <td className="p-3.5 text-center font-mono text-slate-600">{est.fecha_descarga}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}