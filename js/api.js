// =================== API V7.0 - ARCHIPELAGO DASHBOARD ===================
// Cliente: Guilherme Santoro
// Desenvolvedor: Alessandro Rodrigues
// Data: Dezembro/2025
// Versão: V7.0 (11 HOSPITAIS - 356 LEITOS - 76 COLUNAS + RESERVAS + UTI)
// ✅ NOVIDADES V7.0:
//    - Sistema de UTI (63 leitos em 8 hospitais)
//    - Sistema de Reservas (nova aba "reservas")
//    - Endpoints: reservar, cancelarReserva, listarReservas, admitirComReserva
//    - Campos bloqueados para UTI
//    - H7 Santa Virgínia sem UTI
// ✅ MANTIDO V6.0:
//    - Sistema de leitos extras dinâmico
//    - Campo anotações (BX - 800 caracteres)
//    - Leitos irmãos (Cruz Azul e Santa Clara)
// ==================================================================================

// =================== URL DA API V7.0 ===================
window.API_URL = 'https://script.google.com/macros/s/AKfycbypNXwnvCIIcl-hrpnoawOkFQEN_iqo_kWPqMZ2yejDw3IqMF73FYhCUFHhTRzTwLZtsQ/exec';

// =================== CONFIGURAÇÃO DOS HOSPITAIS V7.0 ===================
window.HOSPITAIS_CONFIG = {
    H1: { nome: 'Neomater', leitos: 25 },
    H2: { nome: 'Cruz Azul', leitos: 67 },
    H3: { nome: 'Santa Marcelina', leitos: 28 },
    H4: { nome: 'Santa Clara', leitos: 57 },
    H5: { nome: 'Adventista', leitos: 28 },
    H6: { nome: 'Santa Cruz', leitos: 22 },
    H7: { nome: 'Santa Virgínia', leitos: 22 },
    H8: { nome: 'São Camilo Ipiranga', leitos: 22 },
    H9: { nome: 'São Camilo Pompeia', leitos: 22 }
    // H10 e H11 existem no backend mas não aparecem no frontend (reservas)
};

// =================== VARIÁVEIS GLOBAIS ===================
window.hospitalData = {};
window.reservasData = [];  // ✅ NOVO V7.0: Array de reservas ativas
window.apiCache = {};
window.lastAPICall = 0;
window.API_TIMEOUT = 15000;

// =================== MAPEAMENTO DE COLUNAS V7.0 (76 COLUNAS: A-BX) ===================
window.COLUNAS = {
    HOSPITAL: 0, LEITO: 1, TIPO: 2, STATUS: 3, NOME: 4, MATRICULA: 5,
    IDADE: 6, ADM_AT: 7, PPS: 8, SPICT: 9, COMPLEXIDADE: 10, PREV_ALTA: 11,
    C1_TRANSICAO_DOMICILIAR: 12, C2_APLICACAO_MED_DOMICILIAR: 13,
    C3_ASPIRACAO: 14, C4_BANHO: 15, C5_CURATIVO: 16, C6_CURATIVO_PICC: 17,
    C7_FISIOTERAPIA_MOTORA_DOMICILIAR: 18, C8_FONOAUDIOLOGIA_DOMICILIAR: 19,
    C9_OXIGENOTERAPIA: 20, C10_REMOCAO: 21, C11_SOLICITACAO_EXAMES_DOMICILIAR: 22,
    L1_ASSISTE: 23, L2_APS_SP: 24, L3_CUIDADOS_PALIATIVOS: 25, L4_ICO: 26,
    L5_NEXUS_SP_CARDIOLOGIA: 27, L6_NEXUS_SP_GASTROENTEREOLOGIA: 28,
    L7_NEXUS_SP_GERIATRIA: 29, L8_NEXUS_SP_PNEUMOLOGIA: 30,
    L9_NEXUS_SP_PSIQUIATRIA: 31, L10_NEXUS_SP_REUMATOLOGIA: 32,
    L11_NEXUS_SP_SAUDE_FIGADO: 33, L12_GENERALISTA: 34,
    L13_BUCOMAXILOFACIAL: 35, L14_CARDIOLOGIA: 36, L15_CIRURGIA_CARDIACA: 37,
    L16_CIRURGIA_CABECA_PESCOCO: 38, L17_CIRURGIA_APARELHO_DIGESTIVO: 39,
    L18_CIRURGIA_GERAL: 40, L19_CIRURGIA_ONCOLOGICA: 41,
    IDENTIFICACAO_LEITO: 42, ISOLAMENTO: 43,
    L20_CIRURGIA_PLASTICA: 44, L21_CIRURGIA_TORACICA: 45,
    L22_CIRURGIA_VASCULAR: 46, L23_CLINICA_MEDICA: 47,
    L24_COLOPROCTOLOGIA: 48, L25_DERMATOLOGIA: 49,
    L26_ENDOCRINOLOGIA: 50, L27_FISIATRIA: 51,
    L28_GASTROENTEROLOGIA: 52, L29_GERIATRIA: 53,
    L30_GINECOLOGIA_OBSTETRICIA: 54, L31_HEMATOLOGIA: 55,
    L32_INFECTOLOGIA: 56, L33_MASTOLOGIA: 57, L34_NEFROLOGIA: 58,
    L35_NEUROCIRURGIA: 59, L36_NEUROLOGIA: 60, L37_OFTALMOLOGIA: 61,
    L38_ONCOLOGIA_CLINICA: 62, L39_ORTOPEDIA: 63,
    L40_OTORRINOLARINGOLOGIA: 64, L41_PEDIATRIA: 65,
    L42_PNEUMOLOGIA: 66, L43_PSIQUIATRIA: 67, L44_REUMATOLOGIA: 68,
    L45_UROLOGIA: 69, GENERO: 70, REGIAO: 71,
    CATEGORIA_ESCOLHIDA: 72, DIRETIVAS: 73,
    C12_FISIOTERAPIA_RESPIRATORIA_DOMICILIAR: 74,
    ANOTACOES: 75
};

// =================== TIMELINE (10 OPÇÕES) ===================
window.TIMELINE_OPCOES = [
    "Hoje Ouro", "Hoje 2R", "Hoje 3R",
    "24h Ouro", "24h 2R", "24h 3R", 
    "48h", "48H", "72h", "72H", "96h", "96H", "SP"
];

// ✅ NOVO V7.0: TIMELINE UTI (sem turnos)
window.TIMELINE_UTI_OPCOES = [
    "Alta para Enfermaria",
    "Alta Domiciliar",
    "Transferência Externa",
    "Sem Previsão"
];

window.ISOLAMENTO_OPCOES = [
    "Não Isolamento",
    "Isolamento de Contato",
    "Isolamento Respiratório"
];

