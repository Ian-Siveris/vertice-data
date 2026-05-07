import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = 3001;
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Servidor Vertice Data pronto para o TCC!' });
});

app.get('/api/perfil', async (req, res) => {
  try {
    const perfil = await prisma.perfil.findFirst();
    res.json(perfil || { message: "Nenhum perfil cadastrado" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar perfil" });
  }
});

app.post('/api/perfil', async (req, res) => {
  try {
    const { razaoSocial, cnpj, porte, sede, diferenciais, cnaes, atestadosResumo, capitalSocial, patrimonioLiquido } = req.body;
    await prisma.perfil.deleteMany(); 
    const novoPerfil = await prisma.perfil.create({
      data: { 
        razaoSocial, 
        cnpj, 
        porte: porte || "Nao informado",
        sede: sede || "Nao informada",
        diferenciais: diferenciais || "Nenhum",
        cnaes, 
        atestadosResumo, 
        capitalSocial: Number(capitalSocial), 
        patrimonioLiquido: Number(patrimonioLiquido) 
      }
    });
    res.status(201).json(novoPerfil);
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar perfil" });
  }
});

// NOVA ROTA: Salvar preferências de notificação do usuário
app.put('/api/perfil/alertas', async (req, res) => {
  try {
    const { emailAtivo, freqEmail, scoreMinimo } = req.body;
    
    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado. Cadastre a empresa primeiro." });

    const perfilAtualizado = await prisma.perfil.update({
      where: { id: perfil.id },
      data: { 
        alertaEmailAtivo: emailAtivo, 
        alertaFrequencia: freqEmail, 
        alertaScoreMinimo: Number(scoreMinimo) 
      }
    });

    res.json(perfilAtualizado);
  } catch (error) {
    console.error("Erro ao salvar configs de alerta:", error);
    res.status(500).json({ error: "Erro ao salvar preferencias." });
  }
});

app.post('/api/ia/analisar-licitacao', async (req, res) => {
  try {
    const { orgao, objeto, valorEstimado, modalidade, local } = req.body;

    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado. Cadastre a empresa primeiro." });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const promptSistema = `
      Voce e um especialista em licitacoes. Analise o match entre esta EMPRESA e esta LICITACAO.
      Considere o Porte da empresa (ME/EPP tem vantagens), a localidade e os diferenciais.
      
      EMPRESA:
      - Razao Social: ${perfil.razaoSocial}
      - Porte: ${perfil.porte}
      - Localizacao (Sede): ${perfil.sede}
      - Diferenciais/Certificacoes: ${perfil.diferenciais}
      - Experiencia: ${perfil.atestadosResumo}
      - CNAEs: ${perfil.cnaes}
      - Capital Social: R$ ${perfil.capitalSocial}

      LICITACAO:
      - Orgao: ${orgao}
      - Local da Disputa/Execucao: ${local || "Nao informado"}
      - Modalidade: ${modalidade || "Nao informada"}
      - Objeto: ${objeto}
      - Valor: ${valorEstimado}

      Responda APENAS em JSON:
      {
        "score": (um numero de 0 a 100 baseando-se em probabilidade de vitoria e aderencia tecnica/logistica),
        "justificativa": (uma analise profissional justificando a nota, cruzando os dados de sede, porte, valor e objeto)
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: promptSistema }],
      response_format: { type: "json_object" }
    });

    const resultadoIA = JSON.parse(response.choices[0].message.content || "{}");

    const novaLicitacao = await prisma.licitacao.create({
      data: {
        orgao: orgao || "Nao informado",
        objeto: objeto || "Sem descricao",
        valorEstimado: String(valorEstimado),
        dataAbertura: "A definir",
        scoreIA: resultadoIA.score,
        justificativa: resultadoIA.justificativa
      }
    });

    res.json(novaLicitacao);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro na analise da IA." });
  }
});

