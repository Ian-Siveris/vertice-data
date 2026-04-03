import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Download, Copy, Send, CheckCircle2, Loader2 } from 'lucide-react';

export function GeradorProposta() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // Simula o tempo de processamento do LLM (IA a gerar o texto)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 2500); // 2.5 segundos de "geração"
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Cabeçalho com botão de voltar */}
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
          <p className="text-slate-500 mt-1">Ministério da Educação - MEC (Pregão Eletrónico 042/2026)</p>
        </div>
      </div>

      {isGenerating ? (
        /* Estado de Carregamento (Loading) */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 size={48} className="text-brand-blue animate-spin mb-4" />
          <h3 className="text-lg font-bold text-brand-dark mb-2">A processar o edital e o seu perfil...</h3>
          <p className="text-slate-500 text-center max-w-md">
            A Inteligência Artificial está a redigir a declaração de habilitação e a proposta comercial com base nas exigências do item 8.2 do edital.
          </p>
        </div>
      ) : (
        /* Estado Concluído (Documento Gerado) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coluna Esquerda: Contexto e Ações */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-brand-dark mb-3 text-sm uppercase tracking-wider">Ações do Documento</h3>
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
                <CheckCircle2 size={18} /> Verificação da IA
              </div>
              <p className="text-sm text-slate-600">
                O documento foi gerado cumprindo 100% das regras de formatação (Anexo III) exigidas pelo órgão público. Os seus dados de contacto foram preenchidos automaticamente.
              </p>
            </div>
          </div>

          {/* Coluna Direita: Editor/Visualizador do Documento (Simulando folha A4) */}
          <div className="lg:col-span-2 bg-white p-10 rounded-xl shadow-md border border-slate-200 min-h-[600px] font-serif text-slate-800">
            <div className="max-w-2xl mx-auto space-y-6">
              <p className="text-right text-sm">São Paulo, 02 de Abril de 2026.</p>
              
              <div className="space-y-1">
                <p className="font-bold uppercase">Ao</p>
                <p className="font-bold uppercase">Ministério da Educação - MEC</p>
                <p>Comissão Permanente de Licitação</p>
                <p>Ref.: Pregão Eletrónico nº 042/2026</p>
              </div>

              <h2 className="text-center font-bold uppercase underline mt-8 mb-6">Proposta Comercial e Declaração de Cumprimento</h2>

              <p className="text-justify leading-relaxed">
                A empresa <strong>Tech Solutions LTDA</strong>, inscrita no CNPJ sob o nº 12.345.678/0001-90, estabelecida na Rua Exemplo, 123, por intermédio do seu representante legal abaixo assinado, vem, respeitosamente, apresentar PROPOSTA COMERCIAL para o fornecimento de licenças de software e suporte técnico para infraestrutura em nuvem, em estrita conformidade com os termos do Edital.
              </p>

              <p className="text-justify leading-relaxed">
                Declaramos, sob as penas da lei, que cumprimos plenamente os requisitos de habilitação estipulados no item 8.2, comprometendo-nos a manter as condições durante toda a execução do contrato.
              </p>

              <p className="text-justify leading-relaxed mt-6">
                <strong>Valor Total Estimado:</strong> R$ 445.000,00 (Quatrocentos e quarenta e cinco mil reais).
              </p>

              <div className="mt-16 text-center">
                <div className="w-64 border-t border-slate-800 mx-auto mb-2"></div>
                <p className="font-bold">Representante Legal</p>
                <p className="text-sm">Tech Solutions LTDA</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}