window.REGIOES_OPCOES = [
    "Zona Central", "Zona Sul", "Zona Norte", "Zona Leste", "Zona Oeste",
    "ABC", "Guarulhos", "Osasco", "Outra"
];

window.GENERO_OPCOES = ["Masculino", "Feminino"];
window.CATEGORIA_OPCOES = ["Apartamento", "Enfermaria"];
window.DIRETIVAS_OPCOES = ["Sim", "Não", "Não se aplica"];

// ✅ NOVO V7.0: TIPOS DE RESERVA
window.TIPOS_RESERVA = ["APTO", "ENF", "UTI"];

// =================== ✅ LISTAS PARA VALIDAÇÃO - 12 CONCESSÕES (SEM ACENTOS) ===================
window.CONCESSOES_VALIDAS = [
    "Transicao Domiciliar",
    "Aplicacao domiciliar de medicamentos",
    "Aspiracao",
    "Banho",
    "Curativo",
    "Curativo PICC",
    "Fisioterapia Motora Domiciliar",
    "Fonoaudiologia Domiciliar",
    "Oxigenoterapia",
    "Remocao",
    "Solicitacao domiciliar de exames",
    "Fisioterapia Respiratoria Domiciliar"
];

window.LINHAS_VALIDAS = [
    "Assiste", "APS SP", "Cuidados Paliativos",
    "ICO (Insuficiencia Coronariana)", "Nexus SP Cardiologia",
    "Nexus SP Gastroentereologia", "Nexus SP Geriatria",
    "Nexus SP Pneumologia", "Nexus SP Psiquiatria",
    "Nexus SP Reumatologia", "Nexus SP Saude do Figado",
    "Generalista", "Bucomaxilofacial", "Cardiologia",
    "Cirurgia Cardiaca", "Cirurgia de Cabeca e Pescoco",
    "Cirurgia do Aparelho Digestivo", "Cirurgia Geral",
    "Cirurgia Oncologica", "Cirurgia Plastica",
    "Cirurgia Toracica", "Cirurgia Vascular",
    "Clinica Medica", "Coloproctologia", "Dermatologia",
    "Endocrinologia", "Fisiatria", "Gastroenterologia",
    "Geriatria", "Ginecologia e Obstetricia",
    "Hematologia", "Infectologia", "Mastologia",
    "Nefrologia", "Neurocirurgia", "Neurologia",
    "Oftalmologia", "Oncologia Clinica", "Ortopedia",
    "Otorrinolaringologia", "Pediatria", "Pneumologia",
    "Psiquiatria", "Reumatologia", "Urologia"
];

// =================== ✅ CORES PANTONE - 12 CONCESSÕES (SEM ACENTOS NAS CHAVES) ===================
window.CORES_CONCESSOES = {
    'Transicao Domiciliar': '#007A53',
    'Aplicacao domiciliar de medicamentos': '#582C83',
    'Aspiracao': '#2E1A47',
    'Banho': '#8FD3F4',
    'Curativo': '#00BFB3',
    'Curativo PICC': '#E03C31',
    'Fisioterapia Motora Domiciliar': '#009639',
    'Fonoaudiologia Domiciliar': '#FF671F',
    'Oxigenoterapia': '#64A70B',
    'Remocao': '#FFB81C',
    'Solicitacao domiciliar de exames': '#546E7A',
    'Fisioterapia Respiratoria Domiciliar': '#1B5E20'
};

window.CORES_LINHAS = {
    'Assiste': '#ED0A72', 'APS SP': '#007A33',
    'Cuidados Paliativos': '#00B5A2',
    'ICO (Insuficiencia Coronariana)': '#A6192E',
    'Nexus SP Cardiologia': '#C8102E',
    'Nexus SP Gastroentereologia': '#455A64',
    'Nexus SP Geriatria': '#E35205',
    'Nexus SP Pneumologia': '#4A148C',
    'Nexus SP Psiquiatria': '#3E2723',
    'Nexus SP Reumatologia': '#E91E63',
    'Nexus SP Saude do Figado': '#556F44',
    'Generalista': '#FFC72C', 'Bucomaxilofacial': '#D81B60',
    'Cardiologia': '#5A0020', 'Cirurgia Cardiaca': '#9CCC65',
    'Cirurgia de Cabeca e Pescoco': '#7CB342',
    'Cirurgia do Aparelho Digestivo': '#00263A',
    'Cirurgia Geral': '#00AEEF', 'Cirurgia Oncologica': '#0072CE',
    'Cirurgia Plastica': '#8E24AA', 'Cirurgia Toracica': '#BA68C8',
    'Cirurgia Vascular': '#AED581', 'Clinica Medica': '#F4E285',
    'Coloproctologia': '#C2185B', 'Dermatologia': '#9C27B0',
    'Endocrinologia': '#37474F', 'Fisiatria': '#E8927C',
    'Gastroenterologia': '#003C57', 'Geriatria': '#FF6F1D',
    'Ginecologia e Obstetricia': '#582D40',
    'Hematologia': '#1E88E5', 'Infectologia': '#4A7C59',
    'Mastologia': '#5C5EBE', 'Nefrologia': '#7B1FA2',
    'Neurocirurgia': '#1565C0', 'Neurologia': '#64B5F6',
    'Oftalmologia': '#6D4C41', 'Oncologia Clinica': '#6A1B9A',
    'Ortopedia': '#42A5F5', 'Otorrinolaringologia': '#AD1457',
    'Pediatria': '#5A646B', 'Pneumologia': '#1976D2',
    'Psiquiatria': '#4E342E', 'Reumatologia': '#880E4F',
    'Urologia': '#2D5016'
};

// =================== ✅ NORMALIZAÇÃO (APENAS PARA VALIDAÇÃO) ===================
function normalizarTexto(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
}

// =================== FUNÇÕES AUXILIARES ===================
function logAPI(message, data = null) {
    console.log(`[API V7.0] ${message}`, data || '');
}

function logAPIError(message, error) {
    console.error(`[API ERROR V7.0] ${message}`, error);
}

function logAPISuccess(message, data = null) {
    console.log(`[API SUCCESS V7.0] ${message}`, data || '');
}

// =================== ✅ VALIDAÇÃO QUE PRESERVA ACENTOS ORIGINAIS ===================
function validarTimeline(prevAlta, isUTI = false) {
    if (isUTI) {
        return window.TIMELINE_UTI_OPCOES.includes(prevAlta) ? prevAlta : 'Sem Previsão';
    }
    return window.TIMELINE_OPCOES.includes(prevAlta) ? prevAlta : 'SP';
}

function validarConcessoes(concessoes) {
    if (!Array.isArray(concessoes)) return [];
    
    return concessoes.filter(c => {
        const normalizada = normalizarTexto(c);
        return window.CONCESSOES_VALIDAS.includes(normalizada);
    });
}

