import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { api } from '../services/api';

export function Dashboard() {
  const [historico, setHistorico] = useState<any[]>([]);
  
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

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <BarChart3 className="text-brand-blue" />
          Dashboard e Gestao
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
            <BarChart3 size={18} /> <h3 className="text-sm font-medium">Taxa de Conversao (Funil)</h3>
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
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Valor Ofertado</p>
                    <p className="font-bold text-brand-green">{licitacao.valorEstimado}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> ENVIADA
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}