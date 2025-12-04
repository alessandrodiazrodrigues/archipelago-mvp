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
const HOSPITAIS_UTI_ATIVOS = ['H2'];

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
        z-index: 10000; animation: fadeIn 0.3s;
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
        z-index: 10000; animation: fadeIn 0.3s;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function formatarMatriculaUTI(matricula) {
    if (!matricula) return '';
    const mat = String(matricula).replace(/\D/g, '');
    if (mat.length <= 5) return mat;
    return mat.slice(0, -1) + '-' + mat.slice(-1);
}

function calcularTempoInternacaoUTI(admAt) {
    if (!admAt) return '';
    try {
        const admData = new Date(admAt);
        if (isNaN(admData.getTime())) return '';
        const agora = new Date();
        const diffMs = agora - admData;
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDias < 0 || diffDias > 365) return '';
        if (diffDias === 0) return 'Hoje';
        if (diffDias === 1) return '1 dia';
        return diffDias + ' dias';
    } catch (e) {
        return '';
    }
}

// =================== FUNCOES DE RESERVA UTI ===================

window.getReservasUTIHospital = function(hospitalId) {
    const todasReservas = window.reservasData || [];
    return todasReservas.filter(r => r.hospital === hospitalId && r.tipo === 'UTI');
};

window.isLeitoUTIReservado = function(hospitalId, leitoNumero) {
    const reservas = window.getReservasUTIHospital(hospitalId);
    return reservas.find(r => parseInt(r.leito) === parseInt(leitoNumero));
};

