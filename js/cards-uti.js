// =================== CARDS UTI V7.0 - DEZEMBRO/2025 ===================
// =================== ARCHIPELAGO - CARDS DE LEITOS UTI ===================
//
// CONFIGURACAO ATUAL:
// - Apenas H2 (Cruz Azul) ATIVO com 30 leitos UTI
// - Campos bloqueados: PPS, SPICT, Regiao, Diretivas, Concessoes, Linhas
// - Prev Alta sem turnos: Hoje, 24h, 48h, 72h, 96h, Sem Previsao
// - "Tipo de Quarto" -> "Tipo de Convenio"
// ===================

console.log('CARDS-UTI.JS V7.0 - Carregando...');

// =================== HOSPITAIS UTI ATIVOS ===================
// Usa a mesma constante do dashboard-uti.js se ja existir
const HOSPITAIS_UTI_ATIVOS_CARDS = window.HOSPITAIS_UTI_ATIVOS || ['H2'];

// =================== CAPACIDADE UTI ===================
const UTI_CAPACIDADE_CARDS = {
    H1: { contratuais: 3, extras: 2, total: 5, nome: 'Neomater' },
    H2: { contratuais: 20, extras: 10, total: 30, nome: 'Cruz Azul' },
    H3: { contratuais: 2, extras: 2, total: 4, nome: 'Santa Marcelina' },
    H4: { contratuais: 4, extras: 2, total: 6, nome: 'Santa Clara' },
    H5: { contratuais: 4, extras: 2, total: 6, nome: 'Adventista' },
    H6: { contratuais: 2, extras: 2, total: 4, nome: 'Santa Cruz' },
    H7: { contratuais: 0, extras: 0, total: 0, nome: 'Santa Virginia' },
    H8: { contratuais: 2, extras: 2, total: 4, nome: 'Sao Camilo Ipiranga' },
    H9: { contratuais: 2, extras: 2, total: 4, nome: 'Sao Camilo Pompeia' }
};

// =================== OPCOES UTI ===================
const PREV_ALTA_UTI_OPTIONS = ['Hoje', '24h', '48h', '72h', '96h', 'Sem Previsao'];
const ISOLAMENTO_UTI_OPTIONS = ['Nao Isolamento', 'Isolamento de Contato', 'Isolamento Respiratorio'];
const GENERO_UTI_OPTIONS = ['Masculino', 'Feminino'];
const TIPO_CONVENIO_OPTIONS = ['Apartamento', 'Enfermaria'];

// =================== CAMPOS BLOQUEADOS UTI ===================
const CAMPOS_BLOQUEADOS_UTI = ['pps', 'spict', 'regiao', 'diretivas', 'concessoes', 'linhas'];

// =================== FUNCOES AUXILIARES ===================

function logInfoUTI(msg) {
    console.log('[CARDS-UTI V7.0] ' + msg);
}

function logErrorUTI(msg) {
    console.error('[CARDS-UTI V7.0] ' + msg);
}

