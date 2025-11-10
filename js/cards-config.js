// =================== CARDS-CONFIG.JS - CONFIGURAÇÕES GLOBAIS ===================
// Versão: 2.1 - CORRIGIDO
// Descrição: Fonte única de verdade para mapas, funções e configurações
// Depende de: api.js (carregar ANTES para CORES_CONCESSOES e CORES_LINHAS)
// ✅ CORREÇÃO V2.1: Adicionado window.CRUZ_AZUL_NUMERACAO (mapeamento 1-36)

console.log('🔵 CARDS-CONFIG.JS v2.1 - Iniciando carregamento...');

// =================== ✅ MAPAS DE DISPLAY (COM ACENTOS UTF-8) ===================
// Converte texto SEM acentos (vindo da planilha) → COM acentos (exibição)

window.CONCESSOES_DISPLAY_MAP = {
    // Chave = texto sem acentos (como vem da planilha)
    // Valor = texto com acentos (como deve ser exibido)
    "Transicao Domiciliar": "Transição Domiciliar",
    "Aplicacao domiciliar de medicamentos": "Aplicação domiciliar de medicamentos",
    "Aspiracao": "Aspiração",
    "Banho": "Banho",
    "Curativo": "Curativo",
    "Curativo PICC": "Curativo PICC",
    "Fisioterapia Motora Domiciliar": "Fisioterapia Motora Domiciliar",
    "Fonoaudiologia Domiciliar": "Fonoaudiologia Domiciliar",
    "Oxigenoterapia": "Oxigenoterapia",
    "Remocao": "Remoção",
    "Solicitacao domiciliar de exames": "Solicitação domiciliar de exames",
    "Fisioterapia Respiratoria Domiciliar": "Fisioterapia Respiratória Domiciliar"
};

window.LINHAS_DISPLAY_MAP = {
    "Assiste": "Assiste",
    "APS SP": "APS SP",
    "Cuidados Paliativos": "Cuidados Paliativos",
    "ICO (Insuficiencia Coronariana)": "ICO (Insuficiência Coronariana)",
    "Nexus SP Cardiologia": "Nexus SP Cardiologia",
    "Nexus SP Gastroentereologia": "Nexus SP Gastroentereologia",
    "Nexus SP Geriatria": "Nexus SP Geriatria",
    "Nexus SP Pneumologia": "Nexus SP Pneumologia",
    "Nexus SP Psiquiatria": "Nexus SP Psiquiatria",
    "Nexus SP Reumatologia": "Nexus SP Reumatologia",
    "Nexus SP Saude do Figado": "Nexus SP Saúde do Fígado",
    "Generalista": "Generalista",
    "Bucomaxilofacial": "Bucomaxilofacial",
    "Cardiologia": "Cardiologia",
    "Cirurgia Cardiaca": "Cirurgia Cardíaca",
    "Cirurgia de Cabeca e Pescoco": "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo": "Cirurgia do Aparelho Digestivo",
    "Cirurgia Geral": "Cirurgia Geral",
    "Cirurgia Oncologica": "Cirurgia Oncológica",
    "Cirurgia Plastica": "Cirurgia Plástica",
    "Cirurgia Toracica": "Cirurgia Torácica",
    "Cirurgia Vascular": "Cirurgia Vascular",
    "Clinica Medica": "Clínica Médica",
    "Coloproctologia": "Coloproctologia",
    "Dermatologia": "Dermatologia",
    "Endocrinologia": "Endocrinologia",
    "Fisiatria": "Fisiatria",
    "Gastroenterologia": "Gastroenterologia",
    "Geriatria": "Geriatria",
    "Ginecologia e Obstetricia": "Ginecologia e Obstetrícia",
    "Hematologia": "Hematologia",
    "Infectologia": "Infectologia",
    "Mastologia": "Mastologia",
    "Nefrologia": "Nefrologia",
    "Neurocirurgia": "Neurocirurgia",
    "Neurologia": "Neurologia",
    "Oftalmologia": "Oftalmologia",
    "Oncologia Clinica": "Oncologia Clínica",
    "Ortopedia": "Ortopedia",
    "Otorrinolaringologia": "Otorrinolaringologia",
    "Pediatria": "Pediatria",
    "Pneumologia": "Pneumologia",
    "Psiquiatria": "Psiquiatria",
    "Reumatologia": "Reumatologia",
    "Urologia": "Urologia"
};

// =================== ✅ FUNÇÃO DE NORMALIZAÇÃO (PARA COMPARAÇÕES) ===================
/**
 * Remove acentos e caracteres especiais para comparação
 * @param {string} texto - Texto a normalizar
 * @returns {string} Texto normalizado
 */
window.normalizarTexto = function(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
};

