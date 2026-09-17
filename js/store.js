/**
 * store.js - Central Data Management & Persistence (Especializado: Fábrica de Pallets)
 */

const STORAGE_VERSION = 'pallet_factory_v2_4';
const VERSION_KEY = 'sto_data_version';

const STORAGE_KEYS = {
  PRODUCTS: 'sto_pallet_products',
  EMPLOYEES: 'sto_pallet_employees',
  PRODUCTION: 'sto_pallet_production',
  MOVEMENTS: 'sto_pallet_movements'
};

// Helper for relative dates
function getRecentDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Seed Data especializado para Fábrica de Pallets
const SEED_PRODUCTS = [
  // --- PRODUTOS ACABADOS (PALLETS FABRICADOS) ---
  {
    id: 'prod-pal-001',
    code: 'PAL-PBR1',
    name: 'Pallet PBR 1 Padronizado (1000 x 1200 mm - 4 Entradas)',
    category: 'Produto Acabado',
    unit: 'un',
    costPrice: 38.50,
    salePrice: 68.00,
    stock: 280,
    minStock: 100,
    maxStock: 800,
    totalIn: 450,
    totalOut: 170,
    location: 'Pátio de Expedição - Quadra A',
    notes: 'Capacidade estática: 2.500 kg / dinâmica: 1.500 kg. Padrão Abras com tocos maciços.'
  },
  {
    id: 'prod-pal-002',
    code: 'PAL-EURO',
    name: 'Pallet Padrão Europeu EPAL Tratado HT (800 x 1200 mm)',
    category: 'Produto Acabado',
    unit: 'un',
    costPrice: 48.00,
    salePrice: 89.00,
    stock: 45,
    minStock: 80, // Alerta Baixo Estoque!
    maxStock: 400,
    totalIn: 120,
    totalOut: 75,
    location: 'Pátio de Expedição - Quadra B (Certificados)',
    notes: 'Certificado com carimbo fitossanitário HT para exportação. Madeira seca em estufa.'
  },
  {
    id: 'prod-pal-003',
    code: 'PAL-DESC',
    name: 'Pallet One-Way Descartável Leve (1000 x 1200 mm)',
    category: 'Produto Acabado',
    unit: 'un',
    costPrice: 24.00,
    salePrice: 43.00,
    stock: 190,
    minStock: 60,
    maxStock: 500,
    totalIn: 310,
    totalOut: 120,
    location: 'Pátio de Expedição - Quadra C',
    notes: 'Pallet econômico de 2 entradas com longarinas entalhadas para transporte único.'
  },
  {
    id: 'prod-pal-004',
    code: 'PAL-LONG',
    name: 'Pallet Reforçado 2 Entradas Carga Pesada (1200 x 1200 mm)',
    category: 'Produto Acabado',
    unit: 'un',
    costPrice: 56.00,
    salePrice: 98.00,
    stock: 22,
    minStock: 40, // Alerta Baixo Estoque!
    maxStock: 250,
    totalIn: 60,
    totalOut: 38,
    location: 'Pátio de Expedição - Quadra D',
    notes: 'Longarinas de eucalipto 45x90mm para indústrias químicas e sacarias pesadas.'
  },

  // --- MATÉRIAS-PRIMAS (MADEIRAS SERRADAS, TÁBUAS E TOCOS) ---
  {
    id: 'prod-pal-005',
    code: 'MP-TAB-120',
    name: 'Tábua de Pinus Aparelhada (15 x 100 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 4.80,
    salePrice: 7.20,
    stock: 640,
    minStock: 350,
    maxStock: 2000,
    totalIn: 1200,
    totalOut: 560,
    location: 'Galpão de Corte - Box 01',
    notes: 'Tábua superior do Pallet PBR. Umidade controlada abaixo de 18%.'
  },
  {
    id: 'prod-pal-006',
    code: 'MP-TAB-100',
    name: 'Tábua de Pinus Inferior / Base (15 x 100 x 1000 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 4.10,
    salePrice: 6.20,
    stock: 480,
    minStock: 300,
    maxStock: 1500,
    totalIn: 800,
    totalOut: 320,
    location: 'Galpão de Corte - Box 02',
    notes: 'Tábua de assoalho inferior para travamento dos tocos.'
  },
  {
    id: 'prod-pal-007',
    code: 'MP-TOC-80',
    name: 'Toco de Madeira Maciça Quadrado (80 x 100 x 100 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 1.45,
    salePrice: 2.60,
    stock: 210,
    minStock: 500, // Alerta Crítico!
    maxStock: 3000,
    totalIn: 1500,
    totalOut: 1290,
    location: 'Galpão de Corte - Box 05',
    notes: 'Bloco de sustentação central e cantos para entrada de empilhadeira.'
  },
  {
    id: 'prod-pal-008',
    code: 'MP-LONG-EUC',
    name: 'Longarina de Eucalipto Tratado (45 x 70 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 9.80,
    salePrice: 15.00,
    stock: 135,
    minStock: 150, // Alerta Baixo Estoque!
    maxStock: 800,
    totalIn: 300,
    totalOut: 165,
    location: 'Pátio Coberto de Eucalipto',
    notes: 'Estrutura de alta resistência mecânica para pallets de 2 entradas.'
  },
  {
    id: 'prod-pal-009',
    code: 'MP-PRAN-PIN',
    name: 'Prancha de Pinus Bruta para Desdobro (25 x 150 x 3000 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 21.50,
    salePrice: 32.00,
    stock: 95,
    minStock: 50,
    maxStock: 300,
    totalIn: 180,
    totalOut: 85,
    location: 'Pátio Externo - Pilha 02',
    notes: 'Alimentação da serra múltipla e destopadeira.'
  },

  // --- BARROTES DE DIVERSOS TIPOS DE MADEIRA ---
  {
    id: 'prod-pal-020',
    code: 'BAR-PIN-120',
    name: 'Barrote de Pinus Seco em Estufa (45 x 70 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 8.50,
    salePrice: 13.00,
    stock: 320,
    minStock: 150,
    maxStock: 1000,
    totalIn: 500,
    totalOut: 180,
    location: 'Galpão de Corte - Box 03',
    notes: 'Barrote liso sem entalhe para montagem de pallets de 4 entradas e estruturas laterais.'
  },
  {
    id: 'prod-pal-021',
    code: 'BAR-PIN-ENT',
    name: 'Barrote Entalhado de Pinus para Pallet 2 Entradas (45 x 90 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 11.20,
    salePrice: 17.50,
    stock: 240,
    minStock: 100,
    maxStock: 800,
    totalIn: 400,
    totalOut: 160,
    location: 'Galpão de Corte - Box 04',
    notes: 'Possui rebaixos usinados para passagem dos garfos de empilhadeira em 4 sentidos.'
  },
  {
    id: 'prod-pal-022',
    code: 'BAR-EUC-120',
    name: 'Barrote de Eucalipto Tratado em Autoclave (50 x 80 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 14.50,
    salePrice: 22.00,
    stock: 160,
    minStock: 120,
    maxStock: 600,
    totalIn: 280,
    totalOut: 120,
    location: 'Pátio Coberto de Eucalipto',
    notes: 'Imunizado contra brocas e fungos. Altíssima rigidez mecânica para pallets industriais pesados.'
  },
  {
    id: 'prod-pal-023',
    code: 'BAR-EUC-100',
    name: 'Barrote de Eucalipto Pesado (50 x 100 x 1000 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 13.00,
    salePrice: 19.80,
    stock: 35,
    minStock: 80, // Alerta Baixo Estoque!
    maxStock: 400,
    totalIn: 100,
    totalOut: 65,
    location: 'Pátio Coberto de Eucalipto',
    notes: 'Viga reforçada para pallets de dimensões especiais e sacarias químicas.'
  },
  {
    id: 'prod-pal-024',
    code: 'BAR-LEI-120',
    name: 'Barrote de Madeira de Lei / Mista Reforçado (50 x 80 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 19.00,
    salePrice: 29.50,
    stock: 80,
    minStock: 60,
    maxStock: 300,
    totalIn: 120,
    totalOut: 40,
    location: 'Galpão de Madeiras Duras',
    notes: 'Madeira mista densa (Garapeira / Cambará) para pallets reutilizáveis de alta durabilidade.'
  },
  {
    id: 'prod-pal-025',
    code: 'BAR-CED-120',
    name: 'Barrote de Cedrinho Aparelhado (40 x 70 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 16.50,
    salePrice: 25.00,
    stock: 65,
    minStock: 50,
    maxStock: 250,
    totalIn: 90,
    totalOut: 25,
    location: 'Galpão de Madeiras Nobres',
    notes: 'Madeira naturalmente imune a cupins, acabamento refinado para pallets farmacêuticos.'
  },

  // --- RÉGUAS DE DIVERSOS TIPOS DE MADEIRA ---
  {
    id: 'prod-pal-030',
    code: 'REG-PIN-70',
    name: 'Régua de Pinus Aparelhada Estreita (15 x 70 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 3.60,
    salePrice: 5.50,
    stock: 580,
    minStock: 250,
    maxStock: 2500,
    totalIn: 1000,
    totalOut: 420,
    location: 'Galpão de Corte - Prateleira R1',
    notes: 'Régua intermediária para redução de vão entre tábuas no deck superior do pallet.'
  },
  {
    id: 'prod-pal-031',
    code: 'REG-PIN-CHA',
    name: 'Régua de Pinus Chanfrada para Entrada (18 x 100 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 5.20,
    salePrice: 7.90,
    stock: 420,
    minStock: 200,
    maxStock: 1800,
    totalIn: 800,
    totalOut: 380,
    location: 'Galpão de Corte - Prateleira R2',
    notes: 'Borda com chanfro de 45° para entrada suave das rodinhas de paleteira manual.'
  },
  {
    id: 'prod-pal-032',
    code: 'REG-EUC-70',
    name: 'Régua de Eucalipto Serrada para Deck (18 x 70 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 5.80,
    salePrice: 8.90,
    stock: 85,
    minStock: 150, // Alerta Baixo Estoque!
    maxStock: 1200,
    totalIn: 300,
    totalOut: 215,
    location: 'Galpão de Corte - Prateleira R3',
    notes: 'Régua de alta resistência à flexão para pallets com tambores metálicos e big bags.'
  },
  {
    id: 'prod-pal-033',
    code: 'REG-EUC-100',
    name: 'Régua de Eucalipto Assoalho Largo (20 x 100 x 1000 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 6.40,
    salePrice: 9.80,
    stock: 310,
    minStock: 120,
    maxStock: 1000,
    totalIn: 500,
    totalOut: 190,
    location: 'Pátio Coberto de Eucalipto',
    notes: 'Régua larga para assoalho de pallets e caixas de madeira industriais.'
  },
  {
    id: 'prod-pal-034',
    code: 'REG-LEI-80',
    name: 'Régua de Madeira de Lei / Mista (20 x 80 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 8.90,
    salePrice: 14.00,
    stock: 140,
    minStock: 80,
    maxStock: 600,
    totalIn: 250,
    totalOut: 110,
    location: 'Galpão de Madeiras Duras',
    notes: 'Resistente a intempéries e tráfego pesado de empilhadeiras em pisos irregulares.'
  },
  {
    id: 'prod-pal-035',
    code: 'REG-TAU-90',
    name: 'Régua de Tauari / Madeira Clara Especial (15 x 90 x 1200 mm)',
    category: 'Matéria-Prima',
    unit: 'un',
    costPrice: 9.50,
    salePrice: 15.20,
    stock: 85,
    minStock: 60,
    maxStock: 400,
    totalIn: 150,
    totalOut: 65,
    location: 'Galpão de Madeiras Nobres',
    notes: 'Isenta de resinas e odores característicos. Ideal para transporte de alimentos e cosméticos.'
  },

  // --- INSUMOS E FIXAÇÃO ---
  {
    id: 'prod-pal-010',
    code: 'INS-PRG-ESP',
    name: 'Prego Eletrosoldado em Rolo Espiralado 2.1 x 50 mm',
    category: 'Insumo',
    unit: 'cx',
    costPrice: 142.00,
    salePrice: 205.00,
    stock: 38,
    minStock: 20,
    maxStock: 120,
    totalIn: 80,
    totalOut: 42,
    location: 'Almoxarifado - Prateleira A1',
    notes: 'Caixa com 9.000 pregos eletrosoldados para pregadores pneumáticos.'
  },
  {
    id: 'prod-pal-011',
    code: 'INS-PRG-ANE',
    name: 'Prego Anelado para Pallet Reforçado 2.5 x 65 mm',
    category: 'Insumo',
    unit: 'cx',
    costPrice: 165.00,
    salePrice: 235.00,
    stock: 8,
    minStock: 15, // Alerta Baixo Estoque!
    maxStock: 80,
    totalIn: 35,
    totalOut: 27,
    location: 'Almoxarifado - Prateleira A2',
    notes: 'Caixa com 7.200 pregos anelados de alta retenção contra desmontagem.'
  },
  {
    id: 'prod-pal-012',
    code: 'INS-TIN-HT',
    name: 'Tinta Especial para Carimbo Fitossanitário HT / PBR',
    category: 'Insumo',
    unit: 'galão',
    costPrice: 88.00,
    salePrice: 135.00,
    stock: 14,
    minStock: 6,
    maxStock: 40,
    totalIn: 25,
    totalOut: 11,
    location: 'Almoxarifado Químico',
    notes: 'Tinta indelével preta resistente a intempéries e luz solar.'
  },

  // --- EMBALAGENS E EXPEDIÇÃO ---
  {
    id: 'prod-pal-013',
    code: 'EMB-FIT-PET',
    name: 'Fita de Arquear PET Verde 16 mm x 0.8 mm (Rolo 1000 m)',
    category: 'Embalagem',
    unit: 'un',
    costPrice: 175.00,
    salePrice: 250.00,
    stock: 24,
    minStock: 10,
    maxStock: 60,
    totalIn: 40,
    totalOut: 16,
    location: 'Setor de Amarrilho e Expedição',
    notes: 'Utilizada para enfardar pilhas de 15 a 20 pallets para transporte seguro.'
  },
  {
    id: 'prod-pal-014',
    code: 'EMB-SEL-MET',
    name: 'Selo Metálico Recravado para Fita PET 16 mm (Milheiro)',
    category: 'Embalagem',
    unit: 'cx',
    costPrice: 95.00,
    salePrice: 140.00,
    stock: 18,
    minStock: 8,
    maxStock: 50,
    totalIn: 30,
    totalOut: 12,
    location: 'Setor de Amarrilho',
    notes: 'Grampos/selos de travamento para arqueadeira manual.'
  },

  // --- PEÇAS DE DESGASTE E EQUIPAMENTOS ---
  {
    id: 'prod-pal-015',
    code: 'PEC-PREG-MAX',
    name: 'Pistola Pregadeira Pneumática de Pallet (Mod. CN70 Industrial)',
    category: 'Peça',
    unit: 'un',
    costPrice: 1890.00,
    salePrice: 2650.00,
    stock: 6,
    minStock: 3,
    maxStock: 15,
    totalIn: 10,
    totalOut: 4,
    location: 'Oficina de Manutenção Pneumática',
    notes: 'Ferramenta operacional principal para montagem de pallets.'
  },
  {
    id: 'prod-pal-016',
    code: 'PEC-DISC-SER',
    name: 'Disco de Serra Circular Widia 350 mm (60 Dentes)',
    category: 'Peça',
    unit: 'un',
    costPrice: 220.00,
    salePrice: 320.00,
    stock: 9,
    minStock: 4,
    maxStock: 25,
    totalIn: 15,
    totalOut: 6,
    location: 'Sala de Afiação e Serras',
    notes: 'Disco para corte e destopo preciso das pontas de tábuas.'
  }
];

