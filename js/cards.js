// =================== 🟢 CARDS.JS V4.1.2 FINAL - SEM CONFLITOS DE CONST ===================
console.log('🟢 CARDS.JS V4.1.2 - Iniciando carregamento (SEM conflitos)');
console.log('🔍 Timestamp:', new Date().toISOString());

// =================== CARDS.JS - GESTÃO DE LEITOS HOSPITALARES ===================

// =================== ✅ FUNÇÃO DE NORMALIZAÇÃO (PARA COMPARAÇÕES) ===================
function normalizarTexto(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
}

// =================== ✅ USAR VARIÁVEIS GLOBAIS DIRETAMENTE (SEM CRIAR CONST LOCAIS) ===================
// NÃO fazer: const CONCESSOES_DISPLAY_MAP = window.CONCESSOES_DISPLAY_MAP;
// Usar diretamente: window.CONCESSOES_DISPLAY_MAP[texto]

// Se não existirem, criar (proteção)
if (typeof window.CONCESSOES_DISPLAY_MAP === 'undefined') {
    console.log('⚠️ CONCESSOES_DISPLAY_MAP não existe, criando...');
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
}

if (typeof window.LINHAS_DISPLAY_MAP === 'undefined') {
    console.log('⚠️ LINHAS_DISPLAY_MAP não existe, criando...');
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
}

// =================== ✅ FUNÇÃO DE DESNORMALIZAÇÃO ===================
if (typeof window.desnormalizarTexto === 'undefined') {
    console.log('⚠️ desnormalizarTexto não existe, criando...');
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
}

console.log('✅ Mapas e funções verificados/criados');

// =================== VARIÁVEIS GLOBAIS ===================  
window.selectedLeito = null;
window.currentHospital = 'H1';

// =================== MAPEAMENTO DE HOSPITAIS ===================
window.HOSPITAL_MAPPING = {
    H1: 'Neomater',
    H2: 'Cruz Azul', 
    H3: 'Santa Marcelina',
    H4: 'Santa Clara',
    H5: 'Adventista',
    H6: 'Santa Cruz',
    H7: 'Santa Virgínia'
};

// IDENTIFICAR HOSPITAIS HÍBRIDOS
window.HOSPITAIS_HIBRIDOS = ['H1', 'H3', 'H5', 'H6', 'H7'];

// SANTA CLARA - TODOS OS LEITOS SÃO HÍBRIDOS (1-13)
window.SANTA_CLARA_TOTAL_LEITOS = 13;

// TIPO DE QUARTO (2 OPÇÕES - APENAS PARA HÍBRIDOS)
window.TIPO_QUARTO_OPTIONS = ['Apartamento', 'Enfermaria'];

// MAPEAMENTO FIXO NUMERAÇÃO CRUZ AZUL - ENFERMARIAS (16 leitos: 21-36)
window.CRUZ_AZUL_NUMERACAO = {
    21: '711.1', 22: '711.3',
    23: '713.1', 24: '713.2',
    25: '915.1', 26: '915.3',
    27: '911.1', 28: '911.3',
    29: '912.1', 30: '912.3',
    31: '913.1', 32: '913.3',
    33: '914.1', 34: '914.3',
    35: '916.1', 36: '916.3'
};

// MAPEAMENTO DE LEITOS IRMÃOS (CRUZ AZUL)
window.CRUZ_AZUL_IRMAOS = {
    21: 22, 22: 21, 23: 24, 24: 23,
    25: 26, 26: 25, 27: 28, 28: 27,
    29: 30, 30: 29, 31: 32, 32: 31,
    33: 34, 34: 33, 35: 36, 36: 35
};

// =================== ✅ LISTAS FINAIS - 12 CONCESSÕES COM ACENTOS UTF-8 ===================

// ✅ CONCESSÕES - 13 ITENS (12 + "Não se aplica")
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

