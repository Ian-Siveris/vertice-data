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

async function buscarUrlDoPdfReal(urlHtml: string): Promise<string | null> {
  try {
    const regex = /\/(\d{14})\/(\d{4})\/(\d+)/;
    const match = urlHtml.match(regex);

    if (!match) {
        console.log(`[PNCP] Não foi possível extrair chaves da URL: ${urlHtml}`);
        return null;
    }

    const [_, cnpj, ano, sequencial] = match;
    const arquivosApiUrl = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos`;

    const response = await fetch(arquivosApiUrl);
    if (!response.ok) return null;

    const arquivos = await response.json();

    let arquivoPdf = arquivos.find((arq: any) => 
        (arq.tipoDocumentoId === 1 || arq.titulo?.toLowerCase().includes('edital')) && 
        arq.titulo?.toLowerCase().includes('.pdf')
    );

    if (!arquivoPdf) {
        arquivoPdf = arquivos.find((arq: any) => arq.titulo?.toLowerCase().includes('.pdf'));
    }

    if (arquivoPdf) {
        const idArquivo = arquivoPdf.sequencial || arquivoPdf.sequencialDocumento || arquivoPdf.idArquivo || arquivoPdf.id;

        if (!idArquivo) {
           console.log(`[PNCP] Encontrou o PDF, mas a chave de ID mudou. Chaves disponíveis na API: ${Object.keys(arquivoPdf).join(', ')}`);
           return null;
        }

        const linkDownload = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos/${idArquivo}`;
        console.log(`[PNCP] Sucesso! PDF Encontrado: ${arquivoPdf.titulo} (ID Interno: ${idArquivo})`);
        
        return linkDownload;
    }

    console.log(`[PNCP] Nenhum PDF encontrado publicamente nos anexos deste órgão.`);
    return null;
  } catch (error) {
    console.error("Erro na API de arquivos do PNCP:", error);
    return null;
  }
}

