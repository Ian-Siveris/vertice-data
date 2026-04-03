import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Wand2, Download, Copy, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function GeradorProposta() {
  const navigate = useNavigate();
  const location = useLocation();
  const edital = location.state?.editalSelecionado; // Pega o edital da bagagem
  
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [documentoIA, setDocumentoIA] = useState("");

  useEffect(() => {
    if (!edital) {
      alert("Voce precisa selecionar um edital primeiro.");
      navigate('/busca');
      return;
    }

    api.post('/ia/gerar-proposta', edital)
      .then(response => {
        setDocumentoIA(response.data.propostaText);
        setIsGenerating(false);
        
        // AQUI ESTA A NOVIDADE: Se deu certo, avisa o banco de dados que a proposta foi gerada!
        if (edital.id) {
          api.put(`/licitacoes/${edital.id}/proposta`).catch(console.error);
        }
      })
      .catch(error => {
        console.error("Erro ao gerar proposta", error);
        alert("Erro ao comunicar com a IA.");
        setIsGenerating(false);
      });
  }, [edital, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(documentoIA);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!edital) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <Wand2 className="text-brand-green" size={24} />
            Assistente de Propostas
          </h1>
          <p className="text-slate-500 mt-1">{edital.orgao} ({edital.modalidade})</p>
        </div>
      </div>

      {isGenerating ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 size={48} className="text-brand-blue animate-spin mb-4" />
          <h3 className="text-lg font-bold text-brand-dark mb-2">A processar o edital e o seu perfil...</h3>
          <p className="text-slate-500 text-center max-w-md">
            A Inteligencia Artificial esta redigindo a declaracao formal com os dados da sua empresa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-brand-dark mb-3 text-sm uppercase tracking-wider">Acoes do Documento</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 transition-colors font-medium text-sm">
                  <Download size={16} /> Exportar como PDF
                </button>
                <button 
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                  {isCopied ? <CheckCircle2 size={16} className="text-brand-green" /> : <Copy size={16} />}
                  {isCopied ? 'Copiado!' : 'Copiar Texto'}
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 border border-slate-200 text-brand-dark rounded-md hover:bg-slate-50 transition-colors font-medium text-sm mt-4">
                  <Send size={16} /> Enviar por E-mail
                </button>
              </div>
            </div>

            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 text-brand-green font-bold mb-2">
                <CheckCircle2 size={18} /> Texto Exclusivo
              </div>
              <p className="text-sm text-slate-600">
                Este documento foi redigido pelo ChatGPT exclusivamente para a sua empresa participar da licitacao deste orgao.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-10 rounded-xl shadow-md border border-slate-200 min-h-[600px] font-serif text-slate-800">
            <div className="max-w-2xl mx-auto whitespace-pre-wrap leading-relaxed text-justify">
              {documentoIA}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}