function showSuccessMessageUTI(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px;
        background: #22c55e; color: white; border-radius: 8px;
        font-family: 'Poppins', sans-serif; font-weight: 600;
        z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showErrorMessageUTI(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px;
        background: #ef4444; color: white; border-radius: 8px;
        font-family: 'Poppins', sans-serif; font-weight: 600;
        z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// =================== BADGE ISOLAMENTO ===================
function getBadgeIsolamentoUTI(isolamento) {
    if (!isolamento || isolamento === 'Nao Isolamento' || isolamento === 'Não Isolamento') {
        return { cor: '#b2adaa', texto: 'Nao Isol', textoCor: '#ffffff' };
    } else if (isolamento === 'Isolamento de Contato') {
        return { cor: '#f59a1d', texto: 'Contato', textoCor: '#131b2e' };
    } else if (isolamento === 'Isolamento Respiratorio' || isolamento === 'Isolamento Respiratório') {
        return { cor: '#c86420', texto: 'Respiratorio', textoCor: '#ffffff' };
    }
    return { cor: '#b2adaa', texto: 'Nao Isol', textoCor: '#ffffff' };
}

// =================== BADGE GENERO ===================
function getBadgeGeneroUTI(sexo) {
    if (sexo === 'Masculino') {
        return {
            cor: 'rgba(96,165,250,0.2)',
            borda: '#60a5fa',
            textoCor: '#60a5fa',
            texto: 'Masculino'
        };
    } else if (sexo === 'Feminino') {
        return {
            cor: 'rgba(236,72,153,0.2)',
            borda: '#ec4899',
            textoCor: '#ec4899',
            texto: 'Feminino'
        };
    }
    return {
        cor: 'rgba(255,255,255,0.05)',
        borda: 'rgba(255,255,255,0.1)',
        textoCor: '#ffffff',
        texto: '—'
    };
}

// =================== FORMATAR MATRICULA ===================
function formatarMatriculaUTI(matricula) {
    if (!matricula || matricula === '—') return '—';
    const mat = String(matricula).replace(/\D/g, '');
    if (mat.length === 0) return '—';
    if (mat.length === 1) return mat;
    return mat.slice(0, -1) + '-' + mat.slice(-1);
}

// =================== FORMATAR DATA ===================
function formatarDataHoraUTI(dataStr) {
    if (!dataStr) return '—';
    try {
        const data = new Date(dataStr);
        if (isNaN(data.getTime())) return dataStr;
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, '0');
        const min = String(data.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano}, ${hora}:${min}`;
    } catch (e) {
        return dataStr;
    }
}

// =================== CALCULAR TEMPO INTERNACAO ===================
function calcularTempoInternacaoUTI(admissao) {
    if (!admissao) return '';
    try {
        const admData = new Date(admissao);
        if (isNaN(admData.getTime())) return '';
        const hoje = new Date();
        const diffMs = hoje - admData;
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (diffDias > 0) {
            return `${diffDias}d ${diffHoras}h`;
        }
        return `${diffHoras}h`;
    } catch (e) {
        return '';
    }
}

// =================== VERIFICAR SE LEITO EXTRA ===================
function isLeitoExtraUTI(hospitalId, posicao) {
    const config = UTI_CAPACIDADE_CARDS[hospitalId];
    if (!config) return false;
    return posicao > config.contratuais;
}

// =================== RENDERIZAR CARDS UTI ===================
window.renderCardsUTI = function(hospitalId) {
    logInfoUTI('Renderizando cards UTI para ' + hospitalId);
    
    const container = document.getElementById('cardsContainerUTI');
    if (!container) {
        logErrorUTI('Container cardsContainerUTI nao encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    // Verificar se hospital esta ativo
    if (!HOSPITAIS_UTI_ATIVOS_CARDS.includes(hospitalId)) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.7);">
                <div style="font-size: 48px; margin-bottom: 20px;">🏥</div>
                <h3 style="color: #60a5fa; margin-bottom: 10px;">UTI Inativa</h3>
                <p>Este hospital ainda nao possui leitos UTI ativos no sistema.</p>
            </div>
        `;
        return;
    }
    
    // Sincronizar dropdown
    const dropdown = document.getElementById('hospitalDropdownUTI');
    if (dropdown && dropdown.value !== hospitalId) {
        dropdown.value = hospitalId;
    }
    
    // Guardar hospital atual
    window.currentHospitalUTI = hospitalId;
    
    // Buscar dados do hospital
    const hospital = window.hospitalData ? window.hospitalData[hospitalId] : null;
    const config = UTI_CAPACIDADE_CARDS[hospitalId];
    const hospitalNome = config ? config.nome : hospitalId;
    
    if (!hospital || !hospital.leitos) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="color: rgba(255,255,255,0.7);">Carregando dados...</p>
            </div>
        `;
        return;
    }
    
    // Filtrar apenas leitos UTI
    const leitosUTI = hospital.leitos.filter(l => {
        const tipo = (l.tipo || '').toUpperCase();
        return tipo === 'UTI';
    });
    
    logInfoUTI('Total de leitos UTI: ' + leitosUTI.length);
    
    if (leitosUTI.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.7);">
                <div style="font-size: 48px; margin-bottom: 20px;">🛏️</div>
                <h3 style="color: #60a5fa; margin-bottom: 10px;">Nenhum Leito UTI</h3>
                <p>Nao foram encontrados leitos UTI para este hospital.</p>
            </div>
        `;
        return;
    }
    
    // Separar ocupados e vagos
    const ocupados = leitosUTI.filter(l => 
        l.status === 'Ocupado' || l.status === 'Em uso' || l.status === 'ocupado'
    );
    const vagos = leitosUTI.filter(l => 
        l.status === 'Vago' || l.status === 'vago'
    );
    
    // Ordenar por numero do leito
    ocupados.sort((a, b) => (a.leito || 0) - (b.leito || 0));
    vagos.sort((a, b) => (a.leito || 0) - (b.leito || 0));
    
    // Buscar reservas UTI
    const reservasUTI = (window.reservasData || []).filter(r => 
        r.hospital === hospitalId && r.tipo === 'UTI'
    );
    
    logInfoUTI('Ocupados: ' + ocupados.length + ', Vagos: ' + vagos.length + ', Reservas: ' + reservasUTI.length);
    
    // Renderizar OCUPADOS
    ocupados.forEach((leito, index) => {
        const posicao = index + 1;
        const card = createCardUTI(leito, hospitalNome, hospitalId, posicao);
        container.appendChild(card);
    });
    
    // Renderizar RESERVADOS
    reservasUTI.forEach((reserva) => {
        const temMatricula = reserva.matricula && String(reserva.matricula).trim();
        if (temMatricula) {
            const leitoReservado = {
                leito: reserva.leito,
                status: 'Reservado',
                tipo: 'UTI',
                identificacaoLeito: String(reserva.identificacaoLeito || ''),
                isolamento: reserva.isolamento || '',
                genero: reserva.genero || '',
                nome: reserva.iniciais || '',
                matricula: String(reserva.matricula || ''),
                idade: reserva.idade || '',
                categoriaEscolhida: reserva.categoriaEscolhida || reserva.tipoConvenio || '',
                prevAlta: '',
                admAt: '',
                _isReserva: true,
                _reservaId: reserva.linha || reserva.id
            };
            const card = createCardUTI(leitoReservado, hospitalNome, hospitalId, 0);
            container.appendChild(card);
        }
    });
    
    // Renderizar VAGOS (apenas 1 para UTI)
    if (vagos.length > 0) {
        const card = createCardUTI(vagos[0], hospitalNome, hospitalId, 0);
        container.appendChild(card);
    }
    
    logInfoUTI('Cards renderizados: ' + container.children.length);
};