async function extrairTextoDoPdf(urlHtml: string): Promise<string> {
  try {
    console.log(`\n[RAG] Iniciando engenharia reversa do link...`);
    
    const urlBinarioPdf = await buscarUrlDoPdfReal(urlHtml);

    if (!urlBinarioPdf) {
        console.log(`[RAG] PDF indisponível. Análise será baseada no resumo.`);
        return "O documento PDF não foi anexado publicamente ou não está disponível. Análise baseada apenas no resumo do objeto.";
    }

    console.log(`[RAG] Baixando Stream do PDF Binário: ${urlBinarioPdf}`);

    const response = await fetch(urlBinarioPdf);
    if (!response.ok) return "Erro ao tentar baixar o arquivo binário.";
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[RAG] Decodificando documento (${buffer.length} bytes)...`);
    
    const evalRequire = eval('require');
    const PDFParser = evalRequire("pdf2json");
    
    let textoBruto = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        
        pdfParser.on("pdfParser_dataError", (errData: any) => {
            reject(new Error(errData.parserError));
        });
        
        pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
        });
        
        pdfParser.parseBuffer(buffer);
    });
    
    textoBruto = decodeURIComponent(textoBruto).replace(/\r\n/g, ' ').replace(/\s+/g, ' ');
    
    console.log("\n==================================================");
    console.log("[RAG] TEXTO EXTRAÍDO COM SUCESSO (Preview):");
    console.log("==================================================");
    console.log(textoBruto.substring(0, 1500) + "\n\n... [CONTINUA LENDO EM BACKGROUND]");
    console.log("==================================================\n");
    
    if (textoBruto.length > 35000) {
      textoBruto = textoBruto.substring(0, 35000) + "\n... [TEXTO TRUNCADO POR LIMITE DE TOKENS DA IA]";
    }
    
    return textoBruto;
  } catch (error) {
    console.error("Erro Crítico no extrator RAG:", error);
    return "Falha na extração do texto. O PDF pode estar protegido ou o formato é incompatível.";
  }
}

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Servidor Vertice Data operacional.' });
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

app.put('/api/perfil/alertas', async (req, res) => {
  try {
    const { emailAtivo, freqEmail, scoreMinimo } = req.body;
    
    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado." });

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
    const { orgao, objeto, valorEstimado, modalidade, local, linkPdf } = req.body;

    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado." });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let textoEdital = "Texto completo não fornecido. Análise baseada apenas no resumo do objeto.";
    if (linkPdf && linkPdf !== "Sem link") {
      textoEdital = await extrairTextoDoPdf(linkPdf);
    }

    const promptSistema = `
      Você é um Analista de Risco e Viabilidade Sênior especialista em licitações públicas.
      Analise o match entre a EMPRESA e as regras ocultas do EDITAL.
      
      DADOS DA EMPRESA:
      - Razão Social: ${perfil.razaoSocial}
      - Porte: ${perfil.porte}
      - Localização (Sede): ${perfil.sede}
      - Diferenciais: ${perfil.diferenciais}
      - Experiência: ${perfil.atestadosResumo}
      - CNAEs: ${perfil.cnaes}

      DADOS BÁSICOS DO EDITAL:
      - Órgão: ${orgao}
      - Local da Disputa: ${local || "Não informado"}
      - Modalidade: ${modalidade || "Não informada"}
      - Valor: ${valorEstimado}
      - Objeto: ${objeto}

      DOCUMENTO EXTRAÍDO (RAG ATIVADO)
      Abaixo está o texto bruto extraído do PDF do edital. Leia com atenção e procure por:
      1. Exigências rigorosas de Atestados de Capacidade Técnica.
      2. Prazos de entrega.
      3. Multas contratuais e penalidades.
      
      [INÍCIO DO TEXTO DO PDF]
      ${textoEdital}
      [FIM DO TEXTO DO PDF]

      Responda APENAS em JSON estrito:
      {
        "score": (um número de 0 a 100 baseado na chance real de vitória),
        "justificativa": (um parágrafo profissional justificando a nota baseada no documento)
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
        orgao: orgao || "Não informado",
        objeto: objeto || "Sem descrição",
        valorEstimado: String(valorEstimado),
        dataAbertura: "A definir",
        scoreIA: resultadoIA.score,
        justificativa: resultadoIA.justificativa
      }
    });

    res.json(novaLicitacao);
  } catch (error) {
    console.error("Erro na análise da IA:", error);
    res.status(500).json({ error: "Erro na análise da IA." });
  }
});

