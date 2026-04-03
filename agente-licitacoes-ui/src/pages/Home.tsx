import { useState } from 'react';
import { BrainCircuit, Calendar, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { ResumoModal } from '../components/ResumoModal';
import { useNavigate } from 'react-router-dom'; // Adicione no topo

const mockMatches = [
  {
    id: '1',
    orgao: 'Ministério da Educação - MEC',
    objeto: 'Contratação de empresa especializada no fornecimento de licenças de software e suporte técnico para infraestrutura em nuvem.',
    valorEstimado: 'R$ 450.000,00',
    dataFim: '15/04/2026',
    score: 98,
    tags: ['Software', 'Cloud']
  },
  {
    id: '2',
    orgao: 'Tribunal de Justiça do Estado',
    objeto: 'Aquisição de equipamentos de informática (servidores) com garantia de atualização tecnológica por 36 meses.',
    valorEstimado: 'R$ 1.200.000,00',
    dataFim: '22/04/2026',
    score: 85,
    tags: ['Hardware', 'Infraestrutura']
  }
];

export function Home() {
  // Criando os estados para controlar o Modal
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState<any>(null);

  // Função para abrir o modal com os dados corretos
  const abrirResumo = (licitacao: any) => {
    setLicitacaoSelecionada(licitacao);
    setModalAberto(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Minhas Atribuições</h1>
          <p className="text-slate-500 mt-1">Licitações triadas e aprovadas pela IA com base no seu perfil.</p>
        </div>
        <button className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors flex items-center gap-2 text-sm font-medium">
          <BrainCircuit size={18} />
          Forçar Nova Triagem
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... (as métricas continuam iguais) ... */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Editais Lidos Hoje</p>
          <p className="text-3xl font-bold text-brand-dark mt-2">142</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 border-b-4 border-b-brand-green">
          <p className="text-sm text-slate-500 font-medium">Matches Encontrados</p>
          <p className="text-3xl font-bold text-brand-green mt-2">2</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Propostas Geradas</p>
          <p className="text-3xl font-bold text-brand-dark mt-2">0</p>
        </div>
      </div>

      {/* Grid de Licitações */}
      <div className="grid grid-cols-1 gap-4 mt-8">
        {mockMatches.map((licitacao) => (
          <div key={licitacao.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-1 bg-green-100 text-brand-green rounded text-uppercase tracking-wider">
                    COMPATÍVEL
                  </span>
                </div>
                <h3 className="text-lg font-bold text-brand-dark">{licitacao.orgao}</h3>
              </div>
              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-2 border border-slate-100 min-w-[80px]">
                <span className="text-xs text-slate-500 font-medium">IA Score</span>
                <span className="text-xl font-bold text-brand-green">{licitacao.score}%</span>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              <span className="font-semibold text-brand-dark">Objeto: </span> 
              {licitacao.objeto}
            </p>

            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-4">
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={16} className="text-slate-400" />
                  <span className="font-medium text-brand-dark">{licitacao.valorEstimado}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <span>Vence em: {licitacao.dataFim}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* AQUI ESTÁ A MÁGICA: O botão agora chama a função abrirResumo */}
                <button 
                  onClick={() => abrirResumo(licitacao)}
                  className="text-brand-blue hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <FileText size={16} />
                  Ver Resumo da IA
                </button>
                <button 
                  onClick={() => navigate('/proposta')}
                  className="bg-brand-green text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle size={16} />
                  Gerar Proposta
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Colocamos o Modal no final do arquivo, fora do fluxo visual normal */}
      <ResumoModal 
        isOpen={modalAberto} 
        onClose={() => setModalAberto(false)} 
        licitacao={licitacaoSelecionada} 
      />
      
    </div>
  );
}