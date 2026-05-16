import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft,
  Wand2,
  Download,
  Copy,
  CheckCircle2,
  Loader2,
  Edit3,
  Sparkles,
  Save,
  X
} from 'lucide-react';

import { api } from '../services/api';
import html2pdf from 'html2pdf.js';

export function GeradorProposta() {
  const navigate = useNavigate();
  const location = useLocation();

  const edital = location.state?.editalSelecionado;

  const [isGenerating, setIsGenerating] = useState(true);
  const [isImproving, setIsImproving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [documentoIA, setDocumentoIA] = useState('');
  const [textoEditavel, setTextoEditavel] = useState('');

  // Estados do novo modal de ajuste
  const [isImproveModalOpen, setIsImproveModalOpen] =
    useState(false);

  const [instrucoesUser, setInstrucoesUser] =
    useState('');

  const salvarTextoNoBanco = async (
    textoParaSalvar: string
  ) => {
    if (edital && edital.id) {
      try {
        await api.put(
          `/licitacoes/${edital.id}/proposta`,
          {
            textoProposta: textoParaSalvar
          }
        );

        console.log(
          'Texto salvo no banco com sucesso!'
        );
      } catch (error) {
        console.error(
          'Erro ao salvar no banco',
          error
        );
      }
    }
  };

  useEffect(() => {
    if (!edital) {
      alert(
        'Você precisa selecionar um edital primeiro.'
      );

      navigate('/');
      return;
    }

    if (edital.textoProposta) {
      setDocumentoIA(edital.textoProposta);
      setTextoEditavel(edital.textoProposta);
      setIsGenerating(false);

      return;
    }

    api
      .post('/ia/gerar-proposta', {
        ...edital,
        linkPdf: edital.link 
      })
      .then((response) => {
        const texto =
          response.data.propostaText;

        setDocumentoIA(texto);
        setTextoEditavel(texto);
        setIsGenerating(false);

        salvarTextoNoBanco(texto);
      })
      .catch((error) => {
        console.error(
          'Erro ao gerar proposta',
          error
        );

        alert('Erro ao comunicar com a IA.');
        setIsGenerating(false);
      });

  }, [edital, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      textoEditavel
    );

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handlePrintPDF = () => {
    const element = document.getElementById(
      'documento-para-imprimir'
    );

    if (!element) return;

    const opt = {
      margin: 15, 

      filename: `Proposta_${edital.orgao.replace(
        /[^a-z0-9]/gi,
        '_'
      )}.pdf`,

      image: {
        type: 'jpeg',
        quality: 0.98
      },

      html2canvas: {
        scale: 2,
        useCORS: true
      },

      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save();
  };

  const openImproveModal = () => {
    setInstrucoesUser('');
    setIsImproveModalOpen(true);
  };

  const submitImprove = async () => {
    if (!instrucoesUser.trim()) {
      alert(
        'Por favor, digite o que deseja melhorar.'
      );

      return;
    }

    setIsImproveModalOpen(false);
    setIsImproving(true);

    try {
      const response = await api.post(
        '/ia/melhorar-proposta',
        {
          textoAtual: textoEditavel,
          instrucao: instrucoesUser
        }
      );

      const novoTexto =
        response.data.propostaText;

      setDocumentoIA(novoTexto);
      setTextoEditavel(novoTexto);

      salvarTextoNoBanco(novoTexto);
    } catch (error) {
      alert(
        'Erro ao ajustar o documento.'
      );
    } finally {
      setIsImproving(false);
    }
  };

  const toggleEditMode = () => {

    if (isEditing) {
      salvarTextoNoBanco(textoEditavel);
    }

    setIsEditing(!isEditing);
  };

  if (!edital) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            #documento-para-imprimir,
            #documento-para-imprimir * {
              visibility: visible;
            }

            #documento-para-imprimir {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="flex items-center gap-4 no-print">

        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <Wand2
              className="text-brand-green"
              size={24}
            />

            Assistente de Propostas
          </h1>

          <p className="text-slate-500 mt-1">
            {edital.orgao} (
            {edital.modalidade})
          </p>
        </div>
      </div>

      {isGenerating ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px]">

          <Loader2
            size={48}
            className="text-brand-blue animate-spin mb-4"
          />

          <h3 className="text-lg font-bold text-brand-dark mb-2">
            Redigindo proposta nos padrões governamentais...
          </h3>

          <p className="text-slate-500 text-center max-w-md">
            Cruzando os dados do edital com a Lei 14.133 e os impostos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="space-y-4 no-print">

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">

              <h3 className="font-bold text-brand-dark mb-3 text-sm uppercase tracking-wider">
                Ações da IA
              </h3>

              <div className="space-y-2">

                <button
                  onClick={openImproveModal}
                  disabled={
                    isImproving || isEditing
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-bold text-sm disabled:opacity-50"
                >
                  {isImproving ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Sparkles size={16} />
                  )}

                  Ajustar Texto com IA
                </button>

                <button
                  onClick={toggleEditMode}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors font-bold text-sm border ${
                    isEditing
                      ? 'bg-brand-green text-white border-brand-green hover:bg-green-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isEditing ? (
                    <Save size={16} />
                  ) : (
                    <Edit3 size={16} />
                  )}

                  {isEditing
                    ? 'Salvar Edição'
                    : 'Editar Manualmente'}
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">

              <h3 className="font-bold text-brand-dark mb-3 text-sm uppercase tracking-wider">
                Exportação
              </h3>

              <div className="space-y-2">

                <button
                  onClick={handlePrintPDF}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 transition-colors font-medium text-sm"
                >
                  <Download size={16} />
                  Salvar como PDF
                </button>

                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                  {isCopied ? (
                    <CheckCircle2
                      size={16}
                      className="text-brand-green"
                    />
                  ) : (
                    <Copy size={16} />
                  )}

                  {isCopied
                    ? 'Copiado!'
                    : 'Copiar Texto'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-10 rounded-xl shadow-md border border-slate-200 min-h-[800px] font-serif text-slate-800 relative">

            {isImproving && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">

                <Loader2
                  size={40}
                  className="text-indigo-600 animate-spin mb-4"
                />

                <p className="font-bold text-indigo-900">
                  A IA está reescrevendo o documento...
                </p>
              </div>
            )}

            <div
              id="documento-para-imprimir"
              className="max-w-2xl mx-auto"
            >
              {isEditing ? (
                <textarea
                  value={textoEditavel}
                  onChange={(e) =>
                    setTextoEditavel(
                      e.target.value
                    )
                  }
                  className="w-full h-[700px] p-4 border border-brand-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 resize-none font-serif text-justify"
                />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed text-justify">
                  {textoEditavel}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isImproveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 no-print">

          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">

            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">

              <div className="flex items-center gap-2">
                <Sparkles
                  className="text-indigo-600"
                  size={20}
                />

                <h2 className="text-md font-bold text-brand-dark">
                  Ajustar com IA
                </h2>
              </div>

              <button
                onClick={() =>
                  setIsImproveModalOpen(false)
                }
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Como a IA deve alterar este documento?
              </label>

              <textarea
                value={instrucoesUser}
                onChange={(e) =>
                  setInstrucoesUser(
                    e.target.value
                  )
                }
                placeholder="Ex.: altere o valor total para R$ 150.000,00 e adicione uma cláusula informando que o frete está incluso."
                className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              />
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">

              <button
                onClick={() =>
                  setIsImproveModalOpen(false)
                }
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={submitImprove}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Wand2 size={16} />
                Aplicar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}