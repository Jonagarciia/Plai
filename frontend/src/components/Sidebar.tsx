import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  LogOut, 
  Menu, 
  ChevronLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Definición de las opciones de navegación principales
  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Cursos', path: '/cursos', icon: BookOpen },
    { label: 'Constancias', path: '/constancias', icon: Award },
  ];

  const esRutaActiva = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* ─── 1. NAVBAR SUPERIOR (CUANDO EL SIDEBAR LATERAL ESTÁ OCULTO) ─── */}
      {!sidebarVisible && (
        <header className="sticky top-0 z-40 bg-[#005293] text-white border-b border-white/10 shadow-md h-16 px-8 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarVisible(true)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
              title="Mostrar menú lateral"
            >
              <Menu size={18} />
              <span className="hidden sm:inline">Mostrar Menú Lateral</span>
            </button>

            {/* Iso / Logo institucional rápido */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B8006B] via-[#D8731E] to-[#8FB63D] flex items-center justify-center font-black text-white text-base shadow-sm">
                P
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider text-white leading-none">PLAi</h1>
                <p className="text-[9px] font-semibold text-blue-100 uppercase tracking-widest mt-0.5">
                  Plataforma Abierta de Innovación
                </p>
              </div>
            </div>
          </div>

          {/* Menú Superior Horizontal */}
          <nav className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const activo = esRutaActiva(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activo
                      ? 'bg-[#B8006B] text-white shadow-md'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Perfil Header */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center border border-white/30">
                AD
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#8FB63D] rounded-full border-2 border-[#005293]"></span>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="text-blue-200 hover:text-[#D8731E] transition-colors p-1.5 cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
      )}

      {/* ─── 2. ESTRUCTURA PRINCIPAL Y SIDEBAR LATERAL ─── */}
      <div className="flex flex-1 w-full min-w-0">
        
        {/* SIDEBAR LATERAL INSTITUCIONAL */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-gradient-to-b from-[#005293] via-[#004075] to-[#1E293B] text-white flex flex-col justify-between p-5 border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${
            sidebarVisible ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            {/* Header del Sidebar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#B8006B] via-[#D8731E] to-[#8FB63D] flex items-center justify-center font-black text-white text-xl shadow-lg">
                  P
                </div>
                <div>
                  <h1 className="text-base font-black tracking-wider text-white leading-tight">PLAi</h1>
                  <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-0.5">
                    Plataforma Abierta
                  </p>
                </div>
              </div>

              {/* Botón Ocultar Menú Lateral */}
              <button
                onClick={() => setSidebarVisible(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Ocultar menú lateral"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Opciones de Navegación Vertical */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const activo = esRutaActiva(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      activo
                        ? 'bg-[#B8006B] text-white shadow-lg shadow-pink-950/40 border border-white/20'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={activo ? 'text-white' : 'text-blue-200'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Sidebar: Usuario Registrado */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/20 text-white font-black text-xs flex items-center justify-center border border-white/20">
                  AD
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#8FB63D] rounded-full border-2 border-[#004075]"></span>
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Admin PLAi</p>
                <p className="text-[10px] text-blue-200 truncate">admin@plai.mx</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="p-2 text-blue-200 hover:text-[#D8731E] hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* CONTENIDO CENTRADO Y DINÁMICO */}
        <main className={`flex-1 w-full min-w-0 transition-all duration-300 ${sidebarVisible ? 'pl-64' : 'pl-0'}`}>
          <div className="max-w-6xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}