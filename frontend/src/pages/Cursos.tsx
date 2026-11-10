import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  UploadCloud, 
  RefreshCw, 
  X, 
  Edit3, 
  FileText, 
  Search, 
  Filter, 
  RotateCcw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cursos() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [cursoEditar, setCursoEditar] = useState<any | null>(null);

  const anioActual = new Date().getFullYear();

  // Formulario curso nuevo
  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: '',
    codigo_curso: '',
    codigo_implementacion: '',
    modalidad: 'Autogestivo',
    estado: 'Activo',
    estudiantes: 0,
    area: 'General',
    calificacion_minima: '80',
    moodle_url: '#'
  });

  // Cargar catálogo de cursos desde el Backend
  const cargarCursos = () => {
    setLoading(true);
    fetch('http://127.0.0.1:8000/api/v1/cursos')
      .then((res) => res.json())
      .then((data) => {
        setCursos(data.cursos || []);
        setLoading(false);
      })
      .catch(() => {
        setCursos([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  // Extraer lista única de áreas/ejes temáticos dinámicamente
  const areasDisponibles = useMemo(() => {
    const listaAreas = cursos.map((c) => c.area || 'General');
    return Array.from(new Set(listaAreas));
  }, [cursos]);

  // Lógica de filtrado en tiempo real
  const cursosFiltrados = useMemo(() => {
    return cursos.filter((curso) => {
      // 1. Filtro por Búsqueda de Texto
      const texto = busqueda.toLowerCase().trim();
      const coincideTexto =
        !texto ||
        curso.nombre?.toLowerCase().includes(texto) ||
        curso.codigo_curso?.toLowerCase().includes(texto) ||
        curso.codigo_implementacion?.toLowerCase().includes(texto) ||
        curso.area?.toLowerCase().includes(texto);

      // 2. Filtro por Área / Eje Temático
      const coincideArea =
        filtroArea === 'TODAS' || (curso.area || 'General') === filtroArea;

      // 3. Filtro por Estatus
      const coincideEstado =
        filtroEstado === 'TODOS' || (curso.estado || 'Activo') === filtroEstado;

      return coincideTexto && coincideArea && coincideEstado;
    });
  }, [cursos, busqueda, filtroArea, filtroEstado]);

  // Limpiar todos los filtros
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroArea('TODAS');
    setFiltroEstado('TODOS');
  };

  // 1. Crear nuevo curso
  const handleCrearCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoCurso),
      });

      if (!res.ok) {
        alert('Error al agregar el curso');
        return;
      }

      setModalCrearAbierto(false);
      setNuevoCurso({
        nombre: '',
        codigo_curso: '',
        codigo_implementacion: '',
        modalidad: 'Autogestivo',
        estado: 'Activo',
        estudiantes: 0,
        area: 'General',
        calificacion_minima: '80',
        moodle_url: '#'
      });
      cargarCursos();
    } catch {
      alert('Error de conexión con el servidor backend');
    }
  };

  // 2. Abrir Modal de Edición
  const handleAbrirEditar = (curso: any) => {
    setCursoEditar(curso);
    setModalEditarAbierto(true);
  };

  // 3. Guardar Cambios de Edición
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoEditar) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/cursos/${cursoEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cursoEditar),
      });

      if (!res.ok) {
        alert('Error al actualizar el curso');
        return;
      }

      setModalEditarAbierto(false);
      setCursoEditar(null);
      cargarCursos();
    } catch {
      alert('Error de conexión al actualizar el curso');
    }
  };

  // 4. Cambiar estatus directamente en la tabla
  const handleCambiarEstatus = async (curso: any, nuevoEstado: string) => {
    const cursoActualizado = { ...curso, estado: nuevoEstado };
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/cursos/${curso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cursoActualizado),
      });

      if (res.ok) {
        cargarCursos();
      }
    } catch {
      alert('Error al actualizar el estatus');
    }
  };

  // 5. Eliminar curso individual
  const handleEliminarCurso = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el curso "${nombre}"?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/cursos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        cargarCursos();
      } else {
        alert('No se pudo eliminar el curso');
      }
    } catch {
      alert('Error de conexión al eliminar');
    }
  };

  // Subir Excel del Catálogo
  const handleSubirExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/catalogo/subir-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || 'Error al cargar el Excel del catálogo');
        return;
      }

      alert(data.mensaje || 'Catálogo actualizado correctamente');
      cargarCursos();
    } catch {
      alert('Error de conexión con el servidor backend');
    }
  };

  // Vaciar catálogo completo
  const handleVaciarCatalogo = async () => {
    if (!window.confirm('¿Estás seguro de eliminar todo el catálogo de cursos? Las métricas volverán a 0.')) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/catalogo/vaciar', {
        method: 'DELETE',
      });
      const data = await res.json();
      alert(data.mensaje || 'Catálogo vaciado con éxito');
      cargarCursos();
    } catch {
      alert('Error al intentar vaciar el catálogo');
    }
  };

  return (
    <div className="space-y-6 min-h-screen">
      {/* Encabezado Principal */}
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8006B] bg-[#B8006B]/10 px-3 py-1 rounded-full">
              Gestión Educativa
            </span>
            <h1 className="text-2xl font-black text-[#005293] tracking-tight mt-1">Catálogo de Cursos</h1>
            <p className="text-xs text-slate-500">Administra la oferta educativa, edita o procesa reportes individuales.</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModalCrearAbierto(true)}
            className="flex items-center gap-2 bg-[#005293] hover:bg-[#004075] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
          >
            <Plus size={16} />
            <span>Nuevo Curso</span>
          </button>

          <label className="relative flex items-center gap-2 bg-[#B8006B] hover:bg-[#a0005d] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs">
            <UploadCloud size={16} />
            <span>Cargar Catálogo (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleSubirExcel}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>

          <button
            onClick={handleVaciarCatalogo}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-rose-200"
          >
            <Trash2 size={16} />
            <span>Vaciar Catálogo</span>
          </button>
        </div>
      </div>

      {/* ─── BARRA DE BÚSQUEDA Y FILTROS ─── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Buscador de texto */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por curso, código, implementación o área..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#005293] transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtro por Área / Eje Temático */}
          <div className="w-full sm:w-56">
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#005293] cursor-pointer"
            >
              <option value="TODAS">Todas las áreas</option>
              {areasDisponibles.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estatus */}
          <div className="w-full sm:w-44">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#005293] cursor-pointer"
            >
              <option value="TODOS">Todos los estatus</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          {/* Botón Restablecer Filtros */}
          {(busqueda || filtroArea !== 'TODAS' || filtroEstado !== 'TODOS') && (
            <button
              onClick={handleLimpiarFiltros}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              title="Limpiar filtros"
            >
              <RotateCcw size={14} />
              <span>Restablecer</span>
            </button>
          )}

        </div>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong className="text-[#005293] font-black">{cursosFiltrados.length}</strong> de <strong className="text-slate-800">{cursos.length}</strong> cursos en el catálogo
          </span>

          {(busqueda || filtroArea !== 'TODAS' || filtroEstado !== 'TODOS') && (
            <span className="text-[#B8006B] font-bold bg-[#B8006B]/10 px-2.5 py-0.5 rounded-full">
              Filtro activo
            </span>
          )}
        </div>
      </div>

      {/* Tabla del Catálogo de Cursos */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#005293]">Listado de Cursos Registrados</h3>
          <button
            onClick={cargarCursos}
            className="p-2 text-slate-400 hover:text-[#005293] transition-colors cursor-pointer"
            title="Actualizar lista"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="p-4 pl-6">Nombre del Curso</th>
                <th className="p-4">Código / Implementación</th>
                <th className="p-4">Área / Eje Temático</th>
                <th className="p-4">Modalidad</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-center">Estudiantes</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {cursosFiltrados.length > 0 ? (
                cursosFiltrados.map((curso) => (
                  <tr key={curso.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">{curso.nombre}</td>
                    <td className="p-4 font-mono text-[#005293]">
                      <div>{curso.codigo_curso}</div>
                      <div className="text-[10px] text-slate-400">{curso.codigo_implementacion}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">{curso.area || 'General'}</td>
                    <td className="p-4">{curso.modalidad}</td>

                    <td className="p-4">
                      <select
                        value={curso.estado || 'Activo'}
                        onChange={(e) => handleCambiarEstatus(curso, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full outline-none border cursor-pointer ${
                          curso.estado === 'Activo'
                            ? 'bg-[#8FB63D]/20 text-[#506b1a] border-[#8FB63D]/40'
                            : curso.estado === 'Inactivo'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </td>

                    <td className="p-4 text-center font-bold text-slate-900">{curso.estudiantes || 0}</td>
                    
                    {/* ACCIONES */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate('/reporte-detalle', { state: { curso } })}
                          className="flex items-center gap-1 bg-[#B8006B] hover:bg-[#a0005d] text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs text-[11px]"
                          title="Procesar reportes Moodle"
                        >
                          <FileText size={14} />
                          <span>Procesar</span>
                        </button>

                        <button
                          onClick={() => handleAbrirEditar(curso)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer border border-amber-200"
                          title="Modificar curso"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          onClick={() => handleEliminarCurso(curso.id, curso.nombre)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer border border-rose-200"
                          title="Eliminar curso"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-normal">
                    No se encontraron cursos que coincidan con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: REGISTRAR NUEVO CURSO ─── */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#005293]">Registrar Nuevo Curso</h2>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearCurso} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Curso *</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre oficial de la actividad formativa"
                  value={nuevoCurso.nombre}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-[#005293]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código del Curso</label>
                  <input
                    type="text"
                    placeholder="Ej. PLAI-INOV"
                    value={nuevoCurso.codigo_curso}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, codigo_curso: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Implementación</label>
                  <input
                    type="text"
                    placeholder={`Ej. IMP-${anioActual}`}
                    value={nuevoCurso.codigo_implementacion}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, codigo_implementacion: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de Estudiantes</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej. 45"
                    value={nuevoCurso.estudiantes}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, estudiantes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área / Eje Temático</label>
                  <input
                    type="text"
                    placeholder="Ej. Tecnología / Gestión"
                    value={nuevoCurso.area}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, area: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estatus del Curso</label>
                  <select
                    value={nuevoCurso.estado}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, estado: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293] cursor-pointer"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Criterio / Calif. Mínima</label>
                  <input
                    type="text"
                    placeholder="Ej. 80 o Asistencia"
                    value={nuevoCurso.calificacion_minima}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, calificacion_minima: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B8006B] text-white rounded-xl font-bold hover:bg-[#a0005d] transition-colors cursor-pointer shadow-xs"
                >
                  Guardar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: MODIFICAR / EDITAR CURSO ─── */}
      {modalEditarAbierto && cursoEditar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#005293]">Modificar Curso</h2>
              <button
                onClick={() => setModalEditarAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Curso *</label>
                <input
                  type="text"
                  required
                  value={cursoEditar.nombre}
                  onChange={(e) => setCursoEditar({ ...cursoEditar, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-[#005293]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código del Curso</label>
                  <input
                    type="text"
                    value={cursoEditar.codigo_curso}
                    onChange={(e) => setCursoEditar({ ...cursoEditar, codigo_curso: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Implementación</label>
                  <input
                    type="text"
                    value={cursoEditar.codigo_implementacion}
                    onChange={(e) => setCursoEditar({ ...cursoEditar, codigo_implementacion: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de Estudiantes</label>
                  <input
                    type="number"
                    min="0"
                    value={cursoEditar.estudiantes}
                    onChange={(e) => setCursoEditar({ ...cursoEditar, estudiantes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área / Eje Temático</label>
                  <input
                    type="text"
                    value={cursoEditar.area || ''}
                    onChange={(e) => setCursoEditar({ ...cursoEditar, area: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estatus del Curso</label>
                  <select
                    value={cursoEditar.estado || 'Activo'}
                    onChange={(e) => setCursoEditar({ ...cursoEditar, estado: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293] cursor-pointer"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Criterio / Calif. Mínima</label>
                  <input
                    type="text"
                    value={cursoEditar.calificacion_minima || '80'}
                    onChange={(e) => setCursoEditar({ ...cursoEditar, calificacion_minima: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#005293]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005293] text-white rounded-xl font-bold hover:bg-[#004075] transition-colors cursor-pointer shadow-xs"
                >
                  Actualizar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}