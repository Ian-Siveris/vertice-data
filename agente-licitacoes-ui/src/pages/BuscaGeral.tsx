import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Building, Calendar, ArrowRight, BrainCircuit, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { ResumoModal } from '../components/ResumoModal'; 

interface LicitacaoPNCP {
  orgao: string;
  modalidade: string;
  local: string;
  objeto: string;
  valorEstimado: string;
  dataAbertura: string;
  link: string;
}

export function BuscaGeral() {
  // Inicializa o estado lendo a memoria do navegador (se existir)
  const [palavraChave, setPalavraChave] = useState(() => sessionStorage.getItem('busca_palavra') || '');
  const [editais, setEditais] = useState<LicitacaoPNCP[]>(() => {
    const salvos = sessionStorage.getItem('busca_editais');
    return salvos ? JSON.parse(salvos) : [];
  });
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [analisandoId, setAnalisandoId] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<any>(null);

  // Toda vez que a palavra-chave ou os editais mudarem, salvamos na memoria do navegador
  useEffect(() => {
    sessionStorage.setItem('busca_palavra', palavraChave);
  }, [palavraChave]);

  useEffect(() => {
    sessionStorage.setItem('busca_editais', JSON.stringify(editais));
  }, [editais]);

  const handleBuscar = async () => {
    if (!palavraChave.trim()) return;
    setCarregando(true);
    setErro('');
    setEditais([]);

    try {
      const response = await api.post('/pncp/buscar', { palavraChave });
      if (response.data && response.data.editais) {
        setEditais(response.data.editais);
      } else {
        setErro('Nenhum edital encontrado para esta palavra-chave.');
      }
    } catch (err) {
      console.error(err);
      setErro('Erro ao buscar no portal do Governo. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleAnalisarIA = async (edital: LicitacaoPNCP, index: number) => {
    setAnalisandoId(index);
    try {
      const response = await api.post('/ia/analisar-licitacao', edital);
      
      setResultadoIA({
        ...edital,
        score: response.data.scoreIA,
        justificativa: response.data.justificativa
      });
      
      setModalAberto(true);
    } catch (err: any) {
      console.error(err);
      const msgErro = err.response?.data?.error || "Erro ao analisar com a IA.";
      alert(msgErro);
    } finally {
      setAnalisandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Busca de Licitacoes (PNCP)</h1>
        <p className="text-slate-500 mt-1">Consulte editais em tempo real no portal do governo e analise a compatibilidade.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              value={palavraChave}
              onChange={(e) => setPalavraChave(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="Digite uma palavra-chave (ex: software, nuvem)..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-slate-50 text-brand-dark"
            />
          </div>
          <button 
            onClick={handleBuscar}
            disabled={carregando}
            className="bg-brand-blue text-white px-6 rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm flex items-center gap-2 min-w-[120px] justify-center"
          >
            {carregando ? <Loader2 size={18} className="animate-spin" /> : 'Pesquisar'}
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 font-medium text-sm">
          {erro}
        </div>
      )}

      {editais.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="font-semibold text-brand-dark">Resultados Oficiais ({editais.length} encontrados)</h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            {editais.map((edital, index) => (
              <div key={index} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between gap-6">
                
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-800 text-white rounded tracking-wider uppercase">
                      {edital.modalidade}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-brand-blue font-bold">
                      <Building size={16} />
                      {edital.orgao}
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin size={12} /> {edital.local}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed text-justify line-clamp-3">
                    <span className="font-semibold">Objeto:</span> {edital.objeto}
                  </p>
                </div>

                <div className="flex flex-col md:items-end justify-between gap-4 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="space-y-1 text-left md:text-right w-full">
                    <div className="text-sm font-bold text-brand-dark bg-slate-100 inline-block px-3 py-1 rounded">
                      {edital.valorEstimado}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full mt-auto">
                    <button 
                      onClick={() => handleAnalisarIA(edital, index)}
                      disabled={analisandoId === index}
                      className={`w-full text-white px-4 py-2 rounded font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 ${analisandoId === index ? 'bg-green-400 cursor-not-allowed' : 'bg-brand-green hover:bg-green-600'}`}
                    >
                      {analisandoId === index ? (
                        <><Loader2 size={16} className="animate-spin" /> Pensando...</>
                      ) : (
                        <><BrainCircuit size={16} /> Analisar com IA</>
                      )}
                    </button>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      )}

      <ResumoModal 
        isOpen={modalAberto} 
        onClose={() => setModalAberto(false)} 
        licitacao={resultadoIA} 
      />

    </div>
  );
}