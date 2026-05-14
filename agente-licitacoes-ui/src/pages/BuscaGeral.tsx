import { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building,
  BrainCircuit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings2
} from 'lucide-react';

import { api } from '../services/api';
import { ResumoModal } from '../components/ResumoModal';

interface LicitacaoPNCP {
  orgao: string;
  modalidade: string;
  local: string;
  objeto: string;
  valorEstimado: string;
  dataAbertura: string;
  link: string;
}

export function BuscaGeral() {
  const [palavraChave, setPalavraChave] = useState(
    () => sessionStorage.getItem('busca_palavra') || ''
  );

  const [tipoBusca, setTipoBusca] = useState(
    () => sessionStorage.getItem('busca_tipo') || 'todos'
  );

  const [editais, setEditais] = useState<LicitacaoPNCP[]>(() => {
    const salvos = sessionStorage.getItem('busca_editais');
    return salvos ? JSON.parse(salvos) : [];
  });

  // Estados para a paginação
  const [paginaAtual, setPaginaAtual] = useState(
    () => Number(sessionStorage.getItem('busca_pagina')) || 1
  );

  const [totalPaginas, setTotalPaginas] = useState(
    () => Number(sessionStorage.getItem('busca_total_paginas')) || 1
  );

  const [totalRegistros, setTotalRegistros] = useState(
    () => Number(sessionStorage.getItem('busca_total_registros')) || 0
  );

  const [itensPorPagina, setItensPorPagina] = useState(
    () => Number(sessionStorage.getItem('busca_limite')) || 10
  );

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [analisandoId, setAnalisandoId] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<any>(null);

  // Salvando as preferências na memória ao atualizar
  useEffect(() => {
    sessionStorage.setItem('busca_palavra', palavraChave);
    sessionStorage.setItem('busca_tipo', tipoBusca);
    sessionStorage.setItem('busca_editais', JSON.stringify(editais));
    sessionStorage.setItem('busca_pagina', String(paginaAtual));
    sessionStorage.setItem('busca_total_paginas', String(totalPaginas));
    sessionStorage.setItem('busca_total_registros', String(totalRegistros));
    sessionStorage.setItem('busca_limite', String(itensPorPagina));
  }, [
    palavraChave,
    tipoBusca,
    editais,
    paginaAtual,
    totalPaginas,
    totalRegistros,
    itensPorPagina
  ]);

  const handleBuscar = async (
    pagina = 1,
    limite = itensPorPagina
  ) => {
    if (!palavraChave.trim()) return;

    setCarregando(true);
    setErro('');

    try {
      const response = await api.post('/pncp/buscar', {
        palavraChave,
        pagina,
        itensPorPagina: limite,
        tipoDocumento: tipoBusca // Enviando o tipo de filtro selecionado para o back-end
      });

      // Verifica se a lista veio vazia (0 resultados)
      if (response.data && response.data.editais) {
        if (response.data.editais.length === 0) {
          setErro(
            'A busca foi realizada, mas nenhuma licitação ou dispensa foi encontrada para este termo.'
          );

          setEditais([]);
        } else {
          setEditais(response.data.editais);
          setPaginaAtual(response.data.paginaAtual);
          setTotalPaginas(response.data.totalPaginas);
          setTotalRegistros(response.data.totalRegistros);
        }
      }
    } catch (err) {
      console.error(err);

      setErro(
        'Erro ao buscar no portal do governo. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  };

  // Funções de interação com a paginação
  const proximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      handleBuscar(paginaAtual + 1);
    }
  };

  const paginaAnterior = () => {
    if (paginaAtual > 1) {
      handleBuscar(paginaAtual - 1);
    }
  };

  const mudarLimite = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const novoLimite = Number(e.target.value);

    setItensPorPagina(novoLimite);
    handleBuscar(1, novoLimite);
  };

  const handleAnalisarIA = async (
    edital: LicitacaoPNCP,
    index: number
  ) => {
    setAnalisandoId(index);

    try {
      // AQUI ESTÁ A MÁGICA DO RAG: Enviamos o link do edital disfarçado de 'linkPdf'
      const response = await api.post(
        '/ia/analisar-licitacao',
        {
          ...edital,
          linkPdf: edital.link 
        }
      );

      setResultadoIA({
        ...edital,
        score: response.data.scoreIA,
        justificativa: response.data.justificativa
      });

      setModalAberto(true);
    } catch (err: any) {
      console.error(err);

      alert(
        err.response?.data?.error ||
          'Erro ao analisar com a IA.'
      );
    } finally {
      setAnalisandoId(null);
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-brand-dark">
          Busca de Licitações (PNCP)
        </h1>

        <p className="text-slate-500 mt-1">
          Acesso irrestrito a todos os editais, dispensas e inexigibilidades federais.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search
                size={20}
                className="text-slate-400"
              />
            </div>

            <input
              type="text"
              value={palavraChave}
              onChange={(e) => setPalavraChave(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleBuscar(1)
              }
              placeholder="Digite uma palavra-chave (ex.: software, nuvem, notebook)..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-slate-50 text-brand-dark"
            />
          </div>

          <select
            value={tipoBusca}
            onChange={(e) => setTipoBusca(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white text-brand-dark font-medium cursor-pointer"
          >
            <option value="todos">
              Todos (Editais e Dispensas)
            </option>

            <option value="edital">
              Apenas Editais Tradicionais
            </option>

            <option value="aviso_contratacao_direta">
              Apenas Dispensas Diretas
            </option>
          </select>

          <button
            onClick={() => handleBuscar(1)}
            disabled={carregando}
            className="bg-brand-blue text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm flex items-center gap-2 min-w-[120px] justify-center"
          >
            {carregando ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              'Pesquisar'
            )}
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 font-medium text-sm">
          {erro}
        </div>
      )}

      {editais.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col">
              <h2 className="font-semibold text-brand-dark">
                Resultados Oficiais
              </h2>

              <span className="text-xs text-slate-500">
                {totalRegistros.toLocaleString('pt-BR')} licitações totais no portal do governo.
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-300 px-3 py-1.5 rounded-md">
              <Settings2
                size={16}
                className="text-slate-400"
              />

              <label>Exibir:</label>

              <select
                value={itensPorPagina}
                onChange={mudarLimite}
                className="bg-transparent outline-none cursor-pointer font-bold text-brand-blue"
              >
                <option value={10}>
                  10 por página
                </option>

                <option value={20}>
                  20 por página
                </option>

                <option value={50}>
                  50 por página
                </option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {editais.map((edital, index) => (
              <div
                key={index}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="flex-1 space-y-3">

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-800 text-white rounded tracking-wider uppercase">
                      {edital.modalidade}
                    </span>

                    <div className="flex items-center gap-1 text-sm text-brand-blue font-bold">
                      <Building size={16} />
                      {edital.orgao}
                    </div>

                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin size={12} /> {edital.local}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed text-justify line-clamp-3">
                    <span className="font-semibold">
                      Objeto:
                    </span>{' '}
                    {edital.objeto}
                  </p>
                </div>

                <div className="flex flex-col md:items-end justify-between gap-4 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">

                  <div className="space-y-1 text-left md:text-right w-full">
                    <div className="text-sm font-bold text-brand-dark bg-slate-100 inline-block px-3 py-1 rounded">
                      {edital.valorEstimado}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full mt-auto">
                    <button
                      onClick={() =>
                        handleAnalisarIA(edital, index)
                      }
                      disabled={analisandoId === index}
                      className={`w-full text-white px-4 py-2 rounded font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 ${
                        analisandoId === index
                          ? 'bg-green-400 cursor-not-allowed'
                          : 'bg-brand-green hover:bg-green-600'
                      }`}
                    >
                      {analisandoId === index ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <BrainCircuit size={16} />
                          Analisar com IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

            <span className="text-sm text-slate-600 font-medium hidden sm:block">
              Página {paginaAtual} de {totalPaginas}
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">

              <button
                onClick={paginaAnterior}
                disabled={paginaAtual === 1 || carregando}
                className={`flex items-center gap-1 px-4 py-2 rounded text-sm font-medium transition-colors border ${
                  paginaAtual === 1 || carregando
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-brand-dark border-slate-300 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft size={16} />
                Voltar
              </button>

              <span className="text-sm font-bold text-brand-blue sm:hidden">
                {paginaAtual} / {totalPaginas}
              </span>

              <button
                onClick={proximaPagina}
                disabled={
                  paginaAtual === totalPaginas ||
                  carregando
                }
                className={`flex items-center gap-1 px-4 py-2 rounded text-sm font-medium transition-colors border ${
                  paginaAtual === totalPaginas ||
                  carregando
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-brand-dark border-slate-300 hover:bg-slate-50'
                }`}
              >
                Avançar
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <ResumoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        licitacao={resultadoIA}
      />

    </div>
  );
}