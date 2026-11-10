import React, { useState, useEffect } from 'react';
import { Award, ArrowLeft, Download, RefreshCw, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Constancias() {
  const navigate = useNavigate();

  const [cursos, setCursos] = useState<any[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<any | null>(null);
  const [resultadoConstancias, setResultadoConstancias] = useState<any | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Cargar lista de cursos desde la API
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/cursos')
      .then((res) => res.json())
      .then((data) => {
        const lista = data.cursos || [];
        setCursos(lista);
        if (lista.length > 0) {
          setCursoSeleccionado(lista[0]);
        }
      })
      .catch(() => {
        setErrorMensaje('No se pudo conectar con el servidor backend (puerto 8000).');
        setCursos([]);
      });
  }, []);

  // Procesar el archivo de constancias
  const handleSubirConstancias = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!cursoSeleccionado) {
      alert('Por favor selecciona o registra un curso antes de cargar las constancias.');
      return;
    }

    setCargando(true);
    setErrorMensaje(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('curso_nombre', cursoSeleccionado.nombre);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/reportes/constancias', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMensaje(data.detail || 'Ocurrió un error al procesar el archivo de constancias.');
        setCargando(false);
        return;
      }

      setResultadoConstancias(data);
      setCargando(false);
    } catch (err: any) {
      setErrorMensaje('Error de red al intentar procesar el archivo de constancias.');
      setCargando(false);
    }
  };

  //  Descargar tabla limpia a Excel
  const handleDescargarExcelLimpio = () => {
    if (!resultadoConstancias || !resultadoConstancias.datos || resultadoConstancias.datos.length === 0) return;

    const tituloCurso = resultadoConstancias.curso_nombre || 'Curso';
    const nombreLimpio = tituloCurso.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fechaHoy = new Date().toLocaleDateString('es-MX');

    const filasHTML = resultadoConstancias.datos
      .map(
        (est: any, index: number) => `
      <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; font-family: Arial, sans-serif; font-size: 10pt;">
        <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">${est.nombre || ''} ${est.apellido || ''}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; color: #005293;">${est.correo || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #D8731E;">${est.codigo_constancia || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; color: #475569;">${est.fecha_descarga || 'Descargada'}</td>
      </tr>
    `
      )
      .join('');

    const templateHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Constancias PLAi</x:Name>
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
          <div style="margin-bottom: 15px;">
            <h2 style="color: #005293; margin: 0; font-size: 16pt;">PLAi - Plataforma Abierta de Innovación</h2>
            <h3 style="color: #334155; margin: 5px 0 0 0; font-size: 13pt;">Reporte de Constancias Emitidas: ${tituloCurso}</h3>
            <p style="color: #64748B; font-size: 10pt; margin: 3px 0 15px 0;">Fecha de emisión: ${fechaHoy} | Total constancias: ${resultadoConstancias.datos.length}</p>
          </div>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #005293; color: #FFFFFF; font-weight: bold; font-family: Arial, sans-serif; font-size: 11pt;">
                <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Participante</th>
                <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Correo Electrónico</th>
                <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Código de Constancia</th>
                <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Fecha de Otorgamiento / Descarga</th>
              </tr>
            </thead>
            <tbody>
              ${filasHTML}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([templateHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Constancias_${nombreLimpio}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 min-h-screen">
      {/* Encabezado Módulo Constancias */}
      <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xs gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-3 bg-slate-100 hover:bg-[#005293] text-slate-700 hover:text-white rounded-2xl transition-all cursor-pointer flex items-center justify-center shadow-xs"
            title="Volver al Dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D8731E] bg-[#D8731E]/10 px-3 py-1 rounded-full">
              Módulo de Acreditación
            </span>
            <h1 className="text-2xl font-black text-[#005293] tracking-tight mt-1">Gestión de Constancias Emitidas</h1>
            <p className="text-xs text-slate-500">
              Carga y genera los reportes de constancias o certificados descargados de Moodle.
            </p>
          </div>
        </div>

        {/* Seleccionar Curso del Catálogo */}
        <div className="w-full sm:w-80">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Curso Seleccionado:
          </label>
          <select
            value={cursoSeleccionado?.id || ''}
            onChange={(e) => {
              const found = cursos.find((c) => c.id === Number(e.target.value));
              setCursoSeleccionado(found);
              setResultadoConstancias(null);
              setErrorMensaje(null);
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#005293] cursor-pointer"
          >
            {cursos.length > 0 ? (
              cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.codigo_implementacion})
                </option>
              ))
            ) : (
              <option value="">No hay cursos registrados (Crea uno primero)</option>
            )}
          </select>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {errorMensaje && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
          ⚠️ {errorMensaje}
        </div>
      )}

      {/* Zona de Carga */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#D8731E]">Cargar Archivo de Constancias (Moodle)</h2>
        <div className="border-2 border-dashed border-[#D8731E]/30 rounded-2xl p-8 text-center bg-[#D8731E]/5 relative hover:bg-[#D8731E]/10 transition-all">
          <input
            type="file"
            accept=".xlsx, .xls, .csv, .xlsm"
            onChange={handleSubirConstancias}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Award size={36} className="mx-auto text-[#D8731E] mb-2" />
          <p className="text-sm font-bold text-slate-800">
            {cargando ? (
              <span className="text-[#005293] animate-pulse">Procesando archivo...</span>
            ) : (
              <>
                Sube el registro para: <span className="text-[#D8731E]">{cursoSeleccionado?.nombre || 'Ningún curso seleccionado'}</span>
              </>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">Extrae automáticamente los códigos de constancia y fechas de descarga.</p>
        </div>
      </div>

      {/* Tabla de Resultados de Constancias */}
      {resultadoConstancias && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#005293]">
                Constancias Emitidas: {resultadoConstancias.curso_nombre}
              </h3>
              <p className="text-xs text-slate-400">Total de registros encontrados: {resultadoConstancias.total_registros}</p>
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
                onClick={() => setResultadoConstancias(null)}
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
                  <th className="p-3.5 pl-4">Participante</th>
                  <th className="p-3.5">Correo Electrónico</th>
                  <th className="p-3.5 text-center">Código de Constancia</th>
                  <th className="p-3.5 text-center">Fecha de Otorgamiento / Descarga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {resultadoConstancias.datos.map((est: any) => (
                  <tr key={est.id} className="hover:bg-slate-50">
                    <td className="p-3.5 pl-4 font-bold text-slate-900">{est.nombre} {est.apellido}</td>
                    <td className="p-3.5 font-mono text-slate-500">{est.correo}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-[#D8731E]">{est.codigo_constancia}</td>
                    <td className="p-3.5 text-center font-mono text-slate-600">{est.fecha_descarga}</td>
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