app.post('/api/ia/triagem-automatica', async (req, res) => {
  try {
    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado." });

    const headers = { "Accept": "application/json", "User-Agent": "Mozilla/5.0" };
    const urlE = `https://pncp.gov.br/api/search/?q=software&tipos_documento=edital&ordenacao=-data_publicacao_pncp&pagina=1`;
    
    const resE = await fetch(urlE, { headers });
    const dataE = resE.ok ? await resE.json() : {};

    let itemsBrutos = dataE.items || dataE.data || [];
    const items = itemsBrutos.filter((item: any) => item.orgao_nome).slice(0, 2); 
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    let novosMatches = 0;

    for (const item of items) {
      const objetoLicitacao = item.description || item.titulo || "Sem descrição";
      
      const existe = await prisma.licitacao.findFirst({ where: { objeto: objetoLicitacao } });
      if (existe) continue;

      const orgao = item.orgao_nome || "Órgão não informado";
      const valor = item.valor_global || item.valorTotalEstimado ? `R$ ${item.valor_global || item.valorTotalEstimado}` : "Valor sob consulta";
      
      const linkPdf = item.item_url ? `https://pncp.gov.br/app/editais${item.item_url.replace('/compras', '')}` : null;
      let textoEdital = "Análise baseada no resumo.";
      
      if (linkPdf) {
          textoEdital = await extrairTextoDoPdf(linkPdf); 
      }

      const promptSistema = `
        Atue como um Agente de Triagem Autônoma. Analise o match entre a EMPRESA e esta LICITAÇÃO.
        
        EMPRESA: Sede: ${perfil.sede} | Porte: ${perfil.porte} | Atestados: ${perfil.atestadosResumo}
        LICITAÇÃO: ${orgao} - ${objetoLicitacao} - Valor: ${valor}
        
        TEXTO DO EDITAL (RAG):
        ${textoEdital}

        Seja rigoroso. Responda em JSON: { "score": (0 a 100), "justificativa": (sua análise) }
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

    res.json({ message: "Triagem com leitura de PDFs concluída!", processadas: novosMatches });

  } catch (error) {
    console.error("Erro no Agente Autônomo:", error);
    res.status(500).json({ error: "Erro durante a triagem automática." });
  }
});

app.post('/api/ia/gerar-proposta', async (req, res) => {
  try {
    const { orgao, objeto, modalidade, linkPdf } = req.body;
    
    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado." });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    let textoEdital = "Texto completo do edital não fornecido. Baseie-se apenas no resumo do objeto.";
    if (linkPdf && linkPdf !== "Sem link") {
      textoEdital = await extrairTextoDoPdf(linkPdf);
    }

    const promptRedator = `
      Você é um advogado especialista em licitações públicas.
      Sua missão é redigir uma "CARTA-PROPOSTA PARA FORNECIMENTO" formal baseada no EDITAL OFICIAL fornecido.

      DADOS DA EMPRESA:
      Razão Social: ${perfil.razaoSocial}
      CNPJ: ${perfil.cnpj}
      Porte: ${perfil.porte}
      Endereço: ${perfil.sede}

      DADOS BÁSICOS DA LICITAÇÃO:
      Órgão: ${orgao}
      Modalidade: ${modalidade}
      Objeto: ${objeto}

      TEXTO DO EDITAL (RAG ATIVADO):
      Leia o texto abaixo extraído do PDF oficial. Extraia e inclua na proposta as "Condições de Pagamento", "Prazos de Entrega" e "Garantias" exigidas pelo órgão. Se não constarem, crie termos genéricos padrão de licitação.
      
      [INÍCIO DO EDITAL]
      ${textoEdital}
      [FIM DO EDITAL]

      REGRAS DE ESTRUTURAÇÃO OBRIGATÓRIAS:
      1. Cabeçalho alinhado à esquerda com o Órgão e a Modalidade.
      2. Título centralizado: CARTA-PROPOSTA PARA FORNECIMENTO.
      3. Seção "1. IDENTIFICAÇÃO DA PROPONENTE": Liste Razão Social, CNPJ e Endereço.
      4. Seção "2. DADOS DA PROPOSTA": Inclua Validade (60 dias) e os Prazos e Condições extraídos do Edital acima.
      5. Seção "3. ESPECIFICAÇÕES DO OBJETO": Descreva brevemente o objeto e crie um "Valor Total da Proposta: R$ [ESTIME UM VALOR]".
      6. Seção "4. DECLARAÇÕES LEGAIS": Declare inclusão de todos os tributos e obediência à Lei nº 14.133/2021.
      7. Encerramento: Local e Data (${perfil.sede || 'Sede'}, ${dataHoje}), seguido de assinatura.

      Não use marcação markdown de código (como \`\`\`). Retorne apenas o texto puro do documento.
    `;

    const responseRedator = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: promptRedator }],
    });

    const rascunhoProposta = responseRedator.choices[0].message.content || "";

    const promptAuditor = `
      Você é um Auditor Sênior de Compliance em Licitações.
      Sua tarefa é revisar o documento gerado pelo Redator e garantir que não houve alucinação nos dados imutáveis da empresa.

      DADOS IMUTÁVEIS (VERDADE ABSOLUTA DO BANCO DE DADOS):
      - Razão Social: ${perfil.razaoSocial}
      - CNPJ: ${perfil.cnpj}
      - Endereço: ${perfil.sede}

      DOCUMENTO GERADO PELO REDATOR:
      ${rascunhoProposta}

      INSTRUÇÕES DE AUDITORIA:
      1. Analise o documento gerado.
      2. Verifique se a Razão Social, CNPJ e Endereço constam no documento e estão EXATAMENTE iguais aos Dados Imutáveis fornecidos acima.
      3. Se o Redator tiver omitido, errado ou inventado algum desses dados, corrija o texto do documento silenciosamente.
      4. Se o documento estiver correto, mantenha-o intacto.
      5. Retorne APENAS o documento final validado, pronto para impressão. Não adicione comentários, introduções ou notas de revisão.
    `;

    const responseAuditor = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: promptAuditor }],
    });

    res.json({ propostaText: responseAuditor.choices[0].message.content });

  } catch (error) {
    console.error("Erro no pipeline Multi-Agent da Proposta:", error);
    res.status(500).json({ error: "Erro ao gerar a proposta auditada." });
  }
});

