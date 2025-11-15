// =================== CARDS-CONFIG.JS V6.0 - CONFIGURAÇÕES GLOBAIS ===================
// Versão: 6.0 - ATUALIZADO PARA 11 HOSPITAIS
// Descrição: Fonte única de verdade para mapas, funções e configurações
// ✅ NOVIDADE V6.0: H8 e H9 adicionados (São Camilo Ipiranga e Pompeia)
// ✅ NOVIDADE V6.0: Sistema de leitos extras dinâmico
// ✅ NOVIDADE V6.0: Santa Clara reestruturado (4 pares de irmãos)
// ✅ NOVIDADE V6.0: Santa Marcelina expandido (28 leitos)
// ✅ NOVIDADE V6.0: Campo anotações (800 caracteres)

console.log('🔵 CARDS-CONFIG.JS v6.0 - Iniciando carregamento...');

// =================== ✅ MAPAS DE DISPLAY (COM ACENTOS UTF-8) ===================
window.CONCESSOES_DISPLAY_MAP = {
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

// =================== ✅ FUNÇÕES DE NORMALIZAÇÃO ===================
window.normalizarTexto = function(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
};

window.desnormalizarTexto = function(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    
    if (window.CONCESSOES_DISPLAY_MAP[texto]) {
        return window.CONCESSOES_DISPLAY_MAP[texto];
    }
    
    if (window.LINHAS_DISPLAY_MAP[texto]) {
        return window.LINHAS_DISPLAY_MAP[texto];
    }
    
    return texto;
};

// =================== ✅ CONFIGURAÇÕES DE HOSPITAIS V6.0 ===================
window.HOSPITAL_MAPPING = {
    H1: { nome: 'Neomater', leitos: 25, tipo: 'hibrido_puro' },
    H2: { nome: 'Cruz Azul', leitos: 67, tipo: 'tipos_fixos' },
    H3: { nome: 'Santa Marcelina', leitos: 28, tipo: 'hibrido_puro' },
    H4: { nome: 'Santa Clara', leitos: 57, tipo: 'tipos_fixos' },
    H5: { nome: 'Adventista', leitos: 28, tipo: 'hibrido_puro' },
    H6: { nome: 'Santa Cruz', leitos: 22, tipo: 'hibrido_puro' },
    H7: { nome: 'Santa Virgínia', leitos: 22, tipo: 'hibrido_puro' },
    H8: { nome: 'São Camilo Ipiranga', leitos: 22, tipo: 'hibrido_puro' },
    H9: { nome: 'São Camilo Pompeia', leitos: 22, tipo: 'hibrido_puro' }
    // H10 e H11 existem no backend mas não aparecem no frontend (reservas desabilitadas)
};

// =================== ✅ SISTEMA DE LEITOS EXTRAS V6.0 (DINÂMICO) ===================
window.HOSPITAL_CAPACIDADE = {
    H1: { contratuais: 10, extras: 15, total: 25 },
    H2: { contratuais: 36, extras: 31, total: 67 },
    H3: { contratuais: 7, extras: 21, total: 28 },
    H4: { contratuais: 26, extras: 31, total: 57 },
    H5: { contratuais: 13, extras: 15, total: 28 },
    H6: { contratuais: 7, extras: 15, total: 22 },
    H7: { contratuais: 7, extras: 15, total: 22 },
    H8: { contratuais: 7, extras: 15, total: 22 },
    H9: { contratuais: 7, extras: 15, total: 22 }
};

// =================== ✅ ORDEM ALFABÉTICA (9 HOSPITAIS ATIVOS) ===================
window.ORDEM_ALFABETICA_HOSPITAIS = ['H5', 'H2', 'H1', 'H4', 'H6', 'H3', 'H7', 'H8', 'H9'];

// =================== ✅ TIPOS DE HOSPITAL ===================
window.HOSPITAIS_HIBRIDOS = ['H1', 'H3', 'H5', 'H6', 'H7', 'H8', 'H9'];
window.HOSPITAIS_TIPOS_FIXOS = ['H2', 'H4'];

// =================== ✅ CRUZ AZUL - LEITOS IRMÃOS (8 PARES) ===================
window.CRUZ_AZUL_IRMAOS = {
    21: 22, 22: 21,
    23: 24, 24: 23,
    25: 26, 26: 25,
    27: 28, 28: 27,
    29: 30, 30: 29,
    31: 32, 32: 31,
    33: 34, 34: 33,
    35: 36, 36: 35
};

console.log('✅ CRUZ_AZUL_IRMAOS carregado:', Object.keys(window.CRUZ_AZUL_IRMAOS).length / 2, 'pares');

// =================== ✅ SANTA CLARA - LEITOS IRMÃOS (4 PARES) - NOVO V6.0 ===================
window.SANTA_CLARA_IRMAOS = {
    10: 11, 11: 10,
    12: 13, 13: 12,
    14: 15, 15: 14,
    16: 17, 17: 16
};

console.log('✅ SANTA_CLARA_IRMAOS carregado:', Object.keys(window.SANTA_CLARA_IRMAOS).length / 2, 'pares');

// =================== ✅ LISTAS DE OPÇÕES ===================
window.TIPO_QUARTO_OPTIONS = ['Apartamento', 'Enfermaria'];

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

window.PPS_OPTIONS = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];