// Funcionários especializados da Fábrica de Pallets
const SEED_EMPLOYEES = [
  {
    id: 'emp-pal-001',
    badge: 'OP-201',
    name: 'Valter José da Silva',
    cpf: '234.567.890-12',
    role: 'Montador de Pallets Pneumático',
    department: 'Linha de Montagem PBR',
    shift: 'Manhã',
    dailyTarget: 80, // 80 pallets PBR/dia
    salary: 2850.00,
    status: 'Ativo',
    phone: '(11) 98722-1101',
    email: 'valter.silva@pallets.com.br',
    pix: '23456789012',
    admissionDate: '2023-01-10',
    notes: 'Especialista na montagem rápida de pallets PBR em bancada pneumática. Alta assiduidade.'
  },
  {
    id: 'emp-pal-002',
    badge: 'OP-202',
    name: 'Marcos Vinicius Ribeiro',
    cpf: '345.678.901-23',
    role: 'Operador de Pregadeira Automática',
    department: 'Linha Automatizada',
    shift: 'Manhã',
    dailyTarget: 160, // 160 pallets/dia
    salary: 3200.00,
    status: 'Ativo',
    phone: '(11) 97633-2202',
    email: 'marcos.ribeiro@pallets.com.br',
    pix: 'marcos.pregadeira@gmail.com',
    admissionDate: '2023-05-18',
    notes: 'Operador técnico da máquina pregadeira automática e responsável pela lubrificação diária.'
  },
  {
    id: 'emp-pal-003',
    badge: 'OP-203',
    name: 'Antônio Carlos de Souza',
    cpf: '456.789.012-34',
    role: 'Operador de Destopadeira e Serra',
    department: 'Corte e Desdobro de Madeira',
    shift: 'Manhã',
    dailyTarget: 450, // 450 tábuas cortadas e destopadas/dia
    salary: 2950.00,
    status: 'Ativo',
    phone: '(11) 96544-3303',
    email: 'antonio.souza@pallets.com.br',
    pix: '11965443303',
    admissionDate: '2022-09-01',
    notes: 'Responsável pela destopadeira de réguas e afiação das serras circulares.'
  },
  {
    id: 'emp-pal-004',
    badge: 'OP-204',
    name: 'Lucas Ferreira Lima',
    cpf: '567.890.123-45',
    role: 'Montador Especialista (Pallet Euro)',
    department: 'Linha de Exportação',
    shift: 'Tarde',
    dailyTarget: 65, // 65 pallets Euro/dia
    salary: 2900.00,
    status: 'Ativo',
    phone: '(11) 95455-4404',
    email: 'lucas.lima@pallets.com.br',
    pix: 'lucas.lima@pallets.com.br',
    admissionDate: '2023-11-20',
    notes: 'Linha especial Euro EPAL com medidas rigorosas e caixas industriais sob medida.'
  },
  {
    id: 'emp-pal-005',
    badge: 'OP-205',
    name: 'Tiago Santos Barbosa',
    cpf: '678.901.234-56',
    role: 'Operador de Estufa e Tratamento HT',
    department: 'Tratamento Térmico Fitossanitário',
    shift: 'Tarde',
    dailyTarget: 120, // 120 pallets inspecionados e carimbados/dia
    salary: 3100.00,
    status: 'Ativo',
    phone: '(11) 94366-5505',
    email: 'tiago.barbosa@pallets.com.br',
    pix: 'tiago.ht@outlook.com',
    admissionDate: '2024-02-15',
    notes: 'Certificado em tratamento fitossanitário HT / Ministério da Agricultura para exportação.'
  },
  {
    id: 'emp-pal-006',
    badge: 'OP-206',
    name: 'Edimilson Alencar Ramos',
    cpf: '789.012.345-67',
    role: 'Conferente de Qualidade e Amarrilho',
    department: 'Expedição e Pátio',
    shift: 'Comercial',
    dailyTarget: 300, // 300 pallets arqueados em fardos/dia
    salary: 2600.00,
    status: 'Ativo',
    phone: '(11) 93277-6606',
    email: 'edimilson.ramos@pallets.com.br',
    pix: '11932776606',
    admissionDate: '2024-06-01',
    notes: 'Conferência final de pregos sobressalentes, arqueação em fardos e carregamento de caminhões.'
  }
];