// LINHAS DE CUIDADO: 45 ESPECIALIDADES
window.LINHAS_CUIDADO_LIST = [
    "Assiste", "APS SP", "Cuidados Paliativos", "ICO (Insuficiência Coronariana)",
    "Nexus SP Cardiologia", "Nexus SP Gastroentereologia", "Nexus SP Geriatria",
    "Nexus SP Pneumologia", "Nexus SP Psiquiatria", "Nexus SP Reumatologia",
    "Nexus SP Saúde do Fígado", "Generalista", "Bucomaxilofacial", "Cardiologia",
    "Cirurgia Cardíaca", "Cirurgia de Cabeça e Pescoço", "Cirurgia do Aparelho Digestivo",
    "Cirurgia Geral", "Cirurgia Oncológica", "Cirurgia Plástica", "Cirurgia Torácica",
    "Cirurgia Vascular", "Clínica Médica", "Coloproctologia", "Dermatologia",
    "Endocrinologia", "Fisiatria", "Gastroenterologia", "Geriatria",
    "Ginecologia e Obstetrícia", "Hematologia", "Infectologia", "Mastologia",
    "Nefrologia", "Neurocirurgia", "Neurologia", "Oftalmologia", "Oncologia Clínica",
    "Ortopedia", "Otorrinolaringologia", "Pediatria", "Pneumologia", "Psiquiatria",
    "Reumatologia", "Urologia"
];

// PPS: 10 OPÇÕES
window.PPS_OPTIONS = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];

// PREVISÃO DE ALTA - 10 OPÇÕES
window.PREVISAO_ALTA_OPTIONS = [
    'Hoje Ouro', 'Hoje 2R', 'Hoje 3R',
    '24h Ouro', '24h 2R', '24h 3R', 
    '48h', '72h', '96h', 'Sem Previsão'
];

// ISOLAMENTO: 3 OPÇÕES
window.ISOLAMENTO_OPTIONS = [
    'Não Isolamento',
    'Isolamento de Contato', 
    'Isolamento Respiratório'
];

// REGIÃO: 9 OPÇÕES
window.REGIAO_OPTIONS = [
    'Zona Central', 'Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste',
    'ABC', 'Guarulhos', 'Osasco', 'Outra'
];

// GÊNERO: 2 OPÇÕES
window.SEXO_OPTIONS = ['Masculino', 'Feminino'];

// DIRETIVAS ANTECIPADAS
window.DIRETIVAS_OPTIONS = ['Não se aplica', 'Sim', 'Não'];

// IDADE: DROPDOWN 14-115 ANOS
window.IDADE_OPTIONS = [];
for (let i = 14; i <= 115; i++) {
    window.IDADE_OPTIONS.push(i);
}

console.log('✅ Todas as variáveis globais configuradas');

// =================== FUNÇÃO: SELECT HOSPITAL ===================
window.selectHospital = function(hospitalId) {
    console.log(`[CARDS] Selecionando hospital: ${hospitalId} (${window.HOSPITAL_MAPPING[hospitalId]})`);
    
    window.currentHospital = hospitalId;
    
    document.querySelectorAll('.hospital-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.hospital === hospitalId) {
            btn.classList.add('active');
        }
    });
    
    window.renderCards();
    console.log(`[CARDS] Hospital selecionado: ${window.HOSPITAL_MAPPING[hospitalId]}`);
};

