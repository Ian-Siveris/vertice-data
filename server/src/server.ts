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

// NOVA ROTA: O Agente Autonomo da IA
app.post('/api/ia/triagem-automatica', async (req, res) => {
  try {
    const perfil = await prisma.perfil.findFirst();
    if (!perfil) return res.status(404).json({ error: "Perfil nao encontrado." });

    // 1. O agente vai no PNCP buscar as novidades (usando 'software' como padrao)
    const urlPNCP = `https://pncp.gov.br/api/search/?q=software&tipos_documento=edital&ordenacao=-data_publicacao_pncp&pagina=1`;
    const responsePNCP = await fetch(urlPNCP, { headers: { "Accept": "application/json" } });
    const dataPNCP = await responsePNCP.json();

    // Pegamos os 3 mais recentes (limitamos a 3 para a apresentacao nao demorar muito)
    const items = dataPNCP.items.filter((item: any) => item.orgao_nome).slice(0, 3);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    let novosMatches = 0;

    for (const item of items) {
      const objetoLicitacao = item.description || item.titulo || "Sem descricao";
      
      // Regra de Ouro: So analisa se essa licitacao ainda nao estiver no nosso Banco de Dados
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

    const promptSistema = `
      Voce e um advogado especialista em licitacoes publicas.
      
      DADOS DA EMPRESA:
      Razao Social: ${perfil.razaoSocial}
      CNPJ: ${perfil.cnpj}
      Porte: ${perfil.porte}
      Sede: ${perfil.sede}

      DADOS DA LICITACAO:
      Orgao: ${orgao}
      Modalidade: ${modalidade}
      Objeto: ${objeto}

      Escreva uma "Proposta Comercial e Declaracao de Cumprimento de Requisitos".
      Regras:
      1. Comece com: "Local e Data: ${perfil.sede || 'Sede da Empresa'}, ${dataHoje}."
      2. Enderecamento formal ao orgao.
      3. O corpo do texto deve afirmar que a empresa tem capacidade tecnica. Se a empresa for ME/EPP, inclua uma breve mencao aos beneficios da Lei Complementar 123/2006.
      4. Crie um campo: "Valor Total da Proposta: R$ [INSERIR VALOR AQUI]".
      5. Encerramento formal e assinatura do Representante Legal.
      Nao use formatacao markdown.
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

app.post('/api/pncp/buscar', async (req, res) => {
  try {
    const { palavraChave } = req.body;
    if (!palavraChave) return res.status(400).json({ error: "Palavra chave obrigatoria." });

    const urlPNCP = `https://pncp.gov.br/api/search/?q=${palavraChave}&tipos_documento=edital&ordenacao=-data_publicacao_pncp&pagina=1`;
    const response = await fetch(urlPNCP, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`Erro API Governo: ${response.status}`);
    
    const data = await response.json();
    const editaisEncontrados = data.items
      .filter((item: any) => item.orgao_nome || item.orgaoEntidade?.razaoSocial)
      .slice(0, 8)
      .map((item: any) => ({
          orgao: item.orgao_nome || item.orgaoEntidade?.razaoSocial || "Orgao nao informado",
          modalidade: item.modalidade_licitacao_nome || "Nao informada",
          local: `${item.municipio_nome || 'N/A'} - ${item.uf || 'N/A'}`,
          objeto: item.description || item.titulo || "Descricao nao disponivel",
          valorEstimado: item.valor_global || item.valorTotalEstimado ? `R$ ${item.valor_global || item.valorTotalEstimado}` : "Valor sob consulta",
          dataAbertura: item.data_publicacao_pncp || item.data_inicio_vigencia || "Data nao informada",
          link: item.item_url ? `https://pncp.gov.br/app/editais${item.item_url.replace('/compras', '')}` : "Sem link"
      }));

    res.json({ quantidade: editaisEncontrados.length, editais: editaisEncontrados });
  } catch (error) {
    console.error(error);
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
    const licitacaoAtualizada = await prisma.licitacao.update({
      where: { id },
      data: { propostaGerada: true }
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