function validarLinhas(linhas) {
    if (!Array.isArray(linhas)) return [];
    
    return linhas.filter(l => {
        const normalizada = normalizarTexto(l);
        return window.LINHAS_VALIDAS.includes(normalizada);
    });
}

function validarIsolamento(isolamento) {
    if (!isolamento || typeof isolamento !== 'string') {
        return 'Não Isolamento';
    }
    
    const isolamentoNormalizado = isolamento.trim();
    const isolamentoLower = isolamentoNormalizado.toLowerCase();
    
    if (isolamentoLower === 'isolamento de contato' || 
        isolamentoLower === 'isolamento contato') {
        return 'Isolamento de Contato';
    }
    
    if (isolamentoLower === 'isolamento respiratório' || 
        isolamentoLower === 'isolamento respiratorio') {
        return 'Isolamento Respiratório';
    }
    
    if (isolamentoLower === 'não isolamento' || 
        isolamentoLower === 'nao isolamento') {
        return 'Não Isolamento';
    }
    
    if (window.ISOLAMENTO_OPCOES.includes(isolamentoNormalizado)) {
        return isolamentoNormalizado;
    }
    
    return 'Não Isolamento';
}

function validarIdentificacaoLeito(identificacao) {
    if (identificacao === null || identificacao === undefined) return '';
    const identificacaoStr = String(identificacao).trim();
    if (identificacaoStr === '') return '';
    
    if (identificacaoStr.length > 10) {
        console.warn(`Identificacao "${identificacaoStr}" excede 10 caracteres, truncando...`);
        return identificacaoStr.substring(0, 10).toUpperCase();
    }
    
    return identificacaoStr.toUpperCase();
}

function validarGenero(genero) {
    return window.GENERO_OPCOES.includes(genero) ? genero : '';
}

function validarRegiao(regiao) {
    return window.REGIOES_OPCOES.includes(regiao) ? regiao : '';
}

function validarCategoriaEscolhida(categoria) {
    return window.CATEGORIA_OPCOES.includes(categoria) ? categoria : '';
}

function validarDiretivas(diretiva) {
    return window.DIRETIVAS_OPCOES.includes(diretiva) ? diretiva : 'Não se aplica';
}

function getCorConcessao(concessao) {
    const normalizada = normalizarTexto(concessao);
    return window.CORES_CONCESSOES[normalizada] || '#999999';
}

function getCorLinha(linha) {
    const normalizada = normalizarTexto(linha);
    return window.CORES_LINHAS[normalizada] || '#999999';
}

// =================== JSONP ===================
function jsonpRequest(url, params = {}) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        window[callbackName] = function(data) {
            delete window[callbackName];
            if (script && script.parentNode) {
                document.head.removeChild(script);
            }
            resolve(data);
        };
        
        const urlObj = new URL(url);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                urlObj.searchParams.append(key, String(params[key]));
            }
        });
        urlObj.searchParams.append('callback', callbackName);
        
        const script = document.createElement('script');
        script.src = urlObj.toString();
        script.onerror = () => {
            delete window[callbackName];
            if (script && script.parentNode) {
                document.head.removeChild(script);
            }
            reject(new Error('JSONP request failed'));
        };
        
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script && script.parentNode) {
                    document.head.removeChild(script);
                }
                reject(new Error('JSONP request timeout'));
            }
        }, 20000);
        
        setTimeout(() => {
            document.head.appendChild(script);
        }, 100);
    });
}

// =================== API REQUEST ===================
async function apiRequest(action, params = {}, method = 'GET') {
    try {
        logAPI(`Fazendo requisicao ${method}: ${action}`, params);
        
        if (method === 'GET') {
            try {
                let url = new URL(window.API_URL);
                url.searchParams.append('action', action);
                Object.keys(params).forEach(key => {
                    if (params[key] !== null && params[key] !== undefined) {
                        url.searchParams.append(key, String(params[key]));
                    }
                });
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                
                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.ok) {
                    throw new Error(data.error || data.message || 'Erro desconhecido da API');
                }
                
                logAPISuccess(`${method} ${action} concluido (Fetch)`, data.data ? `${Object.keys(data.data).length || 0} registros` : 'sem dados');
                return data;
                
            } catch (fetchError) {
                logAPI(`Fetch falhou (${fetchError.message}), tentando JSONP...`);
                
                const data = await jsonpRequest(window.API_URL, { action, ...params });
                
                if (!data || !data.ok) {
                    throw new Error(data?.error || data?.message || 'Erro desconhecido da API via JSONP');
                }
                
                logAPISuccess(`${method} ${action} concluido (JSONP)`, data.data ? `${Object.keys(data.data).length || 0} registros` : 'sem dados');
                return data;
            }
            
        } else {
            try {
                const response = await fetch(window.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ action, ...params })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                if (!data.ok) throw new Error(data.error || 'Erro no POST');
                
                logAPISuccess(`${method} ${action} concluido (POST)`, 'dados salvos');
                return data;
                
            } catch (postError) {
                logAPI(`POST falhou (${postError.message}), tentando via GET com JSONP...`);
                
                const data = await jsonpRequest(window.API_URL, { action, ...params });
                if (!data || !data.ok) throw new Error(data?.error || 'Erro no POST via JSONP');
                
                logAPISuccess(`${method} ${action} concluido (POST via JSONP)`, 'dados salvos');
                return data;
            }
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            logAPIError(`Timeout na requisicao ${method} ${action}`, 'Requisicao cancelada por timeout');
            throw new Error('Timeout na API - verifique sua conexao');
        }
        
        logAPIError(`Erro na requisicao ${method} ${action}`, error.message);
        throw error;
    }
}

