# PRODEX ERP - Sistema de Controle de Estoque & Gestão de Produção de Pallets

Sistema corporativo completo e moderno para gerenciamento integrado de **Estoque de Madeiras e Insumos** e **Acompanhamento Diário da Produtividade da Equipe de Produção**, com dashboard em tempo real, gráficos analíticos interativos, alertas de reposição urgente e suporte a exportação e backup.

Desenvolvido especialmente para o fluxo operacional de **Fábricas de Pallets e Embalagens de Madeira**.

---

## 🚀 Funcionalidades Principais

### 1. 📊 Dashboard Executivo & KPIs em Tempo Real
- **Valor Total em Estoque (R$):** Valorização monetária calculada em tempo real com base no saldo e preços de custo de cada item.
- **Alertas de Reposição Urgente:** Contador e tabela dedicada de produtos que atingiram ou estão abaixo do estoque mínimo de segurança.
- **Produção Diária & Eficiência:** Total de unidades produzidas no dia vs. meta global da equipe com taxa de qualidade percentual (% de peças aprovadas sem defeito).
- **4 Gráficos Interativos (Chart.js):**
  - Evolução da produção nos últimos 7 dias (gráfico de área).
  - Composição física do estoque por categoria (rosca).
  - Produtividade individual por colaborador hoje vs. meta diária (barras duplas).
  - Fluxo de movimentações (entradas vs. saídas).
- **Leaderboard / Ranking de Produção:** Destaque dos colaboradores mais eficientes do dia.

---

### 2. 📦 Controle de Estoque Especializado para Fábrica de Pallets
Catálogo técnico completo com dimensões, unidades, localização e níveis de estoque:
- **Produtos Acabados:**
  - Pallet PBR 1 Padronizado (1000 x 1200 mm - 4 Entradas - Padrão Abras).
  - Pallet Padrão Europeu EPAL Tratado HT (800 x 1200 mm).
  - Pallet One-Way Descartável Leve (1000 x 1200 mm).
  - Pallet Reforçado Carga Pesada (1200 x 1200 mm).
- **Barrotes Estruturais de Vários Tipos de Madeira:**
  - Barrote de Pinus Seco em Estufa (45 x 70 x 1200 mm).
  - Barrote Entalhado de Pinus para Pallet 2/4 Entradas (45 x 90 x 1200 mm).
  - Barrote de Eucalipto Tratado em Autoclave (50 x 80 x 1200 mm).
  - Barrote de Eucalipto Pesado (50 x 100 x 1000 mm).
  - Barrote de Madeira de Lei / Mista Reforçado (50 x 80 x 1200 mm - Garapeira / Cambará).
  - Barrote de Cedrinho Aparelhado (40 x 70 x 1200 mm).
- **Réguas e Decks de Vários Tipos de Madeira:**
  - Régua de Pinus Aparelhada Estreita (15 x 70 x 1200 mm).
  - Régua de Pinus Chanfrada para Entrada de Paleteira (18 x 100 x 1200 mm).
  - Régua de Eucalipto Serrada para Deck (18 x 70 x 1200 mm).
  - Régua de Eucalipto Assoalho Largo (20 x 100 x 1000 mm).
  - Régua de Madeira de Lei / Mista (20 x 80 x 1200 mm).
  - Régua de Tauari / Madeira Clara Especial (15 x 90 x 1200 mm).
- **Insumos e Fixação:** Pregos eletrosoldados em rolo (2.1x50mm), pregos anelados (2.5x65mm), tinta fitossanitária HT.
- **Embalagens e Peças:** Fita PET 16mm, selos metálicos, pregadeiras pneumáticas CN70 e discos de serra circular.

---

### 3. 👥 Gestão de Equipe & Apontamentos Diários de Produção
- Cadastro completo de funcionários com matrícula, cargo, turno (Manhã, Tarde, Noite, Comercial) e meta diária individual.
- Cards individuais com foto/avatar e **barra de progresso dinâmica** por percentual de meta batida.
- Lançamento diário de produção por colaborador, produto, peças aprovadas, peças com defeito (refugo) e horas trabalhadas.
- **Integração Automática com o Estoque:** Opção de dar entrada automática imediata no estoque do produto acabado ao apontar a produção!

---

### 4. 🔄 Auditoria de Movimentações
- Histórico completo de entradas, saídas e ajustes de inventário físico com data, tipo, quantidade, valor, responsável e justificativa/NF-e.

---

### 5. 📑 Relatórios, Backup & Temas
- Exportação com 1 clique para planilhas **CSV** (Produtos, Produção e Movimentações).
- Modo de **Impressão Econômica / Salvar em PDF** formatado para reuniões de turno.
- **Backup e Restauração Integral em JSON**.
- Alternância entre **Dark Mode** e **Light Mode**.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico:** Estrutura acessível e modular.
- **Vanilla CSS3:** Design system exclusivo, CSS variables, glassmorphism e animações fluidas.
- **JavaScript ES6+:** Arquitetura modular e reativa com persistência no `localStorage`.
- **Chart.js:** Gráficos analíticos responsivos.
- **Font Awesome 6:** Iconografia industrial moderna.
- **Node.js:** Servidor HTTP nativo (zero dependências externas).

---

## 💻 Como Executar Localmente

### Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) instalado (versão 18+ recomendada) ou simplesmente um navegador moderno.

### Passo a passo
1. Clone este repositório:
```bash
git clone https://github.com/danrleyjhones98/Controle_de_estoque.git
cd Controle_de_estoque
```

2. Inicie o servidor local:
```bash
node server.js
```
*Ou simplesmente:*
```bash
npm start
```

3. Acesse a aplicação no seu navegador:
```
http://localhost:3000
```
*(ou a porta indicada no terminal, como 3001 ou 3002 caso a porta 3000 esteja em uso)*

> **Dica:** O projeto também pode ser executado diretamente dando dois cliques no arquivo `index.html` em qualquer navegador web.

---

## 📁 Estrutura de Arquivos

```
Controle_de_estoque/
├── index.html              # Interface principal com todas as abas e modais
├── server.js               # Servidor HTTP nativo com detecção dinâmica de portas
├── package.json            # Metadados e scripts de inicialização
├── .gitignore              # Arquivos ignorados pelo Git
├── README.md               # Documentação completa do projeto
├── css/
│   ├── style.css           # Estilos globais, temas Dark/Light e layout
│   └── components.css      # Estilos dos cards, tabelas, modais e badges
└── js/
    ├── store.js            # Estado central, persistência e catálogo de pallets
    ├── dashboard.js        # Métricas, KPIs e gráficos Chart.js
    ├── products.js         # CRUD de produtos e estoque mínimo
    ├── production.js       # Gestão de equipe e apontamentos de produção
    ├── movements.js        # Auditoria de entradas, saídas e ajustes
    ├── reports.js          # Exportação CSV, impressão e backup JSON
    └── app.js              # Controlador principal da interface e navegação
```

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