window.cancelarReservaUTI = async function(hospital, identificacaoLeito, matricula) {
    logInfoUTI('Cancelando reserva UTI: ' + hospital + ' ' + identificacaoLeito);
    try {
        const idLeito = String(identificacaoLeito || '');
        const mat = String(matricula || '');
        const params = new URLSearchParams({
            action: 'cancelarReserva',
            hospital: hospital,
            identificacaoLeito: idLeito,
            matricula: mat
        });
        
        const response = await fetch(window.API_URL + '?' + params.toString(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        if (result.ok || result.success) {
            if (window.reservasData) {
                window.reservasData = window.reservasData.filter(r => 
                    !(r.hospital === hospital && (String(r.identificacaoLeito || '') === idLeito || String(r.matricula || '') === mat))
                );
            }
            return true;
        }
        throw new Error(result.message || result.error || 'Erro ao cancelar reserva');
    } catch (error) {
        logErrorUTI('Erro ao cancelar reserva: ' + error.message);
        throw error;
    }
};

// =================== FILTRAR LEITOS UTI ===================

function filtrarLeitosUTI(hospitalId) {
    const hospitalData = window.hospitalData?.[hospitalId];
    if (!hospitalData || !hospitalData.leitos) return [];
    return hospitalData.leitos.filter(l => l.tipo === 'UTI');
}

// =================== RENDER CARDS UTI ===================

window.renderCardsUTI = function(hospitalId) {
    logInfoUTI('Renderizando cards UTI para ' + hospitalId);
    
    // Verificar se hospital esta ativo
    if (!HOSPITAIS_UTI_ATIVOS.includes(hospitalId)) {
        logErrorUTI('Hospital ' + hospitalId + ' nao esta ativo para UTI');
        return;
    }
    
    const container = document.getElementById('cardsContainerUTI');
    if (!container) {
        logErrorUTI('Container cardsContainerUTI nao encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    const hospitalConfig = UTI_CAPACIDADE_CARDS[hospitalId];
    const hospitalNome = hospitalConfig?.nome || hospitalId;
    
    // Buscar leitos UTI
    const leitosUTI = filtrarLeitosUTI(hospitalId);
    logInfoUTI('Leitos UTI encontrados: ' + leitosUTI.length);
    
    // Separar ocupados e vagos
    const leitosOcupados = leitosUTI.filter(l => 
        l.status === 'Ocupado' || l.status === 'ocupado' || l.status === 'Em uso'
    );
    const leitosVagos = leitosUTI.filter(l => 
        l.status === 'Vago' || l.status === 'vago'
    );
    
    // Buscar reservas UTI
    const reservasUTI = window.getReservasUTIHospital(hospitalId);
    logInfoUTI('Reservas UTI: ' + reservasUTI.length);
    
    // Ordenar ocupados por identificacao
    leitosOcupados.sort((a, b) => {
        const idA = String(a.identificacaoLeito || a.identificacao_leito || '');
        const idB = String(b.identificacaoLeito || b.identificacao_leito || '');
        return idA.localeCompare(idB, undefined, {numeric: true});
    });
    
    // Ordenar vagos por numero do leito
    leitosVagos.sort((a, b) => parseInt(a.leito) - parseInt(b.leito));
    
    // Mostrar apenas 1 vago (menor ID)
    const vagosParaMostrar = leitosVagos.slice(0, 1);
    
    // 1. Renderizar ocupados
    leitosOcupados.forEach((leito, index) => {
        const card = createCardUTI(leito, hospitalNome, hospitalId, index + 1);
        container.appendChild(card);
    });
    
    // 2. Renderizar reservados
    reservasUTI.forEach((reserva) => {
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
            prevAlta: '',
            _isReserva: true,
            _reservaId: reserva.linha || reserva.id
        };
        const card = createCardUTI(leitoReservado, hospitalNome, hospitalId, 0);
        container.appendChild(card);
    });
    
    // 3. Renderizar vagos
    vagosParaMostrar.forEach((leito) => {
        const card = createCardUTI(leito, hospitalNome, hospitalId, 0);
        container.appendChild(card);
    });
    
    const total = leitosOcupados.length + reservasUTI.length + vagosParaMostrar.length;
    logInfoUTI(total + ' cards UTI renderizados');
    
    // Atualizar currentHospitalUTI
    window.currentHospitalUTI = hospitalId;
};

// =================== CRIAR CARD UTI ===================

function createCardUTI(leito, hospitalNome, hospitalId, posicaoOcupacao) {
    const card = document.createElement('div');
    card.className = 'card-leito card-leito-uti';
    
    const numeroLeito = leito.leito;
    const isReserva = leito._isReserva || false;
    
    // Determinar status
    let isVago = false;
    let isReservado = false;
    let statusBgColor = '#60a5fa';
    let statusTextColor = '#ffffff';
    let statusTexto = 'Disponivel';
    
    if (leito.status === 'Ocupado' || leito.status === 'ocupado' || leito.status === 'Em uso') {
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
    
    // Isolamento
    let isolamento = leito.isolamento || 'Nao Isolamento';
    
    // Identificacao do leito
    let identificacaoLeito = String(leito.identificacaoLeito || leito.identificacao_leito || '');
    
    // Genero
    const sexo = leito.genero || '';
    
    // Badges
    const badgeIsolamento = getBadgeIsolamentoUTI(isolamento);
    const badgeGenero = getBadgeGeneroUTI(sexo);
    
    // Tempo de internacao
    let tempoInternacao = '';
    if (!isVago && admissao) {
        tempoInternacao = calcularTempoInternacaoUTI(admissao);
    }
    
    const iniciais = isVago ? '—' : (nome ? String(nome).trim() : '—');
    const idSequencial = String(numeroLeito).padStart(2, '0');
    
    // Display do leito
    let leitoDisplay;
    if (isVago) {
        leitoDisplay = identificacaoLeito.trim() ? identificacaoLeito.trim().toUpperCase() : '—';
    } else {
        leitoDisplay = identificacaoLeito.trim() ? identificacaoLeito.trim().toUpperCase() : 'LEITO ' + numeroLeito;
    }
    
    // Cor do circulo
    const circuloCor = '#60a5fa';
    const circuloStroke = isVago ? '#1a1f2e' : '#ffffff';
    
    // HTML do Card UTI
    card.innerHTML = `
        <div class="card-header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; font-family: 'Poppins', sans-serif;">
            <div style="font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">HOSPITAL</div>
            <div style="font-size: 16px; color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${hospitalNome}</div>
            <div style="font-size: 10px; color: #ef4444; font-weight: 700; margin-top: 2px;">UTI</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 8px 6px; text-align: center;">
                <div style="font-size: 9px; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-bottom: 3px;">Leito</div>
                <div style="font-size: 15px; color: #ffffff; font-weight: 700;">${leitoDisplay}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 8px 6px; text-align: center;">
                <div style="font-size: 9px; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-bottom: 3px;">Tipo</div>
                <div style="font-size: 12px; color: #ffffff; font-weight: 600;">UTI</div>
            </div>
            <div style="background: ${statusBgColor}; border-radius: 8px; padding: 8px 6px; text-align: center;">
                <div style="font-size: 9px; color: ${statusTextColor}; text-transform: uppercase; margin-bottom: 3px; opacity: 0.8;">Status</div>
                <div style="font-size: 12px; color: ${statusTextColor}; font-weight: 700;">${statusTexto}</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="background: ${badgeGenero.cor}; border-radius: 8px; padding: 8px 6px; text-align: center;">
                <div style="font-size: 9px; color: ${badgeGenero.textoCor}; text-transform: uppercase; margin-bottom: 3px; opacity: 0.8;">Genero</div>
                <div style="font-size: 11px; color: ${badgeGenero.textoCor}; font-weight: 600;">${badgeGenero.texto}</div>
            </div>
            <div style="background: ${badgeIsolamento.cor}; border-radius: 8px; padding: 8px 6px; text-align: center;">
                <div style="font-size: 9px; color: ${badgeIsolamento.textoCor}; text-transform: uppercase; margin-bottom: 3px; opacity: 0.8;">Isolamento</div>
                <div style="font-size: 11px; color: ${badgeIsolamento.textoCor}; font-weight: 600;">${badgeIsolamento.texto}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 8px 6px; text-align: center;">
                <div style="font-size: 9px; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-bottom: 3px;">Prev Alta</div>
                <div style="font-size: 11px; color: #ffffff; font-weight: 600;">${previsaoAlta || '—'}</div>
            </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 10px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: ${circuloCor}; display: flex; align-items: center; justify-content: center; border: 3px solid ${circuloStroke}; flex-shrink: 0;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                        <div style="font-size: 9px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Iniciais</div>
                        <div style="font-size: 14px; color: #ffffff; font-weight: 700;">${iniciais}</div>
                    </div>
                    <div>
                        <div style="font-size: 9px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Matricula</div>
                        <div style="font-size: 14px; color: #ffffff; font-weight: 600;">${matriculaFormatada || '—'}</div>
                    </div>
                    <div>
                        <div style="font-size: 9px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Idade</div>
                        <div style="font-size: 14px; color: #ffffff; font-weight: 600;">${idade ? idade + ' anos' : '—'}</div>
                    </div>
                    <div>
                        <div style="font-size: 9px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Internacao</div>
                        <div style="font-size: 14px; color: #ffffff; font-weight: 600;">${tempoInternacao || '—'}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 10px; color: rgba(255,255,255,0.4);">
                <span>ID</span><br>
                <span>${idSequencial}</span>
            </div>
            <div style="display: flex; gap: 8px;">
                ${isVago ? `
                    <button class="btn-reservar-uti" data-leito="${numeroLeito}" data-hospital="${hospitalId}" 
                            style="padding: 10px 16px; background: #0676bb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; font-size: 12px;">
                        RESERVAR
                    </button>
                    <button class="btn-admitir-uti" data-leito="${numeroLeito}" data-hospital="${hospitalId}"
                            style="padding: 10px 16px; background: #f59a1d; color: #131b2e; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; font-size: 12px;">
                        ADMITIR
                    </button>
                ` : isReservado ? `
                    <button class="btn-cancelar-reserva-uti" data-leito="${numeroLeito}" data-hospital="${hospitalId}" data-identificacao="${identificacaoLeito}" data-matricula="${matricula}"
                            style="padding: 10px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; font-size: 12px;">
                        CANCELAR
                    </button>
                    <button class="btn-admitir-uti" data-leito="${numeroLeito}" data-hospital="${hospitalId}"
                            style="padding: 10px 16px; background: #f59a1d; color: #131b2e; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; font-size: 12px;">
                        ADMITIR
                    </button>
                ` : `
                    <button class="btn-cancelar-uti" 
                            style="padding: 10px 16px; background: rgba(255,255,255,0.1); color: #9ca3af; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; font-size: 12px;">
                        CANCELAR
                    </button>
                    <button class="btn-editar-uti" data-leito="${numeroLeito}" data-hospital="${hospitalId}"
                            style="padding: 10px 16px; background: #f59a1d; color: #131b2e; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; font-size: 12px;">
                        ADMITIR
                    </button>
                `}
            </div>
        </div>
    `;
    
    // Adicionar event listeners
    setTimeout(() => {
        // Botao Reservar
        const btnReservar = card.querySelector('.btn-reservar-uti');
        if (btnReservar) {
            btnReservar.addEventListener('click', (e) => {
                e.stopPropagation();
                abrirModalReservaUTI(hospitalId, numeroLeito);
            });
        }
        
        // Botao Admitir (vago ou reservado)
        const btnAdmitir = card.querySelector('.btn-admitir-uti');
        if (btnAdmitir) {
            btnAdmitir.addEventListener('click', (e) => {
                e.stopPropagation();
                abrirModalAdmissaoUTI(hospitalId, numeroLeito);
            });
        }
        
        // Botao Editar (ocupado)
        const btnEditar = card.querySelector('.btn-editar-uti');
        if (btnEditar) {
            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation();
                abrirModalEdicaoUTI(hospitalId, numeroLeito);
            });
        }
        
        // Botao Cancelar Reserva
        const btnCancelarReserva = card.querySelector('.btn-cancelar-reserva-uti');
        if (btnCancelarReserva) {
            btnCancelarReserva.addEventListener('click', async (e) => {
                e.stopPropagation();
                const identificacao = btnCancelarReserva.dataset.identificacao;
                const mat = btnCancelarReserva.dataset.matricula;
                
                if (confirm('Deseja cancelar esta reserva UTI?')) {
                    try {
                        await window.cancelarReservaUTI(hospitalId, identificacao, mat);
                        showSuccessMessageUTI('Reserva cancelada com sucesso!');
                        if (window.loadHospitalData) await window.loadHospitalData();
                        window.renderCardsUTI(hospitalId);
                    } catch (err) {
                        showErrorMessageUTI('Erro ao cancelar: ' + err.message);
                    }
                }
            });
        }
        
        // Botao Cancelar (dar alta)
        const btnCancelar = card.querySelector('.btn-cancelar-uti');
        if (btnCancelar && !isVago && !isReservado) {
            btnCancelar.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Deseja dar alta neste paciente UTI?')) {
                    try {
                        const params = new URLSearchParams({
                            action: 'daralta',
                            hospital: hospitalId,
                            leito: numeroLeito
                        });
                        const response = await fetch(window.API_URL + '?' + params.toString());
                        const result = await response.json();
                        if (result.ok || result.success) {
                            showSuccessMessageUTI('Alta realizada com sucesso!');
                            if (window.loadHospitalData) await window.loadHospitalData();
                            window.renderCardsUTI(hospitalId);
                        } else {
                            throw new Error(result.message || 'Erro ao dar alta');
                        }
                    } catch (err) {
                        showErrorMessageUTI('Erro ao dar alta: ' + err.message);
                    }
                }
            });
        }
    }, 100);
    
    return card;
}

