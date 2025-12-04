// =================== DASHBOARD UTI V7.0 - DEZEMBRO/2025 ===================
// =================== ARCHIPELAGO - GESTAO DE LEITOS UTI ===================
// 
// CONFIGURACAO ATUAL:
// - Apenas H2 (Cruz Azul) ATIVO com 30 leitos UTI
// - Demais hospitais DESLIGADOS (configuracao pronta para ativacao futura)
//
// PARA ATIVAR OUTROS HOSPITAIS:
// 1. Adicione o ID do hospital no array HOSPITAIS_UTI_ATIVOS (linha ~25)
// 2. Certifique-se que os leitos UTI estao cadastrados na planilha
//
// CAPACIDADE UTI COMPLETA (quando todos ativos):
// H1: 3 contratuais + 2 extras = 5 total
// H2: 20 contratuais + 10 extras = 30 total (ATIVO)
// H3: 2 contratuais + 2 extras = 4 total
// H4: 4 contratuais + 2 extras = 6 total
// H5: 4 contratuais + 2 extras = 6 total
// H6: 2 contratuais + 2 extras = 4 total
// H7: 0 (nao possui UTI)
// H8: 2 contratuais + 2 extras = 4 total
// H9: 2 contratuais + 2 extras = 4 total
// TOTAL GERAL: 39 contratuais + 24 extras = 63 leitos
// ===================

// =================== HOSPITAIS UTI ATIVOS ===================
// Para ativar mais hospitais, adicione o ID aqui
const HOSPITAIS_UTI_ATIVOS = ['H2']; // Apenas Cruz Azul ativo no momento

// =================== CAPACIDADE UTI POR HOSPITAL ===================
const UTI_CAPACIDADE = {
    H1: { contratuais: 3, extras: 2, total: 5, nome: 'Neomater', ativo: false },
    H2: { contratuais: 20, extras: 10, total: 30, nome: 'Cruz Azul', ativo: true },
    H3: { contratuais: 2, extras: 2, total: 4, nome: 'Santa Marcelina', ativo: false },
    H4: { contratuais: 4, extras: 2, total: 6, nome: 'Santa Clara', ativo: false },
    H5: { contratuais: 4, extras: 2, total: 6, nome: 'Adventista', ativo: false },
    H6: { contratuais: 2, extras: 2, total: 4, nome: 'Santa Cruz', ativo: false },
    H7: { contratuais: 0, extras: 0, total: 0, nome: 'Santa Virginia', ativo: false }, // Nao possui UTI
    H8: { contratuais: 2, extras: 2, total: 4, nome: 'Sao Camilo Ipiranga', ativo: false },
    H9: { contratuais: 2, extras: 2, total: 4, nome: 'Sao Camilo Pompeia', ativo: false }
};

// Exportar para uso global
window.UTI_CAPACIDADE = UTI_CAPACIDADE;

// =================== OPCOES DE PREV ALTA UTI (SEM TURNOS) ===================
const PREV_ALTA_UTI = ['Hoje', '24h', '48h', '72h', '96h', 'Sem Previsao'];
window.PREV_ALTA_UTI = PREV_ALTA_UTI;

// =================== CAMPOS BLOQUEADOS NA UTI ===================
const CAMPOS_BLOQUEADOS_UTI = ['pps', 'spict', 'regiao', 'diretivas', 'concessoes', 'linhasCuidado'];
window.CAMPOS_BLOQUEADOS_UTI = CAMPOS_BLOQUEADOS_UTI;

// =================== CORES ===================
const CORES_UTI = {
    ocupados: '#22c55e',      // Verde
    reservados: '#fbbf24',    // Amarelo
    disponiveis: '#3b82f6',   // Azul
    titulo: '#60a5fa',        // Azul claro
    fundo: '#131b2e',
    card: 'rgba(255, 255, 255, 0.03)'
};

// =================== FUNCOES AUXILIARES ===================