app.post('/api/ia/triagem-automatica', async (req, res) => {
  try {
    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado." });

    const headers = { "Accept": "application/json", "User-Agent": "Mozilla/5.0" };
    const urlE = `https://pncp.gov.br/api/search/?q=software&tipos_documento=edital&ordenacao=-data_publicacao_pncp&pagina=1`;
    const urlD = `https://pncp.gov.br/api/search/?q=software&tipos_documento=aviso_contratacao_direta&ordenacao=-data_publicacao_pncp&pagina=1`;

    const [resE, resD] = await Promise.all([fetch(urlE, { headers }), fetch(urlD, { headers })]);
    
    const dataE = resE.ok ? await resE.json() : {};
    const dataD = resD.ok ? await resD.json() : {};

    let itemsBrutos = [...(dataE.items || dataE.data || []), ...(dataD.items || dataD.data || [])];
    itemsBrutos.sort((a, b) => new Date(b.data_publicacao_pncp).getTime() - new Date(a.data_publicacao_pncp).getTime());
    
    const items = itemsBrutos.filter((item: any) => item.orgao_nome).slice(0, 3);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    let novosMatches = 0;

    for (const item of items) {
      const objetoLicitacao = item.description || item.titulo || "Sem descricao";
      
      const existe = await prisma.licitacao.findFirst({ where: { objeto: objetoLicitacao } });
      if (existe) continue;

      const orgao = item.orgao_nome || "Orgao nao informado";
      const valor = item.valor_global || item.valorTotalEstimado ? `R$ ${item.valor_global || item.valorTotalEstimado}` : "Valor sob consulta";
      const modalidade = item.modalidade_licitacao_nome || "Nao informada";
      const local = `${item.municipio_nome || 'N/A'} - ${item.uf || 'N/A'}`;

      const promptSistema = `
        Voce e um especialista em licitacoes. Analise o match entre esta EMPRESA e esta LICITACAO.
        
        EMPRESA:
        - Razao Social: ${perfil.razaoSocial}
        - Porte: ${perfil.porte}
        - Sede: ${perfil.sede}
        - Experiencia: ${perfil.atestadosResumo}
        - CNAEs: ${perfil.cnaes}

        LICITACAO:
        - Orgao: ${orgao}
        - Local: ${local}
        - Modalidade: ${modalidade}
        - Objeto: ${objetoLicitacao}
        - Valor: ${valor}

        Responda APENAS em JSON:
        { "score": (0 a 100), "justificativa": (analise justificando a nota) }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: promptSistema }],
        response_format: { type: "json_object" }
      });

      const resultadoIA = JSON.parse(response.choices[0].message.content || "{}");

      await prisma.licitacao.create({
        data: {
          orgao,
          objeto: objetoLicitacao,
          valorEstimado: valor,
          dataAbertura: item.data_publicacao_pncp || "A definir",
          scoreIA: resultadoIA.score,
          justificativa: resultadoIA.justificativa
        }
      });

      novosMatches++;
    }

    res.json({ message: "Triagem concluida com sucesso!", processadas: novosMatches });

  } catch (error) {
    console.error("Erro no Agente Autonomo:", error);
    res.status(500).json({ error: "Erro durante a triagem automatica." });
  }
});

app.post('/api/ia/gerar-proposta', async (req, res) => {
  try {
    const { orgao, objeto, modalidade } = req.body;
    
    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado." });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    // Novo Prompt Baseado nos Documentos Governamentais Oficiais
    const promptSistema = `
      Você é um advogado especialista em licitações públicas.
      Sua missão é redigir uma "CARTA-PROPOSTA PARA FORNECIMENTO" formal.

      DADOS DA EMPRESA:
      Razão Social: ${perfil.razaoSocial}
      CNPJ: ${perfil.cnpj}
      Porte: ${perfil.porte}
      Endereço: ${perfil.sede}

      DADOS DA LICITAÇÃO:
      Órgão: ${orgao}
      Modalidade: ${modalidade}
      Objeto: ${objeto}

      REGRAS DE ESTRUTURAÇÃO (Siga este esqueleto rigorosamente):
      1. Cabeçalho alinhado à esquerda com o Órgão e a Modalidade.
      2. Título centralizado: CARTA-PROPOSTA PARA FORNECIMENTO.
      3. Seção "1. IDENTIFICAÇÃO DA PROPONENTE": Liste Razão Social, CNPJ e Endereço de forma organizada.
      4. Seção "2. DADOS DA PROPOSTA": Inclua "Validade da proposta: 60 (sessenta) dias" e "Prazo de entrega: Conforme Edital".
      5. Seção "3. ESPECIFICAÇÕES DO OBJETO": Descreva brevemente o objeto e crie um "Valor Total da Proposta: R$ [CRIAR UM VALOR ESTIMATIVO COERENTE]".
      6. Seção "4. DECLARAÇÕES LEGAIS OBRIGATÓRIAS": Escreva um parágrafo declarando que estão inclusos no valor cotado todos os tributos, encargos fiscais, sociais, trabalhistas e previdenciários. Declare também que a empresa não incide nas vedações da Lei nº 14.133/2021.
      7. Encerramento: Local e Data (${perfil.sede || 'Sede'}, ${dataHoje}), seguido de um espaço para assinatura do Representante Legal.

      Não use markdown de código. Formate como um documento de texto claro.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: promptSistema }],
    });

    res.json({ propostaText: response.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar a proposta." });
  }
});