// Lançamentos de Produção recentes da fábrica de pallets
const SEED_PRODUCTION = [
  {
    id: 'rec-pal-001',
    date: getRecentDateStr(0),
    employeeId: 'emp-pal-001',
    productId: 'prod-pal-001', // Pallet PBR 1
    quantityProduced: 85,
    defectsCount: 2, // 2 pallets com tábua rachada corrigida
    hoursWorked: 8,
    shift: 'Manhã',
    notes: 'Ritmo acelerado na bancada pneumática. Todas as tábuas no padrão Abras.'
  },
  {
    id: 'rec-pal-002',
    date: getRecentDateStr(0),
    employeeId: 'emp-pal-002',
    productId: 'prod-pal-001', // Pallet PBR 1
    quantityProduced: 168,
    defectsCount: 1,
    hoursWorked: 8,
    shift: 'Manhã',
    notes: 'Pregadeira automática operando 100% sem travamento de pregos.'
  },
  {
    id: 'rec-pal-003',
    date: getRecentDateStr(0),
    employeeId: 'emp-pal-004',
    productId: 'prod-pal-002', // Pallet Euro EPAL
    quantityProduced: 68,
    defectsCount: 0,
    hoursWorked: 8,
    shift: 'Tarde',
    notes: 'Montagem perfeita com chanfros inferiores executados.'
  },
  {
    id: 'rec-pal-004',
    date: getRecentDateStr(0),
    employeeId: 'emp-pal-003',
    productId: 'prod-pal-005', // Tábua de Pinus
    quantityProduced: 480,
    defectsCount: 12, // Nós e empenamentos descartados
    hoursWorked: 8,
    shift: 'Manhã',
    notes: 'Lote de pranchas bem desdobrado na serra destopadeira.'
  },
  {
    id: 'rec-pal-005',
    date: getRecentDateStr(1),
    employeeId: 'emp-pal-001',
    productId: 'prod-pal-001',
    quantityProduced: 78,
    defectsCount: 3,
    hoursWorked: 8,
    shift: 'Manhã',
    notes: 'Pequena pausa para troca de mangueira pneumática.'
  },
  {
    id: 'rec-pal-006',
    date: getRecentDateStr(1),
    employeeId: 'emp-pal-002',
    productId: 'prod-pal-003', // Pallet One-Way
    quantityProduced: 155,
    defectsCount: 2,
    hoursWorked: 8,
    shift: 'Manhã',
    notes: 'Produção em série para cliente de logística alimentícia.'
  },
  {
    id: 'rec-pal-007',
    date: getRecentDateStr(2),
    employeeId: 'emp-pal-001',
    productId: 'prod-pal-001',
    quantityProduced: 82,
    defectsCount: 1,
    hoursWorked: 8,
    shift: 'Manhã',
    notes: 'Operação padrão sem ocorrências.'
  },
  {
    id: 'rec-pal-008',
    date: getRecentDateStr(2),
    employeeId: 'emp-pal-004',
    productId: 'prod-pal-004', // Pallet Reforçado
    quantityProduced: 62,
    defectsCount: 0,
    hoursWorked: 8,
    shift: 'Tarde',
    notes: 'Pallets pesados concluídos para indústria química.'
  }
];

