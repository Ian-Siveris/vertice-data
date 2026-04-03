import { X, CheckCircle, AlertTriangle, FileText, FileBadge, Scale } from 'lucide-react';

// Definindo os tipos (TypeScript) para não dar erro
interface ResumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  licitacao: any;
}

export function ResumoModal({ isOpen, onClose, licitacao }: ResumoModalProps) {
  if (!isOpen || !licitacao) return null;

  return (
    // Overlay (Fundo escuro)
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      
      {/* Container do Modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-brand-blue/10 p-2 rounded-lg">
              <FileText className="text-brand-blue" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">Parecer Analítico da IA</h2>
              <p className="text-sm text-slate-500">Documento base: {licitacao.orgao}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal (com scroll) */}
        <div className="p-6 overflow-y-auto">
          
          {/* Resumo em Texto */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Síntese do Edital</h3>
            <p className="text-slate-700 leading-relaxed bg-brand-light p-4 rounded-lg border border-slate-100">
              O edital visa a contratação do objeto listado com foco em manutenção evolutiva. 
              Nossa análise aponta <strong className="text-brand-green">alta compatibilidade (Match de {licitacao.score}%)</strong> com 
              o perfil cadastrado. O capital social exigido é de 10% do valor estimado, critério já atendido 
              pelo seu balanço atual. Não há exigências incomuns de qualificação técnica.
            </p>
          </div>

          {/* Checklist de Validação */}
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Critérios de Habilitação</h3>
          
          <div className="space-y-3">
            {/* Item 1 - Sucesso */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-green-100 bg-green-50/50">
              <CheckCircle className="text-brand-green mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-brand-dark text-sm">CNAE Compatível</p>
                <p className="text-xs text-slate-500 mt-1">O código 6204-0/00 (Consultoria em TI) do seu perfil atende ao item 8.2 do edital.</p>
              </div>
            </div>

            {/* Item 2 - Sucesso */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-green-100 bg-green-50/50">
              <Scale className="text-brand-green mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-brand-dark text-sm">Qualificação Econômico-Financeira</p>
                <p className="text-xs text-slate-500 mt-1">O patrimônio líquido da empresa é superior ao exigido (R$ {licitacao.valorEstimado}).</p>
              </div>
            </div>

            {/* Item 3 - Alerta */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
              <AlertTriangle className="text-brand-amber mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-brand-dark text-sm">Atestado de Capacidade Técnica (Atenção)</p>
                <p className="text-xs text-slate-600 mt-1">
                  Você possui atestados para "Desenvolvimento", mas a banca pode ser rigorosa quanto ao termo "Sustentação" citado no edital. Sugere-se revisão.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            Voltar
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-brand-green text-white rounded-md hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2">
            <FileBadge size={16} />
            Avançar para Proposta
          </button>
        </div>

      </div>
    </div>
  );
}