function normStrUTI(s) {
    if (!s) return '';
    return String(s).toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseAdmDateUTI(admAt) {
    if (!admAt) return null;
    try {
        const d = new Date(admAt);
        if (!isNaN(d.getTime())) {
            const agora = new Date();
            const diffDias = Math.floor((agora - d) / (1000 * 60 * 60 * 24));
            if (diffDias >= 0 && diffDias <= 365) {
                return d;
            }
        }
    } catch (e) {}
    return null;
}

function isOcupadoUTI(leito) {
    if (!leito || !leito.status) return false;
    const s = normStrUTI(leito.status);
    return s === 'ocupado' || s === 'em uso' || s === 'ocupada';
}

function isVagoUTI(leito) {
    if (!leito || !leito.status) return false;
    const s = normStrUTI(leito.status);
    return s === 'vago' || s === 'disponivel' || s === 'livre';
}

// =================== FILTRAR APENAS LEITOS UTI ===================
function filtrarLeitosUTI(leitos) {
    if (!Array.isArray(leitos)) return [];
    return leitos.filter(l => l.tipo === 'UTI');
}

// =================== BUSCAR RESERVAS UTI ===================
function getReservasUTI(hospitalId) {
    if (!window.reservasData || !Array.isArray(window.reservasData)) return [];
    return window.reservasData.filter(r => r.hospital === hospitalId && r.tipo === 'UTI');
}

// =================== VERIFICAR SE HOSPITAL ESTA ATIVO ===================
function isHospitalUTIAtivo(hospitalId) {
    return HOSPITAIS_UTI_ATIVOS.includes(hospitalId);
}

// =================== OBTER HOSPITAIS COM UTI ATIVOS ===================
function getHospitaisUTIAtivos() {
    return Object.entries(UTI_CAPACIDADE)
        .filter(([id, config]) => config.ativo && config.total > 0 && HOSPITAIS_UTI_ATIVOS.includes(id))
        .map(([id, config]) => ({ id, ...config }));
}

// =================== CALCULAR OFFSET DO GAUGE ===================
function calcularGaugeOffsetUTI(porcentagem) {
    const circunferencia = Math.PI * 55;
    const progresso = (porcentagem / 100) * circunferencia;
    return circunferencia - progresso;
}

// =================== RENDER GAUGE OCUPADOS (VERDE) ===================
function renderGaugeOcupadosUTI(porcentagem, numero) {
    const offset = calcularGaugeOffsetUTI(porcentagem);
    const cor = CORES_UTI.ocupados;
    
    return `
        <div class="uti-gauge-container">
            <div class="uti-gauge-titulo">Ocupados</div>
            <div style="position: relative;">
                <svg class="uti-gauge" viewBox="0 0 140 80">
                    <path d="M 15 70 A 55 55 0 0 1 125 70" 
                          fill="none" 
                          stroke="rgba(255,255,255,0.1)" 
                          stroke-width="14" 
                          stroke-linecap="round"/>
                    <path d="M 15 70 A 55 55 0 0 1 125 70" 
                          fill="none" 
                          stroke="${cor}" 
                          stroke-width="14" 
                          stroke-linecap="round"
                          stroke-dasharray="172.8"
                          stroke-dashoffset="${offset}"/>
                </svg>
                <div class="uti-number-inside">${numero.toString().padStart(2, '0')}</div>
            </div>
            <div class="uti-badge-below ocupados">${porcentagem.toFixed(0)}%</div>
        </div>
    `;
}

// =================== RENDER GAUGE RESERVADOS (AMARELO) ===================
function renderGaugeReservadosUTI(porcentagem, numero) {
    const offset = calcularGaugeOffsetUTI(porcentagem);
    const cor = CORES_UTI.reservados;
    
    return `
        <div class="uti-gauge-container">
            <div class="uti-gauge-titulo">Reservados</div>
            <div style="position: relative;">
                <svg class="uti-gauge" viewBox="0 0 140 80">
                    <path d="M 15 70 A 55 55 0 0 1 125 70" 
                          fill="none" 
                          stroke="rgba(255,255,255,0.1)" 
                          stroke-width="14" 
                          stroke-linecap="round"/>
                    <path d="M 15 70 A 55 55 0 0 1 125 70" 
                          fill="none" 
                          stroke="${cor}" 
                          stroke-width="14" 
                          stroke-linecap="round"
                          stroke-dasharray="172.8"
                          stroke-dashoffset="${offset}"/>
                </svg>
                <div class="uti-number-inside">${numero.toString().padStart(2, '0')}</div>
            </div>
            <div class="uti-badge-below reservados">${porcentagem.toFixed(0)}%</div>
        </div>
    `;
}

// =================== RENDER GAUGE DISPONIVEIS (AZUL) ===================
function renderGaugeDisponiveisUTI(porcentagem, numero) {
    const offset = calcularGaugeOffsetUTI(porcentagem);
    const cor = CORES_UTI.disponiveis;
    
    return `
        <div class="uti-gauge-container">
            <div style="position: relative;">
                <svg class="uti-gauge" viewBox="0 0 140 80">
                    <path d="M 15 70 A 55 55 0 0 1 125 70" 
                          fill="none" 
                          stroke="rgba(255,255,255,0.1)" 
                          stroke-width="14" 
                          stroke-linecap="round"/>
                    <path d="M 15 70 A 55 55 0 0 1 125 70" 
                          fill="none" 
                          stroke="${cor}" 
                          stroke-width="14" 
                          stroke-linecap="round"
                          stroke-dasharray="172.8"
                          stroke-dashoffset="${offset}"/>
                </svg>
                <div class="uti-number-inside">${numero.toString().padStart(2, '0')}</div>
            </div>
            <div class="uti-badge-below disponiveis">${porcentagem.toFixed(0)}%</div>
        </div>
    `;
}

// =================== PROCESSAR DADOS UTI DO HOSPITAL ===================
function processarDadosUTI(hospitalId) {
    const hospitalObj = window.hospitalData[hospitalId] || {};
    let leitosRaw = hospitalObj.leitos || hospitalObj || [];
    
    if (!Array.isArray(leitosRaw)) {
        leitosRaw = [];
    }
    
    // Filtrar apenas leitos UTI
    const leitos = filtrarLeitosUTI(leitosRaw);
    
    // Buscar configuracao de capacidade
    const capacidade = UTI_CAPACIDADE[hospitalId];
    if (!capacidade) {
        console.error('[UTI] Capacidade nao encontrada para', hospitalId);
        return null;
    }
    
    // Contar ocupados
    const ocupados = leitos.filter(l => isOcupadoUTI(l));
    
    // Buscar reservas UTI
    const reservas = getReservasUTI(hospitalId);
    
    // Contar por tipo de convenio (Apartamento/Enfermaria escolhido na admissao)
    const ocupadosApto = ocupados.filter(l => l.categoriaEscolhida === 'Apartamento').length;
    const ocupadosEnf = ocupados.filter(l => l.categoriaEscolhida === 'Enfermaria').length;
    
    const reservadosApto = reservas.filter(r => r.tipoConvenio === 'Apartamento' || r.categoriaEscolhida === 'Apartamento').length;
    const reservadosEnf = reservas.filter(r => r.tipoConvenio === 'Enfermaria' || r.categoriaEscolhida === 'Enfermaria').length;
    
    // Calcular vagos
    const vagos = leitos.filter(l => isVagoUTI(l));
    
    // Calcular disponiveis (descontando reservas)
    const disponiveis = Math.max(0, capacidade.contratuais - ocupados.length - reservas.length);
    
    // Calcular taxa de ocupacao
    const base = Math.max(capacidade.contratuais, ocupados.length);
    const taxaOcupacao = base > 0 ? Math.min((ocupados.length / base) * 100, 100) : 0;
    
    // Calcular TPH
    const hoje = new Date();
    const tphValues = ocupados
        .map(l => {
            if (!l.admAt) return 0;
            const admData = parseAdmDateUTI(l.admAt);
            if (!admData) return 0;
            const dias = Math.floor((hoje - admData) / (1000 * 60 * 60 * 24));
            return (dias >= 0 && dias <= 365) ? dias : 0;
        })
        .filter(v => v >= 0);
    
    const tphMedio = tphValues.length > 0 
        ? (tphValues.reduce((a, b) => a + b, 0) / tphValues.length).toFixed(2)
        : '0.00';
    
    // Previsao de alta (para hoje)
    const previsaoAlta = ocupados.filter(l => {
        if (!l.prevAlta) return false;
        const prev = l.prevAlta.toLowerCase();
        return prev.includes('hoje');
    });
    
    return {
        id: hospitalId,
        nome: capacidade.nome,
        contratuais: capacidade.contratuais,
        extras: capacidade.extras,
        totalLeitos: leitos.length,
        taxaOcupacao,
        ocupados: {
            total: ocupados.length,
            apartamento: ocupadosApto,
            enfermaria: ocupadosEnf,
            lista: ocupados
        },
        reservados: {
            total: reservas.length,
            apartamento: reservadosApto,
            enfermaria: reservadosEnf,
            lista: reservas
        },
        disponiveis: {
            total: disponiveis,
            vagos: vagos.length
        },
        previsao: {
            total: previsaoAlta.length
        },
        tph: {
            medio: tphMedio
        }
    };
}

// =================== COPIAR PARA WHATSAPP ===================
function copiarDashboardUTIParaWhatsApp(hospitalId) {
    const dados = processarDadosUTI(hospitalId);
    if (!dados) {
        alert('Erro ao processar dados do hospital');
        return;
    }
    
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let texto = `*DASHBOARD UTI - ${dados.nome}*\n`;
    texto += `${dataFormatada}\n`;
    texto += `━━━━━━━━━━━━━━━━━\n\n`;
    
    texto += `*Ocupacao:* ${dados.ocupados.total}/${dados.contratuais} (${dados.taxaOcupacao.toFixed(1)}%)\n`;
    texto += `- Convenio Apartamento: ${dados.ocupados.apartamento}\n`;
    texto += `- Convenio Enfermaria: ${dados.ocupados.enfermaria}\n\n`;
    
    if (dados.reservados.total > 0) {
        texto += `*Reservados:* ${dados.reservados.total}\n`;
        texto += `- Convenio Apartamento: ${dados.reservados.apartamento}\n`;
        texto += `- Convenio Enfermaria: ${dados.reservados.enfermaria}\n\n`;
    }
    
    texto += `*Disponiveis:* ${dados.disponiveis.total}\n\n`;
    texto += `*Previsao Alta Hoje:* ${dados.previsao.total}\n`;
    texto += `*TPH Medio:* ${dados.tph.medio} dias\n`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('Texto copiado para a area de transferencia!\n\nCole no WhatsApp e envie.');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar. Tente novamente.');
    });
}

