import { Search, Filter, MapPin, Building, Calendar, ArrowRight } from 'lucide-react';

// Dados simulados do Portal Nacional de Compras Públicas (PNCP) - Antes do filtro da IA
const mockEditaisBrutos = [
  { id: '101', orgao: 'Prefeitura de São Paulo - SP', objeto: 'Aquisição de material de expediente (papel A4, canetas) para a secretaria de educação.', valor: 'R$ 85.000,00', data: '10/04/2026', uf: 'SP' },
  { id: '102', orgao: 'Ministério da Defesa', objeto: 'Contratação de empresa para reforma do telhado do galpão logístico.', valor: 'R$ 340.000,00', data: '12/04/2026', uf: 'DF' },
  { id: '103', orgao: 'Universidade Federal de Minas Gerais', objeto: 'Aquisição de reagentes químicos para laboratório de pesquisa.', valor: 'R$ 55.000,00', data: '14/04/2026', uf: 'MG' },
  { id: '104', orgao: 'Ministério da Educação - MEC', objeto: 'Contratação de empresa especializada no fornecimento de licenças de software e suporte técnico para infraestrutura em nuvem.', valor: 'R$ 450.000,00', data: '15/04/2026', uf: 'DF' },
];

export function BuscaGeral() {
  return (
    <div className="space-y-6">
      
      {/* Cabeçalho da Busca */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Busca de Licitações (PNCP)</h1>
        <p className="text-slate-500 mt-1">Consulte todos os editais disponíveis no portal nacional, sem filtros da IA.</p>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        
        {/* Input principal */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por palavra-chave, número do edital ou órgão..." 
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-slate-50 text-brand-dark"
          />
          <button className="absolute inset-y-1 right-1 bg-brand-blue text-white px-4 rounded-md hover:bg-blue-800 transition-colors font-medium text-sm">
            Buscar
          </button>
        </div>

        {/* Filtros Secundários */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
            <Filter size={16} />
            <select className="bg-transparent outline-none cursor-pointer">
              <option>Modalidade</option>
              <option>Pregão Eletrônico</option>
              <option>Concorrência</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
            <MapPin size={16} />
            <select className="bg-transparent outline-none cursor-pointer">
              <option>Estado (UF)</option>
              <option>SP</option>
              <option>DF</option>
              <option>MG</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Resultados (Estilo "Tabela/Lista" mais densa) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-semibold text-brand-dark">Resultados da Busca (4.521 encontrados)</h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {mockEditaisBrutos.map((edital) => (
            <div key={edital.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded">ABERTA</span>
                  <div className="flex items-center gap-1 text-xs text-brand-blue font-medium">
                    <Building size={14} />
                    {edital.orgao}
                  </div>
                </div>
                <p className="text-sm text-brand-dark leading-relaxed">{edital.objeto}</p>
              </div>

              <div className="flex flex-col md:items-end gap-2 min-w-[150px]">
                <div className="text-sm font-bold text-brand-dark">{edital.valor}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={14} />
                  Abertura: {edital.data}
                </div>
                {/* Botão simples, pois aqui não tem botão verde da IA */}
                <button className="mt-2 text-sm text-brand-blue font-medium flex items-center gap-1 hover:underline">
                  Ver detalhes
                  <ArrowRight size={14} />
                </button>
              </div>
              
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}