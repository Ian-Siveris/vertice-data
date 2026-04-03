import { Building2, FileCheck, DollarSign, Save } from 'lucide-react';

export function Perfil() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Perfil da Empresa</h1>
        <p className="text-slate-500 mt-1">Configure os dados que a IA utilizará para encontrar licitações compatíveis.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Seção 1: Dados Básicos */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-brand-blue">
            <Building2 size={20} />
            <h2 className="text-lg font-semibold">Dados Básicos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
              <input type="text" defaultValue="Tech Solutions LTDA" className="w-full p-2 border border-slate-300 rounded-md bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
              <input type="text" defaultValue="12.345.678/0001-90" className="w-full p-2 border border-slate-300 rounded-md bg-slate-50" />
            </div>
          </div>
        </div>

        {/* Seção 2: Qualificação Técnica (O que mais importa para a IA) */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-brand-blue">
            <FileCheck size={20} />
            <h2 className="text-lg font-semibold">Qualificação Técnica (CNAEs e Atestados)</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNAEs Operacionais (Separados por vírgula)</label>
              <input type="text" defaultValue="6204-0/00, 6201-5/01, 6202-3/00" className="w-full p-2 border border-slate-300 rounded-md" />
              <p className="text-xs text-slate-500 mt-1">A IA usará esses códigos para validar o objeto do edital.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resumo de Atestados de Capacidade Técnica</label>
              <textarea 
                rows={3} 
                defaultValue="Possui atestado para desenvolvimento de software web, sustentação de sistemas legados e consultoria em infraestrutura cloud (AWS/Azure)."
                className="w-full p-2 border border-slate-300 rounded-md resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Seção 3: Qualificação Econômico-Financeira */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-brand-blue">
            <DollarSign size={20} />
            <h2 className="text-lg font-semibold">Parâmetros Financeiros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capital Social (R$)</label>
              <input type="text" defaultValue="500.000,00" className="w-full p-2 border border-slate-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patrimônio Líquido Atual (R$)</label>
              <input type="text" defaultValue="850.000,00" className="w-full p-2 border border-slate-300 rounded-md" />
            </div>
          </div>
        </div>

        {/* Rodapé com botão de salvar */}
        <div className="p-6 bg-slate-50 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button className="px-6 py-2 text-sm font-medium bg-brand-blue text-white rounded-md hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm">
            <Save size={16} />
            Salvar Perfil
          </button>
        </div>

      </div>
    </div>
  );
}