import { useState, useEffect } from 'react';
import { X, BellRing, Mail, Check, Settings, ExternalLink, Loader2, Info } from 'lucide-react';
import { api } from '../services/api';

interface NotificacoesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Aviso {
  id: number;
  orgao: string;
  objeto: string;
  scoreIA: number;
  dataAbertura: string;
}

export function NotificacoesPanel({ isOpen, onClose }: NotificacoesPanelProps) {
  const [abaAtiva, setAbaAtiva] = useState<'avisos' | 'config'>('avisos');
  const [emailSalvo, setEmailSalvo] = useState(false);
  const [salvandoBackend, setSalvandoBackend] = useState(false);
  
  // Estados para os dados dinâmicos
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Estados dinâmicos para a aba de configurações
  const [emailAtivo, setEmailAtivo] = useState(true);
  const [freqEmail, setFreqEmail] = useState('Diário (Às 08:00)');
  const [scoreMinimo, setScoreMinimo] = useState(80);

  // Busca os dados assim que o painel é aberto
  useEffect(() => {
    if (isOpen) {
      setCarregando(true);
      
      // 1. Busca o histórico de notificações (Matches)
      api.get('/licitacoes')
        .then(res => {
          const recentes = res.data.slice(0, 10);
          setAvisos(recentes);
        })
        .catch(console.error);

      // 2. Busca as preferências atuais de e-mail do Perfil no Banco de Dados
      api.get('/perfil')
        .then(res => {
          if (res.data && res.data.id) {
             // Atualiza os seletores da tela com os dados que vieram do banco
             setEmailAtivo(res.data.alertaEmailAtivo ?? true);
             setFreqEmail(res.data.alertaFrequencia ?? 'Diário (Às 08:00)');
             setScoreMinimo(res.data.alertaScoreMinimo ?? 80);
          }
        })
        .catch(console.error)
        .finally(() => setCarregando(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Função que salva as configurações no banco de dados
  const handleSalvarConfig = async () => {
    setSalvandoBackend(true);
    try {
      await api.put('/perfil/alertas', { 
        emailAtivo, 
        freqEmail, 
        scoreMinimo 
      });
      
      setEmailSalvo(true);
      setTimeout(() => setEmailSalvo(false), 2000);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar as configurações no servidor.");
    } finally {
      setSalvandoBackend(false);
    }
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
            {avisos.length > 0 && abaAtiva !== 'avisos' && (
              <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {avisos.length}
              </span>
            )}
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
            {carregando ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <Loader2 size={32} className="animate-spin text-brand-blue mb-2" />
                <p className="text-sm font-medium">Buscando alertas...</p>
              </div>
            ) : avisos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50 text-center">
                <Info size={40} className="text-slate-400 mb-3" />
                <h4 className="font-bold text-slate-600">Nenhum alerta ainda</h4>
                <p className="text-sm text-slate-500 mt-1">Gere análises de IA na página de buscas para receber notificações aqui.</p>
              </div>
            ) : (
              avisos.map((aviso) => {
                const isHighMatch = aviso.scoreIA >= 70;
                const corBorda = isHighMatch ? 'bg-brand-green' : 'bg-brand-amber';
                const corTexto = isHighMatch ? 'text-brand-green' : 'text-brand-amber';
                const tituloAviso = isHighMatch ? 'NOVO MATCH DA IA' : 'NOVA OPORTUNIDADE';

                return (
                  <div key={aviso.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                    <div className={`absolute top-0 left-0 w-1 h-full ${corBorda}`}></div>
                    
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-xs font-bold ${corTexto}`}>{tituloAviso}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded bg-slate-100 ${corTexto}`}>
                        Score: {aviso.scoreIA}%
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-brand-dark text-sm mb-1 line-clamp-1" title={aviso.orgao}>
                      {aviso.orgao}
                    </h4>
                    
                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                      {aviso.objeto}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        Abertura: {aviso.dataAbertura}
                      </span>
                      <button 
                        onClick={onClose}
                        className="text-xs text-brand-blue font-medium flex items-center gap-1 hover:underline"
                      >
                        Fechar e visualizar <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Conteúdo: Configuração de Alertas por E-mail */}
        {abaAtiva === 'config' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <h3 className="font-bold text-brand-dark mb-4 text-sm uppercase tracking-wider">Alertas Diários</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Receba um resumo no seu e-mail corporativo apenas quando a Inteligência Artificial encontrar licitações altamente compatíveis com o seu perfil.
            </p>

            {carregando ? (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-blue" /></div>
            ) : (
              <div className="space-y-5 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailAtivo}
                      onChange={(e) => setEmailAtivo(e.target.checked)}
                      className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue" 
                    />
                    <span className="text-sm font-medium text-brand-dark">Ativar envio de e-mails</span>
                  </label>
                </div>

                <div className={`pt-4 border-t border-slate-100 transition-opacity ${!emailAtivo && 'opacity-50 pointer-events-none'}`}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Frequência do Resumo</label>
                  <select 
                    value={freqEmail}
                    onChange={(e) => setFreqEmail(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 text-sm outline-none focus:border-brand-blue"
                  >
                    <option value="Diário (Às 08:00)">Diário (Às 08:00)</option>
                    <option value="Semanal (Segundas às 08:00)">Semanal (Segundas às 08:00)</option>
                    <option value="Tempo Real (A cada novo match)">Tempo Real (A cada novo match)</option>
                  </select>
                </div>

                <div className={`pt-2 transition-opacity ${!emailAtivo && 'opacity-50 pointer-events-none'}`}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gatilho da IA (Score Mínimo)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      value={scoreMinimo}
                      onChange={(e) => setScoreMinimo(Number(e.target.value))}
                      className="w-full accent-brand-blue" 
                    />
                    <span className="text-sm font-bold text-brand-blue w-12">{scoreMinimo}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Só enviar e-mail se o Match for maior ou igual a {scoreMinimo}%.</p>
                </div>

                <button 
                  onClick={handleSalvarConfig}
                  disabled={salvandoBackend}
                  className="w-full mt-4 bg-brand-blue text-white py-2 rounded-md hover:bg-blue-800 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {salvandoBackend ? <Loader2 size={16} className="animate-spin" /> : emailSalvo ? <Check size={16} /> : <Mail size={16} />}
                  {salvandoBackend ? 'Salvando...' : emailSalvo ? 'Configurações Salvas!' : 'Salvar Preferências'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}