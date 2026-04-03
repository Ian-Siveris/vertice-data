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
    const { razaoSocial, cnpj, cnaes, atestadosResumo, capitalSocial, patrimonioLiquido } = req.body;
    await prisma.perfil.deleteMany(); 
    const novoPerfil = await prisma.perfil.create({
      data: { razaoSocial, cnpj, cnaes, atestadosResumo, capitalSocial: Number(capitalSocial), patrimonioLiquido: Number(patrimonioLiquido) }
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

    if (!perfil) {
      return res.status(404).json({ error: "Perfil nao encontrado. Cadastre a empresa primeiro." });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const promptSistema = `
      Voce e um especialista em licitacoes. Analise o match entre esta EMPRESA e esta LICITACAO.
      
      EMPRESA:
      - Razao Social: ${perfil.razaoSocial}
      - Experiencia: ${perfil.atestadosResumo}
      - CNAEs: ${perfil.cnaes}
      - Capital Social: R$ ${perfil.capitalSocial}

      LICITACAO:
      - Orgao: ${orgao}
      - Local: ${local || "Nao informado"}
      - Modalidade: ${modalidade || "Nao informada"}
      - Objeto: ${objeto}
      - Valor: ${valorEstimado}

      Responda APENAS em JSON:
      {
        "score": (um numero de 0 a 100),
        "justificativa": (uma analise profissional e direta justificando a nota)
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

app.post('/api/pncp/buscar', async (req, res) => {
  try {
    const { palavraChave } = req.body;

    if (!palavraChave) {
      return res.status(400).json({ error: "Voce precisa enviar uma 'palavraChave' (ex: software)." });
    }

    const urlPNCP = `https://pncp.gov.br/api/search/?q=${palavraChave}&tipos_documento=edital`;

    const response = await fetch(urlPNCP, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Governo: ${response.status}`);
    }

    const data = await response.json();

    const editaisEncontrados = data.items.slice(0, 5).map((item: any) => {
      
      const objetoLicitacao = item.description || "Descricao nao disponivel";
      const valor = item.valor_global ? `R$ ${item.valor_global}` : "Valor nao divulgado na busca";
      
      // Monta o link clicavel padrao do PNCP usando o CNPJ e sequenciais
      let linkBase = "Sem link";
      if (item.item_url) {
        // o item_url vem como /compras/CNPJ/ANO/NUMERO
        linkBase = `https://pncp.gov.br/app/editais${item.item_url.replace('/compras', '')}`;
      }

      return {
        orgao: item.orgao_nome || "Orgao nao informado",
        modalidade: item.modalidade_licitacao_nome || "Nao informada",
        local: `${item.municipio_nome || 'N/A'} - ${item.uf || 'N/A'}`,
        objeto: objetoLicitacao,
        valorEstimado: valor,
        dataAbertura: item.data_inicio_vigencia || item.data_publicacao_pncp || "Data nao informada",
        link: linkBase
      };
    });

    res.json({
      quantidade: editaisEncontrados.length,
      editais: editaisEncontrados
    });

  } catch (error) {
    console.error("Erro ao buscar no PNCP:", error);
    res.status(500).json({ error: "Falha ao se comunicar com o portal do Governo (PNCP)." });
  }
});

app.listen(PORT, () => {
  console.log(`Back-end rodando em http://localhost:${PORT}`);
});