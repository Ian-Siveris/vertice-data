import { Search, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { api } from '../services/api'; // Certifique-se de ter criado src/services/api.ts

export function Login() {
  const navigate = useNavigate();

  // Teste de conexão com o Back-end ao carregar a tela
  useEffect(() => {
    api.get('/status')
      .then(response => {
        console.log("Conexão com o Back-end estabelecida:", response.data.message);
      })
      .catch(error => {
        console.error("Erro ao conectar com o Back-end:", error);
      });
  }, []);

  // Função para simular o login e redirecionar para a Home
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que a página recarregue
    
    // Futuramente, aqui faremos um api.post('/login', { email, password })
    navigate('/'); // Redireciona para o painel principal
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      
      {/* Container Principal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Cabeçalho do Login */}
        <div className="bg-brand-blue p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center shadow-lg mb-4">
            <Search size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
            Vértice<span className="text-brand-green">.Data</span>
          </h1>
          <p className="text-blue-200 mt-2 text-sm">Inteligência Artificial para Licitações</p>
        </div>

        {/* Formulário */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-brand-dark mb-6 text-center">Acesse sua conta</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Input E-mail */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail corporativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="voce@empresa.com.br" 
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue bg-slate-50 transition-all"
                />
              </div>
            </div>

            {/* Input Senha */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Senha</label>
                <a href="#" className="text-xs text-brand-blue hover:underline font-medium transition-all">Esqueceu a senha?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue bg-slate-50 transition-all"
                />
              </div>
            </div>

            {/* Botão de Entrar */}
            <button 
              type="submit" 
              className="w-full bg-brand-green text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-md mt-2 active:scale-95"
            >
              Entrar na Plataforma
              <ArrowRight size={18} />
            </button>
            
          </form>
        </div>
      </div>
      
      {/* Rodapé da Tela de Login */}
      <p className="text-slate-400 text-sm mt-8">
        © 2026 Vértice Data. Sistema restrito.
      </p>

    </div>
  );
}