// =================== CRIAR CARD UTI ===================
function createCardUTI(leito, hospitalNome, hospitalId, posicaoOcupacao) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'background: #1a1f2e; border-radius: 12px; padding: 18px; color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: "Poppins", sans-serif;';
    
    // Borda laranja se extra
    const isExtra = isLeitoExtraUTI(hospitalId, posicaoOcupacao);
    if (isExtra && posicaoOcupacao > 0) {
        card.style.cssText += ' border: 2px solid #f59a1d !important;';
    }
    
    const numeroLeito = parseInt(leito.leito);
    
    // Determinar status
    let isVago = false;
    let isReservado = false;
    let statusBgColor = '#60a5fa';
    let statusTextColor = '#ffffff';
    let statusTexto = 'Disponivel';
    
    if (leito.status === 'Em uso' || leito.status === 'ocupado' || leito.status === 'Ocupado') {
        isVago = false;
        statusBgColor = '#f59a1d';
        statusTextColor = '#131b2e';
        statusTexto = 'Ocupado';
    } else if (leito.status === 'Reservado') {
        isVago = false;
        isReservado = true;
        statusBgColor = '#f59a1d';
        statusTextColor = '#131b2e';
        statusTexto = 'Reservado';
    } else if (leito.status === 'Vago' || leito.status === 'vago') {
        isVago = true;
    }
    
    // Dados do paciente
    const nome = leito.nome || '';
    const matricula = leito.matricula || '';
    const matriculaFormatada = formatarMatriculaUTI(matricula);
    const idade = leito.idade || null;
    const admissao = leito.admAt || '';
    const previsaoAlta = leito.prevAlta || '';
    const sexo = leito.genero || '';
    const tipoConvenio = leito.categoriaEscolhida || leito.categoria || '';
    
    // Normalizar isolamento
    let isolamento = leito.isolamento || 'Nao Isolamento';
    const isolamentoLower = isolamento.toLowerCase().trim();
    if (isolamentoLower === 'isolamento de contato' || isolamentoLower === 'isolamento contato') {
        isolamento = 'Isolamento de Contato';
    } else if (isolamentoLower === 'isolamento respiratorio' || isolamentoLower === 'isolamento respiratório') {
        isolamento = 'Isolamento Respiratorio';
    } else {
        isolamento = 'Nao Isolamento';
    }
    
    // Identificacao do leito
    let identificacaoLeito = String(leito.identificacaoLeito || leito.identificacao_leito || '');
    
    const badgeIsolamento = getBadgeIsolamentoUTI(isolamento);
    const badgeGenero = getBadgeGeneroUTI(sexo);
    
    let tempoInternacao = '';
    if (!isVago && admissao) {
        tempoInternacao = calcularTempoInternacaoUTI(admissao);
    }
    
    const iniciais = isVago ? '—' : (nome ? String(nome).trim() : '—');
    const idSequencial = String(numeroLeito).padStart(2, '0');
    
    // Display do leito
    let leitoDisplay = isVago ? '—' : (identificacaoLeito.trim() || `LEITO ${numeroLeito}`);
    if (!isVago && identificacaoLeito.trim()) {
        leitoDisplay = identificacaoLeito.trim().toUpperCase();
    }
    
    // Cor do circulo
    const circuloCor = '#60a5fa';
    const circuloStroke = isVago ? '#1a1f2e' : '#ffffff';
    
    // =================== ESTILOS PARA CAMPOS BLOQUEADOS ===================
    const styleBloqueado = 'background: rgba(100,100,100,0.3); border: 1px solid rgba(100,100,100,0.4); opacity: 0.5;';
    const styleNormal = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);';
    
    // HTML do Card
    card.innerHTML = `
        <!-- HEADER: HOSPITAL -->
        <div class="card-header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; font-family: 'Poppins', sans-serif;">
            <div style="font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">HOSPITAL</div>
            <div style="font-size: 16px; color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${hospitalNome}</div>
            <div style="font-size: 10px; color: #f59a1d; font-weight: 600; margin-top: 2px;">UTI</div>
            ${posicaoOcupacao > 0 ? `
            <div style="background: ${isExtra ? '#f59a1d' : '#60a5fa'}; color: ${isExtra ? '#131b2e' : '#ffffff'}; padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-top: 8px; display: inline-block;">
                OCUPACAO ${posicaoOcupacao}/${UTI_CAPACIDADE_CARDS[hospitalId]?.contratuais || 0}
            </div>
            ` : ''}
        </div>

        <!-- LINHA 1: LEITO | TIPO | STATUS -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-box" style="${styleNormal} border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">LEITO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;" data-leito-numero="${numeroLeito}">${leitoDisplay}</div>
            </div>
            
            <div class="card-box" style="${styleNormal} border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">TIPO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">UTI</div>
            </div>
            
            <div class="status-badge" style="background: ${statusBgColor}; color: ${statusTextColor}; padding: 12px 6px; border-radius: 6px; font-weight: 800; text-transform: uppercase; text-align: center; font-size: 11px; letter-spacing: 0.5px; min-height: 45px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="box-label" style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; color: ${statusTextColor};">STATUS</div>
                <div class="box-value" style="font-weight: 700; font-size: 11px; line-height: 1.2; color: ${statusTextColor};">${statusTexto}</div>
            </div>
        </div>

        <!-- LINHA 2: GENERO | ISOLAMENTO | PREV ALTA -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-box" style="background: ${badgeGenero.cor}; border: 1px solid ${badgeGenero.borda}; border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: ${badgeGenero.textoCor}; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">GENERO</div>
                <div class="box-value" style="color: ${badgeGenero.textoCor}; font-weight: 700; font-size: 11px; line-height: 1.2;">${badgeGenero.texto}</div>
            </div>
            
            <div class="card-box" style="background: ${badgeIsolamento.cor}; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: ${badgeIsolamento.textoCor}; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">ISOLAMENTO</div>
                <div class="box-value" style="color: ${badgeIsolamento.textoCor}; font-weight: 700; font-size: 11px; line-height: 1.2;">${badgeIsolamento.texto}</div>
            </div>
            
            <div class="card-box prev-alta" style="background: #60a5fa; border: 1px solid rgba(96,165,250,0.5); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: #ffffff; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">PREVISAO ALTA</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">${previsaoAlta || '—'}</div>
            </div>
        </div>

        <!-- LINHA DIVISORIA -->
        <div class="divider" style="height: 2px; background: #ffffff; margin: 12px 0;"></div>

        <!-- SECAO PESSOA -->
        <div class="card-row-pessoa" style="display: grid; grid-template-columns: 100px 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="pessoa-circle" style="grid-row: span 2; grid-column: 1; width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ${circuloCor};">
                <svg class="pessoa-icon" viewBox="0 0 24 24" fill="none" stroke="${circuloStroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 55%; height: 55%;">
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>
                </svg>
            </div>

            <div class="small-cell" style="${styleNormal} border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">INICIAIS</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${iniciais}</div>
            </div>

            <div class="small-cell" style="${styleNormal} border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">MATRICULA</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${matriculaFormatada}</div>
            </div>

            <div class="small-cell" style="${styleNormal} border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">IDADE</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${idade ? idade + ' anos' : '—'}</div>
            </div>

            <!-- REGIAO BLOQUEADA -->
            <div class="small-cell" style="${styleBloqueado} border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">REGIAO</div>
                <div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 10px; line-height: 1.2;">—</div>
            </div>
        </div>

        <!-- LINHA 3: PPS | SPICT-BR | DIRETIVAS - TODOS BLOQUEADOS -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 12px; font-family: 'Poppins', sans-serif;">
            <div class="card-box" style="${styleBloqueado} border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">PPS</div>
                <div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 11px; line-height: 1.2;">—</div>
            </div>
            
            <div class="card-box" style="${styleBloqueado} border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">SPICT-BR</div>
                <div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 11px; line-height: 1.2;">—</div>
            </div>
            
            <div class="card-box" style="${styleBloqueado} border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">DIRETIVAS</div>
                <div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 11px; line-height: 1.2;">—</div>
            </div>
        </div>

        <!-- CONCESSOES - BLOQUEADO -->
        <div class="card-section" style="margin-bottom: 15px; font-family: 'Poppins', sans-serif;">
            <div class="section-header" style="background: rgba(100,100,100,0.5); color: rgba(255,255,255,0.5); font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
                CONCESSOES PREVISTAS NA ALTA
            </div>
            <div class="chips-container" style="${styleBloqueado} display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; border-radius: 6px; padding: 8px;">
                <span style="color: rgba(255,255,255,0.4); font-size: 10px; font-style: italic;">Campo nao disponivel para UTI</span>
            </div>
        </div>

        <!-- LINHAS DE CUIDADO - BLOQUEADO -->
        <div class="card-section" style="margin-bottom: 15px; font-family: 'Poppins', sans-serif;">
            <div class="section-header" style="background: rgba(100,100,100,0.5); color: rgba(255,255,255,0.5); font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
                LINHAS DE CUIDADO
            </div>
            <div class="chips-container" style="${styleBloqueado} display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; border-radius: 6px; padding: 8px;">
                <span style="color: rgba(255,255,255,0.4); font-size: 10px; font-style: italic;">Campo nao disponivel para UTI</span>
            </div>
        </div>

        <!-- ANOTACOES -->
        <div class="card-section" style="margin-bottom: 15px; font-family: 'Poppins', sans-serif;">
            <div class="section-header" style="background: #60a5fa; color: #ffffff; font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
                ANOTACOES
            </div>
            <div class="anotacoes-container" style="${styleNormal} border-radius: 6px; padding: 8px; min-height: 40px;">
                ${(leito.anotacoes && leito.anotacoes.trim()) 
                    ? `<span style="color: rgba(255,255,255,0.9); font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${leito.anotacoes}</span>`
                    : '<span style="color: rgba(255,255,255,0.5); font-size: 10px; font-style: italic;">Sem anotacoes</span>'
                }
            </div>
        </div>

        <!-- FOOTER -->
        <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); gap: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-info" style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1;">
                ${!isVago && admissao ? `
                <div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">
                    <div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">ADMISSAO</div>
                    <div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">${formatarDataHoraUTI(admissao)}</div>
                </div>
                ` : ''}
                
                ${!isVago && tempoInternacao ? `
                <div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">
                    <div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">INTERNADO</div>
                    <div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">${tempoInternacao}</div>
                </div>
                ` : ''}
                
                <div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">
                    <div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">ID</div>
                    <div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">${idSequencial}</div>
                </div>
            </div>
            
            ${isReservado ? `
            <!-- Botoes RESERVADO -->
            <div style="display: flex; gap: 8px;">
                <button class="btn-action btn-cancelar-reserva-uti" 
                        data-action="cancelar-reserva-uti" 
                        data-leito="${numeroLeito}"
                        data-identificacao="${identificacaoLeito}"
                        data-matricula="${matricula}"
                        style="padding: 10px 16px; background: #c86420; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">
                    CANCELAR
                </button>
                <button class="btn-action btn-admitir-reserva-uti" 
                        data-action="admitir-reserva-uti" 
                        data-leito="${numeroLeito}"
                        style="padding: 10px 16px; background: #60a5fa; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">
                    ADMITIR
                </button>
            </div>
            ` : isVago ? `
            <!-- Botoes VAGO -->
            <div style="display: flex; gap: 8px;">
                <button class="btn-action btn-reservar-uti" 
                        data-action="reservar-uti" 
                        data-leito="${numeroLeito}" 
                        style="padding: 10px 16px; background: #f59a1d; color: #131b2e; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">
                    RESERVAR
                </button>
                <button class="btn-action btn-admitir-uti" 
                        data-action="admitir-uti" 
                        data-leito="${numeroLeito}" 
                        style="padding: 10px 16px; background: #60a5fa; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">
                    ADMITIR
                </button>
            </div>
            ` : `
            <!-- Botao OCUPADO -->
            <button class="btn-action btn-atualizar-uti" 
                    data-action="atualizar-uti" 
                    data-leito="${numeroLeito}" 
                    style="padding: 10px 18px; background: rgba(156,163,175,0.5); color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 11px;">
                ATUALIZAR
            </button>
            `}
        </div>
    `;
    
    // Event listeners
    const admitirBtn = card.querySelector('[data-action="admitir-uti"]');
    if (admitirBtn) {
        admitirBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModalAdmissaoUTI(numeroLeito, leito);
        });
    }
    
    const reservarBtn = card.querySelector('[data-action="reservar-uti"]');
    if (reservarBtn) {
        reservarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModalReservaUTI(numeroLeito, leito);
        });
    }
    
    const atualizarBtn = card.querySelector('[data-action="atualizar-uti"]');
    if (atualizarBtn) {
        atualizarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModalAtualizarUTI(numeroLeito, leito);
        });
    }
    
    const cancelarBtn = card.querySelector('[data-action="cancelar-reserva-uti"]');
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Deseja cancelar esta reserva UTI?')) {
                try {
                    await window.cancelarReserva(hospitalId, cancelarBtn.dataset.identificacao, cancelarBtn.dataset.matricula);
                    showSuccessMessageUTI('Reserva UTI cancelada!');
                    setTimeout(() => window.renderCardsUTI(hospitalId), 500);
                } catch (error) {
                    showErrorMessageUTI('Erro: ' + error.message);
                }
            }
        });
    }
    
    const admitirReservaBtn = card.querySelector('[data-action="admitir-reserva-uti"]');
    if (admitirReservaBtn) {
        admitirReservaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModalAdmissaoUTI(numeroLeito, leito, true);
        });
    }
    
    return card;
}

// =================== MODAL DE ADMISSAO UTI ===================
function openModalAdmissaoUTI(leitoNumero, leito, isFromReserva = false) {
    const hospitalId = window.currentHospitalUTI || 'H2';
    const config = UTI_CAPACIDADE_CARDS[hospitalId];
    const hospitalNome = config ? config.nome : hospitalId;
    
    // Remover modal anterior se existir
    const existingModal = document.getElementById('modalAdmissaoUTI');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'modalAdmissaoUTI';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 10000; padding: 20px; box-sizing: border-box;
    `;
    
    // Pre-preencher com dados da reserva se vier de uma
    const iniciais = isFromReserva ? (leito.nome || '') : '';
    const matricula = isFromReserva ? (leito.matricula || '') : '';
    const idade = isFromReserva ? (leito.idade || '') : '';
    const genero = isFromReserva ? (leito.genero || '') : '';
    const isolamento = isFromReserva ? (leito.isolamento || 'Nao Isolamento') : 'Nao Isolamento';
    const identificacao = isFromReserva ? (leito.identificacaoLeito || '') : '';
    const tipoConvenio = isFromReserva ? (leito.categoriaEscolhida || '') : '';
    
    modal.innerHTML = `
        <div style="background: #1a1f2e; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: 'Poppins', sans-serif;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #60a5fa; margin: 0 0 5px 0; font-size: 22px;">${isFromReserva ? 'CONFIRMAR ADMISSAO' : 'ADMITIR PACIENTE'} - UTI</h2>
                <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">${hospitalNome} - Leito ${leitoNumero}</p>
            </div>
            
            <form id="formAdmissaoUTI" style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Tipo de Convenio -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">TIPO DE CONVENIO *</label>
                    <select id="utiTipoConvenio" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="">Selecione...</option>
                        <option value="Apartamento" ${tipoConvenio === 'Apartamento' ? 'selected' : ''}>Apartamento</option>
                        <option value="Enfermaria" ${tipoConvenio === 'Enfermaria' ? 'selected' : ''}>Enfermaria</option>
                    </select>
                </div>
                
                <!-- Identificacao do Leito -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDENTIFICACAO DO LEITO *</label>
                    <input type="text" id="utiIdentificacao" value="${identificacao}" required placeholder="Ex: 101, 201-A" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;">
                </div>
                
                <!-- Isolamento -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ISOLAMENTO *</label>
                    <select id="utiIsolamento" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="Nao Isolamento" ${isolamento === 'Nao Isolamento' ? 'selected' : ''}>Nao Isolamento</option>
                        <option value="Isolamento de Contato" ${isolamento === 'Isolamento de Contato' ? 'selected' : ''}>Isolamento de Contato</option>
                        <option value="Isolamento Respiratorio" ${isolamento === 'Isolamento Respiratorio' ? 'selected' : ''}>Isolamento Respiratorio</option>
                    </select>
                </div>
                
                <!-- Genero -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">GENERO *</label>
                    <select id="utiGenero" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="">Selecione...</option>
                        <option value="Masculino" ${genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
                        <option value="Feminino" ${genero === 'Feminino' ? 'selected' : ''}>Feminino</option>
                    </select>
                </div>
                
                <!-- Iniciais -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">INICIAIS DO PACIENTE *</label>
                    <input type="text" id="utiIniciais" value="${iniciais}" required placeholder="Ex: J S M" maxlength="20" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; text-transform: uppercase; box-sizing: border-box;">
                </div>
                
                <!-- Matricula -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">MATRICULA *</label>
                    <input type="text" id="utiMatricula" value="${matricula}" required placeholder="Ex: 1234567-8" maxlength="15" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;">
                </div>
                
                <!-- Idade -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDADE *</label>
                    <input type="number" id="utiIdade" value="${idade}" required min="0" max="150" placeholder="Ex: 65" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;">
                </div>
                
                <!-- Previsao de Alta -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">PREVISAO DE ALTA</label>
                    <select id="utiPrevAlta" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="">Selecione...</option>
                        <option value="Hoje">Hoje</option>
                        <option value="24h">24h</option>
                        <option value="48h">48h</option>
                        <option value="72h">72h</option>
                        <option value="96h">96h</option>
                        <option value="Sem Previsao">Sem Previsao</option>
                    </select>
                </div>
                
                <!-- Anotacoes -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ANOTACOES</label>
                    <textarea id="utiAnotacoes" rows="3" maxlength="800" placeholder="Observacoes (max 800 caracteres)" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; resize: vertical; box-sizing: border-box;"></textarea>
                </div>
                
                <!-- Botoes -->
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button type="button" id="btnCancelarUTI" style="flex: 1; padding: 14px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">
                        CANCELAR
                    </button>
                    <button type="submit" style="flex: 1; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">
                        ${isFromReserva ? 'CONFIRMAR' : 'ADMITIR'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('btnCancelarUTI').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    
    document.getElementById('formAdmissaoUTI').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dados = {
            hospital: hospitalId,
            leito: leitoNumero,
            tipo: 'UTI',
            categoriaEscolhida: document.getElementById('utiTipoConvenio').value,
            identificacaoLeito: document.getElementById('utiIdentificacao').value,
            isolamento: document.getElementById('utiIsolamento').value,
            genero: document.getElementById('utiGenero').value,
            nome: document.getElementById('utiIniciais').value.toUpperCase(),
            matricula: document.getElementById('utiMatricula').value,
            idade: document.getElementById('utiIdade').value,
            prevAlta: document.getElementById('utiPrevAlta').value,
            anotacoes: document.getElementById('utiAnotacoes').value,
            // Campos bloqueados UTI - enviar vazios
            pps: '',
            spict: '',
            regiao: '',
            diretivas: '',
            concessoes: [],
            linhas: []
        };
        
        try {
            const params = new URLSearchParams({
                action: 'admitir',
                ...dados,
                concessoes: JSON.stringify(dados.concessoes),
                linhas: JSON.stringify(dados.linhas)
            });
            
            const response = await fetch(window.API_URL + '?' + params.toString());
            const result = await response.json();
            
            if (result.ok || result.success) {
                // Se veio de reserva, cancelar a reserva
                if (isFromReserva && leito._isReserva) {
                    try {
                        await window.cancelarReserva(hospitalId, leito.identificacaoLeito, leito.matricula);
                    } catch (err) {
                        console.log('Reserva ja removida ou erro ao remover:', err);
                    }
                }
                
                modal.remove();
                showSuccessMessageUTI('Paciente admitido na UTI!');
                
                // Recarregar dados
                if (window.loadHospitalData) {
                    await window.loadHospitalData();
                }
                setTimeout(() => window.renderCardsUTI(hospitalId), 500);
            } else {
                throw new Error(result.message || result.error || 'Erro ao admitir');
            }
        } catch (error) {
            showErrorMessageUTI('Erro: ' + error.message);
        }
    });
}

// =================== MODAL DE RESERVA UTI ===================
function openModalReservaUTI(leitoNumero, leito) {
    const hospitalId = window.currentHospitalUTI || 'H2';
    const config = UTI_CAPACIDADE_CARDS[hospitalId];
    const hospitalNome = config ? config.nome : hospitalId;
    
    const existingModal = document.getElementById('modalReservaUTI');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'modalReservaUTI';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 10000; padding: 20px; box-sizing: border-box;
    `;
    
    modal.innerHTML = `
        <div style="background: #1a1f2e; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: 'Poppins', sans-serif;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #f59a1d; margin: 0 0 5px 0; font-size: 22px;">RESERVAR LEITO UTI</h2>
                <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">${hospitalNome} - Leito ${leitoNumero}</p>
            </div>
            
            <form id="formReservaUTI" style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Tipo de Convenio -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">TIPO DE CONVENIO *</label>
                    <select id="reservaUtiTipoConvenio" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="">Selecione...</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Enfermaria">Enfermaria</option>
                    </select>
                </div>
                
                <!-- Identificacao do Leito -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDENTIFICACAO DO LEITO *</label>
                    <input type="text" id="reservaUtiIdentificacao" required placeholder="Ex: 101, 201-A" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;">
                </div>
                
                <!-- Isolamento -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ISOLAMENTO *</label>
                    <select id="reservaUtiIsolamento" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="Nao Isolamento">Nao Isolamento</option>
                        <option value="Isolamento de Contato">Isolamento de Contato</option>
                        <option value="Isolamento Respiratorio">Isolamento Respiratorio</option>
                    </select>
                </div>
                
                <!-- Genero -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">GENERO *</label>
                    <select id="reservaUtiGenero" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                    </select>
                </div>
                
                <!-- Iniciais -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">INICIAIS DO PACIENTE</label>
                    <input type="text" id="reservaUtiIniciais" placeholder="Ex: J S M" maxlength="20" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; text-transform: uppercase; box-sizing: border-box;">
                </div>
                
                <!-- Matricula -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">MATRICULA</label>
                    <input type="text" id="reservaUtiMatricula" placeholder="Ex: 1234567-8" maxlength="15" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;">
                </div>
                
                <!-- Idade -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDADE</label>
                    <input type="number" id="reservaUtiIdade" min="0" max="150" placeholder="Ex: 65" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;">
                </div>
                
                <!-- Botoes -->
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button type="button" id="btnCancelarReservaUTI" style="flex: 1; padding: 14px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">
                        CANCELAR
                    </button>
                    <button type="submit" style="flex: 1; padding: 14px; background: #f59a1d; color: #131b2e; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">
                        RESERVAR
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('btnCancelarReservaUTI').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    
    document.getElementById('formReservaUTI').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dados = {
            hospital: hospitalId,
            leito: leitoNumero,
            tipo: 'UTI',
            categoriaEscolhida: document.getElementById('reservaUtiTipoConvenio').value,
            identificacaoLeito: document.getElementById('reservaUtiIdentificacao').value,
            isolamento: document.getElementById('reservaUtiIsolamento').value,
            genero: document.getElementById('reservaUtiGenero').value,
            iniciais: document.getElementById('reservaUtiIniciais').value.toUpperCase(),
            matricula: document.getElementById('reservaUtiMatricula').value,
            idade: document.getElementById('reservaUtiIdade').value
        };
        
        try {
            const params = new URLSearchParams({
                action: 'reservar',
                ...dados
            });
            
            const response = await fetch(window.API_URL + '?' + params.toString());
            const result = await response.json();
            
            if (result.ok || result.success) {
                modal.remove();
                showSuccessMessageUTI('Leito UTI reservado!');
                
                if (window.carregarReservas) {
                    await window.carregarReservas();
                }
                setTimeout(() => window.renderCardsUTI(hospitalId), 500);
            } else {
                throw new Error(result.message || result.error || 'Erro ao reservar');
            }
        } catch (error) {
            showErrorMessageUTI('Erro: ' + error.message);
        }
    });
}

// =================== MODAL DE ATUALIZAR UTI ===================
function openModalAtualizarUTI(leitoNumero, leito) {
    const hospitalId = window.currentHospitalUTI || 'H2';
    const config = UTI_CAPACIDADE_CARDS[hospitalId];
    const hospitalNome = config ? config.nome : hospitalId;
    
    const existingModal = document.getElementById('modalAtualizarUTI');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'modalAtualizarUTI';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 10000; padding: 20px; box-sizing: border-box;
    `;
    
    const identificacao = leito.identificacaoLeito || leito.identificacao_leito || '';
    const isolamento = leito.isolamento || 'Nao Isolamento';
    const genero = leito.genero || '';
    const prevAlta = leito.prevAlta || '';
    const anotacoes = leito.anotacoes || '';
    
    modal.innerHTML = `
        <div style="background: #1a1f2e; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: 'Poppins', sans-serif;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #60a5fa; margin: 0 0 5px 0; font-size: 22px;">ATUALIZAR PACIENTE UTI</h2>
                <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">${hospitalNome} - ${identificacao || 'Leito ' + leitoNumero}</p>
                <p style="color: #f59a1d; margin: 5px 0 0 0; font-size: 12px;">${leito.nome || ''} - ${formatarMatriculaUTI(leito.matricula)}</p>
            </div>
            
            <form id="formAtualizarUTI" style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Isolamento -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ISOLAMENTO</label>
                    <select id="atualizarUtiIsolamento" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="Nao Isolamento" ${isolamento.includes('Nao') ? 'selected' : ''}>Nao Isolamento</option>
                        <option value="Isolamento de Contato" ${isolamento === 'Isolamento de Contato' ? 'selected' : ''}>Isolamento de Contato</option>
                        <option value="Isolamento Respiratorio" ${isolamento.includes('Respirat') ? 'selected' : ''}>Isolamento Respiratorio</option>
                    </select>
                </div>
                
                <!-- Previsao de Alta -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">PREVISAO DE ALTA</label>
                    <select id="atualizarUtiPrevAlta" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">
                        <option value="">Selecione...</option>
                        <option value="Hoje" ${prevAlta === 'Hoje' ? 'selected' : ''}>Hoje</option>
                        <option value="24h" ${prevAlta === '24h' ? 'selected' : ''}>24h</option>
                        <option value="48h" ${prevAlta === '48h' ? 'selected' : ''}>48h</option>
                        <option value="72h" ${prevAlta === '72h' ? 'selected' : ''}>72h</option>
                        <option value="96h" ${prevAlta === '96h' ? 'selected' : ''}>96h</option>
                        <option value="Sem Previsao" ${prevAlta === 'Sem Previsao' ? 'selected' : ''}>Sem Previsao</option>
                    </select>
                </div>
                
                <!-- Anotacoes -->
                <div>
                    <label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ANOTACOES</label>
                    <textarea id="atualizarUtiAnotacoes" rows="4" maxlength="800" placeholder="Observacoes (max 800 caracteres)" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; resize: vertical; box-sizing: border-box;">${anotacoes}</textarea>
                </div>
                
                <!-- Botoes -->
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button type="button" id="btnDarAltaUTI" style="flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">
                        DAR ALTA
                    </button>
                    <button type="button" id="btnCancelarAtualizarUTI" style="flex: 1; padding: 14px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">
                        CANCELAR
                    </button>
                    <button type="submit" style="flex: 1; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">
                        SALVAR
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('btnCancelarAtualizarUTI').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    
    // Dar Alta
    document.getElementById('btnDarAltaUTI').addEventListener('click', async () => {
        if (!confirm('Confirma a alta deste paciente UTI?')) return;
        
        try {
            const params = new URLSearchParams({
                action: 'daralta',
                hospital: hospitalId,
                leito: leitoNumero
            });
            
            const response = await fetch(window.API_URL + '?' + params.toString());
            const result = await response.json();
            
            if (result.ok || result.success) {
                modal.remove();
                showSuccessMessageUTI('Alta realizada com sucesso!');
                
                if (window.loadHospitalData) {
                    await window.loadHospitalData();
                }
                setTimeout(() => window.renderCardsUTI(hospitalId), 500);
            } else {
                throw new Error(result.message || result.error || 'Erro ao dar alta');
            }
        } catch (error) {
            showErrorMessageUTI('Erro: ' + error.message);
        }
    });
    
    // Atualizar
    document.getElementById('formAtualizarUTI').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dados = {
            hospital: hospitalId,
            leito: leitoNumero,
            isolamento: document.getElementById('atualizarUtiIsolamento').value,
            prevAlta: document.getElementById('atualizarUtiPrevAlta').value,
            anotacoes: document.getElementById('atualizarUtiAnotacoes').value
        };
        
        try {
            const params = new URLSearchParams({
                action: 'atualizar',
                ...dados
            });
            
            const response = await fetch(window.API_URL + '?' + params.toString());
            const result = await response.json();
            
            if (result.ok || result.success) {
                modal.remove();
                showSuccessMessageUTI('Dados atualizados!');
                
                if (window.loadHospitalData) {
                    await window.loadHospitalData();
                }
                setTimeout(() => window.renderCardsUTI(hospitalId), 500);
            } else {
                throw new Error(result.message || result.error || 'Erro ao atualizar');
            }
        } catch (error) {
            showErrorMessageUTI('Erro: ' + error.message);
        }
    });
}

// =================== FUNCAO GLOBAL PARA SELECIONAR HOSPITAL UTI ===================
window.selectHospitalUTI = function(hospitalId) {
    logInfoUTI('Selecionando hospital UTI: ' + hospitalId);
    window.currentHospitalUTI = hospitalId;
    window.renderCardsUTI(hospitalId);
};

// =================== EXPORTAR FUNCOES ===================
window.renderCardsUTI = window.renderCardsUTI;
window.selectHospitalUTI = window.selectHospitalUTI;

console.log('CARDS-UTI.JS V7.0 - Carregado com sucesso!');
console.log('Hospitais UTI ativos:', HOSPITAIS_UTI_ATIVOS_CARDS.join(', '));
console.log('Campos bloqueados UTI:', CAMPOS_BLOQUEADOS_UTI.join(', '));