window.PREVISAO_ALTA_OPTIONS = [
    'Hoje Ouro', 'Hoje 2R', 'Hoje 3R',
    '24h Ouro', '24h 2R', '24h 3R',
    '48h', '72h', '96h', 'Sem Previsão'
];

window.ISOLAMENTO_OPTIONS = [
    'Não Isolamento',
    'Isolamento de Contato',
    'Isolamento Respiratório'
];

window.REGIAO_OPTIONS = [
    'Zona Central', 'Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste',
    'ABC', 'Guarulhos', 'Osasco', 'Outra'
];

window.SEXO_OPTIONS = ['Masculino', 'Feminino'];
window.DIRETIVAS_OPTIONS = ['Não se aplica', 'Sim', 'Não'];

window.IDADE_OPTIONS = [];
for (let i = 14; i <= 115; i++) {
    window.IDADE_OPTIONS.push(i);
}

// =================== ✅ VARIÁVEIS GLOBAIS ===================
window.selectedLeito = null;
window.currentHospital = 'H1';
window.fundoBranco = false;

// =================== ✅ FUNÇÕES AUXILIARES V6.0 ===================
window.getHospitalNome = function(hospitalId) {
    return window.HOSPITAL_MAPPING[hospitalId]?.nome || hospitalId;
};

window.getHospitalTipo = function(hospitalId) {
    return window.HOSPITAL_MAPPING[hospitalId]?.tipo || 'hibrido_puro';
};

window.isHospitalHibrido = function(hospitalId) {
    return window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
};

window.isHospitalTiposFixos = function(hospitalId) {
    return window.HOSPITAIS_TIPOS_FIXOS.includes(hospitalId);
};

window.getCapacidade = function(hospitalId) {
    return window.HOSPITAL_CAPACIDADE[hospitalId] || { contratuais: 0, extras: 0, total: 0 };
};

window.getLeitoIrmao = function(hospitalId, leitoNum) {
    if (hospitalId === 'H2') {
        return window.CRUZ_AZUL_IRMAOS[leitoNum] || null;
    }
    if (hospitalId === 'H4') {
        return window.SANTA_CLARA_IRMAOS[leitoNum] || null;
    }
    return null;
};

// =================== ✅ CÁLCULO DE LEITOS EXTRAS V6.0 ===================
window.calcularLeitosExtras = function(hospitalId, leitosOcupados) {
    const capacidade = window.getCapacidade(hospitalId);
    
    if (!capacidade || capacidade.contratuais === 0) {
        return { contratuais: 0, extras: 0 };
    }
    
    const ocupadosNum = Array.isArray(leitosOcupados) ? leitosOcupados.length : leitosOcupados;
    
    if (ocupadosNum <= capacidade.contratuais) {
        return {
            contratuais: ocupadosNum,
            extras: 0
        };
    } else {
        return {
            contratuais: capacidade.contratuais,
            extras: ocupadosNum - capacidade.contratuais
        };
    }
};

// =================== ✅ VALIDAÇÃO DE LEITO EXTRA ===================
window.isLeitoExtra = function(hospitalId, posicaoOcupacao) {
    const capacidade = window.getCapacidade(hospitalId);
    return posicaoOcupacao > capacidade.contratuais;
};

// =================== ✅ CORES LEITOS EXTRAS V6.0 ===================
window.COR_FLAG_CONTRATUAL = '#60a5fa';
window.COR_FLAG_EXTRA = '#f59a1d';
window.COR_BORDA_EXTRA = '#f59a1d';

// =================== ✅ LOG FINAL ===================
console.log('✅ CARDS-CONFIG.JS v6.0 - Carregado com sucesso!');
console.log('✅ Concessões:', window.CONCESSOES_LIST.length, 'itens');
console.log('✅ Linhas:', window.LINHAS_CUIDADO_LIST.length, 'itens');
console.log('✅ Hospitais ativos:', Object.keys(window.HOSPITAL_MAPPING).length);
console.log('✅ Total de leitos:', Object.values(window.HOSPITAL_CAPACIDADE).reduce((acc, h) => acc + h.total, 0));
console.log('✅ Contratuais:', Object.values(window.HOSPITAL_CAPACIDADE).reduce((acc, h) => acc + h.contratuais, 0));
console.log('✅ Extras:', Object.values(window.HOSPITAL_CAPACIDADE).reduce((acc, h) => acc + h.extras, 0));
console.log('✅ Cruz Azul Irmãos:', Object.keys(window.CRUZ_AZUL_IRMAOS).length / 2, 'pares');
console.log('✅ Santa Clara Irmãos:', Object.keys(window.SANTA_CLARA_IRMAOS).length / 2, 'pares');
console.log('✅ Sistema de leitos extras: ATIVO');
console.log('✅ PRONTO para uso!');