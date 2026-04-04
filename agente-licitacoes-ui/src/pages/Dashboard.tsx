import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, DollarSign, FileText, Download, X, Building, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import html2pdf from 'html2pdf.js';

interface LicitacaoSalva {
  id: number;
  orgao: string;
  objeto: string;
  local: string;
  dataAbertura: string;
  valorEstimado: string;
  modalidade: string;
  scoreIA: number;
  propostaGerada: boolean;
  textoProposta: string | null;
}

export function Dashboard() {
  const [historico, setHistorico] = useState<LicitacaoSalva[]>([]);
  
  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [propostaSelecionada, setPropostaSelecionada] = useState<LicitacaoSalva | null>(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  
  useEffect(() => {
    api.get('/licitacoes').then(res => setHistorico(res.data)).catch(console.error);
  }, []);

  // Filtra apenas as que tiveram proposta gerada
  const propostasGeradas = historico.filter(lic => lic.propostaGerada === true);

  // Funcao para converter "R$ 450.000,00" em numero para o grafico
  const converterMoeda = (valorStr: string) => {
    if (!valorStr || !valorStr.includes('R$')) return 0;
    const numeroLimpo = valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valor = parseFloat(numeroLimpo);
    return isNaN(valor) ? 0 : valor;
  };

  // Calculos Estatisticos
  const valorTotalFunil = historico.reduce((acc, lic) => acc + converterMoeda(lic.valorEstimado), 0);
  const valorTotalPropostas = propostasGeradas.reduce((acc, lic) => acc + converterMoeda(lic.valorEstimado), 0);
  const taxaConversao = historico.length > 0 ? Math.round((propostasGeradas.length / historico.length) * 100) : 0;

  // Abre o modal e carrega o texto
  const abrirModalProposta = (licitacao: LicitacaoSalva) => {
    setPropostaSelecionada(licitacao);
    setModalAberto(true);
  };

  // Função para exportar como PDF usando html2pdf.js
  const handleDownloadPDF = () => {
    if (!propostaSelecionada) return;

    setGerandoPDF(true);
    
    // Pega a DIV oculta que tem o formato limpo para PDF
    const element = document.getElementById('proposta-view-pdf');
    if (!element) {
        setGerandoPDF(false);
        return;
    }

    const opt = {
      margin:       15,
      filename:     `Proposta_${propostaSelecionada.orgao.replace(/[^a-z0-9]/gi, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        setGerandoPDF(false);
    });
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <BarChart3 className="text-brand-blue" />
          Dashboard e Gestão
        </h1>
        <p className="text-slate-500 mt-1">Metricas de desempenho e historico de propostas emitidas.</p>
      </div>

      {/* Cards de Metricas Avancadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp size={18} /> <h3 className="text-sm font-medium">Oportunidades Mapeadas</h3>
          </div>
          <p className="text-2xl font-bold text-brand-dark">{historico.length}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-brand-green mb-2">
            <CheckCircle2 size={18} /> <h3 className="text-sm font-medium">Propostas Enviadas</h3>
          </div>
          <p className="text-2xl font-bold text-brand-green">{propostasGeradas.length}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-brand-blue mb-2">
            <BarChart3 size={18} /> <h3 className="text-sm font-medium">Taxa de Conversão (Funil)</h3>
          </div>
          <p className="text-2xl font-bold text-brand-blue">{taxaConversao}%</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 bg-brand-dark text-white">
          <div className="flex items-center gap-2 text-slate-300 mb-2">
            <DollarSign size={18} /> <h3 className="text-sm font-medium">Pipeline (R$)</h3>
          </div>
          <p className="text-2xl font-bold">
            {valorTotalPropostas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Lista de Propostas Geradas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-brand-dark flex items-center gap-2">
            <FileText size={18} className="text-brand-blue"/> Historico de Propostas Geradas
          </h2>
        </div>
        
        {propostasGeradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma proposta foi gerada ainda. Va em "Matches da IA" e gere sua primeira proposta!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {propostasGeradas.map(licitacao => (
              <div key={licitacao.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-brand-dark">{licitacao.orgao}</h3>
                  <p className="text-sm text-slate-600 line-clamp-1">{licitacao.objeto}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 uppercase font-bold">Valor Ofertado</p>
                    <p className="font-bold text-brand-green">{licitacao.valorEstimado}</p>
                  </div>
                  
                  <button 
                    onClick={() => abrirModalProposta(licitacao)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-brand-blue rounded hover:bg-slate-200 transition-colors font-medium text-sm border border-slate-200"
                  >
                    <FileText size={16} /> Ver Proposta
                  </button>

                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> ENVIADA
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE VISUALIZAÇÃO DO DOCUMENTO */}
      {modalAberto && propostaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header do Modal */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-brand-blue/10 p-2 rounded-lg">
                  <Building className="text-brand-blue" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-dark">Documento Oficial</h2>
                  <p className="text-sm text-slate-500 truncate max-w-md">{propostaSelecionada.orgao}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Documento (Visualização) */}
            <div className="p-8 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              <div className="bg-white shadow-sm border border-slate-200 p-10 w-full max-w-3xl rounded min-h-[600px]">
                <div id="proposta-view-pdf" className="font-serif text-slate-800 whitespace-pre-wrap leading-relaxed text-justify">
                  {propostaSelecionada.textoProposta ? propostaSelecionada.textoProposta : 
                   "Texto da proposta não encontrado. O documento pode ter sido gerado em uma versão anterior do sistema."}
                </div>
              </div>
            </div>

            {/* Footer do Modal (Ações) */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={!propostaSelecionada.textoProposta || gerandoPDF}
                className="px-4 py-2 text-sm font-medium bg-brand-green text-white rounded-md hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {gerandoPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {gerandoPDF ? 'Gerando...' : 'Baixar PDF'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}