app.post('/api/ia/melhorar-proposta', async (req, res) => {
  try {
    const { textoAtual, instrucao } = req.body;
    
    const perfil = await prisma.perfil.findFirst();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const promptSistema = `
      Você é um revisor jurídico sênior e especialista em licitações públicas. O texto abaixo é uma proposta de licitação.
      O usuário solicitou a seguinte alteração/melhoria no documento: "${instrucao}"
      
      Sua tarefa é REVISAR e AJUSTAR o documento atendendo EXATAMENTE ao pedido do usuário.
      Mantenha a formalidade, corrija eventuais erros de formatação.
      
      REGRA DE OURO (MEMÓRIA GLOBAL): 
      NUNCA altere, invente ou apague os dados reais da empresa durante a reescrita. O CNPJ, Razão Social e Endereço devem permanecer estritamente os seguintes:
      - Razão Social: ${perfil?.razaoSocial || "Dados não informados"}
      - CNPJ: ${perfil?.cnpj || "Dados não informados"}
      - Sede: ${perfil?.sede || "Dados não informados"}
      
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

    const itemsNeeded = pag * limit * 2; 
    let apiPagesToFetch = Math.ceil(itemsNeeded / 10);
    if (apiPagesToFetch > 15) apiPagesToFetch = 15;

    const urls: string[] = [];
    for (let i = 1; i <= apiPagesToFetch; i++) {
        urls.push(`https://pncp.gov.br/api/search/?q=${termoCodificado}&tipos_documento=edital&ordenacao=-data_publicacao_pncp&pagina=${i}`);
        urls.push(`https://pncp.gov.br/api/search/?q=${termoCodificado}&tipos_documento=aviso_contratacao_direta&ordenacao=-data_publicacao_pncp&pagina=${i}`);
    }

    const responses = await Promise.all(urls.map(url => fetch(url, { headers }).catch(() => null)));
    const jsons = await Promise.all(responses.map(res => (res && res.ok) ? res.json() : {}));

    let todosItems: any[] = [];
    let maxTotalEditais = 0;
    let maxTotalDispensas = 0;

    jsons.forEach((data, index) => {
        if (data && data.items) todosItems.push(...data.items);
        else if (data && data.data) todosItems.push(...data.data);
        
        const tr = Number(data?.totalRegistros || data?.total_registros || data?.totalElements || 0);
        
        if (index % 2 === 0) { 
            if (tr > maxTotalEditais) maxTotalEditais = tr;
        } else { 
            if (tr > maxTotalDispensas) maxTotalDispensas = tr;
        }
    });

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

    todosItems = todosItems.filter((v, i, a) => a.findIndex(t => t.item_url === v.item_url) === i);

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