// Movimentações de estoque recentes
const SEED_MOVEMENTS = [
  {
    id: 'mov-pal-001',
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    type: 'ENTRADA',
    productId: 'prod-pal-005', // Tábua de Pinus
    quantity: 500,
    unitPrice: 4.80,
    totalPrice: 2400.00,
    responsible: 'Almoxarifado de Madeiras',
    reason: 'Recebimento Carreta de Pinus Serrado NF-e 98124 - Madeireira do Sul'
  },
  {
    id: 'mov-pal-002',
    date: new Date(Date.now() - 3600000 * 7).toISOString(),
    type: 'SAIDA',
    productId: 'prod-pal-001', // Pallet PBR 1
    quantity: 120,
    unitPrice: 68.00,
    totalPrice: 8160.00,
    responsible: 'Expedição',
    reason: 'Carregamento Carreta Truck Pedido Comercial #4102 - Centro de Distribuição'
  },
  {
    id: 'mov-pal-003',
    date: new Date(Date.now() - 3600000 * 18).toISOString(),
    type: 'ENTRADA',
    productId: 'prod-pal-010', // Pregos em Rolo
    quantity: 25,
    unitPrice: 142.00,
    totalPrice: 3550.00,
    responsible: 'Compras / Almoxarifado',
    reason: 'Reposição de estoque de pregos espiralados NF-e 11983 - Fixadores Ind.'
  },
  {
    id: 'mov-pal-004',
    date: new Date(Date.now() - 3600000 * 30).toISOString(),
    type: 'AJUSTE',
    productId: 'prod-pal-007', // Tocos de Madeira
    quantity: -15,
    unitPrice: 1.45,
    totalPrice: -21.75,
    responsible: 'Supervisor de Linha',
    reason: 'Descarte por rachadura severa em inspeção física da bancada'
  }
];