app.post('/api/ia/melhorar-proposta', async (req, res) => {
  try {
    const { textoAtual, instrucao } = req.body;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const promptSistema = `
      Você é um revisor jurídico sênior e especialista em licitações públicas. O texto abaixo é uma proposta de licitação.
      O usuário solicitou a seguinte alteração/melhoria no documento: "${instrucao}"
      
      Sua tarefa é REVISAR e AJUSTAR o documento atendendo EXATAMENTE ao pedido do usuário.
      Mantenha a formalidade, corrija eventuais erros de formatação e mantenha os dados originais da empresa e valores intactos (a menos que o usuário peça explicitamente para mudar).
      Não use marcação markdown (como asteriscos ou hashtags), retorne o texto limpo para impressão.
      
      TEXTO ORIGINAL:
      ${textoAtual}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: promptSistema }],
    });

    res.json({ propostaText: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao melhorar a proposta." });
  }
});

app.post('/api/pncp/buscar', async (req, res) => {
  try {
    const { palavraChave, pagina = 1, itensPorPagina = 10, tipoDocumento = 'todos' } = req.body;
    
    if (!palavraChave) return res.status(400).json({ error: "Palavra chave obrigatoria." });

    const termoCodificado = encodeURIComponent(palavraChave);
    const headers = { "Accept": "application/json", "User-Agent": "Mozilla/5.0" };
    
    const pag = Number(pagina);
    const limit = Number(itensPorPagina);

    // Calculamos uma margem gigantesca para a paginação local funcionar mesmo se filtrarmos muitos itens fora.
    // Sempre buscamos desde a API página 1 até a página necessária para preencher o que o usuário quer.
    const itemsNeeded = pag * limit * 2; 
    let apiPagesToFetch = Math.ceil(itemsNeeded / 10);
    if (apiPagesToFetch > 15) apiPagesToFetch = 15; // Proteção para a API do governo não nos bloquear

    const urls: string[] = [];
    for (let i = 1; i <= apiPagesToFetch; i++) {
        urls.push(`https://pncp.gov.br/api/search/?q=${termoCodificado}&tipos_documento=edital&ordenacao=-data_publicacao_pncp&pagina=${i}`);
        urls.push(`https://pncp.gov.br/api/search/?q=${termoCodificado}&tipos_documento=aviso_contratacao_direta&ordenacao=-data_publicacao_pncp&pagina=${i}`);
    }

    // Faz as chamadas simultâneas 
    const responses = await Promise.all(urls.map(url => fetch(url, { headers }).catch(() => null)));
    const jsons = await Promise.all(responses.map(res => (res && res.ok) ? res.json() : {}));

    let todosItems: any[] = [];
    let maxTotalEditais = 0;
    let maxTotalDispensas = 0;

    jsons.forEach((data, index) => {
        if (data && data.items) todosItems.push(...data.items);
        else if (data && data.data) todosItems.push(...data.data);
        
        // Pega os totais oficias que vêm no JSON (sem multiplicadores falsos)
        const tr = Number(data?.totalRegistros || data?.total_registros || data?.totalElements || 0);
        
        if (index % 2 === 0) { // URLS pares eram Editais
            if (tr > maxTotalEditais) maxTotalEditais = tr;
        } else { // URLS ímpares eram Dispensas
            if (tr > maxTotalDispensas) maxTotalDispensas = tr;
        }
    });

    // 1. SOLUÇÃO DO BUG DO TOTAL
    let totalRealEncontrado = 0;
    if (tipoDocumento === 'todos') {
        totalRealEncontrado = maxTotalEditais + maxTotalDispensas;
    } else if (tipoDocumento === 'edital') {
        totalRealEncontrado = maxTotalEditais;
    } else {
        totalRealEncontrado = maxTotalDispensas;
    }

    if (totalRealEncontrado === 0 && todosItems.length > 0) {
        totalRealEncontrado = todosItems.length;
    }

    // Remove as duplicatas que vêm nativamente na API cruzada
    todosItems = todosItems.filter((v, i, a) => a.findIndex(t => t.item_url === v.item_url) === i);

    // Ordenação bruta antes de formatar os dados
    todosItems.sort((a, b) => {
        const dateA = new Date(a.data_publicacao_pncp).getTime();
        const dateB = new Date(b.data_publicacao_pncp).getTime();
        return (dateB || 0) - (dateA || 0);
    });

    let editaisMapeados = todosItems
      .filter((item: any) => item.orgao_nome || item.orgaoEntidade?.razaoSocial)
      .map((item: any) => ({
          orgao: item.orgao_nome || item.orgaoEntidade?.razaoSocial || "Orgao nao informado",
          modalidade: item.modalidade_licitacao_nome || "Nao informada",
          local: `${item.municipio_nome || 'N/A'} - ${item.uf || 'N/A'}`,
          objeto: item.description || item.titulo || "Descricao nao disponivel",
          valorEstimado: item.valor_global || item.valorTotalEstimado ? `R$ ${item.valor_global || item.valorTotalEstimado}` : "Valor sob consulta",
          dataAbertura: item.data_publicacao_pncp || item.data_inicio_vigencia || "Data nao informada",
          link: item.item_url ? `https://pncp.gov.br/app/editais${item.item_url.replace('/compras', '')}` : "Sem link"
      }));

    // 2. SOLUÇÃO DO BUG DE NÃO EXIBIR "10" OU "20" AO FILTRAR (Paginação local)
    if (tipoDocumento === 'edital') {
      editaisMapeados = editaisMapeados.filter((e: any) => 
        !e.modalidade.toLowerCase().includes('dispensa') && 
        !e.modalidade.toLowerCase().includes('inexigibilidade')
      );
    } else if (tipoDocumento === 'aviso_contratacao_direta') {
      editaisMapeados = editaisMapeados.filter((e: any) => 
        e.modalidade.toLowerCase().includes('dispensa') || 
        e.modalidade.toLowerCase().includes('inexigibilidade')
      );
    }

    // Agora que a lista está purificada pelo seu filtro, cortamos os 10 ou 20 exatos para exibir.
    const startIndex = (pag - 1) * limit;
    const endIndex = startIndex + limit;
    const arrayPaginadoParaExibir = editaisMapeados.slice(startIndex, endIndex);

    const totalPaginasCalculadas = Math.max(1, Math.ceil(totalRealEncontrado / limit));

    res.json({ 
      editais: arrayPaginadoParaExibir,
      totalRegistros: totalRealEncontrado,
      totalPaginas: totalPaginasCalculadas,
      paginaAtual: pag
    });

  } catch (error) {
    console.error("ERRO NA ROTA DE BUSCA:", error);
    res.status(500).json({ error: "Falha ao se comunicar com o portal do Governo (PNCP)." });
  }
});

app.get('/api/licitacoes', async (req, res) => {
  try {
    const licitacoes = await prisma.licitacao.findMany({ orderBy: { id: 'desc' } });
    res.json(licitacoes);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar historico de licitacoes." });
  }
});

app.put('/api/licitacoes/:id/proposta', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { textoProposta } = req.body; 
    
    const licitacaoAtualizada = await prisma.licitacao.update({
      where: { id },
      data: { 
        propostaGerada: true,
        textoProposta: textoProposta 
      }
    });
    res.json(licitacaoAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar status da proposta:", error);
    res.status(500).json({ error: "Erro ao atualizar status." });
  }
});

app.listen(PORT, () => {
  console.log(`Back-end rodando em http://localhost:${PORT}`);
});