// =================== CARREGAMENTO DE DADOS V7.0 ===================
window.loadHospitalData = async function() {
    try {
        logAPI('Carregando dados V7.0 da planilha (356 leitos + reservas)...');
        
        if (window.showLoading) {
            window.showLoading(null, 'Sincronizando com Google Apps Script V7.0...');
        }
        
        const apiResponse = await apiRequest('all', {}, 'GET');
        
        if (!apiResponse || !apiResponse.data || typeof apiResponse.data !== 'object') {
            throw new Error('API V7.0 retornou dados invalidos');
        }
        
        const apiData = apiResponse.data;
        
        window.hospitalData = {};
        
        if (apiData.H1 && apiData.H1.leitos) {
            logAPI('Dados V7.0 recebidos em formato agrupado');
            window.hospitalData = apiData;
        } 
        else if (Array.isArray(apiData)) {
            logAPI('Dados V7.0 recebidos em formato flat - convertendo...');
            apiData.forEach(leito => {
                const hospitalId = leito.hospital;
                if (!window.hospitalData[hospitalId]) {
                    window.hospitalData[hospitalId] = { leitos: [] };
                }
                window.hospitalData[hospitalId].leitos.push(leito);
            });
        }
        else {
            throw new Error('Formato de dados da API V7.0 nao reconhecido');
        }
        
        // ✅ NOVO V7.0: Carregar reservas
        if (apiResponse.reservas && Array.isArray(apiResponse.reservas)) {
            window.reservasData = apiResponse.reservas;
            logAPI('Reservas carregadas: ' + window.reservasData.length);
        } else {
            window.reservasData = [];
        }
        
        const totalHospitais = Object.keys(window.hospitalData).length;
        if (totalHospitais === 0) {
            throw new Error('Nenhum hospital encontrado nos dados da API V7.0');
        }
        
        if (totalHospitais < 9) {
            console.warn(`AVISO: Esperados 9+ hospitais, mas foram encontrados ${totalHospitais}`);
        }
        
        // Processar leitos
        Object.keys(window.hospitalData).forEach(hospitalId => {
            const hospital = window.hospitalData[hospitalId];
            if (hospital && hospital.leitos) {
                hospital.leitos = hospital.leitos.map(leito => {
                    // Normalizar status
                    if (leito.status === 'Em uso') leito.status = 'ocupado';
                    if (leito.status === 'Ocupado') leito.status = 'ocupado';
                    if (leito.status === 'Vago') leito.status = 'vago';
                    
                    // ✅ NOVO V7.0: Marcar se é UTI
                    leito.isUTI = (leito.tipo === 'UTI');
                    
                    // Validar previsão de alta (diferente para UTI)
                    if (leito.prevAlta) {
                        leito.prevAlta = validarTimeline(leito.prevAlta, leito.isUTI);
                    }
                    
                    // Validar concessões e linhas
                    if (leito.concessoes) {
                        leito.concessoes = validarConcessoes(leito.concessoes);
                    }
                    if (leito.linhas) {
                        leito.linhas = validarLinhas(leito.linhas);
                    }
                    
                    // Validar isolamento
                    if (leito.isolamento) {
                        leito.isolamento = validarIsolamento(leito.isolamento);
                    } else {
                        leito.isolamento = 'Não Isolamento';
                    }
                    
                    // Validar identificação do leito
                    if (leito.identificacaoLeito) {
                        try {
                            leito.identificacaoLeito = validarIdentificacaoLeito(leito.identificacaoLeito);
                        } catch (error) {
                            logAPIError(`Erro na identificacao do leito ${hospitalId}-${leito.leito}:`, error.message);
                            leito.identificacaoLeito = '';
                        }
                    } else {
                        leito.identificacaoLeito = '';
                    }
                    
                    // Validar gênero
                    if (leito.genero) {
                        leito.genero = validarGenero(leito.genero);
                    } else {
                        leito.genero = '';
                    }
                    
                    // Validar região
                    if (leito.regiao) {
                        leito.regiao = validarRegiao(leito.regiao);
                    } else {
                        leito.regiao = '';
                    }
                    
                    // Validar categoria escolhida
                    if (leito.categoriaEscolhida) {
                        leito.categoriaEscolhida = validarCategoriaEscolhida(leito.categoriaEscolhida);
                        leito.categoria = leito.categoriaEscolhida;
                    } else {
                        leito.categoriaEscolhida = '';
                        leito.categoria = '';
                    }
                    
                    // Validar diretivas
                    if (leito.diretivas) {
                        leito.diretivas = validarDiretivas(leito.diretivas);
                    } else {
                        leito.diretivas = 'Não se aplica';
                    }
                    
                    // Garantir campo anotações
                    if (!leito.anotacoes) {
                        leito.anotacoes = '';
                    }
                    
                    // Criar objeto paciente se ocupado
                    if (leito.status === 'ocupado' && leito.nome) {
                        leito.paciente = {
                            nome: leito.nome,
                            matricula: leito.matricula,
                            idade: leito.idade,
                            pps: leito.pps,
                            spict: leito.spict,
                            complexidade: leito.complexidade,
                            prevAlta: leito.prevAlta,
                            linhas: leito.linhas || [],
                            concessoes: leito.concessoes || [],
                            isolamento: leito.isolamento,
                            identificacaoLeito: leito.identificacaoLeito,
                            genero: leito.genero,
                            regiao: leito.regiao,
                            categoriaEscolhida: leito.categoriaEscolhida,
                            diretivas: leito.diretivas,
                            anotacoes: leito.anotacoes
                        };
                    }
                    
                    return leito;
                });
                
                // Ordenar leitos por número
                hospital.leitos.sort((a, b) => (a.leito || 0) - (b.leito || 0));
            }
        });
        
        // Estatísticas
        const totalLeitos = Object.values(window.hospitalData).reduce((acc, h) => acc + (h.leitos ? h.leitos.length : 0), 0);
        const leitosOcupados = Object.values(window.hospitalData).reduce((acc, h) => 
            acc + (h.leitos ? h.leitos.filter(l => l.status === 'ocupado').length : 0), 0);
        const leitosUTI = Object.values(window.hospitalData).reduce((acc, h) => 
            acc + (h.leitos ? h.leitos.filter(l => l.tipo === 'UTI').length : 0), 0);
        const taxaOcupacao = totalLeitos > 0 ? Math.round((leitosOcupados / totalLeitos) * 100) : 0;
        
        let totalConcessoes = 0;
        let totalLinhas = 0;
        let leitosComIsolamento = 0;
        let leitosComIdentificacao = 0;
        let leitosComGenero = 0;
        let leitosComRegiao = 0;
        let leitosComCategoria = 0;
        let leitosComDiretivas = 0;
        let leitosComAnotacoes = 0;
        
        Object.values(window.hospitalData).forEach(hospital => {
            hospital.leitos?.forEach(leito => {
                if (leito.status === 'ocupado') {
                    totalConcessoes += (leito.concessoes?.length || 0);
                    totalLinhas += (leito.linhas?.length || 0);
                }
                if (leito.isolamento && leito.isolamento !== 'Não Isolamento') {
                    leitosComIsolamento++;
                }
                if (leito.identificacaoLeito) {
                    leitosComIdentificacao++;
                }
                if (leito.genero) {
                    leitosComGenero++;
                }
                if (leito.regiao) {
                    leitosComRegiao++;
                }
                if (leito.categoriaEscolhida) {
                    leitosComCategoria++;
                }
                if (leito.diretivas && leito.diretivas !== 'Não se aplica') {
                    leitosComDiretivas++;
                }
                if (leito.anotacoes) {
                    leitosComAnotacoes++;
                }
            });
        });
        
        logAPISuccess(`Dados V7.0 carregados da planilha (76 colunas A-BX):`);
        logAPISuccess(`- ${totalHospitais} hospitais ativos`);
        logAPISuccess(`- ${totalLeitos} leitos totais (${leitosUTI} UTI)`);
        logAPISuccess(`- ${leitosOcupados} leitos ocupados (${taxaOcupacao}%)`);
        logAPISuccess(`- ${window.reservasData.length} reservas ativas`);
        logAPISuccess(`- ${totalConcessoes} concessoes ativas (12 tipos)`);
        logAPISuccess(`- ${totalLinhas} linhas de cuidado ativas (45 tipos)`);
        logAPISuccess(`- ${leitosComIsolamento} leitos com isolamento (AR)`);
        logAPISuccess(`- ${leitosComIdentificacao} leitos com identificacao (AQ)`);
        logAPISuccess(`- ${leitosComGenero} leitos com genero (BS/70)`);
        logAPISuccess(`- ${leitosComRegiao} leitos com regiao (BT/71)`);
        logAPISuccess(`- ${leitosComCategoria} leitos com categoria (BU/72)`);
        logAPISuccess(`- ${leitosComDiretivas} leitos com diretivas (BV/73)`);
        logAPISuccess(`- ${leitosComAnotacoes} leitos com anotacoes (BX/75)`);
        
        window.lastAPICall = Date.now();
        
        if (window.hideLoading) {
            window.hideLoading();
        }
        
        return window.hospitalData;
        
    } catch (error) {
        logAPIError('ERRO ao carregar dados V7.0:', error.message);
        
        if (window.hideLoading) {
            window.hideLoading();
        }
        
        window.hospitalData = {};
        window.reservasData = [];
        
        throw error;
    }
};

