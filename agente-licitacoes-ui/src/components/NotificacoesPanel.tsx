import { useState } from 'react';
import { X, BellRing, Mail, Check, Settings, ExternalLink } from 'lucide-react';

interface NotificacoesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificacoesPanel({ isOpen, onClose }: NotificacoesPanelProps) {
  const [abaAtiva, setAbaAtiva] = useState<'avisos' | 'config'>('avisos');
  const [emailSalvo, setEmailSalvo] = useState(false);

  if (!isOpen) return null;

  const handleSalvarConfig = () => {
    setEmailSalvo(true);
    setTimeout(() => setEmailSalvo(false), 2000);
  };

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Painel Lateral */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* Cabeçalho do Painel */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-brand-blue text-white">
          <div className="flex items-center gap-2">
            <BellRing size={20} className="text-brand-green" />
            <h2 className="font-bold text-lg">Central de Alertas</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-800 rounded-full transition-colors text-blue-100">
            <X size={20} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setAbaAtiva('avisos')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${abaAtiva === 'avisos' ? 'text-brand-blue border-b-2 border-brand-blue bg-slate-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Notificações
          </button>
          <button 
            onClick={() => setAbaAtiva('config')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${abaAtiva === 'config' ? 'text-brand-blue border-b-2 border-brand-blue bg-slate-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Settings size={16} /> Configurar E-mails
          </button>
        </div>

        {/* Conteúdo: Avisos */}
        {abaAtiva === 'avisos' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-green"></div>
              <p className="text-xs text-brand-green font-bold mb-1">NOVO MATCH DA IA</p>
              <h4 className="font-semibold text-brand-dark text-sm mb-1">Prefeitura de Curitiba</h4>
              <p className="text-sm text-slate-600 mb-2">Um novo edital compatível com "Licença de Software" foi publicado hoje (Match: 92%).</p>
              <button className="text-xs text-brand-blue font-medium flex items-center gap-1 hover:underline">
                Ver detalhes <ExternalLink size={12} />
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-amber"></div>
              <p className="text-xs text-brand-amber font-bold mb-1">ATENÇÃO: PRAZO</p>
              <h4 className="font-semibold text-brand-dark text-sm mb-1">Ministério da Educação</h4>
              <p className="text-sm text-slate-600">O pregão eletrônico 042/2026 encerra o recebimento de propostas amanhã às 09:00.</p>
            </div>

          </div>
        )}

        {/* Conteúdo: Configuração de Alertas por E-mail */}
        {abaAtiva === 'config' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <h3 className="font-bold text-brand-dark mb-4 text-sm uppercase tracking-wider">Alertas Diários</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Receba um resumo no seu e-mail corporativo apenas quando a Inteligência Artificial encontrar licitações altamente compatíveis com o seu perfil.
            </p>

            <div className="space-y-5 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue" />
                  <span className="text-sm font-medium text-brand-dark">Ativar envio de e-mails</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Frequência do Resumo</label>
                <select className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 text-sm outline-none focus:border-brand-blue">
                  <option>Diário (Às 08:00)</option>
                  <option>Semanal (Segundas às 08:00)</option>
                  <option>Tempo Real (A cada novo match)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Gatilho da IA (Score Mínimo)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="50" max="100" defaultValue="80" className="w-full accent-brand-blue" />
                  <span className="text-sm font-bold text-brand-blue w-12">80%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Só enviar e-mail se o Match for maior que 80%.</p>
              </div>

              <button 
                onClick={handleSalvarConfig}
                className="w-full mt-4 bg-brand-blue text-white py-2 rounded-md hover:bg-blue-800 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {emailSalvo ? <Check size={16} /> : <Mail size={16} />}
                {emailSalvo ? 'Configurações Salvas!' : 'Salvar Preferências'}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}