import { X, CheckCircle, FileText, FileBadge, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  licitacao: any;
}

export function ResumoModal({ isOpen, onClose, licitacao }: ResumoModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !licitacao) return null;

  const handleGerarProposta = () => {
    onClose(); 
    navigate('/proposta', { state: { editalSelecionado: licitacao } });
  };

  const handleAbrirEdital = () => {
    if (licitacao.link && licitacao.link !== "Sem link") {
        window.open(licitacao.link, '_blank');
    } else {
        window.open("https://pncp.gov.br", '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-brand-blue/10 p-2 rounded-lg">
              <FileText className="text-brand-blue" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">Parecer Analítico da IA</h2>
              <p className="text-sm text-slate-500">Órgão: {licitacao.orgao}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Síntese do Edital</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${licitacao.score >= 70 ? 'bg-green-100 text-green-700' : licitacao.score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                Score de Match: {licitacao.score}%
              </span>
            </div>
            
            <p className="text-slate-700 leading-relaxed bg-brand-light p-4 rounded-lg border border-slate-100 text-justify">
              {licitacao.justificativa ? licitacao.justificativa : "Análise detalhada indisponível."}
            </p>
          </div>

          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Verificações Avançadas</h3>
          
          <div className="space-y-3">
            <button 
              onClick={handleAbrirEdital}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-left"
            >
              <ExternalLink className="text-brand-blue mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold text-slate-700 text-sm">Leitura Completa do PDF do Edital</p>
                <p className="text-xs text-slate-500 mt-1">Acessar a página oficial do Governo para baixar anexos e revisar as regras completas.</p>
              </div>
            </button>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            Fechar Análise
          </button>
          <button 
            onClick={handleGerarProposta}
            className="px-4 py-2 text-sm font-medium bg-brand-green text-white rounded-md hover:bg-green-600 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <FileBadge size={16} />
            Gerar Proposta Oficial
          </button>
        </div>

      </div>
    </div>
  );
}