// =================== ✅ ADMITIR PACIENTE V7.0 (COM SUPORTE UTI) ===================
window.admitirPaciente = async function(hospital, leito, dadosPaciente) {
    try {
        logAPI(`Admitindo paciente V7.0 no ${hospital}-${leito}`);
        
        // Verificar se é UTI
        const leitoDados = window.hospitalData[hospital]?.leitos?.find(l => l.leito == leito);
        const isUTI = leitoDados?.tipo === 'UTI';
        
        const concessoesValidas = isUTI ? [] : validarConcessoes(dadosPaciente.concessoes || []);
        const linhasValidas = validarLinhas(dadosPaciente.linhas || []);
        const timelineValida = validarTimeline(dadosPaciente.prevAlta || (isUTI ? 'Sem Previsão' : 'SP'), isUTI);
        const isolamentoValido = validarIsolamento(dadosPaciente.isolamento || 'Não Isolamento');
        const generoValido = validarGenero(dadosPaciente.genero || '');
        const regiaoValida = validarRegiao(dadosPaciente.regiao || '');
        const categoriaValida = isUTI ? '' : validarCategoriaEscolhida(dadosPaciente.categoriaEscolhida || '');
        const diretivasValida = isUTI ? '' : validarDiretivas(dadosPaciente.diretivas || 'Não se aplica');
        
        let identificacaoValida = '';
        if (dadosPaciente.identificacaoLeito) {
            try {
                identificacaoValida = validarIdentificacaoLeito(dadosPaciente.identificacaoLeito);
            } catch (error) {
                throw new Error(`Erro na identificacao do leito: ${error.message}`);
            }
        }
        
        const payload = {
            hospital: hospital,
            leito: Number(leito),
            nome: dadosPaciente.nome || '',
            matricula: dadosPaciente.matricula || '',
            idade: dadosPaciente.idade || null,
            pps: isUTI ? null : (dadosPaciente.pps || null),
            spict: isUTI ? '' : (dadosPaciente.spict || ''),
            complexidade: isUTI ? '' : (dadosPaciente.complexidade || 'I'),
            prevAlta: timelineValida,
            linhas: linhasValidas,
            concessoes: concessoesValidas,
            isolamento: isolamentoValido,
            identificacaoLeito: identificacaoValida,
            genero: generoValido,
            regiao: regiaoValida,
            categoriaEscolhida: categoriaValida,
            diretivas: diretivasValida,
            anotacoes: dadosPaciente.anotacoes || ''
        };
        
        logAPI('Payload V7.0 validado:', {
            hospital: payload.hospital,
            leito: payload.leito,
            nome: payload.nome,
            matricula: payload.matricula,
            idade: payload.idade,
            isUTI: isUTI,
            isolamento: payload.isolamento,
            identificacaoLeito: payload.identificacaoLeito || '(vazio)',
            genero: payload.genero || '(vazio)',
            regiao: payload.regiao || '(vazio)',
            categoria: payload.categoriaEscolhida || '(vazio)',
            diretivas: payload.diretivas || '(vazio)',
            anotacoes: payload.anotacoes ? `${payload.anotacoes.length} chars` : 'vazio',
            concessoes: payload.concessoes.length,
            linhas: payload.linhas.length
        });
        
        const result = await apiRequest('admitir', payload, 'POST');
        
        logAPISuccess('Paciente admitido V7.0', result);
        return result;
        
    } catch (error) {
        logAPIError('Erro ao admitir paciente V7.0:', error.message);
        throw error;
    }
};

// =================== ✅ ATUALIZAR PACIENTE V7.0 ===================
window.atualizarPaciente = async function(hospital, leito, dadosPaciente) {
    try {
        logAPI(`Atualizando paciente V7.0 no ${hospital}-${leito}`);
        
        // Verificar se é UTI
        const leitoDados = window.hospitalData[hospital]?.leitos?.find(l => l.leito == leito);
        const isUTI = leitoDados?.tipo === 'UTI';
        
        const concessoesValidas = isUTI ? [] : validarConcessoes(dadosPaciente.concessoes || []);
        const linhasValidas = validarLinhas(dadosPaciente.linhas || []);
        const timelineValida = validarTimeline(dadosPaciente.prevAlta || (isUTI ? 'Sem Previsão' : 'SP'), isUTI);
        const isolamentoValido = validarIsolamento(dadosPaciente.isolamento || 'Não Isolamento');
        const generoValido = validarGenero(dadosPaciente.genero || '');
        const regiaoValida = validarRegiao(dadosPaciente.regiao || '');
        const categoriaValida = isUTI ? '' : validarCategoriaEscolhida(dadosPaciente.categoriaEscolhida || '');
        const diretivasValida = isUTI ? '' : validarDiretivas(dadosPaciente.diretivas || 'Não se aplica');
        
        let identificacaoValida = '';
        if (dadosPaciente.identificacaoLeito) {
            try {
                identificacaoValida = validarIdentificacaoLeito(dadosPaciente.identificacaoLeito);
            } catch (error) {
                throw new Error(`Erro na identificacao do leito: ${error.message}`);
            }
        }
        
        const payload = {
            hospital: hospital,
            leito: Number(leito),
            nome: dadosPaciente.nome || '',
            matricula: dadosPaciente.matricula || '',
            idade: dadosPaciente.idade || null,
            pps: isUTI ? null : (dadosPaciente.pps || null),
            spict: isUTI ? '' : (dadosPaciente.spict || ''),
            complexidade: isUTI ? '' : (dadosPaciente.complexidade || ''),
            prevAlta: timelineValida,
            linhas: linhasValidas,
            concessoes: concessoesValidas,
            isolamento: isolamentoValido,
            identificacaoLeito: identificacaoValida,
            genero: generoValido,
            regiao: regiaoValida,
            categoriaEscolhida: categoriaValida,
            diretivas: diretivasValida,
            anotacoes: dadosPaciente.anotacoes !== undefined ? dadosPaciente.anotacoes : ''
        };
        
        logAPI('Atualizacao V7.0 validada:', {
            hospital: payload.hospital,
            leito: payload.leito,
            isUTI: isUTI,
            anotacoes: payload.anotacoes ? `${payload.anotacoes.length} chars` : 'vazio',
            concessoes: payload.concessoes.length,
            linhas: payload.linhas.length
        });
        
        const result = await apiRequest('atualizar', payload, 'POST');
        
        logAPISuccess('Paciente atualizado V7.0', result);
        return result;
        
    } catch (error) {
        logAPIError('Erro ao atualizar paciente V7.0:', error.message);
        throw error;
    }
};