// =================== MUDAR HOSPITAL NO DROPDOWN ===================
function mudarHospitalUTI(hospitalId) {
    if (!isHospitalUTIAtivo(hospitalId)) {
        alert('Este hospital ainda nao esta ativo para UTI.');
        return;
    }
    window.renderDashboardUTI(hospitalId);
}

// =================== FUNCAO PRINCIPAL: RENDER DASHBOARD UTI ===================
window.renderDashboardUTI = function(hospitalId) {
    console.log('[UTI V7.0] Renderizando Dashboard UTI');
    
    // Se nao passou hospital, usar o primeiro ativo
    if (!hospitalId) {
        const hospitaisAtivos = getHospitaisUTIAtivos();
        if (hospitaisAtivos.length === 0) {
            console.error('[UTI] Nenhum hospital UTI ativo');
            return;
        }
        hospitalId = hospitaisAtivos[0].id;
    }
    
    // Verificar se hospital esta ativo
    if (!isHospitalUTIAtivo(hospitalId)) {
        console.warn('[UTI] Hospital', hospitalId, 'nao esta ativo para UTI');
        const hospitaisAtivos = getHospitaisUTIAtivos();
        if (hospitaisAtivos.length > 0) {
            hospitalId = hospitaisAtivos[0].id;
        } else {
            return;
        }
    }
    
    // Buscar container
    let container = document.getElementById('dashUTIContent');
    if (!container) {
        const dashSection = document.getElementById('dash3');
        if (dashSection) {
            container = document.createElement('div');
            container.id = 'dashUTIContent';
            dashSection.appendChild(container);
        }
    }
    
    if (!container) {
        container = document.getElementById('dashboardContainer');
        if (!container) {
            console.error('[UTI] Nenhum container encontrado');
            return;
        }
    }
    
    // Verificar dados
    if (!window.hospitalData || Object.keys(window.hospitalData).length === 0) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; text-align: center; color: white; background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%); border-radius: 12px; margin: 20px; padding: 40px;">
                <div style="width: 60px; height: 60px; border: 3px solid #ef4444; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                <h2 style="color: #ef4444; margin-bottom: 10px; font-size: 20px;">Dados nao disponiveis</h2>
                <p style="color: #9ca3af; font-size: 14px;">Aguardando sincronizacao com a planilha</p>
                <button onclick="window.location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">Recarregar</button>
            </div>
        `;
        return;
    }
    
    // Processar dados
    const dados = processarDadosUTI(hospitalId);
    if (!dados) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #9ca3af;">
                <p>Nenhum dado UTI disponivel para este hospital</p>
            </div>
        `;
        return;
    }
    
    // Obter hospitais ativos para dropdown
    const hospitaisAtivos = getHospitaisUTIAtivos();
    
    // Calcular porcentagens
    const porcentagemOcupados = dados.contratuais > 0 ? (dados.ocupados.total / dados.contratuais) * 100 : 0;
    const porcentagemReservados = dados.contratuais > 0 ? (dados.reservados.total / dados.contratuais) * 100 : 0;
    const porcentagemDisponiveis = dados.contratuais > 0 ? (dados.disponiveis.total / dados.contratuais) * 100 : 0;
    
    // Renderizar HTML
    container.innerHTML = `
        <div class="dashboard-uti-container">
            ${getUTICSS()}
            
            <!-- HEADER -->
            <div class="uti-header">
                <div class="uti-header-titulo">
                    <h2>Dashboard UTIs</h2>
                </div>
                
                <div class="uti-header-controles">
                    <select id="hospitalSelectUTI" class="uti-select-hospital" onchange="mudarHospitalUTI(this.value)">
                        ${hospitaisAtivos.map(h => `
                            <option value="${h.id}" ${h.id === hospitalId ? 'selected' : ''}>
                                ${h.nome} (${h.total} leitos)
                            </option>
                        `).join('')}
                    </select>
                    
                    <button id="btnWhatsAppUTI" class="uti-btn-whatsapp" onclick="copiarDashboardUTIParaWhatsApp('${hospitalId}')">
                        Copiar para WhatsApp
                    </button>
                </div>
            </div>
            
            <!-- INFO HOSPITAL -->
            <div class="uti-info-hospital">
                <div class="uti-info-nome">${dados.nome}</div>
                <div class="uti-info-capacidade">
                    <span class="uti-info-item">
                        <span class="uti-info-label">Contratuais:</span>
                        <span class="uti-info-valor">${dados.contratuais}</span>
                    </span>
                    <span class="uti-info-separador">|</span>
                    <span class="uti-info-item">
                        <span class="uti-info-label">Extras:</span>
                        <span class="uti-info-valor">${dados.extras}</span>
                    </span>
                    <span class="uti-info-separador">|</span>
                    <span class="uti-info-item">
                        <span class="uti-info-label">Total:</span>
                        <span class="uti-info-valor">${dados.contratuais + dados.extras}</span>
                    </span>
                </div>
            </div>
            
            <!-- KPI GRID -->
            <div class="uti-kpi-grid">
                
                <!-- BOX OCUPACAO E RESERVAS -->
                <div class="uti-kpi-box box-ocupacao-reservas">
                    <div class="uti-kpi-title">Ocupacao / Reservas</div>
                    
                    <div class="uti-dual-gauges">
                        ${renderGaugeOcupadosUTI(porcentagemOcupados, dados.ocupados.total)}
                        ${renderGaugeReservadosUTI(porcentagemReservados, dados.reservados.total)}
                    </div>
                    
                    <div class="uti-kpi-detalhes">
                        <div class="uti-kpi-subtitle">Por Tipo de Convenio</div>
                        <table class="uti-tabela-tipo">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th style="color: ${CORES_UTI.ocupados};">Ocupados</th>
                                    <th style="color: ${CORES_UTI.reservados};">Reservados</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Apartamento</td>
                                    <td>${dados.ocupados.apartamento}</td>
                                    <td>${dados.reservados.apartamento}</td>
                                </tr>
                                <tr>
                                    <td>Enfermaria</td>
                                    <td>${dados.ocupados.enfermaria}</td>
                                    <td>${dados.reservados.enfermaria}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- BOX DISPONIVEIS -->
                <div class="uti-kpi-box box-disponiveis">
                    <div class="uti-kpi-title">Leitos Disponiveis</div>
                    
                    <div class="uti-gauge-center">
                        ${renderGaugeDisponiveisUTI(porcentagemDisponiveis, dados.disponiveis.total)}
                    </div>
                    
                    <div class="uti-kpi-detalhes">
                        <div class="uti-info-disponiveis">
                            <div class="uti-info-row">
                                <span class="uti-info-label">Previsao Alta Hoje:</span>
                                <span class="uti-info-valor">${dados.previsao.total}</span>
                            </div>
                            <div class="uti-info-row">
                                <span class="uti-info-label">TPH Medio:</span>
                                <span class="uti-info-valor">${dados.tph.medio} dias</span>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
            
            <!-- AVISO SOBRE CAMPOS BLOQUEADOS -->
            <div class="uti-aviso">
                <strong>Nota:</strong> Leitos UTI nao utilizam os campos: PPS, SPICT, Regiao, Diretivas, Concessoes e Linhas de Cuidado.
                O campo "Tipo de Quarto" e substituido por "Tipo de Convenio" (Apartamento/Enfermaria).
            </div>
            
        </div>
    `;
    
    console.log('[UTI V7.0] Dashboard UTI renderizado para', hospitalId);
};

