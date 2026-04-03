import { useState, useEffect } from 'react';
import { Building2, FileCheck, DollarSign, Save, MapPin, Award } from 'lucide-react';
import { api } from '../services/api';

export function Perfil() {
  const [formData, setFormData] = useState({
    razaoSocial: '',
    cnpj: '',
    porte: '',
    sede: '',
    cnaes: '',
    atestadosResumo: '',
    diferenciais: '',
    capitalSocial: '',
    patrimonioLiquido: ''
  });

  const [statusAviso, setStatusAviso] = useState({ tipo: '', mensagem: '' });
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    api.get('/perfil')
      .then(response => {
        if (response.data && response.data.razaoSocial) {
          setFormData({
            razaoSocial: response.data.razaoSocial || '',
            cnpj: response.data.cnpj || '',
            porte: response.data.porte || '',
            sede: response.data.sede || '',
            cnaes: response.data.cnaes || '',
            atestadosResumo: response.data.atestadosResumo || '',
            diferenciais: response.data.diferenciais || '',
            capitalSocial: response.data.capitalSocial || '',
            patrimonioLiquido: response.data.patrimonioLiquido || ''
          });
        }
      })
      .catch(error => console.error("Erro ao carregar perfil:", error));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setCarregando(true);
    setStatusAviso({ tipo: '', mensagem: '' });

    try {
      await api.post('/perfil', formData);
      setStatusAviso({ tipo: 'sucesso', mensagem: 'Perfil salvo! A IA analisará suas licitacoes com base nestes novos dados.' });
      setTimeout(() => setStatusAviso({ tipo: '', mensagem: '' }), 4000);
    } catch (error) {
      console.error(error);
      setStatusAviso({ tipo: 'erro', mensagem: 'Erro ao salvar o perfil. Verifique os dados.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Perfil Estrategico da Empresa</h1>
        <p className="text-slate-500 mt-1">Dados completos melhoram a precisao da Inteligencia Artificial na busca por oportunidades.</p>
      </div>

      {statusAviso.mensagem && (
        <div className={`p-4 rounded-md text-sm font-medium ${statusAviso.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {statusAviso.mensagem}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Sessao 1: Identificacao e Localidade */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-brand-blue">
            <Building2 size={20} />
            <h2 className="text-lg font-semibold">Identificacao e Localidade</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razao Social</label>
              <input 
                type="text" 
                name="razaoSocial"
                value={formData.razaoSocial}
                onChange={handleChange}
                placeholder="Nome completo da empresa" 
                className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 focus:ring-2 focus:ring-brand-blue outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
              <input 
                type="text" 
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00" 
                className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 focus:ring-2 focus:ring-brand-blue outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Porte da Empresa</label>
              <select 
                name="porte"
                value={formData.porte}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 focus:ring-2 focus:ring-brand-blue outline-none"
              >
                <option value="">Selecione...</option>
                <option value="ME (Microempresa)">ME (Microempresa)</option>
                <option value="EPP (Empresa de Pequeno Porte)">EPP (Empresa de Pequeno Porte)</option>
                <option value="Demais (Grande Porte)">Demais / Grande Porte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={14} className="text-slate-400"/> Cidade/Estado Sede
              </label>
              <input 
                type="text" 
                name="sede"
                value={formData.sede}
                onChange={handleChange}
                placeholder="Ex: Curitiba - PR" 
                className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 focus:ring-2 focus:ring-brand-blue outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Sessao 2: Qualificacao */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-brand-blue">
            <FileCheck size={20} />
            <h2 className="text-lg font-semibold">Qualificacao Tecnica e Diferenciais</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNAEs Operacionais (Separados por virgula)</label>
              <input 
                type="text" 
                name="cnaes"
                value={formData.cnaes}
                onChange={handleChange}
                placeholder="Codigos CNAE" 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Award size={14} className="text-slate-400"/> Certificacoes e Diferenciais (Opcional)
              </label>
              <input 
                type="text" 
                name="diferenciais"
                value={formData.diferenciais}
                onChange={handleChange}
                placeholder="Ex: ISO 9001, Certificado AWS, LGPD Compliant" 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue outline-none" 
              />
              <p className="text-xs text-slate-500 mt-1">A IA usara isso para destacar sua empresa em editais rigorosos.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resumo de Atestados de Capacidade Tecnica</label>
              <textarea 
                rows={3} 
                name="atestadosResumo"
                value={formData.atestadosResumo}
                onChange={handleChange}
                placeholder="Descreva a experiencia pratica da empresa e os valores maximos atestados."
                className="w-full p-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-brand-blue outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Sessao 3: Financeiro */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-brand-blue">
            <DollarSign size={20} />
            <h2 className="text-lg font-semibold">Parametros Financeiros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capital Social Atual (Apenas numeros)</label>
              <input 
                type="number" 
                name="capitalSocial"
                value={formData.capitalSocial}
                onChange={handleChange}
                placeholder="0.00" 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patrimonio Liquido (Apenas numeros)</label>
              <input 
                type="number" 
                name="patrimonioLiquido"
                value={formData.patrimonioLiquido}
                onChange={handleChange}
                placeholder="0.00" 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={handleSave}
            disabled={carregando}
            className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center gap-2 shadow-sm ${carregando ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-blue hover:bg-blue-800'}`}
          >
            <Save size={16} />
            {carregando ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>

      </div>
    </div>
  );
}