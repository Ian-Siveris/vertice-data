import { useState } from 'react';
import { Search, User, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NotificacoesPanel } from './NotificacoesPanel';

export function Header() {
  const location = useLocation();
  const [painelAberto, setPainelAberto] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="bg-brand-blue text-white shadow-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-brand-green rounded flex items-center justify-center">
              <Search size={20} className="text-white" />
            </div>
            <span>Vértice<span className="text-brand-green">.Data</span></span>
          </Link>

          {/* Menu de Navegacao Principal */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-brand-green border-b-2 border-brand-green pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Matches da IA
            </Link>
            <Link 
              to="/busca" 
              className={`text-sm font-medium transition-colors ${isActive('/busca') ? 'text-brand-green border-b-2 border-brand-green pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Busca Geral
            </Link>
            {/* NOVO BOTAO: Gestao e Propostas */}
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-brand-green border-b-2 border-brand-green pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Gestao e Propostas
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPainelAberto(true)}
              className="p-2 hover:bg-blue-800 rounded-full transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-amber rounded-full animate-pulse"></span>
            </button>
            
            <Link to="/perfil" className={`flex items-center gap-2 hover:bg-blue-800 px-3 py-2 rounded transition-colors ${isActive('/perfil') ? 'bg-blue-800' : ''}`}>
              <User size={20} />
              <span className="text-sm font-medium hidden sm:block">Meu Perfil</span>
            </Link>
          </div>
        </div>
      </header>

      <NotificacoesPanel isOpen={painelAberto} onClose={() => setPainelAberto(false)} />
    </>
  );
}