// =================== BADGES UTI ===================

function getBadgeIsolamentoUTI(isolamento) {
    if (!isolamento || isolamento === 'Nao Isolamento' || isolamento === 'Não Isolamento') {
        return { cor: '#b2adaa', texto: 'Nao Isol', textoCor: '#ffffff' };
    } else if (isolamento.includes('Contato')) {
        return { cor: '#f59a1d', texto: 'Contato', textoCor: '#131b2e' };
    } else if (isolamento.includes('Respirat')) {
        return { cor: '#ef4444', texto: 'Respir', textoCor: '#ffffff' };
    }
    return { cor: '#b2adaa', texto: 'Nao Isol', textoCor: '#ffffff' };
}

function getBadgeGeneroUTI(genero) {
    if (genero === 'Masculino') {
        return { cor: '#3b82f6', texto: 'Masculino', textoCor: '#ffffff' };
    } else if (genero === 'Feminino') {
        return { cor: '#ec4899', texto: 'Feminino', textoCor: '#ffffff' };
    }
    return { cor: 'rgba(255,255,255,0.1)', texto: '—', textoCor: '#9ca3af' };
}

// =================== MODAL DE RESERVA UTI ===================

function abrirModalReservaUTI(hospitalId, leitoNumero) {
    logInfoUTI('Abrindo modal de reserva UTI: ' + hospitalId + ' Leito ' + leitoNumero);
    
    const hospitalNome = UTI_CAPACIDADE_CARDS[hospitalId]?.nome || hospitalId;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay-uti';
    modal.id = 'modalReservaUTI';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); display: flex; justify-content: center;
        align-items: center; z-index: 9999; padding: 20px; overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="background: #1e293b; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="color: #60a5fa; font-size: 18px; margin: 0; font-family: 'Poppins', sans-serif;">Reservar Leito UTI</h2>
                        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">${hospitalNome} - Leito ${leitoNumero}</p>
                    </div>
                    <button class="btn-fechar-modal-uti" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
            </div>
            
            <div style="padding: 20px; display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Convenio <span style="color: #c86420;">*</span></label>
                    <select id="resUTITipoConvenio" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${TIPO_CONVENIO_OPTIONS.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Identificacao do Leito <span style="color: #c86420;">*</span></label>
                    <input id="resUTIIdentificacao" type="text" placeholder="Ex: 101, 202" maxlength="6" required 
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Apenas numeros</div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento <span style="color: #c86420;">*</span></label>
                    <select id="resUTIIsolamento" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${ISOLAMENTO_UTI_OPTIONS.map(i => `<option value="${i}">${i}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Genero <span style="color: #c86420;">*</span></label>
                    <select id="resUTIGenero" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${GENERO_UTI_OPTIONS.map(g => `<option value="${g}">${g}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Iniciais</label>
                        <input id="resUTIIniciais" type="text" placeholder="Ex: J S" maxlength="10"
                               style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade</label>
                        <input id="resUTIIdade" type="number" placeholder="Ex: 65" min="0" max="150"
                               style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Matricula</label>
                    <input id="resUTIMatricula" type="text" placeholder="Ex: 123456" maxlength="10"
                           oninput="this.value = this.value.replace(/[^0-9-]/g, '')"
                           style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn-cancelar-modal-uti" style="padding: 12px 24px; background: rgba(255,255,255,0.1); color: #9ca3af; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
                    Cancelar
                </button>
                <button class="btn-salvar-reserva-uti" style="padding: 12px 24px; background: #0676bb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
                    Salvar Reserva
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const btnFechar = modal.querySelector('.btn-fechar-modal-uti');
    const btnCancelar = modal.querySelector('.btn-cancelar-modal-uti');
    const btnSalvar = modal.querySelector('.btn-salvar-reserva-uti');
    
    const fecharModal = () => modal.remove();
    
    btnFechar.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });
    
    // Salvar reserva
    btnSalvar.addEventListener('click', async () => {
        try {
            const tipoConvenio = modal.querySelector('#resUTITipoConvenio').value;
            const identificacao = modal.querySelector('#resUTIIdentificacao').value.trim();
            const isolamento = modal.querySelector('#resUTIIsolamento').value;
            const genero = modal.querySelector('#resUTIGenero').value;
            const iniciais = modal.querySelector('#resUTIIniciais').value.trim();
            const idade = modal.querySelector('#resUTIIdade').value;
            const matricula = modal.querySelector('#resUTIMatricula').value.trim();
            
            // Validacoes
            if (!tipoConvenio) {
                showErrorMessageUTI('Selecione o Tipo de Convenio');
                return;
            }
            if (!identificacao) {
                showErrorMessageUTI('Preencha a Identificacao do Leito');
                return;
            }
            if (!isolamento) {
                showErrorMessageUTI('Selecione o Isolamento');
                return;
            }
            if (!genero) {
                showErrorMessageUTI('Selecione o Genero');
                return;
            }
            
            btnSalvar.innerHTML = 'Salvando...';
            btnSalvar.disabled = true;
            
            // Enviar para API
            const params = new URLSearchParams({
                action: 'reservar',
                hospital: hospitalId,
                leito: leitoNumero,
                tipo: 'UTI',
                identificacaoLeito: identificacao,
                isolamento: isolamento,
                genero: genero,
                iniciais: iniciais.replace(/\s/g, ''),
                matricula: matricula,
                idade: idade
            });
            
            logInfoUTI('Enviando reserva UTI: ' + params.toString());
            
            const response = await fetch(window.API_URL + '?' + params.toString());
            const result = await response.json();
            
            if (result.ok || result.success) {
                showSuccessMessageUTI('Reserva UTI salva com sucesso!');
                fecharModal();
                if (window.loadHospitalData) await window.loadHospitalData();
                window.renderCardsUTI(hospitalId);
            } else {
                throw new Error(result.message || result.error || 'Erro ao reservar');
            }
        } catch (error) {
            logErrorUTI('Erro ao salvar reserva: ' + error.message);
            showErrorMessageUTI('Erro: ' + error.message);
            btnSalvar.innerHTML = 'Salvar Reserva';
            btnSalvar.disabled = false;
        }
    });
}