// =================== ✅ DAR ALTA ===================
window.darAlta = async function(hospital, leito) {
    try {
        logAPI(`Dando alta V7.0 no ${hospital}-${leito}`);
        
        const result = await apiRequest('daralta', {
            hospital: hospital,
            leito: Number(leito)
        }, 'POST');
        
        logAPISuccess('Alta processada V7.0', result);
        return result;
        
    } catch (error) {
        logAPIError('Erro ao dar alta V7.0:', error.message);
        throw error;
    }
};

// =================== ✅ NOVO V7.0: FUNÇÕES DE RESERVA ===================

/**
 * Criar uma nova reserva
 * @param {Object} dadosReserva - Dados da reserva
 * @returns {Promise} Resultado da operação
 */
window.criarReserva = async function(dadosReserva) {
    try {
        logAPI('Criando reserva V7.0...');
        
        const payload = {
            hospital: dadosReserva.hospital,
            tipo: dadosReserva.tipo || 'ENF',  // APTO, ENF ou UTI
            identificacaoLeito: dadosReserva.identificacaoLeito || '',
            isolamento: validarIsolamento(dadosReserva.isolamento || 'Não Isolamento'),
            genero: validarGenero(dadosReserva.genero || ''),
            iniciais: dadosReserva.iniciais || '',
            matricula: dadosReserva.matricula || '',
            idade: dadosReserva.idade || '',
            usuario: dadosReserva.usuario || ''
        };
        
        logAPI('Payload reserva:', payload);
        
        const result = await apiRequest('reservar', payload, 'POST');
        
        // Atualizar cache local
        if (result && result.ok) {
            await window.loadHospitalData();
        }
        
        logAPISuccess('Reserva criada V7.0', result);
        return result;
        
    } catch (error) {
        logAPIError('Erro ao criar reserva V7.0:', error.message);
        throw error;
    }
};

/**
 * Cancelar uma reserva existente
 * @param {Object} params - Parametros da reserva (hospital + matricula OU linha)
 * @returns {Promise} Resultado da operação
 */
window.cancelarReserva = async function(params) {
    try {
        logAPI('Cancelando reserva V7.0...');
        
        const payload = {
            hospital: params.hospital,
            matricula: params.matricula,
            linha: params.linha || null
        };
        
        const result = await apiRequest('cancelarReserva', payload, 'POST');
        
        // Atualizar cache local
        if (result && result.ok) {
            await window.loadHospitalData();
        }
        
        logAPISuccess('Reserva cancelada V7.0', result);
        return result;
        
    } catch (error) {
        logAPIError('Erro ao cancelar reserva V7.0:', error.message);
        throw error;
    }
};

/**
 * Listar reservas ativas
 * @param {string} hospital - ID do hospital (opcional, filtra por hospital)
 * @returns {Promise} Lista de reservas
 */
window.listarReservas = async function(hospital = null) {
    try {
        logAPI('Listando reservas V7.0...');
        
        const params = {};
        if (hospital) {
            params.hospital = hospital;
        }
        
        const result = await apiRequest('listarReservas', params, 'GET');
        
        logAPISuccess('Reservas listadas V7.0', result);
        return result;
        
    } catch (error) {
        logAPIError('Erro ao listar reservas V7.0:', error.message);
        throw error;
    }
};

/**
 * Admitir paciente consumindo uma reserva existente
 * @param {string} hospital - ID do hospital
 * @param {number} leito - Numero do leito
 * @param {Object} dadosPaciente - Dados do paciente
 * @param {string} matriculaReserva - Matricula da reserva a consumir
 * @returns {Promise} Resultado da operação
 */
window.admitirComReserva = async function(hospital, leito, dadosPaciente, matriculaReserva) {
    try {
        logAPI(`Admitindo com reserva V7.0: ${hospital}-${leito}, reserva: ${matriculaReserva}`);
        
        // Verificar se é UTI
        const leitoDados = window.hospitalData[hospital]?.leitos?.find(l => l.leito == leito);
        const isUTI = leitoDados?.tipo === 'UTI';
        
        const concessoesValidas = isUTI ? [] : validarConcessoes(dadosPaciente.concessoes || []);
        const linhasValidas = validarLinhas(dadosPaciente.linhas || []);
        const timelineValida = validarTimeline(dadosPaciente.prevAlta || (isUTI ? 'Sem Previsão' : 'SP'), isUTI);
        const isolamentoValido = validarIsolamento(dadosPaciente.isolamento || 'Não Isolamento');
        const generoValido = validarGenero(dadosPaciente.genero || '');
        const regiaoValida = validarRegiao(dadosPaciente.regiao || '');
        const categoriaValida = isUTI ? '' : validarCategoriaEscolhida(dadosPaciente.categoriaEscolhida || '');
        const diretivasValida = isUTI ? '' : validarDiretivas(dadosPaciente.diretivas || 'Não se aplica');
        
        let identificacaoValida = '';
        if (dadosPaciente.identificacaoLeito) {
            try {
                identificacaoValida = validarIdentificacaoLeito(dadosPaciente.identificacaoLeito);
            } catch (error) {
                throw new Error(`Erro na identificacao do leito: ${error.message}`);
            }
        }
        
        const payload = {
            hospital: hospital,
            leito: Number(leito),
            matriculaReserva: matriculaReserva,
            nome: dadosPaciente.nome || '',
            matricula: dadosPaciente.matricula || '',
            idade: dadosPaciente.idade || null,
            pps: isUTI ? null : (dadosPaciente.pps || null),
            spict: isUTI ? '' : (dadosPaciente.spict || ''),
            complexidade: isUTI ? '' : (dadosPaciente.complexidade || 'I'),
            prevAlta: timelineValida,
            linhas: linhasValidas,
            concessoes: concessoesValidas,
            isolamento: isolamentoValido,
            identificacaoLeito: identificacaoValida,
            genero: generoValido,
            regiao: regiaoValida,
            categoriaEscolhida: categoriaValida,
            diretivas: diretivasValida,
            anotacoes: dadosPaciente.anotacoes || ''
        };
        
        const result = await apiRequest('admitirComReserva', payload, 'POST');
        
        logAPISuccess('Admissao com reserva V7.0 concluida', result);
        return result;
        
    } catch (error) {
        logAPIError('Erro ao admitir com reserva V7.0:', error.message);
        throw error;
    }
};