// =================== FUNÇÃO DE BUSCA ===================
window.searchLeitos = function() {
    const searchInput = document.getElementById('searchLeitosInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('#cardsContainer .card');
    
    cards.forEach(card => {
        if (searchTerm === '') {
            card.style.display = '';
            return;
        }
        
        const cardText = card.textContent.toLowerCase();
        const matricula = card.querySelector('[data-matricula]')?.dataset.matricula || '';
        const leito = card.querySelector('[data-leito-numero]')?.dataset.leitoNumero || '';
        const iniciais = card.querySelector('[data-iniciais]')?.dataset.iniciais || '';
        
        const matchMatricula = matricula.includes(searchTerm);
        const matchLeito = leito.includes(searchTerm);
        const matchIniciais = iniciais.toLowerCase().includes(searchTerm);
        const matchGeral = cardText.includes(searchTerm);
        
        if (matchMatricula || matchLeito || matchIniciais || matchGeral) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
    
    const visibleCards = Array.from(cards).filter(c => c.style.display !== 'none');
    console.log(`[CARDS] Busca: "${searchTerm}" - ${visibleCards.length} resultados`);
};

// =================== FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ===================
window.renderCards = function() {
    console.log('[CARDS] Renderizando cards - Gestão de Leitos Hospitalares');
    
    const container = document.getElementById('cardsContainer');
    if (!container) {
        console.error('[CARDS] Container cardsContainer não encontrado');
        return;
    }

    container.innerHTML = '';
    const hospitalId = window.currentHospital || 'H1';
    const hospital = window.hospitalData[hospitalId];
    const hospitalNome = window.HOSPITAL_MAPPING[hospitalId] || 'Hospital';
    
    if (!hospital || !hospital.leitos || hospital.leitos.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="color: #60a5fa; margin-bottom: 15px;">
                    <h3 style="font-family: 'Poppins', sans-serif;">${hospitalNome}</h3>
                </div>
                <div style="background: rgba(96,165,250,0.1); border-radius: 8px; padding: 20px;">
                    <p style="margin-bottom: 15px; font-family: 'Poppins', sans-serif;">Carregando dados...</p>
                    <p style="color: #60a5fa; font-family: 'Poppins', sans-serif;"><em>API conectada</em></p>
                </div>
            </div>
        `;
        return;
    }
    
    // Separar ocupados e vagos
    const leitosOcupados = hospital.leitos.filter(l => 
        l.status === 'Ocupado' || l.status === 'Em uso' || l.status === 'ocupado'
    );
    const leitosVagos = hospital.leitos.filter(l => 
        l.status === 'Vago' || l.status === 'vago'
    );
    
    // Ordenar OCUPADOS por identificacao_leito
    leitosOcupados.sort((a, b) => {
        const idA = a.identificacaoLeito || a.identificacao_leito || '';
        const idB = b.identificacaoLeito || b.identificacao_leito || '';
        
        if (idA && idB) return idA.localeCompare(idB);
        if (idA) return -1;
        if (idB) return 1;
        return (a.leito || 0) - (b.leito || 0);
    });
    
    // Ordenar VAGOS por número do leito
    leitosVagos.sort((a, b) => (a.leito || 0) - (b.leito || 0));
    
    // Juntar: OCUPADOS primeiro, depois VAGOS
    const leitosOrdenados = [...leitosOcupados, ...leitosVagos];
    
    console.log('[CARDS] Total de leitos:', leitosOrdenados.length);
    console.log('[CARDS] Ocupados:', leitosOcupados.length, '| Vagos:', leitosVagos.length);
    
    // Renderizar cards (versão simplificada para teste)
    leitosOrdenados.forEach(leito => {
        const card = createCardSimples(leito, hospitalNome, hospitalId);
        container.appendChild(card);
    });
    
    console.log(`[CARDS] ${hospital.leitos.length} cards renderizados para ${hospitalNome}`);
};

// =================== CRIAR CARD SIMPLIFICADO (PARA TESTE) ===================
function createCardSimples(leito, hospitalNome, hospitalId) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'background: #1a1f2e; border-radius: 12px; padding: 18px; color: #ffffff; margin: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: "Poppins", sans-serif;';
    
    const isVago = leito.status === 'Vago' || leito.status === 'vago';
    const statusColor = isVago ? '#60a5fa' : '#f59a1d';
    const statusTexto = isVago ? 'Disponível' : 'Ocupado';
    
    // Desnormalizar concessões e linhas
    const concessoesRaw = Array.isArray(leito.concessoes) ? leito.concessoes : [];
    const concessoes = concessoesRaw.map(c => window.desnormalizarTexto(c));
    
    const linhasRaw = Array.isArray(leito.linhas) ? leito.linhas : [];
    const linhas = linhasRaw.map(l => window.desnormalizarTexto(l));
    
    card.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 700; margin-bottom: 5px;">HOSPITAL</div>
            <div style="font-size: 18px; color: #ffffff; font-weight: 800;">${hospitalNome}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; text-align: center;">
                <div style="font-size: 10px; color: rgba(255,255,255,0.7);">LEITO</div>
                <div style="font-size: 14px; font-weight: 700;">${leito.leito}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; text-align: center;">
                <div style="font-size: 10px; color: rgba(255,255,255,0.7);">TIPO</div>
                <div style="font-size: 14px; font-weight: 700;">${leito.tipo || 'Híbrido'}</div>
            </div>
            <div style="background: ${statusColor}; border-radius: 6px; padding: 10px; text-align: center;">
                <div style="font-size: 10px; color: #ffffff;">STATUS</div>
                <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${statusTexto}</div>
            </div>
        </div>
        
        <div style="border-top: 2px solid #ffffff; margin: 15px 0;"></div>
        
        <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background: #60a5fa; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="${isVago ? '#1a1f2e' : '#ffffff'}" stroke-width="2.5" style="width: 55%; height: 55%;">
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>
                </svg>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.7);">INICIAIS</div>
                    <div style="font-size: 11px; font-weight: 700;">${leito.nome || '—'}</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.7);">MATRÍCULA</div>
                    <div style="font-size: 11px; font-weight: 700;">${leito.matricula || '—'}</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.7);">IDADE</div>
                    <div style="font-size: 11px; font-weight: 700;">${leito.idade ? leito.idade + ' anos' : '—'}</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.7);">REGIÃO</div>
                    <div style="font-size: 11px; font-weight: 700;">${leito.regiao || '—'}</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <div style="background: #60a5fa; color: #ffffff; font-size: 10px; padding: 6px; border-radius: 4px; margin-bottom: 6px; font-weight: 700;">
                CONCESSÕES PREVISTAS NA ALTA
            </div>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; min-height: 30px;">
                ${concessoes.length > 0 
                    ? concessoes.map(c => `<span style="font-size: 9px; background: rgba(96,165,250,0.2); border: 1px solid rgba(96,165,250,0.4); color: #60a5fa; padding: 3px 8px; border-radius: 10px; margin: 2px; display: inline-block;">${c}</span>`).join('') 
                    : '<span style="color: rgba(255,255,255,0.5); font-size: 10px;">Nenhuma</span>'
                }
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <div style="background: #60a5fa; color: #ffffff; font-size: 10px; padding: 6px; border-radius: 4px; margin-bottom: 6px; font-weight: 700;">
                LINHAS DE CUIDADO
            </div>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; min-height: 30px;">
                ${linhas.length > 0 
                    ? linhas.map(l => `<span style="font-size: 9px; background: rgba(96,165,250,0.2); border: 1px solid rgba(96,165,250,0.4); color: #60a5fa; padding: 3px 8px; border-radius: 10px; margin: 2px; display: inline-block;">${l}</span>`).join('') 
                    : '<span style="color: rgba(255,255,255,0.5); font-size: 10px;">Nenhuma</span>'
                }
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
            <div style="font-size: 9px; color: rgba(255,255,255,0.5);">
                ID: ${String(leito.leito).padStart(2, '0')}
            </div>
            <button style="padding: 10px 20px; background: ${isVago ? '#60a5fa' : 'rgba(156,163,175,0.5)'}; color: #ffffff; border: none; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer;">
                ${isVago ? 'ADMITIR' : 'ATUALIZAR'}
            </button>
        </div>
    `;
    
    return card;
}

console.log('✅ CARDS.JS V4.1.2 - Carregado com sucesso!');
console.log('✅ Funções disponíveis: renderCards, selectHospital, searchLeitos');