// =================== MODAL DE ADMISSAO UTI ===================

function abrirModalAdmissaoUTI(hospitalId, leitoNumero) {
    logInfoUTI('Abrindo modal de admissao UTI: ' + hospitalId + ' Leito ' + leitoNumero);
    
    const hospitalNome = UTI_CAPACIDADE_CARDS[hospitalId]?.nome || hospitalId;
    
    // Verificar se tem reserva para este leito
    const reservaExistente = window.getReservasUTIHospital(hospitalId).find(r => parseInt(r.leito) === parseInt(leitoNumero));
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay-uti';
    modal.id = 'modalAdmissaoUTI';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); display: flex; justify-content: center;
        align-items: center; z-index: 9999; padding: 20px; overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="background: #1e293b; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="color: #f59a1d; font-size: 18px; margin: 0; font-family: 'Poppins', sans-serif;">Admitir Paciente UTI</h2>
                        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">${hospitalNome} - Leito ${leitoNumero}</p>
                    </div>
                    <button class="btn-fechar-modal-uti" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
            </div>
            
            <div style="padding: 20px; display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Convenio <span style="color: #c86420;">*</span></label>
                    <select id="admUTITipoConvenio" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${TIPO_CONVENIO_OPTIONS.map(t => `<option value="${t}" ${reservaExistente?.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Identificacao do Leito <span style="color: #c86420;">*</span></label>
                    <input id="admUTIIdentificacao" type="text" placeholder="Ex: 101, 202" maxlength="6" required 
                           value="${reservaExistente ? String(reservaExistente.identificacaoLeito || '') : ''}"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento <span style="color: #c86420;">*</span></label>
                    <select id="admUTIIsolamento" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${ISOLAMENTO_UTI_OPTIONS.map(i => `<option value="${i}" ${reservaExistente?.isolamento === i ? 'selected' : ''}>${i}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Genero <span style="color: #c86420;">*</span></label>
                    <select id="admUTIGenero" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${GENERO_UTI_OPTIONS.map(g => `<option value="${g}" ${reservaExistente?.genero === g ? 'selected' : ''}>${g}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Iniciais <span style="color: #c86420;">*</span></label>
                        <input id="admUTIIniciais" type="text" placeholder="Ex: J S" maxlength="10" required
                               value="${reservaExistente?.iniciais || ''}"
                               style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade <span style="color: #c86420;">*</span></label>
                        <input id="admUTIIdade" type="number" placeholder="Ex: 65" min="0" max="150" required
                               value="${reservaExistente?.idade || ''}"
                               style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Matricula <span style="color: #c86420;">*</span></label>
                    <input id="admUTIMatricula" type="text" placeholder="Ex: 123456" maxlength="10" required
                           value="${reservaExistente ? String(reservaExistente.matricula || '') : ''}"
                           oninput="this.value = this.value.replace(/[^0-9-]/g, '')"
                           style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Previsao de Alta</label>
                    <select id="admUTIPrevAlta" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${PREV_ALTA_UTI_OPTIONS.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn-cancelar-modal-uti" style="padding: 12px 24px; background: rgba(255,255,255,0.1); color: #9ca3af; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
                    Cancelar
                </button>
                <button class="btn-admitir-paciente-uti" style="padding: 12px 24px; background: #f59a1d; color: #131b2e; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
                    Admitir
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const btnFechar = modal.querySelector('.btn-fechar-modal-uti');
    const btnCancelar = modal.querySelector('.btn-cancelar-modal-uti');
    const btnAdmitir = modal.querySelector('.btn-admitir-paciente-uti');
    
    const fecharModal = () => modal.remove();
    
    btnFechar.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });
    
    // Admitir paciente
    btnAdmitir.addEventListener('click', async () => {
        try {
            const tipoConvenio = modal.querySelector('#admUTITipoConvenio').value;
            const identificacao = modal.querySelector('#admUTIIdentificacao').value.trim();
            const isolamento = modal.querySelector('#admUTIIsolamento').value;
            const genero = modal.querySelector('#admUTIGenero').value;
            const iniciais = modal.querySelector('#admUTIIniciais').value.trim();
            const idade = modal.querySelector('#admUTIIdade').value;
            const matricula = modal.querySelector('#admUTIMatricula').value.trim();
            const prevAlta = modal.querySelector('#admUTIPrevAlta').value;
            
            // Validacoes
            if (!tipoConvenio) { showErrorMessageUTI('Selecione o Tipo de Convenio'); return; }
            if (!identificacao) { showErrorMessageUTI('Preencha a Identificacao do Leito'); return; }
            if (!isolamento) { showErrorMessageUTI('Selecione o Isolamento'); return; }
            if (!genero) { showErrorMessageUTI('Selecione o Genero'); return; }
            if (!iniciais) { showErrorMessageUTI('Preencha as Iniciais'); return; }
            if (!idade) { showErrorMessageUTI('Preencha a Idade'); return; }
            if (!matricula) { showErrorMessageUTI('Preencha a Matricula'); return; }
            
            btnAdmitir.innerHTML = 'Admitindo...';
            btnAdmitir.disabled = true;
            
            // Se tinha reserva, cancelar primeiro
            if (reservaExistente) {
                try {
                    await window.cancelarReservaUTI(hospitalId, String(reservaExistente.identificacaoLeito || ''), String(reservaExistente.matricula || ''));
                    logInfoUTI('Reserva cancelada antes da admissao');
                } catch (err) {
                    logErrorUTI('Erro ao cancelar reserva: ' + err.message);
                }
            }
            
            // Enviar para API
            const params = new URLSearchParams({
                action: 'admitir',
                hospital: hospitalId,
                leito: leitoNumero,
                nome: iniciais.replace(/\s/g, ''),
                matricula: matricula,
                idade: idade,
                identificacaoLeito: identificacao,
                isolamento: isolamento,
                genero: genero,
                categoriaEscolhida: tipoConvenio,
                prevAlta: prevAlta
            });
            
            logInfoUTI('Enviando admissao UTI: ' + params.toString());
            
            const response = await fetch(window.API_URL + '?' + params.toString());
            const result = await response.json();
            
            if (result.ok || result.success) {
                showSuccessMessageUTI('Paciente admitido com sucesso!');
                fecharModal();
                if (window.loadHospitalData) await window.loadHospitalData();
                window.renderCardsUTI(hospitalId);
            } else {
                throw new Error(result.message || result.error || 'Erro ao admitir');
            }
        } catch (error) {
            logErrorUTI('Erro ao admitir: ' + error.message);
            showErrorMessageUTI('Erro: ' + error.message);
            btnAdmitir.innerHTML = 'Admitir';
            btnAdmitir.disabled = false;
        }
    });
}

// =================== MODAL DE EDICAO UTI ===================

function abrirModalEdicaoUTI(hospitalId, leitoNumero) {
    logInfoUTI('Abrindo modal de edicao UTI: ' + hospitalId + ' Leito ' + leitoNumero);
    
    const hospitalNome = UTI_CAPACIDADE_CARDS[hospitalId]?.nome || hospitalId;
    
    // Buscar dados do leito
    const leitosUTI = filtrarLeitosUTI(hospitalId);
    const dadosLeito = leitosUTI.find(l => parseInt(l.leito) === parseInt(leitoNumero));
    
    if (!dadosLeito) {
        showErrorMessageUTI('Leito nao encontrado');
        return;
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay-uti';
    modal.id = 'modalEdicaoUTI';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); display: flex; justify-content: center;
        align-items: center; z-index: 9999; padding: 20px; overflow-y: auto;
    `;
    
    const identificacaoAtual = String(dadosLeito.identificacaoLeito || dadosLeito.identificacao_leito || '');
    const tipoAtual = dadosLeito.categoriaEscolhida || '';
    
    modal.innerHTML = `
        <div style="background: #1e293b; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="color: #f59a1d; font-size: 18px; margin: 0; font-family: 'Poppins', sans-serif;">Editar Paciente UTI</h2>
                        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">${hospitalNome} - Leito ${identificacaoAtual || leitoNumero}</p>
                    </div>
                    <button class="btn-fechar-modal-uti" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
            </div>
            
            <div style="padding: 20px; display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Convenio</label>
                    <select id="editUTITipoConvenio" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${TIPO_CONVENIO_OPTIONS.map(t => `<option value="${t}" ${tipoAtual === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Identificacao do Leito</label>
                    <input id="editUTIIdentificacao" type="text" value="${identificacaoAtual}" maxlength="6"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento</label>
                    <select id="editUTIIsolamento" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${ISOLAMENTO_UTI_OPTIONS.map(i => `<option value="${i}" ${dadosLeito.isolamento === i ? 'selected' : ''}>${i}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Genero</label>
                    <select id="editUTIGenero" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${GENERO_UTI_OPTIONS.map(g => `<option value="${g}" ${dadosLeito.genero === g ? 'selected' : ''}>${g}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Iniciais</label>
                        <input id="editUTIIniciais" type="text" value="${dadosLeito.nome || ''}" maxlength="10"
                               style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade</label>
                        <input id="editUTIIdade" type="number" value="${dadosLeito.idade || ''}" min="0" max="150"
                               style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Matricula</label>
                    <input id="editUTIMatricula" type="text" value="${dadosLeito.matricula || ''}" maxlength="10"
                           oninput="this.value = this.value.replace(/[^0-9-]/g, '')"
                           style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Previsao de Alta</label>
                    <select id="editUTIPrevAlta" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecione...</option>
                        ${PREV_ALTA_UTI_OPTIONS.map(p => `<option value="${p}" ${dadosLeito.prevAlta === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; justify-content: space-between;">
                <button class="btn-alta-uti" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
                    Dar Alta
                </button>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-cancelar-modal-uti" style="padding: 12px 24px; background: rgba(255,255,255,0.1); color: #9ca3af; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
                        Cancelar
                    </button>
                    <button class="btn-salvar-edicao-uti" style="padding: 12px 24px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const btnFechar = modal.querySelector('.btn-fechar-modal-uti');
    const btnCancelar = modal.querySelector('.btn-cancelar-modal-uti');
    const btnSalvar = modal.querySelector('.btn-salvar-edicao-uti');
    const btnAlta = modal.querySelector('.btn-alta-uti');
    
    const fecharModal = () => modal.remove();
    
    btnFechar.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });
    
    // Dar alta
    btnAlta.addEventListener('click', async () => {
        if (confirm('Deseja dar alta neste paciente?')) {
            try {
                btnAlta.innerHTML = 'Processando...';
                btnAlta.disabled = true;
                
                const params = new URLSearchParams({
                    action: 'daralta',
                    hospital: hospitalId,
                    leito: leitoNumero
                });
                
                const response = await fetch(window.API_URL + '?' + params.toString());
                const result = await response.json();
                
                if (result.ok || result.success) {
                    showSuccessMessageUTI('Alta realizada com sucesso!');
                    fecharModal();
                    if (window.loadHospitalData) await window.loadHospitalData();
                    window.renderCardsUTI(hospitalId);
                } else {
                    throw new Error(result.message || 'Erro ao dar alta');
                }
            } catch (error) {
                showErrorMessageUTI('Erro: ' + error.message);
                btnAlta.innerHTML = 'Dar Alta';
                btnAlta.disabled = false;
            }
        }
    });
    
    // Salvar edicao
    btnSalvar.addEventListener('click', async () => {
        try {
            const tipoConvenio = modal.querySelector('#editUTITipoConvenio').value;
            const identificacao = modal.querySelector('#editUTIIdentificacao').value.trim();
            const isolamento = modal.querySelector('#editUTIIsolamento').value;
            const genero = modal.querySelector('#editUTIGenero').value;
            const iniciais = modal.querySelector('#editUTIIniciais').value.trim();
            const idade = modal.querySelector('#editUTIIdade').value;
            const matricula = modal.querySelector('#editUTIMatricula').value.trim();
            const prevAlta = modal.querySelector('#editUTIPrevAlta').value;
            
            btnSalvar.innerHTML = 'Salvando...';
            btnSalvar.disabled = true;
            
            const params = new URLSearchParams({
                action: 'atualizar',
                hospital: hospitalId,
                leito: leitoNumero,
                nome: iniciais.replace(/\s/g, ''),
                matricula: matricula,
                idade: idade,
                identificacaoLeito: identificacao,
                isolamento: isolamento,
                genero: genero,
                categoriaEscolhida: tipoConvenio,
                prevAlta: prevAlta
            });
            
            logInfoUTI('Enviando atualizacao UTI: ' + params.toString());
            
            const response = await fetch(window.API_URL + '?' + params.toString());
            const result = await response.json();
            
            if (result.ok || result.success) {
                showSuccessMessageUTI('Dados atualizados com sucesso!');
                fecharModal();
                if (window.loadHospitalData) await window.loadHospitalData();
                window.renderCardsUTI(hospitalId);
            } else {
                throw new Error(result.message || result.error || 'Erro ao atualizar');
            }
        } catch (error) {
            logErrorUTI('Erro ao atualizar: ' + error.message);
            showErrorMessageUTI('Erro: ' + error.message);
            btnSalvar.innerHTML = 'Salvar';
            btnSalvar.disabled = false;
        }
    });
}

// =================== INICIALIZACAO ===================

console.log('CARDS-UTI.JS V7.0 - Carregado com sucesso!');
console.log('Hospitais UTI ativos:', HOSPITAIS_UTI_ATIVOS.join(', '));
console.log('Total de leitos UTI configurados:', Object.values(UTI_CAPACIDADE_CARDS).reduce((sum, h) => sum + h.total, 0));