/**
 * Verificar se existe reserva para um hospital/matricula
 * @param {string} hospital - ID do hospital
 * @param {string} matricula - Matricula do paciente
 * @returns {Object|null} Reserva encontrada ou null
 */
window.buscarReservaPorMatricula = function(hospital, matricula) {
    if (!window.reservasData || !Array.isArray(window.reservasData)) {
        return null;
    }
    
    return window.reservasData.find(r => 
        r.hospital === hospital && r.matricula === matricula
    ) || null;
};

/**
 * Obter reservas de um hospital específico
 * @param {string} hospital - ID do hospital
 * @returns {Array} Lista de reservas do hospital
 */
window.getReservasHospital = function(hospital) {
    if (!window.reservasData || !Array.isArray(window.reservasData)) {
        return [];
    }
    
    return window.reservasData.filter(r => r.hospital === hospital);
};

/**
 * Obter reservas por tipo (UTI, APTO, ENF)
 * @param {string} tipo - Tipo de reserva
 * @returns {Array} Lista de reservas do tipo
 */
window.getReservasPorTipo = function(tipo) {
    if (!window.reservasData || !Array.isArray(window.reservasData)) {
        return [];
    }
    
    return window.reservasData.filter(r => r.tipo === tipo);
};

/**
 * Contar reservas por hospital
 * @param {string} hospital - ID do hospital
 * @returns {Object} Contagem de reservas por tipo
 */
window.contarReservasHospital = function(hospital) {
    const reservas = window.getReservasHospital(hospital);
    
    return {
        total: reservas.length,
        apto: reservas.filter(r => r.tipo === 'APTO').length,
        enf: reservas.filter(r => r.tipo === 'ENF').length,
        uti: reservas.filter(r => r.tipo === 'UTI').length
    };
};

// =================== ✅ PREPARAR DADOS PARA FORMULÁRIO V7.0 ===================
window.prepararDadosFormulario = function(dados) {
    const isUTI = dados.isUTI || dados.tipo === 'UTI';
    
    dados = {
        hospital: dados.hospital,
        leito: dados.leito,
        nome: dados.nome || '',
        matricula: dados.matricula || '',
        idade: dados.idade || null,
        pps: isUTI ? null : (dados.pps || null),
        spict: isUTI ? '' : (dados.spict || ''),
        complexidade: isUTI ? '' : (dados.complexidade || 'I'),
        prevAlta: dados.prevAlta || (isUTI ? 'Sem Previsão' : 'SP'),
        linhas: dados.linhas || [],
        concessoes: isUTI ? [] : (dados.concessoes || []),
        isolamento: dados.isolamento || 'Não Isolamento',
        identificacaoLeito: dados.identificacaoLeito || '',
        genero: dados.genero || '',
        regiao: dados.regiao || '',
        categoriaEscolhida: isUTI ? '' : (dados.categoriaEscolhida || ''),
        diretivas: isUTI ? '' : (dados.diretivas || 'Não se aplica'),
        anotacoes: dados.anotacoes || '',
        isUTI: isUTI
    };
    
    logAPI('Dados preparados para formulario V7.0:', {
        hospital: dados.hospital,
        leito: dados.leito,
        isUTI: dados.isUTI,
        isolamento: dados.isolamento,
        identificacaoLeito: dados.identificacaoLeito || '(vazio)',
        genero: dados.genero || '(vazio)',
        anotacoes: dados.anotacoes ? `${dados.anotacoes.length} chars` : 'vazio',
        concessoes: dados.concessoes.length,
        linhas: dados.linhas.length
    });
    
    return dados;
};

// =================== ✅ PARSE DADOS V7.0 ===================
window.parseLeitoData = function(leito) {
    if (!leito) return null;
    
    const isUTI = leito.tipo === 'UTI';
    
    const dados = {
        hospital: leito.hospital,
        leito: leito.leito,
        tipo: leito.tipo,
        isUTI: isUTI,
        status: leito.status,
        nome: leito.nome,
        matricula: leito.matricula,
        idade: leito.idade,
        admAt: leito.admAt,
        pps: isUTI ? null : leito.pps,
        spict: isUTI ? '' : leito.spict,
        complexidade: isUTI ? '' : leito.complexidade,
        prevAlta: leito.prevAlta,
        concessoes: isUTI ? [] : (Array.isArray(leito.concessoes) ? leito.concessoes : []),
        linhas: Array.isArray(leito.linhas) ? leito.linhas : [],
        identificacaoLeito: leito.identificacaoLeito,
        isolamento: leito.isolamento,
        genero: leito.genero,
        regiao: leito.regiao,
        categoriaEscolhida: isUTI ? '' : leito.categoriaEscolhida,
        diretivas: isUTI ? '' : leito.diretivas,
        anotacoes: leito.anotacoes || ''
    };
    
    return dados;
};