class Store {
  constructor() {
    this.subscribers = [];
    this.init();
  }

  init() {
    const savedVersion = localStorage.getItem(VERSION_KEY);

    // Se for primeira vez ou se a versão mudou para a fábrica de pallets, atualiza os dados
    if (savedVersion !== STORAGE_VERSION || !localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.resetToDefault();
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
    }
  }

  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Erro ao carregar chave ${key}:`, e);
      return [];
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notify(key, data);
    } catch (e) {
      console.error(`Erro ao salvar chave ${key}:`, e);
    }
  }

  subscribe(listener) {
    this.subscribers.push(listener);
    return () => {
      this.subscribers = this.subscribers.filter(l => l !== listener);
    };
  }

  notify(key, data) {
    this.subscribers.forEach(listener => {
      try {
        listener(key, data);
      } catch (err) {
        console.error('Erro no listener:', err);
      }
    });
  }

  // --- Products CRUD ---
  getProducts() {
    return this.load(STORAGE_KEYS.PRODUCTS);
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  }

  addProduct(productData) {
    const products = this.getProducts();
    const newProduct = {
      id: 'prod-' + Date.now(),
      code: productData.code || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: productData.name.trim(),
      category: productData.category || 'Geral',
      unit: productData.unit || 'un',
      costPrice: parseFloat(productData.costPrice) || 0,
      salePrice: parseFloat(productData.salePrice) || 0,
      stock: parseFloat(productData.stock) || 0,
      minStock: parseFloat(productData.minStock) || 0,
      maxStock: parseFloat(productData.maxStock) || 100,
      totalIn: parseFloat(productData.stock) || 0,
      totalOut: 0,
      location: productData.location ? productData.location.trim() : 'Pátio',
      notes: productData.notes ? productData.notes.trim() : ''
    };

    products.unshift(newProduct);
    this.save(STORAGE_KEYS.PRODUCTS, products);

    if (newProduct.stock > 0) {
      this.addMovement({
        type: 'ENTRADA',
        productId: newProduct.id,
        quantity: newProduct.stock,
        unitPrice: newProduct.costPrice,
        responsible: 'Sistema',
        reason: 'Cadastro inicial de item com saldo em pátio'
      });
    }

    return newProduct;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      costPrice: parseFloat(updates.costPrice ?? products[index].costPrice) || 0,
      salePrice: parseFloat(updates.salePrice ?? products[index].salePrice) || 0,
      stock: parseFloat(updates.stock ?? products[index].stock) || 0,
      minStock: parseFloat(updates.minStock ?? products[index].minStock) || 0,
      maxStock: parseFloat(updates.maxStock ?? products[index].maxStock) || 100
    };

    this.save(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  }

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.save(STORAGE_KEYS.PRODUCTS, products);
    return true;
  }

  adjustStock(productId, qtyDelta, type, reason, responsible) {
    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return null;

    const oldStock = prod.stock;
    const delta = parseFloat(qtyDelta) || 0;
    prod.stock = Math.max(0, oldStock + delta);

    if (delta > 0) {
      prod.totalIn = (prod.totalIn || 0) + delta;
    } else {
      prod.totalOut = (prod.totalOut || 0) + Math.abs(delta);
    }

    this.save(STORAGE_KEYS.PRODUCTS, products);

    this.addMovement({
      type: type || (delta >= 0 ? 'ENTRADA' : 'SAIDA'),
      productId: prod.id,
      quantity: Math.abs(delta),
      unitPrice: prod.costPrice,
      responsible: responsible || 'Operador',
      reason: reason || 'Movimentação no pátio de pallets'
    });

    return prod;
  }

  // --- Employees CRUD ---
  getEmployees() {
    return this.load(STORAGE_KEYS.EMPLOYEES);
  }

  getEmployeeById(id) {
    return this.getEmployees().find(e => e.id === id) || null;
  }

  addEmployee(empData) {
    const employees = this.getEmployees();
    const newEmp = {
      id: 'emp-' + Date.now(),
      badge: empData.badge ? empData.badge.trim() : `OP-${Math.floor(100 + Math.random() * 900)}`,
      name: empData.name.trim(),
      cpf: empData.cpf ? empData.cpf.trim() : '',
      role: empData.role ? empData.role.trim() : 'Montador de Pallets',
      department: empData.department ? empData.department.trim() : 'Produção',
      shift: empData.shift || 'Manhã',
      dailyTarget: parseInt(empData.dailyTarget, 10) || 50,
      salary: parseFloat(empData.salary) || 0,
      status: empData.status || 'Ativo',
      phone: empData.phone ? empData.phone.trim() : '',
      email: empData.email ? empData.email.trim() : '',
      pix: empData.pix ? empData.pix.trim() : '',
      admissionDate: empData.admissionDate || new Date().toISOString().split('T')[0],
      notes: empData.notes ? empData.notes.trim() : ''
    };

    employees.unshift(newEmp);
    this.save(STORAGE_KEYS.EMPLOYEES, employees);
    return newEmp;
  }

  updateEmployee(id, updates) {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return null;

    employees[index] = {
      ...employees[index],
      ...updates,
      dailyTarget: parseInt(updates.dailyTarget ?? employees[index].dailyTarget, 10) || 50,
      salary: parseFloat(updates.salary ?? employees[index].salary) || 0
    };

    this.save(STORAGE_KEYS.EMPLOYEES, employees);
    return employees[index];
  }

  deleteEmployee(id) {
    const employees = this.getEmployees().filter(e => e.id !== id);
    this.save(STORAGE_KEYS.EMPLOYEES, employees);
    return true;
  }

  // --- Production Records CRUD ---
  getProductionRecords() {
    return this.load(STORAGE_KEYS.PRODUCTION);
  }

  getProductionRecordById(id) {
    return this.getProductionRecords().find(r => r.id === id) || null;
  }

  addProductionRecord(recData) {
    const records = this.getProductionRecords();
    const qty = parseInt(recData.quantityProduced, 10) || 0;
    const newRec = {
      id: 'rec-' + Date.now(),
      date: recData.date || new Date().toISOString().split('T')[0],
      employeeId: recData.employeeId,
      productId: recData.productId,
      quantityProduced: qty,
      defectsCount: parseInt(recData.defectsCount, 10) || 0,
      hoursWorked: parseFloat(recData.hoursWorked) || 8,
      shift: recData.shift || 'Manhã',
      notes: recData.notes ? recData.notes.trim() : ''
    };

    records.unshift(newRec);
    this.save(STORAGE_KEYS.PRODUCTION, records);

    // Entrada automática no estoque do pallet ou peça finalizada
    if (recData.updateStock && recData.productId && qty > 0) {
      const emp = this.getEmployeeById(recData.employeeId);
      this.adjustStock(
        recData.productId,
        qty,
        'ENTRADA',
        `Produção de pallets finalizada (${newRec.date})`,
        emp ? emp.name : 'Produção'
      );
    }

    return newRec;
  }

  updateProductionRecord(id, updates) {
    const records = this.getProductionRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    records[index] = {
      ...records[index],
      ...updates,
      quantityProduced: parseInt(updates.quantityProduced ?? records[index].quantityProduced, 10) || 0,
      defectsCount: parseInt(updates.defectsCount ?? records[index].defectsCount, 10) || 0,
      hoursWorked: parseFloat(updates.hoursWorked ?? records[index].hoursWorked) || 8
    };

    this.save(STORAGE_KEYS.PRODUCTION, records);
    return records[index];
  }

  deleteProductionRecord(id) {
    const records = this.getProductionRecords().filter(r => r.id !== id);
    this.save(STORAGE_KEYS.PRODUCTION, records);
    return true;
  }

  // --- Movements Log ---
  getMovements() {
    return this.load(STORAGE_KEYS.MOVEMENTS);
  }

  addMovement(movData) {
    const movements = this.getMovements();
    const qty = parseFloat(movData.quantity) || 0;
    const unitPrice = parseFloat(movData.unitPrice) || 0;

    const newMov = {
      id: 'mov-' + Date.now() + Math.floor(Math.random() * 100),
      date: movData.date || new Date().toISOString(),
      type: movData.type || 'ENTRADA',
      productId: movData.productId,
      quantity: qty,
      unitPrice: unitPrice,
      totalPrice: movData.totalPrice || (qty * unitPrice),
      responsible: movData.responsible || 'Pátio',
      reason: movData.reason || 'Movimentação manual'
    };

    movements.unshift(newMov);
    this.save(STORAGE_KEYS.MOVEMENTS, movements);
    return newMov;
  }

  // --- Export & Backup ---
  exportAllData() {
    return {
      version: STORAGE_VERSION,
      companyType: 'Fábrica de Pallets e Embalagens de Madeira',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      employees: this.getEmployees(),
      production: this.getProductionRecords(),
      movements: this.getMovements()
    };
  }

  importAllData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Arquivo de dados inválido.');
    }
    if (Array.isArray(data.products)) this.save(STORAGE_KEYS.PRODUCTS, data.products);
    if (Array.isArray(data.employees)) this.save(STORAGE_KEYS.EMPLOYEES, data.employees);
    if (Array.isArray(data.production)) this.save(STORAGE_KEYS.PRODUCTION, data.production);
    if (Array.isArray(data.movements)) this.save(STORAGE_KEYS.MOVEMENTS, data.movements);
    return true;
  }

  resetToDefault() {
    this.save(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    this.save(STORAGE_KEYS.EMPLOYEES, SEED_EMPLOYEES);
    this.save(STORAGE_KEYS.PRODUCTION, SEED_PRODUCTION);
    this.save(STORAGE_KEYS.MOVEMENTS, SEED_MOVEMENTS);
  }
}

// Global instance
window.store = new Store();