// =================== CSS DO DASHBOARD UTI ===================
function getUTICSS() {
    return `
        <style id="utiCSS">
            * {
                text-transform: none !important;
            }
            
            .dashboard-uti-container {
                background: linear-gradient(135deg, #131b2e 0%, #1e293b 100%);
                min-height: 100vh;
                padding: 20px;
                color: white;
                font-family: 'Poppins', sans-serif;
            }
            
            /* =================== HEADER =================== */
            .uti-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
                gap: 15px;
            }
            
            .uti-header-titulo h2 {
                margin: 0;
                color: ${CORES_UTI.titulo};
                font-size: 24px;
                font-weight: 700;
            }
            
            .uti-header-controles {
                display: flex;
                gap: 15px;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .uti-select-hospital {
                padding: 10px 15px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                min-width: 200px;
            }
            
            .uti-select-hospital:focus {
                outline: none;
                border-color: ${CORES_UTI.titulo};
            }
            
            .uti-select-hospital option {
                background: #1e293b;
                color: white;
            }
            
            .uti-btn-whatsapp {
                padding: 10px 20px;
                background: #25D366;
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .uti-btn-whatsapp:hover {
                background: #128C7E;
            }
            
            /* =================== INFO HOSPITAL =================== */
            .uti-info-hospital {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .uti-info-nome {
                font-size: 20px;
                font-weight: 700;
                color: white;
                margin-bottom: 10px;
            }
            
            .uti-info-capacidade {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                align-items: center;
            }
            
            .uti-info-item {
                display: flex;
                gap: 5px;
            }
            
            .uti-info-label {
                color: #9ca3af;
                font-size: 14px;
            }
            
            .uti-info-valor {
                color: white;
                font-weight: 600;
                font-size: 14px;
            }
            
            .uti-info-separador {
                color: rgba(255, 255, 255, 0.3);
            }
            
            /* =================== KPI GRID =================== */
            .uti-kpi-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .uti-kpi-box {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                padding: 25px;
                border: 1px solid rgba(255, 255, 255, 0.8);
                border-top: 3px solid #ffffff;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            
            .uti-kpi-box:hover {
                background: rgba(255, 255, 255, 0.05);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            }
            
            .uti-kpi-title {
                font-size: 14px;
                font-weight: 700;
                color: #ffffff;
                text-align: center;
                margin-bottom: 20px;
            }
            
            /* =================== DUAL GAUGES =================== */
            .uti-dual-gauges {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin-bottom: 20px;
            }
            
            .uti-gauge-center {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
            }
            
            .uti-gauge-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .uti-gauge-titulo {
                font-size: 12px;
                color: #9ca3af;
                margin-bottom: 5px;
            }
            
            .uti-gauge {
                width: 120px;
                height: 70px;
            }
            
            .uti-number-inside {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 26px;
                font-weight: 700;
                color: white;
                line-height: 1;
                margin-top: 8px;
            }
            
            .uti-badge-below {
                font-size: 14px;
                font-weight: 700;
                padding: 4px 12px;
                border-radius: 12px;
                border: 1px solid;
            }
            
            .uti-badge-below.ocupados {
                background: rgba(34, 197, 94, 0.2);
                color: ${CORES_UTI.ocupados};
                border-color: ${CORES_UTI.ocupados};
            }
            
            .uti-badge-below.reservados {
                background: rgba(251, 191, 36, 0.2);
                color: ${CORES_UTI.reservados};
                border-color: ${CORES_UTI.reservados};
            }
            
            .uti-badge-below.disponiveis {
                background: rgba(59, 130, 246, 0.2);
                color: ${CORES_UTI.disponiveis};
                border-color: ${CORES_UTI.disponiveis};
            }
            
            /* =================== DETALHES =================== */
            .uti-kpi-detalhes {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 15px;
            }
            
            .uti-kpi-subtitle {
                font-size: 11px;
                color: #6b7280;
                margin-bottom: 12px;
                text-align: center;
            }
            
            .uti-tabela-tipo {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }
            
            .uti-tabela-tipo th {
                color: #9ca3af;
                font-weight: 600;
                padding: 8px;
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .uti-tabela-tipo td {
                color: white;
                padding: 8px;
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .uti-tabela-tipo td:first-child {
                text-align: left;
                color: #9ca3af;
            }
            
            .uti-info-disponiveis {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .uti-info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 6px;
            }
            
            /* =================== AVISO =================== */
            .uti-aviso {
                background: rgba(251, 191, 36, 0.1);
                border: 1px solid rgba(251, 191, 36, 0.3);
                border-radius: 8px;
                padding: 15px;
                font-size: 13px;
                color: #fbbf24;
                margin-top: 20px;
            }
            
            .uti-aviso strong {
                color: #fbbf24;
            }
            
            /* =================== RESPONSIVIDADE =================== */
            @media (max-width: 768px) {
                .uti-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .uti-header-controles {
                    width: 100%;
                    flex-direction: column;
                }
                
                .uti-select-hospital {
                    width: 100%;
                }
                
                .uti-btn-whatsapp {
                    width: 100%;
                }
                
                .uti-kpi-grid {
                    grid-template-columns: 1fr;
                }
                
                .uti-dual-gauges {
                    flex-direction: column;
                    gap: 20px;
                    align-items: center;
                }
                
                .uti-info-capacidade {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .uti-info-separador {
                    display: none;
                }
            }
            
            @media (max-width: 480px) {
                .dashboard-uti-container {
                    padding: 10px;
                }
                
                .uti-header-titulo h2 {
                    font-size: 18px;
                }
                
                .uti-kpi-box {
                    padding: 15px;
                }
                
                .uti-number-inside {
                    font-size: 22px;
                }
                
                .uti-gauge {
                    width: 100px;
                    height: 60px;
                }
            }
        </style>
    `;
}

