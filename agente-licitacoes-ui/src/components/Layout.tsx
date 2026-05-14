import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-light font-sans">
      <Header />
      {/* Container principal onde as páginas filhas serão renderizadas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="py-6 text-center text-sm text-slate-500">
        MVP TCC - Sistema de Triagem de Licitações com IA
      </footer>
    </div>
  );
}