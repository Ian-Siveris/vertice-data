import { useState, useEffect } from 'react';
import { Building2, FileCheck, DollarSign, Save } from 'lucide-react';
import { api } from '../services/api';

interface PerfilData {
  razaoSocial: string;
  cnpj: string;
  porte: string;
  sede: string;
  cnaes: string;
  atestadosResumo: string;
  diferenciais: string;
  capitalSocial: string;
  patrimonioLiquido: string;
}

export function Perfil() {
  const [formData, setFormData] = useState<PerfilData>({
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
        if (!response.data) return;
        setFormData(prev => ({ ...prev, ...response.data }));
      })
      .catch(error => console.error("Erro ao carregar perfil:", error));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setCarregando(true);
    setStatusAviso({ tipo: '', mensagem: '' });

    try {
      await api.post('/perfil', formData);
      setStatusAviso({
        tipo: 'sucesso',
        mensagem: 'Perfil salvo! A IA agora usará essas informações.'
      });
      setTimeout(() => setStatusAviso({ tipo: '', mensagem: '' }), 4000);
    } catch (error) {
      console.error(error);
      setStatusAviso({
        tipo: 'erro',
        mensagem: 'Erro ao salvar o perfil. Verifique os dados.'
      });
    } finally {
      setCarregando(false);
    }
  };

  // Classe padrão para todos os inputs ficarem bonitos e visíveis
  const inputBaseClass = "w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue focus:bg-white transition-all shadow-sm";

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-brand-dark">
          Perfil Estratégico da Empresa
        </h1>
        <p className="text-slate-500 mt-1">
          Esses dados melhoram a precisão da IA nas recomendações.
        </p>
      </div>

      {statusAviso.mensagem && (
        <div
          className={`p-4 rounded-md text-sm font-medium ${
            statusAviso.tipo === 'sucesso'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {statusAviso.mensagem}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Identificação */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5 text-brand-blue">
            <Building2 size={20} />
            <h2 className="text-lg font-semibold">Identificação</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Razão Social</label>
              <input name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} placeholder="Ex: Vértice Soluções em TI LTDA" className={inputBaseClass} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">CNPJ</label>
              <input name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" className={inputBaseClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Porte da Empresa</label>
              <select name="porte" value={formData.porte} onChange={handleChange} className={inputBaseClass}>
                <option value="">Selecione o porte</option>
                <option value="ME">Microempresa (ME)</option>
                <option value="EPP">Empresa de Pequeno Porte (EPP)</option>
                <option value="Grande">Grande porte</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Cidade e Estado (Sede)</label>
              <input name="sede" value={formData.sede} onChange={handleChange} placeholder="Ex: Cascavel - PR" className={inputBaseClass} />
            </div>
          </div>
        </div>

        {/* Qualificação */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-5 text-brand-blue">
            <FileCheck size={20} />
            <h2 className="text-lg font-semibold">Qualificação</h2>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">CNAEs (Códigos de Atividade)</label>
              <input
                name="cnaes"
                value={formData.cnaes}
                onChange={handleChange}
                placeholder="Ex: 4751-2/01, 6204-0/00"
                className={inputBaseClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Diferenciais e Certificações</label>
              <textarea
                name="diferenciais"
                value={formData.diferenciais}
                onChange={handleChange}
                placeholder="Ex: ISO 9001, Microsoft Partner, Equipe 24/7..."
                className={`${inputBaseClass} resize-y min-h-[80px]`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Resumo de Experiência (Atestados)</label>
              <textarea
                name="atestadosResumo"
                value={formData.atestadosResumo}
                onChange={handleChange}
                placeholder="Descreva brevemente sua experiência. Ex: Fornecimento de mais de 500 licenças de software para órgãos públicos..."
                className={`${inputBaseClass} resize-y min-h-[120px]`}
              />
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5 text-brand-blue">
            <DollarSign size={20} />
            <h2 className="text-lg font-semibold">Financeiro</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Capital Social (R$)</label>
              <input
                type="number"
                name="capitalSocial"
                value={formData.capitalSocial}
                onChange={handleChange}
                placeholder="Ex: 100000"
                className={inputBaseClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Patrimônio Líquido (R$)</label>
              <input
                type="number"
                name="patrimonioLiquido"
                value={formData.patrimonioLiquido}
                onChange={handleChange}
                placeholder="Ex: 250000"
                className={inputBaseClass}
              />
            </div>
          </div>
        </div>

        {/* Botão */}
        <div className="p-6 bg-slate-50 flex justify-end">
          <button
            onClick={handleSave}
            disabled={carregando}
            className="px-6 py-2.5 text-sm font-bold text-white bg-brand-blue hover:bg-blue-800 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save size={18} />
            {carregando ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>

      </div>
    </div>
  );
}