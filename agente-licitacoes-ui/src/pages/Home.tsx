import { useState, useEffect } from 'react';
import { BrainCircuit, Calendar, DollarSign, FileText, CheckCircle, Loader2, Filter, Search } from 'lucide-react';
import { ResumoModal } from '../components/ResumoModal';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function Home() {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState<any>(null);
  
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [triando, setTriando] = useState(false);

  const [filtroOrdem, setFiltroOrdem] = useState('maior_score');
  const [filtroCard, setFiltroCard] = useState('todas'); 
  // Novo estado para a barra de pesquisa
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    setCarregando(true);
    try {
      const response = await api.get('/licitacoes');
      setHistorico(response.data);
    } catch (error) {
      console.error("Erro ao carregar historico", error);
    } finally {
      setCarregando(false);
    }
  };

  const handleTriagemAutomatica = async () => {
    setTriando(true);
    try {
      const response = await api.post('/ia/triagem-automatica');
      alert(`Triagem concluida! A IA processou e encontrou ${response.data.processadas} novos editais.`);
      carregarHistorico();
    } catch (error) {
      console.error(error);
      alert("Erro ao executar triagem automatica.");
    } finally {
      setTriando(false);
    }
  };

  const abrirResumo = (licitacao: any) => {
    setLicitacaoSelecionada({
      ...licitacao,
      score: licitacao.scoreIA, 
      justificativa: licitacao.justificativa
    });
    setModalAberto(true);
  };

  // Filtro Duplo: Filtra pela aba selecionada E pelo texto digitado
  const historicoFiltrado = historico.filter(licitacao => {
    // 1. Verifica a aba (Card)
    let passaFiltroCard = true;
    if (filtroCard === 'fortes') passaFiltroCard = licitacao.scoreIA >= 70;
    if (filtroCard === 'aguardando') passaFiltroCard = licitacao.scoreIA >= 50;

    // 2. Verifica a busca por texto (Orgao ou Objeto)
    let passaFiltroBusca = true;
    if (termoBusca.trim() !== '') {
      const termo = termoBusca.toLowerCase();
      const orgaoMatch = licitacao.orgao.toLowerCase().includes(termo);
      const objetoMatch = licitacao.objeto.toLowerCase().includes(termo);
      passaFiltroBusca = orgaoMatch || objetoMatch;
    }

    return passaFiltroCard && passaFiltroBusca;
  });

  const historicoOrdenado = [...historicoFiltrado].sort((a, b) => {
    if (filtroOrdem === 'maior_score') return b.scoreIA - a.scoreIA;
    if (filtroOrdem === 'menor_score') return a.scoreIA - b.scoreIA;
    if (filtroOrdem === 'recentes') return b.id - a.id;
    return 0;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Matches da IA</h1>
          <p className="text-slate-500 mt-1">Licitacoes triadas e salvas pelo nosso Agente Autonomo.</p>
        </div>
        <button 
          onClick={handleTriagemAutomatica}
          disabled={triando}
          className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium shadow-sm text-white ${triando ? 'bg-slate-500 cursor-not-allowed' : 'bg-brand-blue hover:bg-blue-800'}`}
        >
          {triando ? (
            <><Loader2 size={18} className="animate-spin" /> O Agente esta varrendo o PNCP...</>
          ) : (
            <><BrainCircuit size={18} /> Forcar Nova Triagem</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setFiltroCard('todas')}
          className={`p-4 rounded-lg shadow-sm border transition-all cursor-pointer hover:shadow-md border-b-4 ${filtroCard === 'todas' ? 'border-brand-blue border-b-brand-blue bg-blue-50' : 'border-slate-200 border-b-transparent bg-white'}`}
        >
          <p className="text-sm text-slate-500 font-medium">Licitacoes Analisadas</p>
          <p className="text-3xl font-bold text-brand-blue mt-2">{historico.length}</p>
        </div>

        <div 
          onClick={() => setFiltroCard('fortes')}
          className={`p-4 rounded-lg shadow-sm border transition-all cursor-pointer hover:shadow-md border-b-4 ${filtroCard === 'fortes' ? 'border-brand-green border-b-brand-green bg-green-50' : 'border-slate-200 border-b-transparent bg-white'}`}
        >
          <p className="text-sm text-slate-500 font-medium">Matches Fortes (Score {'>='} 70)</p>
          <p className="text-3xl font-bold text-brand-green mt-2">
            {historico.filter(h => h.scoreIA >= 70).length}
          </p>
        </div>

        <div 
          onClick={() => setFiltroCard('aguardando')}
          className={`p-4 rounded-lg shadow-sm border transition-all cursor-pointer hover:shadow-md border-b-4 ${filtroCard === 'aguardando' ? 'border-amber-400 border-b-amber-400 bg-amber-50' : 'border-slate-200 border-b-transparent bg-white'}`}
        >
          <p className="text-sm text-slate-500 font-medium">Aguardando Proposta</p>
          <p className="text-3xl font-bold text-amber-500 mt-2">
            {historico.filter(h => h.scoreIA >= 50).length}
          </p>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-blue" />
        </div>
      ) : historico.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-bold text-brand-dark mb-2">Nenhum edital analisado ainda</h3>
          <p className="text-slate-500 mb-4">Clique em "Forcar Nova Triagem" para a IA buscar os editais mais recentes.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          
          {/* Nova Barra de Ferramentas (Pesquisa + Filtro) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 gap-3">
            <h2 className="font-semibold text-slate-700 text-sm whitespace-nowrap">
              Exibindo: <span className="text-brand-blue">{historicoOrdenado.length}</span> {historicoOrdenado.length === 1 ? 'resultado' : 'resultados'}
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              
              {/* Barra de Pesquisa */}
              <div className="flex items-center text-sm text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm w-full sm:w-64 relative">
                <Search size={16} className="text-slate-400 absolute left-3" />
                <input 
                  type="text"
                  placeholder="Buscar orgao ou objeto..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="bg-transparent outline-none w-full pl-6 text-brand-dark placeholder:text-slate-400"
                />
              </div>

              {/* Select de Ordenacao */}
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm w-full sm:w-auto">
                <Filter size={16} className="text-brand-blue shrink-0" />
                <select 
                  value={filtroOrdem}
                  onChange={(e) => setFiltroOrdem(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer text-brand-dark font-medium w-full"
                >
                  <option value="maior_score">Mais Compativeis (Maior Score)</option>
                  <option value="menor_score">Menos Compativeis (Menor Score)</option>
                  <option value="recentes">Adicionados Recentemente</option>
                </select>
              </div>

            </div>
          </div>

          {/* Grid de Resultados */}
          {historicoOrdenado.length === 0 ? (
             <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
               <p className="text-slate-500">Nenhuma licitacao encontrada para a sua busca atual.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {historicoOrdenado.map((licitacao) => (
                <div key={licitacao.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded tracking-wider uppercase ${licitacao.scoreIA >= 70 ? 'bg-green-100 text-brand-green' : licitacao.scoreIA >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {licitacao.scoreIA >= 70 ? 'ALTA COMPATIBILIDADE' : licitacao.scoreIA >= 40 ? 'MEDIA COMPATIBILIDADE' : 'BAIXA COMPATIBILIDADE'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-brand-dark">{licitacao.orgao}</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-2 border border-slate-100 min-w-[80px]">
                      <span className="text-xs text-slate-500 font-medium">IA Score</span>
                      <span className={`text-xl font-bold ${licitacao.scoreIA >= 70 ? 'text-brand-green' : licitacao.scoreIA >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {licitacao.scoreIA}%
                      </span>
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
                        <span>Abertura: {licitacao.dataAbertura?.substring(0, 10)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => abrirResumo(licitacao)}
                        className="text-brand-blue hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        <FileText size={16} />
                        Ver Analise da IA
                      </button>
                      <button 
                        onClick={() => navigate('/proposta', { state: { editalSelecionado: licitacao } })}
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
          )}
        </div>
      )}

      <ResumoModal 
        isOpen={modalAberto} 
        onClose={() => setModalAberto(false)} 
        licitacao={licitacaoSelecionada} 
      />
      
    </div>
  );
}