// =================== ✅ FUNÇÃO DE DESNORMALIZAÇÃO (EXIBIÇÃO) ===================
/**
 * Restaura acentos para exibição usando os mapas
 * @param {string} texto - Texto sem acentos
 * @returns {string} Texto com acentos
 */
window.desnormalizarTexto = function(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    
    // Tentar encontrar no mapa de concessões
    if (window.CONCESSOES_DISPLAY_MAP[texto]) {
        return window.CONCESSOES_DISPLAY_MAP[texto];
    }
    
    // Tentar encontrar no mapa de linhas
    if (window.LINHAS_DISPLAY_MAP[texto]) {
        return window.LINHAS_DISPLAY_MAP[texto];
    }
    
    // Se não encontrar nos mapas, retornar o texto original
    return texto;
};

// =================== ✅ CONFIGURAÇÕES DE HOSPITAIS ===================
window.HOSPITAL_MAPPING = {
    H1: 'Neomater',
    H2: 'Cruz Azul',
    H3: 'Santa Marcelina',
    H4: 'Santa Clara',
    H5: 'Adventista',
    H6: 'Santa Cruz',
    H7: 'Santa Virgínia'
};

// Ordem alfabética para exibição
window.ORDEM_ALFABETICA_HOSPITAIS = ['H5', 'H2', 'H1', 'H4', 'H3', 'H6', 'H7'];

// Identificar hospitais híbridos (leitos 100% flexíveis)
window.HOSPITAIS_HIBRIDOS = ['H1', 'H3', 'H5', 'H6', 'H7'];

// Santa Clara - Limites fixos (9 aptos + 4 enfs)
window.SANTA_CLARA_TOTAL_LEITOS = 13;
window.SANTA_CLARA_LIMITE_APTOS = 9;
window.SANTA_CLARA_LIMITE_ENFS = 4;

// =================== ✅ MAPEAMENTO CRUZ AZUL - LEITOS IRMÃOS (NOVO V2.1!) ===================
// Sistema de numeração física dos leitos do Hospital H2 (Cruz Azul)
// Apartamentos: 1-20 → Numeração 101-120
// Enfermarias: 21-36 → Numeração 201-216 (leitos irmãos em pares)
// 
// LEITOS IRMÃOS (compartilham o mesmo quarto):
// 21 ↔ 22 (201-202), 23 ↔ 24 (203-204), 25 ↔ 26 (205-206)
// 27 ↔ 28 (207-208), 29 ↔ 30 (209-210), 31 ↔ 32 (211-212)
// 33 ↔ 34 (213-214), 35 ↔ 36 (215-216)

window.CRUZ_AZUL_NUMERACAO = {
    // APARTAMENTOS (1-20) - Numeração 101-120
    1: "101", 2: "102", 3: "103", 4: "104", 5: "105",
    6: "106", 7: "107", 8: "108", 9: "109", 10: "110",
    11: "111", 12: "112", 13: "113", 14: "114", 15: "115",
    16: "116", 17: "117", 18: "118", 19: "119", 20: "120",
    
    // ENFERMARIAS (21-36) - Numeração 201-216 (Leitos Irmãos)
    21: "201", 22: "202", // Par 1
    23: "203", 24: "204", // Par 2
    25: "205", 26: "206", // Par 3
    27: "207", 28: "208", // Par 4
    29: "209", 30: "210", // Par 5
    31: "211", 32: "212", // Par 6
    33: "213", 34: "214", // Par 7
    35: "215", 36: "216"  // Par 8
};

console.log('✅ CRUZ_AZUL_NUMERACAO carregado:', Object.keys(window.CRUZ_AZUL_NUMERACAO).length, 'leitos');

// Validação de integridade
if (Object.keys(window.CRUZ_AZUL_NUMERACAO).length !== 36) {
    console.error('❌ ERRO CRÍTICO: CRUZ_AZUL_NUMERACAO deveria ter 36 leitos, mas tem', Object.keys(window.CRUZ_AZUL_NUMERACAO).length);
} else {
    console.log('✅ Validação OK: 36 leitos mapeados (20 aptos + 16 enfs)');
}

// =================== ✅ MAPEAMENTOS CRUZ AZUL - LEITOS IRMÃOS ===================
// Sistema de leitos irmãos para enfermarias (21-36)
// Compartilham o mesmo quarto, restrições por isolamento/gênero
window.CRUZ_AZUL_IRMAOS = {
    21: 22, 22: 21, 23: 24, 24: 23,
    25: 26, 26: 25, 27: 28, 28: 27,
    29: 30, 30: 29, 31: 32, 32: 31,
    33: 34, 34: 33, 35: 36, 36: 35
};

console.log('✅ CRUZ_AZUL_IRMAOS carregado:', Object.keys(window.CRUZ_AZUL_IRMAOS).length / 2, 'pares de irmãos');