// =================== EXPORTS GLOBAIS ===================
window.renderDashboardUTI = window.renderDashboardUTI;
window.processarDadosUTI = processarDadosUTI;
window.filtrarLeitosUTI = filtrarLeitosUTI;
window.getReservasUTI = getReservasUTI;
window.isHospitalUTIAtivo = isHospitalUTIAtivo;
window.getHospitaisUTIAtivos = getHospitaisUTIAtivos;
window.mudarHospitalUTI = mudarHospitalUTI;
window.copiarDashboardUTIParaWhatsApp = copiarDashboardUTIParaWhatsApp;
window.HOSPITAIS_UTI_ATIVOS = HOSPITAIS_UTI_ATIVOS;

// =================== LOGS DE INICIALIZACAO ===================
console.log('Dashboard UTI V7.0 - CARREGADO COM SUCESSO');
console.log('UTI V7.0 - Hospitais ATIVOS:', HOSPITAIS_UTI_ATIVOS.join(', '));
console.log('UTI V7.0 - Total de leitos UTI ativos:', 
    HOSPITAIS_UTI_ATIVOS.reduce((sum, id) => sum + (UTI_CAPACIDADE[id]?.total || 0), 0)
);
console.log('');
console.log('Para ativar mais hospitais UTI:');
console.log('1. Edite o array HOSPITAIS_UTI_ATIVOS no inicio do arquivo');
console.log('2. Adicione o ID do hospital (ex: "H1", "H4")');
console.log('3. Certifique-se que os leitos UTI estao na planilha');