// =================== REFRESH ===================
window.refreshAfterAction = async function() {
    try {
        logAPI('Recarregando dados V7.0 apos acao...');
        
        const container = document.getElementById('cardsContainer');
        if (container) {
            container.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #1a1f2e; border-radius: 12px;">
                    <div style="color: #60a5fa; margin-bottom: 15px; font-size: 18px;">
                        Sincronizando V7.0 (356 leitos + reservas)...
                    </div>
                    <div style="color: #9ca3af; font-size: 14px;">
                        Atualizando dados
                    </div>
                </div>
            `;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await window.loadHospitalData();
        
        setTimeout(() => {
            if (window.renderCards) {
                window.renderCards();
                logAPISuccess('Interface V7.0 atualizada!');
            }
        }, 500);
        
    } catch (error) {
        logAPIError('Erro ao refresh V7.0:', error.message);
        
        setTimeout(() => {
            if (window.renderCards) {
                window.renderCards();
            }
        }, 1000);
    }
};

// =================== FUNÇÕES AUXILIARES ===================
window.testAPI = async function() {
    try {
        logAPI('Testando conectividade V7.0...');
        
        const result = await apiRequest('test', {}, 'GET');
        
        if (result) {
            logAPISuccess('API V7.0 funcionando!', result);
            return { status: 'ok', data: result };
        } else {
            throw new Error('API V7.0 nao retornou dados validos');
        }
        
    } catch (error) {
        logAPIError('Erro na conectividade V7.0:', error.message);
        return { status: 'error', message: error.message };
    }
};

window.monitorAPI = function() {
    if (window.apiMonitorInterval) {
        clearInterval(window.apiMonitorInterval);
    }
    
    window.apiMonitorInterval = setInterval(async () => {
        try {
            const timeSinceLastCall = Date.now() - window.lastAPICall;
            
            if (timeSinceLastCall > 240000) {
                logAPI('Refresh automatico V7.0...');
                await window.loadHospitalData();
                
                if (window.currentView === 'leitos' && window.renderCards) {
                    setTimeout(() => window.renderCards(), 1000);
                }
            }
        } catch (error) {
            logAPIError('Erro no monitoramento V7.0:', error.message);
        }
    }, 60000);
    
    logAPI('Monitoramento V7.0 ativado');
};

window.fetchHospitalData = async function(hospital) {
    logAPI(`Buscando dados V7.0 do hospital: ${hospital}`);
    
    await window.loadHospitalData();
    
    if (window.hospitalData[hospital] && window.hospitalData[hospital].leitos) {
        return window.hospitalData[hospital].leitos;
    }
    
    return [];
};

window.loadAllHospitalsData = window.loadHospitalData;

window.fetchLeitoData = async function(hospital, leito) {
    try {
        const data = await apiRequest('one', { hospital: hospital, leito: leito }, 'GET');
        return data;
    } catch (error) {
        logAPIError(`Erro ao buscar leito V7.0 ${hospital}-${leito}:`, error.message);
        return null;
    }
};

window.loadColors = async function() {
    try {
        const colors = await apiRequest('getcolors', {}, 'GET');
        if (colors && typeof colors === 'object') {
            Object.entries(colors).forEach(([property, value]) => {
                if (property.startsWith('--') || property.startsWith('-')) {
                    document.documentElement.style.setProperty(property, value);
                }
            });
            logAPISuccess('Cores V7.0 carregadas');
            return colors;
        }
    } catch (error) {
        logAPIError('Erro ao carregar cores V7.0:', error.message);
    }
    return null;
};

window.saveColors = async function(colors) {
    try {
        const result = await apiRequest('savecolors', { colors: colors }, 'POST');
        logAPISuccess('Cores V7.0 salvas');
        return result;
    } catch (error) {
        logAPIError('Erro ao salvar cores V7.0:', error.message);
        throw error;
    }
};

// =================== ✅ NOVO V7.0: FUNÇÕES AUXILIARES UTI ===================

/**
 * Filtrar leitos por tipo (UTI ou Enfermaria)
 * @param {string} hospital - ID do hospital
 * @param {boolean} apenasUTI - Se true, retorna apenas UTI; se false, exclui UTI
 * @returns {Array} Lista de leitos filtrados
 */
window.filtrarLeitosPorTipo = function(hospital, apenasUTI = false) {
    const leitos = window.hospitalData[hospital]?.leitos || [];
    
    if (apenasUTI) {
        return leitos.filter(l => l.tipo === 'UTI');
    } else {
        return leitos.filter(l => l.tipo !== 'UTI');
    }
};

/**
 * Obter estatísticas de ocupação de UTI por hospital
 * @param {string} hospital - ID do hospital
 * @returns {Object} Estatísticas de UTI
 */
window.getEstatisticasUTI = function(hospital) {
    const leitosUTI = window.filtrarLeitosPorTipo(hospital, true);
    const ocupados = leitosUTI.filter(l => l.status === 'ocupado');
    const vagos = leitosUTI.filter(l => l.status === 'vago');
    const capacidade = window.UTI_CAPACIDADE ? window.UTI_CAPACIDADE[hospital] : null;
    
    return {
        total: leitosUTI.length,
        ocupados: ocupados.length,
        vagos: vagos.length,
        contratuais: capacidade ? capacidade.contratuais : 0,
        extras: capacidade ? capacidade.extras : 0,
        taxaOcupacao: leitosUTI.length > 0 ? Math.round((ocupados.length / leitosUTI.length) * 100) : 0
    };
};

/**
 * Obter estatísticas de ocupação de Enfermaria por hospital (exclui UTI)
 * @param {string} hospital - ID do hospital
 * @returns {Object} Estatísticas de Enfermaria
 */
window.getEstatisticasEnfermaria = function(hospital) {
    const leitosEnf = window.filtrarLeitosPorTipo(hospital, false);
    const ocupados = leitosEnf.filter(l => l.status === 'ocupado');
    const vagos = leitosEnf.filter(l => l.status === 'vago');
    const capacidade = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospital] : null;
    
    return {
        total: leitosEnf.length,
        ocupados: ocupados.length,
        vagos: vagos.length,
        contratuais: capacidade ? capacidade.contratuais : 0,
        extras: capacidade ? capacidade.extras : 0,
        taxaOcupacao: leitosEnf.length > 0 ? Math.round((ocupados.length / leitosEnf.length) * 100) : 0
    };
};

// =================== INICIALIZAÇÃO ===================
window.addEventListener('load', () => {
    logAPI('API.js V7.0 COMPLETO carregado');
    logAPI(`Hospitais: 11 (9 ativos + 2 reservas)`);
    logAPI(`Leitos: 356 totais (293 enfermaria + 63 UTI)`);
    logAPI(`URL: ${window.API_URL}`);
    logAPI(`Colunas: 76 (A-BX)`);
    logAPI(`Concessoes: 12 tipos`);
    logAPI(`Linhas: 45 tipos`);
    logAPI(`Timeline Enfermaria: ${window.TIMELINE_OPCOES.length} opcoes`);
    logAPI(`Timeline UTI: ${window.TIMELINE_UTI_OPCOES.length} opcoes`);
    logAPI(`Anotacoes: Campo livre 800 chars (BX/75)`);
    logAPI(`Reservas: Sistema ativo`);
    
    logAPISuccess('Hospitais V7.0:');
    Object.entries(window.HOSPITAIS_CONFIG).forEach(([id, config]) => {
        logAPI(`   ${id}: ${config.nome} (${config.leitos} leitos)`);
    });
    
    setTimeout(() => {
        if (window.monitorAPI) {
            window.monitorAPI();
        }
    }, 10000);
});

logAPISuccess('API.js V7.0 100% FUNCIONAL');
logAPISuccess('Nova URL V7.0 configurada');
logAPISuccess('11 hospitais (9 ativos + 2 reservas)');
logAPISuccess('356 leitos totais (293 enfermaria + 63 UTI)');
logAPISuccess('76 colunas (A-BX)');
logAPISuccess('Campo anotacoes implementado');
logAPISuccess('Sistema de reservas implementado');
logAPISuccess('Suporte a UTI implementado');