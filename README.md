# Vértice Data - Inteligência Artificial para Licitações

Sistema completo (SaaS) desenvolvido como Trabalho de Conclusão de Curso (TCC), focado em automatizar a busca, triagem e elaboração de propostas para licitações públicas utilizando dados reais do Governo Federal e Inteligência Artificial.

## O Problema que Resolvemos
Participar de licitações públicas exige a leitura diária de dezenas de editais complexos. O Vértice Data atua como um agente autônomo que varre o Portal Nacional de Compras Públicas (PNCP), cruza as exigências dos editais com o perfil estratégico da empresa e redige a proposta comercial automaticamente.

## Principais Funcionalidades

* **Agente Autônomo de Busca:** Integração direta com a API do PNCP para buscar editais recentes baseados em palavras-chave.
* **Match com IA (Scoring):** Utiliza a API da OpenAI (GPT-3.5-turbo) para ler o edital, cruzar com os CNAEs, Capital Social, Sede e Atestados da empresa, gerando um Score de 0 a 100 de probabilidade de vitória.
* **Geração Automatizada de Propostas:** A IA atua como um advogado especializado, redigindo a "Declaração de Cumprimento de Requisitos" e a "Proposta Comercial" prontas para assinatura.
* **Dashboard de Gestão:** Funil de vendas integrado para acompanhamento do valor em pipeline (R$) e da taxa de conversão das licitações analisadas.
* **Filtros e Memória:** Persistência de estado local, ordenação dinâmica por compatibilidade e busca em tempo real.

## Tecnologias Utilizadas

**Front-end:**
* React (com Vite)
* TypeScript
* Tailwind CSS (Estilização)
* Lucide React (Ícones)
* React Router DOM (Navegação)
* Axios (Consumo de API)

**Back-end:**
* Node.js com Express
* TypeScript
* Prisma ORM
* PostgreSQL (Banco de Dados)
* OpenAI API (Inteligência Artificial)

## Como executar o projeto localmente

### Pré-requisitos
* Node.js instalado (versão 18+)
* PostgreSQL instalado e rodando

### 1. Clonar o repositório
```bash
git clone [https://github.com/Ian-Siveris/tcc-project.git](https://github.com/Ian-Siveris/tcc-project.git)