// =================== ✅ LISTAS DE OPÇÕES (DROPDOWNS) ===================

// TIPO DE QUARTO (2 opções - apenas para híbridos)
window.TIPO_QUARTO_OPTIONS = ['Apartamento', 'Enfermaria'];

// CONCESSÕES - 13 itens (12 + "Não se aplica")
window.CONCESSOES_LIST = [
    "Não se aplica",
    "Transição Domiciliar",
    "Aplicação domiciliar de medicamentos",
    "Aspiração",
    "Banho",
    "Curativo",
    "Curativo PICC",
    "Fisioterapia Motora Domiciliar",
    "Fonoaudiologia Domiciliar",
    "Oxigenoterapia",
    "Remoção",
    "Solicitação domiciliar de exames",
    "Fisioterapia Respiratória Domiciliar"
];

// LINHAS DE CUIDADO - 45 especialidades (COM ACENTOS - api.js normaliza depois)
window.LINHAS_CUIDADO_LIST = [
    "Assiste",
    "APS SP",
    "Cuidados Paliativos",
    "ICO (Insuficiência Coronariana)",
    "Nexus SP Cardiologia",
    "Nexus SP Gastroentereologia",
    "Nexus SP Geriatria",
    "Nexus SP Pneumologia",
    "Nexus SP Psiquiatria",
    "Nexus SP Reumatologia",
    "Nexus SP Saúde do Fígado",
    "Generalista",
    "Bucomaxilofacial",
    "Cardiologia",
    "Cirurgia Cardíaca",
    "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo",
    "Cirurgia Geral",
    "Cirurgia Oncológica",
    "Cirurgia Plástica",
    "Cirurgia Torácica",
    "Cirurgia Vascular",
    "Clínica Médica",
    "Coloproctologia",
    "Dermatologia",
    "Endocrinologia",
    "Fisiatria",
    "Gastroenterologia",
    "Geriatria",
    "Ginecologia e Obstetrícia",
    "Hematologia",
    "Infectologia",
    "Mastologia",
    "Nefrologia",
    "Neurocirurgia",
    "Neurologia",
    "Oftalmologia",
    "Oncologia Clínica",
    "Ortopedia",
    "Otorrinolaringologia",
    "Pediatria",
    "Pneumologia",
    "Psiquiatria",
    "Reumatologia",
    "Urologia"
];

// PPS - 10 opções (10% a 100%)
window.PPS_OPTIONS = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];

// PREVISÃO DE ALTA - 10 opções
window.PREVISAO_ALTA_OPTIONS = [
    'Hoje Ouro', 'Hoje 2R', 'Hoje 3R',
    '24h Ouro', '24h 2R', '24h 3R',
    '48h', '72h', '96h', 'Sem Previsão'
];

// ISOLAMENTO - 3 opções
window.ISOLAMENTO_OPTIONS = [
    'Não Isolamento',
    'Isolamento de Contato',
    'Isolamento Respiratório'
];

// REGIÃO - 9 opções
window.REGIAO_OPTIONS = [
    'Zona Central', 'Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste',
    'ABC', 'Guarulhos', 'Osasco', 'Outra'
];

// GÊNERO - 2 opções
window.SEXO_OPTIONS = ['Masculino', 'Feminino'];

// DIRETIVAS ANTECIPADAS - 3 opções
window.DIRETIVAS_OPTIONS = ['Não se aplica', 'Sim', 'Não'];

// IDADE - Dropdown 14-115 anos
window.IDADE_OPTIONS = [];
for (let i = 14; i <= 115; i++) {
    window.IDADE_OPTIONS.push(i);
}

// =================== ✅ VARIÁVEIS GLOBAIS ===================
window.selectedLeito = null;
window.currentHospital = 'H1';
window.fundoBranco = false;

// =================== ✅ VALIDAÇÃO E LOG FINAL ===================
console.log('✅ CARDS-CONFIG.JS v2.1 - Carregado com sucesso!');
console.log('✅ Concessões:', window.CONCESSOES_LIST.length, 'itens (12 + "Não se aplica")');
console.log('✅ Linhas:', window.LINHAS_CUIDADO_LIST.length, 'itens');
console.log('✅ Hospitais:', Object.keys(window.HOSPITAL_MAPPING).length);
console.log('✅ Cruz Azul Numeração:', Object.keys(window.CRUZ_AZUL_NUMERACAO).length, 'leitos (1-36)');
console.log('✅ Cruz Azul Irmãos:', Object.keys(window.CRUZ_AZUL_IRMAOS).length / 2, 'pares');
console.log('✅ Funções:', typeof window.normalizarTexto, '/', typeof window.desnormalizarTexto);
console.log('✅ PRONTO para uso em cards.js e dashboards!');
