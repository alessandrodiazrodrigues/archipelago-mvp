// js/dashboards/dashboard-hospital.js
// Dashboard Enfermarias - Archipelago V7.0
// Versao: 7.0 - Dezembro/2025
// Alteracoes V7.0:
// - Renomeado de "Dashboard Hospitalar" para "Dashboard Enfermarias"
// - Filtro UTI (leitos UTI nao aparecem neste dashboard)
// - Sistema de reservas integrado
// - Novo KPI box para Reservados
// - Calculo de disponiveis desconta reservas

// =================== DASHBOARD ENFERMARIAS V7.0 ===================
// Depende de: cards-config.js (carregar ANTES)

console.log('Dashboard Enfermarias V7.0 - Carregando...');

// =================== VALIDAR DEPENDENCIAS ===================
if (typeof window.desnormalizarTexto === 'undefined') {
    console.error('ERRO CRITICO: cards-config.js NAO foi carregado!');
    throw new Error('cards-config.js deve ser carregado ANTES de dashboard-hospital.js');
}

console.log('Dependencias validadas - cards-config.js OK');

// =================== CONTINUACAO DO DASHBOARD ENFERMARIAS ===================

console.log('Dashboard Enfermarias V7.0 - Inicializando...');

// Variavel global para controlar o filtro atual
window.hospitalFiltroAtual = 'todos';

const CORES_ARCHIPELAGO = {
    azulMarinhoEscuro: '#131b2e',
    azulEscuro: '#172945',
    azulMedio: '#1c5083',
    azulPrincipal: '#60a5fa',
    azulAcinzentado: '#577a97',
    azulClaro: '#a9c0d2',
    cinzaEscuro: '#3c3a3e',
    cinzaMedio: '#9ca3af',
    cinzaClaro: '#e9e5e2',
    laranja: '#c86420',
    amarelo: '#f59a1d',
    verde: '#29ad8d',
    ocupados: '#60a5fa',
    previsao: '#60a5fa',
    disponiveis: '#60a5fa',
    reservados: '#fbbf24', // V7.0: Cor para reservados
    tph: '#577a97',
    pps: '#1c5083',
    spict: '#172945'
};

const CONFIG_DASHBOARD = {
    MOSTRAR_LINHAS_CUIDADO: true,
    MOSTRAR_96H: false,
};

window.fundoBranco = false;

const hasDataLabels = typeof ChartDataLabels !== 'undefined';
if (!hasDataLabels) {
    console.warn('ChartDataLabels nao carregado. Numeros nas pizzas via legenda.');
}

function normStr(s) {
    return (s ?? '').toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim().toLowerCase();
}

function parseAdmDate_Hosp(admAt) {
    if (!admAt) return null;
    
    const d = new Date(admAt);
    if (!isNaN(d)) {
        const hoje = new Date();
        const dias = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));
        
        if (dias >= 0 && dias <= 365) {
            return d;
        }
    }
    
    return null;
}

function getLeitoNumero(val) {
    if (typeof val === 'number') return val;
    const m = String(val || '').match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
}

function isOcupado(leito) {
    const s = (leito?.status || '').toString().toLowerCase().trim();
    return s === 'ocupado' || s === 'em uso' || s === 'ocupada';
}

function isVago(leito) {
    const s = (leito?.status || '').toString().toLowerCase().trim();
    return s === 'vago' || s === 'disponivel' || s === 'disponível' || s === 'livre';
}

// =================== V7.0: FUNCAO PARA BUSCAR RESERVAS ===================
function getReservasHospital(hospitalId) {
    if (!window.reservasData || !Array.isArray(window.reservasData)) return [];
    return window.reservasData.filter(r => r.hospital === hospitalId && r.tipo !== 'UTI');
}

// =================== V7.0: FILTRAR LEITOS SEM UTI ===================
function filtrarLeitosSemUTI(leitos) {
    if (!Array.isArray(leitos)) return [];
    return leitos.filter(l => l.tipo !== 'UTI');
}

function getCorExata(itemName, tipo = 'concessao') {
    if (!itemName || typeof itemName !== 'string') {
        return CORES_ARCHIPELAGO.cinzaMedio;
    }
    
    const paleta = tipo === 'concessao' ? 
        window.CORES_CONCESSOES : 
        window.CORES_LINHAS;
    
    if (!paleta) {
        console.warn('Paleta de cores nao carregada (api.js)');
        return CORES_ARCHIPELAGO.cinzaMedio;
    }
    
    // USAR A FUNCAO DE NORMALIZACAO DO cards-config.js
    const itemNormalizado = window.normalizarTexto(itemName);
    
    // Buscar com nome normalizado (SEM acentos)
    let cor = paleta[itemNormalizado];
    if (cor) return cor;
    
    // Tentar com limpeza adicional
    const nomeNorm = itemNormalizado.trim().replace(/\s+/g, ' ').replace(/[–—]/g, '-');
    cor = paleta[nomeNorm];
    if (cor) return cor;
    
    // Se nao encontrou, avisar no console
    console.warn('[CORES] Nao encontrada: "' + itemName + '" -> normalizado: "' + itemNormalizado + '"');
    return CORES_ARCHIPELAGO.cinzaMedio;
}

window.atualizarTodasAsCores = function() {
    const corTexto = window.fundoBranco ? CORES_ARCHIPELAGO.cinzaEscuro : '#ffffff';
    const corGrid = window.fundoBranco ? 'rgba(60, 58, 62, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    if (window.chartInstances) {
        Object.values(window.chartInstances).forEach(chart => {
            if (chart && chart.options && chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.ticks.color = corTexto;
                    chart.options.scales.x.grid.color = corGrid;
                    if (chart.options.scales.x.title) {
                        chart.options.scales.x.title.color = corTexto;
                    }
                }
                
                if (chart.options.scales.y) {
                    chart.options.scales.y.ticks.color = corTexto;
                    chart.options.scales.y.grid.color = corGrid;
                    if (chart.options.scales.y.title) {
                        chart.options.scales.y.title.color = corTexto;
                    }
                }
                
                chart.update('none');
            }
        });
    }
};

/**
 * Filtra hospitais no dashboard
 * @param {string} hospitalId - ID do hospital ou 'todos'
 */
window.filtrarHospitalDashboard = function(hospitalId) {
    console.log('[FILTRO] Filtrando:', hospitalId);
    
    // Atualizar variavel global
    window.hospitalFiltroAtual = hospitalId;
    
    // Atualizar dropdown
    const dropdown = document.getElementById('hospitalFilterDropdown');
    if (dropdown) {
        dropdown.value = hospitalId;
    }
    
    // Filtrar cards
    const hospitaisCards = document.querySelectorAll('.hospital-card');
    let totalVisiveis = 0;
    
    hospitaisCards.forEach(card => {
        const cardHospitalId = card.getAttribute('data-hospital');
        
        if (hospitalId === 'todos') {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease';
            totalVisiveis++;
        } else {
            if (cardHospitalId === hospitalId) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease';
                totalVisiveis++;
            } else {
                card.style.display = 'none';
            }
        }
    });
    
    console.log('[FILTRO] Visiveis:', totalVisiveis);
};

// =================== V7.0: WHATSAPP COM RESERVAS E FILTRO UTI ===================
window.copiarDashboardParaWhatsApp = function() {
    const hospitaisIds = ['H5', 'H2', 'H1', 'H4', 'H6', 'H3', 'H7', 'H8', 'H9'];
    const hospitaisNomes = {
        'H1': 'NEOMATER',
        'H2': 'CRUZ AZUL',
        'H3': 'SANTA MARCELINA',
        'H4': 'SANTA CLARA',
        'H5': 'ADVENTISTA',
        'H6': 'SANTA CRUZ',
        'H7': 'SANTA VIRGINIA',
        'H8': 'SAO CAMILO IPIRANGA',
        'H9': 'SAO CAMILO POMPEIA'
    };
    
    // Verificar qual hospital esta selecionado
    const filtroAtual = window.hospitalFiltroAtual || 'todos';
    const hospitaisParaRelatorio = filtroAtual === 'todos' ? hospitaisIds : [filtroAtual];
    
    // V7.0: Renomeado para Dashboard Enfermarias
    let texto = filtroAtual === 'todos' ? 
        '*DASHBOARD ENFERMARIAS*\n' : 
        '*DASHBOARD ENFERMARIAS - ' + hospitaisNomes[filtroAtual] + '*\n';
    
    texto += new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '\n\n';
    
    hospitaisParaRelatorio.forEach((hospitalId, index) => {
        const hospital = window.hospitalData[hospitalId];
        if (!hospital || !hospital.leitos) return;
        
        // V7.0: Filtrar leitos UTI
        const leitos = filtrarLeitosSemUTI(hospital.leitos);
        
        const nome = hospitaisNomes[hospitalId];
        
        if (filtroAtual === 'todos') {
            texto += '━━━━━━━━━━━━━━━━━\n';
            texto += '*' + (index + 1) + '. ' + nome + '*\n';
            texto += '━━━━━━━━━━━━━━━━━\n\n';
        }
        
        // V7.0: Adicionar reservas no relatorio
        const reservas = getReservasHospital(hospitalId);
        if (reservas.length > 0) {
            texto += '*Leitos Reservados: ' + reservas.length + '*\n';
            reservas.forEach(r => {
                texto += '- ' + (r.tipo || 'Leito') + ' ' + (r.identificacaoLeito || '---') + ' - Mat. ' + (r.matricula || '---') + '\n';
            });
            texto += '\n';
        }
        
        // ========== ALTAS PREVISTAS ==========
        const altasTimeline = {
            'HOJE': { 'Ouro': [], '2R': [], '3R': [] },
            '24H': { 'Ouro': [], '2R': [], '3R': [] },
            '48H': []
        };
        
        leitos.forEach(leito => {
            if (isOcupado(leito)) {
                const prevAlta = leito.prevAlta || (leito.paciente && leito.paciente.prevAlta);
                const matricula = leito.matricula || 'S/N';
                
                if (prevAlta) {
                    const prev = normStr(prevAlta).replace(/\s+/g, ' ');
                    
                    if (prev.includes('hoje') && prev.includes('ouro')) altasTimeline['HOJE']['Ouro'].push(matricula);
                    else if (prev.includes('hoje') && prev.includes('2r')) altasTimeline['HOJE']['2R'].push(matricula);
                    else if (prev.includes('hoje') && prev.includes('3r')) altasTimeline['HOJE']['3R'].push(matricula);
                    else if ((prev.includes('24h') || prev.includes('24 h')) && prev.includes('ouro')) altasTimeline['24H']['Ouro'].push(matricula);
                    else if ((prev.includes('24h') || prev.includes('24 h')) && prev.includes('2r')) altasTimeline['24H']['2R'].push(matricula);
                    else if ((prev.includes('24h') || prev.includes('24 h')) && prev.includes('3r')) altasTimeline['24H']['3R'].push(matricula);
                    else if (prev.includes('48h')) altasTimeline['48H'].push(matricula);
                }
            }
        });
        
        const temAltasHoje = altasTimeline['HOJE']['Ouro'].length > 0 || altasTimeline['HOJE']['2R'].length > 0 || altasTimeline['HOJE']['3R'].length > 0;
        const temAltas24h = altasTimeline['24H']['Ouro'].length > 0 || altasTimeline['24H']['2R'].length > 0 || altasTimeline['24H']['3R'].length > 0;
        const temAltas48h = altasTimeline['48H'].length > 0;
        
        if (temAltasHoje) {
            texto += '*Altas Previstas HOJE:*\n';
            if (altasTimeline['HOJE']['Ouro'].length > 0) {
                texto += 'Hoje Ouro: ' + altasTimeline['HOJE']['Ouro'].join(', ') + '\n';
            }
            if (altasTimeline['HOJE']['2R'].length > 0) {
                texto += 'Hoje 2R: ' + altasTimeline['HOJE']['2R'].join(', ') + '\n';
            }
            if (altasTimeline['HOJE']['3R'].length > 0) {
                texto += 'Hoje 3R: ' + altasTimeline['HOJE']['3R'].join(', ') + '\n';
            }
            texto += '\n';
        }
        
        if (temAltas24h) {
            texto += '*Altas Previstas 24H:*\n';
            if (altasTimeline['24H']['Ouro'].length > 0) {
                texto += '24h Ouro: ' + altasTimeline['24H']['Ouro'].join(', ') + '\n';
            }
            if (altasTimeline['24H']['2R'].length > 0) {
                texto += '24h 2R: ' + altasTimeline['24H']['2R'].join(', ') + '\n';
            }
            if (altasTimeline['24H']['3R'].length > 0) {
                texto += '24h 3R: ' + altasTimeline['24H']['3R'].join(', ') + '\n';
            }
            texto += '\n';
        }
        
        if (temAltas48h) {
            texto += '*Altas Previstas 48H:*\n';
            texto += '48h: ' + altasTimeline['48H'].join(', ') + '\n\n';
        }
        
        // ========== CONCESSOES PREVISTAS (COM DESNORMALIZACAO) ==========
        const concessoesTimeline = {
            'HOJE': {},
            '24H': {}
        };
        
        leitos.forEach(leito => {
            if (isOcupado(leito)) {
                const concessoes = leito.concessoes || (leito.paciente && leito.paciente.concessoes);
                const prevAlta = leito.prevAlta || (leito.paciente && leito.paciente.prevAlta);
                const matricula = leito.matricula || 'S/N';
                
                if (concessoes && prevAlta) {
                    const concessoesList = Array.isArray(concessoes) ? 
                        concessoes : 
                        String(concessoes).split('|');
                    
                    const prev = normStr(prevAlta).replace(/\s+/g, ' ');
                    let timeline = null;
                    
                    if (prev.includes('hoje')) timeline = 'HOJE';
                    else if (prev.includes('24h') || prev.includes('24 h')) timeline = '24H';
                    
                    if (timeline) {
                        concessoesList.forEach(concessao => {
                            if (concessao && concessao.trim()) {
                                // APLICAR DESNORMALIZACAO AQUI
                                const nome = desnormalizarTexto(concessao.trim());
                                if (!concessoesTimeline[timeline][nome]) {
                                    concessoesTimeline[timeline][nome] = [];
                                }
                                concessoesTimeline[timeline][nome].push(matricula);
                            }
                        });
                    }
                }
            }
        });
        
        const temConcessoesHoje = Object.keys(concessoesTimeline['HOJE']).length > 0;
        const temConcessoes24h = Object.keys(concessoesTimeline['24H']).length > 0;
        
        if (temConcessoesHoje) {
            texto += '*Concessoes Previstas HOJE:*\n';
            Object.entries(concessoesTimeline['HOJE']).forEach(([nome, mats]) => {
                // APLICAR DESNORMALIZACAO AQUI TAMBEM
                texto += desnormalizarTexto(nome) + ': ' + mats.join(', ') + '\n';
            });
            texto += '\n';
        }
        
        if (temConcessoes24h) {
            texto += '*Concessoes Previstas 24H:*\n';
            Object.entries(concessoesTimeline['24H']).forEach(([nome, mats]) => {
                // APLICAR DESNORMALIZACAO AQUI TAMBEM
                texto += desnormalizarTexto(nome) + ': ' + mats.join(', ') + '\n';
            });
            texto += '\n';
        }
        
        // ========== DIRETIVAS PENDENTES ==========
        const diretivasPendentes = leitos.filter(l => {
            if (!isOcupado(l)) return false;
            
            const spict = l.spict;
            if (!spict) return false;
            
            const spictNorm = normStr(spict);
            const spictElegivel = spictNorm === 'elegivel' || spictNorm === 'elegível';
            
            if (!spictElegivel) return false;
            
            const diretivas = l.diretivas;
            const dirNorm = normStr(diretivas);
            
            const valoresPendentes = ['', 'não', 'nao', 'n/a', 'pendente', 'não se aplica'];
            
            return valoresPendentes.includes(dirNorm);
        });
        
        if (diretivasPendentes.length > 0) {
            texto += '*Diretivas Pendentes:*\n';
            diretivasPendentes.forEach(l => {
                const leito = l.identificacaoLeito || l.leito || '---';
                const matricula = l.matricula || '---';
                texto += 'Leito ' + leito + ' - Mat. ' + matricula + '\n';
            });
            texto += '\n';
        }
        
        // Se nao tem nada
        if (!temAltasHoje && !temAltas24h && !temAltas48h && !temConcessoesHoje && !temConcessoes24h && diretivasPendentes.length === 0 && reservas.length === 0) {
            texto += '_Nenhuma atividade prevista_\n\n';
        }
    });
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('Dados copiados para o WhatsApp!\n\nCole e envie.');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar. Tente novamente.');
    });
};

// =================== CALCULOS DE MODALIDADES (COM FILTRO UTI) ===================
function calcularModalidadesVagos(leitos, hospitalId) {
    // V7.0: Filtrar UTI
    const leitosFiltrados = filtrarLeitosSemUTI(leitos);
    
    const modalidade = {
        flexiveis: 0,
        exclusivo_apto: 0,
        exclusivo_enf_sem_restricao: 0,
        exclusivo_enf_fem: 0,
        exclusivo_enf_masc: 0
    };

    const vagos = leitosFiltrados.filter(l => isVago(l));

    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        // V6.0: Usar contratuais (nao conta extras)
        const capacidadeInfo = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospitalId] : null;
        const contratuais = capacidadeInfo ? capacidadeInfo.contratuais : leitosFiltrados.length;
        const ocupados = leitosFiltrados.filter(l => isOcupado(l)).length;
        modalidade.flexiveis = Math.max(0, contratuais - ocupados);
        return modalidade;
    }

    // =================== H2 - CRUZ AZUL ===================
    if (hospitalId === 'H2') {
        // APARTAMENTOS: contratuais - ocupados
        const aptosContratuais = 20;
        const aptosOcupados = leitosFiltrados.filter(l => 
            isOcupado(l) && (l.tipo === 'APTO' || l.tipo === 'Apartamento')
        ).length;
        modalidade.exclusivo_apto = Math.max(0, aptosContratuais - aptosOcupados);
        
        // ENFERMARIAS: apenas leitos contratuais (21-36)
        const vagosContratuais = vagos.filter(l => {
            const tipo = l.tipo || '';
            if (tipo !== 'ENFERMARIA' && tipo !== 'Enfermaria') return false;
            const numeroLeito = getLeitoNumero(l.leito);
            return numeroLeito && numeroLeito >= 21 && numeroLeito <= 36;
        });
        
        vagosContratuais.forEach(leitoVago => {
            const numeroLeito = getLeitoNumero(leitoVago.leito);
            
            // Buscar irmao usando CRUZ_AZUL_IRMAOS
            const irmaosMap = window.CRUZ_AZUL_IRMAOS || {};
            const numeroIrmao = irmaosMap[numeroLeito];
            
            if (!numeroIrmao) {
                modalidade.exclusivo_enf_sem_restricao++;
                return;
            }
            
            const irmao = leitosFiltrados.find(l => getLeitoNumero(l.leito) === numeroIrmao);
            
            if (!irmao || isVago(irmao)) {
                modalidade.exclusivo_enf_sem_restricao++;
            } else if (irmao.isolamento && irmao.isolamento !== 'Nao Isolamento') {
                // Isolamento: leito nao disponivel (nao conta)
            } else {
                if (irmao.genero === 'Feminino') {
                    modalidade.exclusivo_enf_fem++;
                } else if (irmao.genero === 'Masculino') {
                    modalidade.exclusivo_enf_masc++;
                } else {
                    modalidade.exclusivo_enf_sem_restricao++;
                }
            }
        });
        
        return modalidade;
    }
    
    // =================== H4 - SANTA CLARA ===================
    if (hospitalId === 'H4') {
        // APARTAMENTOS: contratuais - ocupados
        const aptosContratuais = 18;
        const aptosOcupados = leitosFiltrados.filter(l => 
            isOcupado(l) && (l.tipo === 'APTO' || l.tipo === 'Apartamento')
        ).length;
        modalidade.exclusivo_apto = Math.max(0, aptosContratuais - aptosOcupados);
        
        // ENFERMARIAS: apenas leitos contratuais (10-17)
        const vagosContratuais = vagos.filter(l => {
            const tipo = l.tipo || '';
            if (tipo !== 'ENFERMARIA' && tipo !== 'Enfermaria') return false;
            const numeroLeito = getLeitoNumero(l.leito);
            return numeroLeito && numeroLeito >= 10 && numeroLeito <= 17;
        });
        
        vagosContratuais.forEach(leitoVago => {
            const numeroLeito = getLeitoNumero(leitoVago.leito);
            
            // Determinar irmao usando SANTA_CLARA_IRMAOS
            const irmaosMap = window.SANTA_CLARA_IRMAOS || {
                10: 11, 11: 10,
                12: 13, 13: 12,
                14: 15, 15: 14,
                16: 17, 17: 16
            };
            
            const numeroIrmao = irmaosMap[numeroLeito];
            
            if (!numeroIrmao) {
                modalidade.exclusivo_enf_sem_restricao++;
                return;
            }
            
            const irmao = leitosFiltrados.find(l => getLeitoNumero(l.leito) === numeroIrmao);
            
            if (!irmao || isVago(irmao)) {
                modalidade.exclusivo_enf_sem_restricao++;
            } else if (irmao.isolamento && irmao.isolamento !== 'Nao Isolamento') {
                // Isolamento: leito nao disponivel (nao conta)
            } else {
                if (irmao.genero === 'Feminino') {
                    modalidade.exclusivo_enf_fem++;
                } else if (irmao.genero === 'Masculino') {
                    modalidade.exclusivo_enf_masc++;
                } else {
                    modalidade.exclusivo_enf_sem_restricao++;
                }
            }
        });
        
        return modalidade;
    }


    return modalidade;
}

function calcularModalidadePorTipo(leitos, hospitalId) {
    // V7.0: Filtrar UTI
    const leitosFiltrados = filtrarLeitosSemUTI(leitos);
    
    const modalidade = {
        flexiveis: 0,
        exclusivo_apto: 0,
        exclusivo_enf_sem_restricao: 0,
        exclusivo_enf_fem: 0,
        exclusivo_enf_masc: 0
    };

    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        modalidade.flexiveis = leitosFiltrados.length;
        return modalidade;
    }

    leitosFiltrados.forEach(leito => {
        const genero = leito.genero || '';
        
        // Para H2 e H4: usar TIPO estrutural
        if (hospitalId === 'H2' || hospitalId === 'H4') {
            const tipo = leito.tipo || '';
            if (tipo === 'APTO' || tipo === 'Apartamento') {
                modalidade.exclusivo_apto++;
            } else if (tipo === 'ENFERMARIA' || tipo === 'Enfermaria') {
                if (genero === 'Feminino') {
                    modalidade.exclusivo_enf_fem++;
                } else if (genero === 'Masculino') {
                    modalidade.exclusivo_enf_masc++;
                } else {
                    modalidade.exclusivo_enf_sem_restricao++;
                }
            }
            return;
        }
        
        // Para hibridos: usar categoriaEscolhida
        const catEscolhida = leito.categoriaEscolhida || leito.categoria || '';
        
        if (catEscolhida === 'Apartamento') {
            modalidade.exclusivo_apto++;
        } else if (catEscolhida === 'Enfermaria') {
            if (hospitalId === 'H2' || hospitalId === 'H4') {
                if (genero === 'Feminino') {
                    modalidade.exclusivo_enf_fem++;
                } else if (genero === 'Masculino') {
                    modalidade.exclusivo_enf_masc++;
                } else {
                    modalidade.exclusivo_enf_sem_restricao++;
                }
            } else {
                modalidade.exclusivo_enf_sem_restricao++;
            }
        } else {
            modalidade.flexiveis++;
        }
    });

    return modalidade;
}

// =================== V7.0: PROCESSAR DADOS HOSPITAL (COM RESERVAS E FILTRO UTI) ===================
window.processarDadosHospital = function(hospitalId) {
    const hospitalObj = window.hospitalData[hospitalId] || {};
    
    let leitosRaw = hospitalObj.leitos || hospitalObj || [];
    if (!Array.isArray(leitosRaw)) {
        leitosRaw = [];
    }
    
    // V7.0: Filtrar leitos UTI
    const leitos = filtrarLeitosSemUTI(leitosRaw);
    
    const ocupados = leitos.filter(l => isOcupado(l));
    
    // V7.0: Buscar reservas do hospital (ja vem filtrada sem UTI)
    const reservas = getReservasHospital(hospitalId);
    
    let ocupadosApto, ocupadosEnfFem, ocupadosEnfMasc;
    
    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        ocupadosApto = ocupados.filter(l => 
            l.categoriaEscolhida === 'Apartamento'
        ).length;
        ocupadosEnfFem = ocupados.filter(l => 
            l.categoriaEscolhida === 'Enfermaria' && l.genero === 'Feminino'
        ).length;
        ocupadosEnfMasc = ocupados.filter(l => 
            l.categoriaEscolhida === 'Enfermaria' && l.genero === 'Masculino'
        ).length;
    } else {
        ocupadosApto = ocupados.filter(l => 
            l.tipo === 'Apartamento' || l.tipo === 'APTO'
        ).length;
        ocupadosEnfFem = ocupados.filter(l => 
            (l.tipo === 'ENFERMARIA' || l.tipo === 'Enfermaria') && l.genero === 'Feminino'
        ).length;
        ocupadosEnfMasc = ocupados.filter(l => 
            (l.tipo === 'ENFERMARIA' || l.tipo === 'Enfermaria') && l.genero === 'Masculino'
        ).length;
    }
    
    // V7.0: Calcular reservas por tipo
    const reservadosApto = reservas.filter(r => r.tipo === 'Apartamento').length;
    const reservadosEnfFem = reservas.filter(r => r.tipo === 'Enfermaria' && r.genero === 'Feminino').length;
    const reservadosEnfMasc = reservas.filter(r => r.tipo === 'Enfermaria' && r.genero === 'Masculino').length;
    
    const previsaoAlta = leitos.filter(l => {
        if (!l.prevAlta || l.prevAlta.trim() === '') return false;
        const prev = normStr(l.prevAlta);
        return prev.includes('hoje');
    });
    
    let previsaoApto, previsaoEnfFem, previsaoEnfMasc;
    
    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        previsaoApto = previsaoAlta.filter(l => 
            l.categoriaEscolhida === 'Apartamento'
        ).length;
        previsaoEnfFem = previsaoAlta.filter(l => 
            l.categoriaEscolhida === 'Enfermaria' && l.genero === 'Feminino'
        ).length;
        previsaoEnfMasc = previsaoAlta.filter(l => 
            l.categoriaEscolhida === 'Enfermaria' && l.genero === 'Masculino'
        ).length;
    } else {
        previsaoApto = previsaoAlta.filter(l => 
            l.tipo === 'Apartamento' || l.tipo === 'APTO'
        ).length;
        previsaoEnfFem = previsaoAlta.filter(l => 
            (l.tipo === 'ENFERMARIA' || l.tipo === 'Enfermaria') && l.genero === 'Feminino'
        ).length;
        previsaoEnfMasc = previsaoAlta.filter(l => 
            (l.tipo === 'ENFERMARIA' || l.tipo === 'Enfermaria') && l.genero === 'Masculino'
        ).length;
    }
    
    const vagos = leitos.filter(l => isVago(l));
    
    let vagosApto, vagosEnfFem, vagosEnfMasc;
    
    if (hospitalId === 'H2' || hospitalId === 'H4') {
        // =================== LOGICA APENAS PARA CONTRATUAIS ===================
        const capacidadeInfo = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospitalId] : null;
        
        // Definir estrutura de contratuais
        let aptosContratuais, enfsContratuais;
        if (hospitalId === 'H2') {
            aptosContratuais = 20; // leitos 1-20
            enfsContratuais = 16;  // leitos 21-36 (8 pares)
        } else {
            aptosContratuais = 18; // leitos 1-9 + 27-35
            enfsContratuais = 8;   // leitos 10-17 (4 pares)
        }
        
        // APARTAMENTOS: contratuais - ocupados - reservados (se ocupados >= contratuais, entao 0)
        vagosApto = Math.max(0, aptosContratuais - ocupadosApto - reservadosApto);
        
        // ENFERMARIAS: processar apenas leitos CONTRATUAIS com sistema de irmaos
        let vagosEnfSemRestricao = 0;
        let vagosEnfFemRestrita = 0;
        let vagosEnfMascRestrita = 0;
        
        // Determinar mapa de irmaos e range de contratuais
        let irmaosMap, rangeMin, rangeMax;
        if (hospitalId === 'H2') {
            irmaosMap = window.CRUZ_AZUL_IRMAOS || {
                21: 22, 22: 21,
                23: 24, 24: 23,
                25: 26, 26: 25,
                27: 28, 28: 27,
                29: 30, 30: 29,
                31: 32, 32: 31,
                33: 34, 34: 33,
                35: 36, 36: 35
            };
            rangeMin = 21;
            rangeMax = 36;
        } else {
            irmaosMap = window.SANTA_CLARA_IRMAOS || {
                10: 11, 11: 10,
                12: 13, 13: 12,
                14: 15, 15: 14,
                16: 17, 17: 16
            };
            rangeMin = 10;
            rangeMax = 17;
        }
        
        // Processar APENAS leitos vagos DENTRO DO RANGE CONTRATUAL
        const vagosContratuais = vagos.filter(l => {
            const tipo = l.tipo || '';
            if (tipo !== 'ENFERMARIA' && tipo !== 'Enfermaria') return false;
            
            const numeroLeito = getLeitoNumero(l.leito);
            return numeroLeito && numeroLeito >= rangeMin && numeroLeito <= rangeMax;
        });
        
        vagosContratuais.forEach(leitoVago => {
            const numeroLeito = getLeitoNumero(leitoVago.leito);
            const numeroIrmao = irmaosMap[numeroLeito];
            
            if (!numeroIrmao) {
                vagosEnfSemRestricao++;
                return;
            }
            
            const irmao = leitos.find(l => getLeitoNumero(l.leito) === numeroIrmao);
            
            // Irmao vago: sem restricao
            if (!irmao || isVago(irmao)) {
                vagosEnfSemRestricao++;
            }
            // Irmao com isolamento: NAO conta (leito bloqueado)
            else if (irmao.isolamento && irmao.isolamento !== 'Nao Isolamento') {
                // Nao conta nada - leito bloqueado
            }
            // Irmao ocupado: contar por genero
            else {
                if (irmao.genero === 'Feminino') {
                    vagosEnfFemRestrita++;
                } else if (irmao.genero === 'Masculino') {
                    vagosEnfMascRestrita++;
                } else {
                    vagosEnfSemRestricao++;
                }
            }
        });
        
        // CAPACIDADE TOTAL: somar todas as possibilidades e descontar reservas
        vagosEnfFem = Math.max(0, vagosEnfSemRestricao + vagosEnfFemRestrita - reservadosEnfFem);
        vagosEnfMasc = Math.max(0, vagosEnfSemRestricao + vagosEnfMascRestrita - reservadosEnfMasc);
    }

    // Para hibridos, as variaveis serao definidas abaixo no bloco especifico
    let vagosAptoFinal = vagosApto || 0;
    let vagosEnfFemFinal = vagosEnfFem || 0;
    let vagosEnfMascFinal = vagosEnfMasc || 0;
    
    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        // V6.0: Hibridos - leitos sao 100% flexiveis
        const capacidadeInfo = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospitalId] : null;
        const contratuais = capacidadeInfo ? capacidadeInfo.contratuais : leitos.length;
        
        // Calcular total de disponiveis contratuais - V7.0: descontar reservas
        const disponiveisTotais = Math.max(0, contratuais - ocupados.length - reservas.length);
        
        // HIBRIDOS: Cada vago PODE ser qualquer tipo (nao simultaneo)
        // Exemplo: 1 vago = ate 1 apto OU ate 1 fem OU ate 1 masc
        vagosAptoFinal = disponiveisTotais;
        vagosEnfFemFinal = disponiveisTotais;
        vagosEnfMascFinal = disponiveisTotais;
    }
    
    const tphValues = ocupados
        .map(l => {
            const admAt = l.admAt;
            if (!admAt) return null;
            
            const admData = parseAdmDate_Hosp(admAt);
            if (!admData || isNaN(admData.getTime())) return null;
            
            const hoje = new Date();
            const dias = Math.floor((hoje - admData) / (1000 * 60 * 60 * 24));
            return (dias >= 0 && dias <= 365) ? dias : null;
        })
        .filter(v => v !== null);
    
    const tphMedio = tphValues.length > 0 
        ? (tphValues.reduce((a, b) => a + b, 0) / tphValues.length).toFixed(2)
        : '0.00';
    
    const leitosMais5Diarias = ocupados.filter(l => {
        const admAt = l.admAt;
        if (!admAt) return false;
        
        const admData = parseAdmDate_Hosp(admAt);
        if (!admData || isNaN(admData.getTime())) return false;
        
        const hoje = new Date();
        const horas = (hoje - admData) / (1000 * 60 * 60);
        return horas >= 120;
    }).map(l => {
        const admData = parseAdmDate_Hosp(l.admAt);
        const dias = Math.floor((new Date() - admData) / (1000 * 60 * 60 * 24));
        
        return { 
            leito: l.identificacaoLeito || l.leito || '---',
            matricula: l.matricula || '---',
            dias: dias
        };
    }).sort((a, b) => b.dias - a.dias);
    
    const ppsValues = ocupados
        .map(l => parseInt(l.pps) || 0)
        .filter(v => v > 0);
    const ppsMedio = ppsValues.length > 0
        ? Math.round(ppsValues.reduce((a, b) => a + b, 0) / ppsValues.length)
        : 0;
    
    const ppsMenor40 = ocupados.filter(l => {
        const pps = parseInt(l.pps) || 0;
        return pps > 0 && pps < 40;
    }).map(l => ({
        leito: l.identificacaoLeito || l.leito || '---',
        matricula: l.matricula || '---'
    }));
    
    const spictElegiveis = ocupados.filter(l => {
        const spict = l.spict;
        if (!spict) return false;
        const norm = normStr(spict);
        return norm === 'elegivel' || norm === 'elegível';
    });
    
    const diretivasPendentes = ocupados.filter(l => {
        const spict = l.spict;
        if (!spict) return false;
        
        const spictNorm = normStr(spict);
        const spictElegivel = spictNorm === 'elegivel' || spictNorm === 'elegível';
        
        if (!spictElegivel) return false;
        
        const diretivas = l.diretivas;
        const dirNorm = normStr(diretivas);
        
        const valoresPendentes = ['', 'não', 'nao', 'n/a', 'pendente', 'não se aplica'];
        
        return valoresPendentes.includes(dirNorm);
    }).map(l => ({
        leito: l.identificacaoLeito || l.leito || '---',
        matricula: l.matricula || '---'
    }));
    
    const totalLeitos = leitos.length;
    
    // V6.0: Usar HOSPITAL_CAPACIDADE para base de calculo
    const capacidadeInfo = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospitalId] : null;
    const contratuais = capacidadeInfo ? capacidadeInfo.contratuais : totalLeitos;
    const base = Math.max(contratuais, ocupados.length);
    const taxaOcupacao = totalLeitos > 0 ? Math.min((ocupados.length / base * 100), 100) : 0;
    
    const modalidadeOcupados = calcularModalidadePorTipo(ocupados, hospitalId);
    const modalidadePrevisao = calcularModalidadePorTipo(previsaoAlta, hospitalId);
    const modalidadeDisponiveis = calcularModalidadesVagos(leitos, hospitalId);
    
    const nomeHospital = {
        'H1': 'Neomater',
        'H2': 'Cruz Azul',
        'H3': 'Santa Marcelina',
        'H4': 'Santa Clara',
        'H5': 'Adventista',
        'H6': 'Santa Cruz',
        'H7': 'Santa Virginia',
        'H8': 'Sao Camilo Ipiranga',
        'H9': 'Sao Camilo Pompeia'
    };
    
    return {
        nome: nomeHospital[hospitalId] || hospitalId,
        totalLeitos,
        contratuais,
        taxaOcupacao,
        ocupados: {
            total: ocupados.length,
            apartamento: ocupadosApto,
            enf_feminina: ocupadosEnfFem,
            enf_masculina: ocupadosEnfMasc,
            modalidade: modalidadeOcupados
        },
        // V7.0: Novo objeto de reservados
        reservados: {
            total: reservas.length,
            apartamento: reservadosApto,
            enf_feminina: reservadosEnfFem,
            enf_masculina: reservadosEnfMasc
        },
        previsao: {
            total: previsaoAlta.length,
            apartamento: previsaoApto,
            enf_feminina: previsaoEnfFem,
            enf_masculina: previsaoEnfMasc,
            modalidade: modalidadePrevisao
        },
        disponiveis: {
            // V7.0: Disponiveis = Contratuais - Ocupados - Reservados
            total: Math.max(contratuais - ocupados.length - reservas.length, 0),
            apartamento: vagosAptoFinal,
            enf_feminina: vagosEnfFemFinal,
            enf_masculina: vagosEnfMascFinal,
            modalidade: modalidadeDisponiveis
        },
        tph: {
            medio: tphMedio,
            lista: leitosMais5Diarias
        },
        pps: {
            medio: ppsMedio,
            menor40: ppsMenor40
        },
        spict: {
            elegiveis: spictElegiveis.length,
            diretivas: diretivasPendentes.length,
            listaDiretivas: diretivasPendentes
        }
    };
};

// =================== FUNCOES DE GAUGE E MODALIDADE ===================
function calcularGaugeOffset_Hosp(porcentagem) {
    const circunferencia = Math.PI * 55;
    const progresso = (porcentagem / 100) * circunferencia;
    return circunferencia - progresso;
}

function renderGaugeV5_Hosp(porcentagem, cor, numero) {
    const offset = calcularGaugeOffset_Hosp(porcentagem);
    const badgeClass = 'blue';
    cor = CORES_ARCHIPELAGO.azulPrincipal; 
    
    return '\
        <div class="v5-gauge-container">\
            <div style="position: relative;">\
                <svg class="v5-gauge" viewBox="0 0 140 80">\
                    <path d="M 15 70 A 55 55 0 0 1 125 70" \
                          fill="none" \
                          stroke="rgba(255,255,255,0.1)" \
                          stroke-width="14" \
                          stroke-linecap="round"/>\
                    <path d="M 15 70 A 55 55 0 0 1 125 70" \
                          fill="none" \
                          stroke="' + cor + '" \
                          stroke-width="14" \
                          stroke-linecap="round"\
                          stroke-dasharray="172.8"\
                          stroke-dashoffset="' + offset + '"/>\
                </svg>\
                <div class="v5-number-inside">' + numero.toString().padStart(2, '0') + '</div>\
            </div>\
            <div class="v5-badge-below ' + badgeClass + '">' + porcentagem.toFixed(0) + '%</div>\
        </div>\
    ';
}

// V7.0: Gauge especifico para reservados (cor amarela)
function renderGaugeReservados_Hosp(porcentagem, numero) {
    const offset = calcularGaugeOffset_Hosp(porcentagem);
    const cor = CORES_ARCHIPELAGO.reservados;
    
    return '\
        <div class="v5-gauge-container">\
            <div style="position: relative;">\
                <svg class="v5-gauge" viewBox="0 0 140 80">\
                    <path d="M 15 70 A 55 55 0 0 1 125 70" \
                          fill="none" \
                          stroke="rgba(255,255,255,0.1)" \
                          stroke-width="14" \
                          stroke-linecap="round"/>\
                    <path d="M 15 70 A 55 55 0 0 1 125 70" \
                          fill="none" \
                          stroke="' + cor + '" \
                          stroke-width="14" \
                          stroke-linecap="round"\
                          stroke-dasharray="172.8"\
                          stroke-dashoffset="' + offset + '"/>\
                </svg>\
                <div class="v5-number-inside">' + numero.toString().padStart(2, '0') + '</div>\
            </div>\
            <div class="v5-badge-below reservados">' + porcentagem.toFixed(0) + '%</div>\
        </div>\
    ';
}

function renderModalidadeContratual_Hosp(modalidade) {
    return '\
        <div class="lista-simples-compacta">\
            <div class="lista-item-compacto">\
                <span class="label">Flexiveis Quanto ao Plano</span>\
                <span class="valor">' + (modalidade.flexiveis || 0) + '</span>\
            </div>\
            <div class="lista-item-compacto">\
                <span class="label">Exclusivamente Apartamentos</span>\
                <span class="valor">' + (modalidade.exclusivo_apto || 0) + '</span>\
            </div>\
            <div class="lista-item-compacto">\
                <span class="label">Exclus. Enf Sem Restricao</span>\
                <span class="valor">' + (modalidade.exclusivo_enf_sem_restricao || 0) + '</span>\
            </div>\
            <div class="lista-item-compacto">\
                <span class="label">Exclus. Enf Feminina</span>\
                <span class="valor">' + (modalidade.exclusivo_enf_fem || 0) + '</span>\
            </div>\
            <div class="lista-item-compacto">\
                <span class="label">Exclus. Enf Masculina</span>\
                <span class="valor">' + (modalidade.exclusivo_enf_masc || 0) + '</span>\
            </div>\
        </div>\
    ';
}

function renderMiniGaugeTPH_Hosp(dias) {
    const diasNum = typeof dias === 'string' ? parseFloat(dias) : dias;
    
    const maxDias = 10;
    const porcentagem = (diasNum / maxDias) * 100;
    
    let corClass = 'green';
    if (diasNum >= 9) corClass = 'red';
    else if (diasNum >= 6) corClass = 'yellow';
    
    const totalBlocos = 20;
    const blocosCheios = Math.round((diasNum / maxDias) * totalBlocos);
    
    let blocos = '';
    for (let i = 0; i < totalBlocos; i++) {
        blocos += '<div class="tph-gauge-block ' + (i < blocosCheios ? 'filled' : 'empty') + '"></div>';
    }
    
    return '\
        <div class="tph-mini-gauge">\
            <div class="tph-gauge-bar ' + corClass + '">\
                ' + blocos + '\
            </div>\
        </div>\
    ';
}

// =================== RENDER DASHBOARD ENFERMARIAS V7.0 ===================
window.renderDashboardHospitalar = function() {
    console.log('Renderizando Dashboard Enfermarias V7.0...');
    
    const container = document.getElementById('dashHospitalarContent');
    if (!container) {
        console.warn('Container dashHospitalarContent nao encontrado');
        return;
    }
    
    if (!window.hospitalData) {
        container.innerHTML = '\
            <div style="text-align: center; padding: 50px; color: white;">\
                <p>Carregando dados...</p>\
            </div>\
        ';
        return;
    }
    
    const ordemAlfabetica = ['H5', 'H2', 'H1', 'H4', 'H3', 'H6', 'H7', 'H8', 'H9'];
    
    const hospitaisComDados = ordemAlfabetica.filter(hospitalId => {
        const hospital = window.hospitalData[hospitalId];
        if (!hospital || !hospital.leitos) return false;
        // V7.0: Filtrar UTI antes de verificar
        const leitosSemUTI = filtrarLeitosSemUTI(hospital.leitos);
        return leitosSemUTI.some(l => isOcupado(l) || isVago(l));
    });
    
    if (hospitaisComDados.length === 0) {
        container.innerHTML = '\
            <div style="text-align: center; padding: 50px; color: white; background: ' + CORES_ARCHIPELAGO.azulMarinhoEscuro + '; border-radius: 12px;">\
                <h3 style="color: ' + CORES_ARCHIPELAGO.amarelo + '; margin-bottom: 15px;">Nenhum Dado Hospitalar Disponivel</h3>\
                <p style="color: ' + CORES_ARCHIPELAGO.cinzaMedio + '; margin-bottom: 20px;">Aguardando dados reais da planilha Google.</p>\
                <button onclick="window.forceDataRefresh()" style="background: ' + CORES_ARCHIPELAGO.azulPrincipal + '; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px;">\
                    Recarregar Dados Reais\
                </button>\
            </div>\
        ';
        return;
    }
    
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    container.innerHTML = '\
        <div class="dashboard-hospitalar-wrapper" style="background: linear-gradient(135deg, ' + CORES_ARCHIPELAGO.azulMarinhoEscuro + ' 0%, ' + CORES_ARCHIPELAGO.azulEscuro + ' 100%); min-height: 100vh; padding: 20px; color: white; font-family: \'Poppins\', sans-serif;">\
            \
            <!-- HEADER COM FILTRO -->\
            <div class="dashboard-header-filtro">\
                <h2 class="dashboard-title-central">Dashboard Enfermarias</h2>\
                \
                <!-- DROPDOWN COM TODOS OS HOSPITAIS -->\
                <div class="hospital-filter-selector">\
                    <select id="hospitalFilterDropdown" class="hospital-filter-select" onchange="window.filtrarHospitalDashboard(this.value)">\
                        <option value="todos" selected>Todos</option>\
                        <option value="H5">Adventista</option>\
                        <option value="H2">Cruz Azul</option>\
                        <option value="H1">Neomater</option>\
                        <option value="H4">Santa Clara</option>\
                        <option value="H6">Santa Cruz</option>\
                        <option value="H3">Santa Marcelina</option>\
                        <option value="H7">Santa Virginia</option>\
                        <option value="H8">Sao Camilo Ipiranga</option>\
                        <option value="H9">Sao Camilo Pompeia</option>\
                    </select>\
                </div>\
                \
                <button onclick="window.copiarDashboardParaWhatsApp()" class="btn-whatsapp-dashboard">\
                    Relatorio Via WhatsApp\
                </button>\
            </div>\
            \
            <div class="hospitais-container">\
                ' + hospitaisComDados.map(hospitalId => renderHospitalSection(hospitalId, hoje)).join('') + '\
            </div>\
        </div>\
        \
        ' + getHospitalConsolidadoCSS() + '\
    ';
    
    const aguardarChartJS = () => {
        if (typeof Chart === 'undefined') {
            setTimeout(aguardarChartJS, 100);
            return;
        }
        
        setTimeout(() => {
            hospitaisComDados.forEach(hospitalId => {
                renderAltasHospital(hospitalId);
                renderConcessoesHospital(hospitalId);
                if (CONFIG_DASHBOARD.MOSTRAR_LINHAS_CUIDADO) {
                    renderLinhasHospital(hospitalId);
                }
            });
            
            console.log('Dashboard Enfermarias renderizado com sucesso!');
        }, 100);
    };
    
    aguardarChartJS();
};

// =================== V7.0: RENDER HOSPITAL SECTION (COM BOX RESERVADOS) ===================
function renderHospitalSection(hospitalId, hoje) {
    const dados = window.processarDadosHospital(hospitalId);
    
    if (!dados || !dados.tph || !dados.pps || !dados.spict) {
        console.error('Dados invalidos para ' + hospitalId);
        return '';
    }
    
    // V7.0: Calcular porcentagem de reservados
    const porcentagemReservados = dados.contratuais > 0 ? (dados.reservados.total / dados.contratuais * 100) : 0;
    
    return '\
        <div class="hospital-card" data-hospital="' + hospitalId + '">\
            <div class="hospital-header">\
                <h3 class="hospital-title">' + dados.nome + '</h3>\
            </div>\
            \
            <div class="kpis-grid">\
                <div class="kpi-box box-ocupados">\
                    <div class="kpi-title">Leitos Ocupados</div>\
                    \
                    <div class="kpi-content">\
                        ' + renderGaugeV5_Hosp(dados.taxaOcupacao, CORES_ARCHIPELAGO.ocupados, dados.ocupados.total) + '\
                        \
                        <div class="kpi-items-lista">\
                            <div class="kpi-subtitle">Total por Tipo de Leito</div>\
                            <div class="item-lista">\
                                <span class="label">Apartamento</span>\
                                <span class="valor">' + dados.ocupados.apartamento + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Feminina</span>\
                                <span class="valor">' + dados.ocupados.enf_feminina + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Masculina</span>\
                                <span class="valor">' + dados.ocupados.enf_masculina + '</span>\
                            </div>\
                        </div>\
                    </div>\
                    \
                    <div class="kpi-detalhes">\
                        <div class="detalhe-titulo">Total por Modalidade Contratual</div>\
                        ' + renderModalidadeContratual_Hosp(dados.ocupados.modalidade) + '\
                    </div>\
                </div>\
\
                <!-- V7.0: NOVO BOX DE RESERVADOS -->\
                <div class="kpi-box box-reservados">\
                    <div class="kpi-title">Leitos Reservados</div>\
                    \
                    <div class="kpi-content">\
                        ' + renderGaugeReservados_Hosp(porcentagemReservados, dados.reservados.total) + '\
                        \
                        <div class="kpi-items-lista">\
                            <div class="kpi-subtitle">Total por Tipo de Leito</div>\
                            <div class="item-lista">\
                                <span class="label">Apartamento</span>\
                                <span class="valor">' + dados.reservados.apartamento + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Feminina</span>\
                                <span class="valor">' + dados.reservados.enf_feminina + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Masculina</span>\
                                <span class="valor">' + dados.reservados.enf_masculina + '</span>\
                            </div>\
                        </div>\
                    </div>\
                    \
                    <div class="kpi-detalhes">\
                        <div class="detalhe-titulo">Aguardando Admissao</div>\
                        <div class="lista-simples-compacta">\
                            <div class="lista-item-compacto">\
                                <span class="label">Total Reservados</span>\
                                <span class="valor">' + dados.reservados.total + '</span>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
\
                <div class="kpi-box box-previsao">\
                    <div class="kpi-title">Leitos em Previsao de Alta</div>\
                    \
                    <div class="kpi-content">\
                        ' + renderGaugeV5_Hosp((dados.previsao.total / dados.ocupados.total * 100) || 0, CORES_ARCHIPELAGO.previsao, dados.previsao.total) + '\
                        \
                        <div class="kpi-items-lista">\
                            <div class="kpi-subtitle">Total por Tipo de Leito</div>\
                            <div class="item-lista">\
                                <span class="label">Apartamento</span>\
                                <span class="valor">' + dados.previsao.apartamento + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Feminina</span>\
                                <span class="valor">' + dados.previsao.enf_feminina + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Masculina</span>\
                                <span class="valor">' + dados.previsao.enf_masculina + '</span>\
                            </div>\
                        </div>\
                    </div>\
                    \
                    <div class="kpi-detalhes">\
                        <div class="detalhe-titulo">Total por Modalidade Contratual</div>\
                        ' + renderModalidadeContratual_Hosp(dados.previsao.modalidade) + '\
                    </div>\
                </div>\
\
                <div class="kpi-box box-disponiveis">\
                    <div class="kpi-title">Leitos Disponiveis</div>\
                    \
                    <div class="kpi-content">\
                        ' + renderGaugeV5_Hosp((dados.disponiveis.total / dados.contratuais * 100) || 0, CORES_ARCHIPELAGO.disponiveis, dados.disponiveis.total) + '\
                        \
                        <div class="kpi-items-lista">\
                            <div class="kpi-subtitle">Capacidade Total por Tipo de Leito (nao Simultaneo)</div>\
                            <div class="item-lista">\
                                <span class="label">Apartamento</span>\
                                <span class="valor">ate ' + dados.disponiveis.apartamento + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Feminina</span>\
                                <span class="valor">ate ' + dados.disponiveis.enf_feminina + '</span>\
                            </div>\
                            <div class="item-lista">\
                                <span class="label">Enfermaria Masculina</span>\
                                <span class="valor">ate ' + dados.disponiveis.enf_masculina + '</span>\
                            </div>\
                        </div>\
                    </div>\
                    \
                    <div class="kpi-detalhes">\
                        <div class="detalhe-titulo">Total por Modalidade Contratual</div>\
                        ' + renderModalidadeContratual_Hosp(dados.disponiveis.modalidade) + '\
                    </div>\
                </div>\
\
                <div class="kpi-box box-tph">\
                    <div class="kpi-title">TPH Medio</div>\
                    \
                    <div class="kpi-tph-container">\
                        <div class="kpi-tph-numero">' + dados.tph.medio + '</div>\
                        <div class="kpi-tph-label">Dias</div>\
                        ' + renderMiniGaugeTPH_Hosp(dados.tph.medio) + '\
                    </div>\
                    \
                    <div class="kpi-detalhes">\
                        <div class="detalhe-titulo">N Diarias > 5</div>\
                        ' + (dados.tph.lista && dados.tph.lista.length > 0 ? '\
                            <table class="hospitais-table">\
                                <thead>\
                                    <tr>\
                                        <th style="text-align: left !important;">Leito</th>\
                                        <th style="text-align: center !important;">Matricula</th>\
                                        <th style="text-align: right !important;">Dias</th>\
                                    </tr>\
                                </thead>\
                                <tbody>\
                                    ' + dados.tph.lista.map(function(l) { return '\
                                        <tr>\
                                            <td style="text-align: left !important;">' + l.leito + '</td>\
                                            <td style="text-align: center !important;">' + l.matricula + '</td>\
                                            <td style="text-align: right !important;">' + l.dias + '</td>\
                                        </tr>\
                                    '; }).join('') + '\
                                </tbody>\
                            </table>\
                        ' : '<div class="sem-dados">Nenhum Leito com Mais de 5 Diarias</div>') + '\
                    </div>\
                </div>\
\
                <div class="kpi-box box-pps">\
                    <div class="kpi-title">PPS</div>\
                    \
                    <div class="kpi-valores-duplos-divididos">\
                        <div class="kpi-valor-metade">\
                            <div class="valor">' + dados.pps.medio + '</div>\
                            <div class="label">PPS Medio</div>\
                        </div>\
                        <div class="divisor-vertical"></div>\
                        <div class="kpi-valor-metade">\
                            <div class="valor">' + (dados.pps.menor40 && dados.pps.menor40.length || 0).toString().padStart(2, '0') + '</div>\
                            <div class="label">PPS < 40%</div>\
                        </div>\
                    </div>\
                    \
                    <div class="kpi-detalhes">\
                        <div class="detalhe-titulo">PPS < 40%</div>\
                        ' + (dados.pps.menor40 && dados.pps.menor40.length > 0 ? '\
                            <table class="hospitais-table">\
                                <thead>\
                                    <tr>\
                                        <th style="text-align: left !important;">Leito</th>\
                                        <th style="text-align: right !important;">Matricula</th>\
                                    </tr>\
                                </thead>\
                                <tbody>\
                                    ' + dados.pps.menor40.map(function(l) { return '\
                                        <tr>\
                                            <td style="text-align: left !important;">' + l.leito + '</td>\
                                            <td style="text-align: right !important;">' + l.matricula + '</td>\
                                        </tr>\
                                    '; }).join('') + '\
                                </tbody>\
                            </table>\
                        ' : '<div class="sem-dados">Nenhum Leito com PPS < 40%</div>') + '\
                    </div>\
                </div>\
\
                <div class="kpi-box box-spict">\
                    <div class="kpi-title">SPICT-BR | Diretivas</div>\
                    \
                    <div class="kpi-valores-duplos-divididos">\
                        <div class="kpi-valor-metade">\
                            <div class="valor">' + dados.spict.elegiveis.toString().padStart(2, '0') + '</div>\
                            <div class="label">SPICT-BR</div>\
                        </div>\
                        <div class="divisor-vertical"></div>\
                        <div class="kpi-valor-metade">\
                            <div class="valor">' + dados.spict.diretivas.toString().padStart(2, '0') + '</div>\
                            <div class="label">Diretivas</div>\
                        </div>\
                    </div>\
                    \
                    <div class="kpi-detalhes">\
                        <div class="detalhe-titulo">Diretivas Pendentes</div>\
                        ' + (dados.spict.listaDiretivas && dados.spict.listaDiretivas.length > 0 ? '\
                            <table class="hospitais-table">\
                                <thead>\
                                    <tr>\
                                        <th style="text-align: left !important;">Leito</th>\
                                        <th style="text-align: right !important;">Matricula</th>\
                                    </tr>\
                                </thead>\
                                <tbody>\
                                    ' + dados.spict.listaDiretivas.map(function(l) { return '\
                                        <tr>\
                                            <td style="text-align: left !important;">' + l.leito + '</td>\
                                            <td style="text-align: right !important;">' + l.matricula + '</td>\
                                        </tr>\
                                    '; }).join('') + '\
                                </tbody>\
                            </table>\
                        ' : '<div class="sem-dados">Nenhuma Diretiva Pendente</div>') + '\
                    </div>\
                </div>\
            </div>\
            \
            <div class="graficos-verticais">\
                <div class="grafico-item">\
                    <div class="chart-header">\
                        <h4>Analise Preditiva de Altas em ' + hoje + '</h4>\
                    </div>\
                    <div class="chart-container">\
                        <canvas id="graficoAltas' + hospitalId + '"></canvas>\
                    </div>\
                </div>\
                \
                <div class="grafico-item">\
                    <div class="chart-header">\
                        <h4>Concessoes Previstas em ' + hoje + '</h4>\
                    </div>\
                    <div id="concessoesBoxes' + hospitalId + '" class="timeline-boxes-container"></div>\
                </div>\
                \
                ' + (CONFIG_DASHBOARD.MOSTRAR_LINHAS_CUIDADO ? '\
                <div class="grafico-item">\
                    <div class="chart-header">\
                        <h4>Linhas de Cuidado Previstas em ' + hoje + '</h4>\
                    </div>\
                    <div id="linhasBoxes' + hospitalId + '" class="timeline-boxes-container"></div>\
                </div>\
                ' : '') + '\
            </div>\
        </div>\
    ';
}

// =================== GRAFICOS (COM FILTRO UTI) ===================
const backgroundPlugin = {
    id: 'customBackground',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = window.fundoBranco ? '#ffffff' : 'transparent';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};

function renderAltasHospital(hospitalId) {
    const canvas = document.getElementById('graficoAltas' + hospitalId);
    if (!canvas || typeof Chart === 'undefined') return;
    
    const hospital = window.hospitalData[hospitalId];
    if (!hospital || !hospital.leitos) return;
    
    // V7.0: Filtrar UTI
    const leitos = filtrarLeitosSemUTI(hospital.leitos);
    
    const chartKey = 'altas' + hospitalId;
    if (window.chartInstances && window.chartInstances[chartKey]) {
        window.chartInstances[chartKey].destroy();
    }
    
    if (!window.chartInstances) window.chartInstances = {};
    
    const categorias = CONFIG_DASHBOARD.MOSTRAR_96H ? 
        ['HOJE', '24H', '48H', '72H', '96H'] : 
        ['HOJE', '24H', '48H', '72H'];
    
    const dados = {
        'Ouro': CONFIG_DASHBOARD.MOSTRAR_96H ? [0, 0, 0, 0, 0] : [0, 0, 0, 0],
        '2R': CONFIG_DASHBOARD.MOSTRAR_96H ? [0, 0, 0, 0, 0] : [0, 0, 0, 0],
        '3R': CONFIG_DASHBOARD.MOSTRAR_96H ? [0, 0, 0, 0, 0] : [0, 0, 0, 0],
        '48H': CONFIG_DASHBOARD.MOSTRAR_96H ? [0, 0, 0, 0, 0] : [0, 0, 0, 0],
        '72H': CONFIG_DASHBOARD.MOSTRAR_96H ? [0, 0, 0, 0, 0] : [0, 0, 0, 0],
        '96H': CONFIG_DASHBOARD.MOSTRAR_96H ? [0, 0, 0, 0, 0] : []
    };
    
    leitos.forEach(leito => {
        if (isOcupado(leito)) {
            const prevAlta = leito.prevAlta || (leito.paciente && leito.paciente.prevAlta);
            
            if (prevAlta) {
                const prev = normStr(prevAlta).replace(/\s+/g, ' ');
                
                let index = -1;
                let tipo = '';
                
                if (prev.includes('hoje') && prev.includes('ouro')) { index = 0; tipo = 'Ouro'; }
                else if (prev.includes('hoje') && prev.includes('2r')) { index = 0; tipo = '2R'; }
                else if (prev.includes('hoje') && prev.includes('3r')) { index = 0; tipo = '3R'; }
                else if ((prev.includes('24h') || prev.includes('24 h')) && prev.includes('ouro')) { index = 1; tipo = 'Ouro'; }
                else if ((prev.includes('24h') || prev.includes('24 h')) && prev.includes('2r')) { index = 1; tipo = '2R'; }
                else if ((prev.includes('24h') || prev.includes('24 h')) && prev.includes('3r')) { index = 1; tipo = '3R'; }
                else if (prev.includes('48h')) { index = 2; tipo = '48H'; }
                else if (prev.includes('72h')) { index = 3; tipo = '72H'; }
                else if (CONFIG_DASHBOARD.MOSTRAR_96H && prev.includes('96h')) { index = 4; tipo = '96H'; }
                
                if (index >= 0 && tipo && dados[tipo]) {
                    dados[tipo][index]++;
                }
            }
        }
    });
    
    const corTexto = window.fundoBranco ? CORES_ARCHIPELAGO.cinzaEscuro : '#ffffff';
    const corGrid = window.fundoBranco ? 'rgba(60, 58, 62, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    const ctx = canvas.getContext('2d');
    
    const dadosSimplificados = CONFIG_DASHBOARD.MOSTRAR_96H ? [
        dados['Ouro'][0] + dados['2R'][0] + dados['3R'][0],
        dados['Ouro'][1] + dados['2R'][1] + dados['3R'][1],
        dados['48H'][2],
        dados['72H'][3],
        dados['96H'][4]
    ] : [
        dados['Ouro'][0] + dados['2R'][0] + dados['3R'][0],
        dados['Ouro'][1] + dados['2R'][1] + dados['3R'][1],
        dados['48H'][2],
        dados['72H'][3]
    ];
    
    const valorMaximo = Math.max.apply(null, dadosSimplificados.concat([0]));
    const limiteSuperior = valorMaximo + 1;
    
    window.chartInstances[chartKey] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categorias,
            datasets: [{
                label: 'Previsao de Alta',
                data: dadosSimplificados,
                backgroundColor: CORES_ARCHIPELAGO.azulPrincipal,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
            plugins: {
                legend: { 
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(19, 27, 46, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    titleFont: { family: 'Poppins', size: 13, weight: 600 },
                    bodyFont: { family: 'Poppins', size: 12 },
                    callbacks: {
                        label: function(context) {
                            return 'Beneficiarios: ' + context.parsed.x;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: limiteSuperior,
                    min: 0,
                    title: {
                        display: true,
                        text: 'Beneficiarios',
                        color: corTexto,
                        font: { family: 'Poppins', size: 13, weight: 600 }
                    },
                    grid: {
                        color: corGrid,
                        drawBorder: false
                    },
                    ticks: {
                        color: corTexto,
                        font: { family: 'Poppins', size: 12 },
                        stepSize: 1,
                        precision: 0
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: corTexto,
                        font: { family: 'Poppins', size: 13, weight: 600 }
                    }
                }
            }
        },
        plugins: [backgroundPlugin]
    });
}

// =================== RENDER CONCESSOES HOSPITAL (COM FILTRO UTI) ===================
function renderConcessoesHospital(hospitalId) {
    const container = document.getElementById('concessoesBoxes' + hospitalId);
    if (!container) return;
    
    const hospital = window.hospitalData[hospitalId];
    if (!hospital || !hospital.leitos) return;
    
    // V7.0: Filtrar UTI
    const leitos = filtrarLeitosSemUTI(hospital.leitos);
    
    const concessoesTimeline = {
        'HOJE': {},
        '24H': {},
        '48H': {}
    };
    
    leitos.forEach(leito => {
        if (isOcupado(leito)) {
            const concessoes = leito.concessoes || (leito.paciente && leito.paciente.concessoes);
            const prevAlta = leito.prevAlta || (leito.paciente && leito.paciente.prevAlta);
            const matricula = leito.matricula || 'S/N';
            
            if (concessoes && prevAlta) {
                const concessoesList = Array.isArray(concessoes) ? 
                    concessoes : 
                    String(concessoes).split('|');
                
                const prev = normStr(prevAlta).replace(/\s+/g, ' ');
                let timeline = null;
                
                if (prev.includes('hoje')) timeline = 'HOJE';
                else if (prev.includes('24h') || prev.includes('24 h')) timeline = '24H';
                else if (prev.includes('48h')) timeline = '48H';
                
                if (timeline) {
                    concessoesList.forEach(concessao => {
                        if (concessao && concessao.trim()) {
                            const nome = desnormalizarTexto(concessao.trim());
                            if (!concessoesTimeline[timeline][nome]) {
                                concessoesTimeline[timeline][nome] = [];
                            }
                            concessoesTimeline[timeline][nome].push(matricula);
                        }
                    });
                }
            }
        }
    });
    
    const periodos = ['HOJE', '24H', '48H'];
    
    container.innerHTML = '\
        <div class="timeline-boxes-grid">\
            ' + periodos.map(function(periodo) {
                const concessoes = concessoesTimeline[periodo];
                const total = Object.values(concessoes).reduce(function(sum, arr) { return sum + arr.length; }, 0);
                
                return '\
                    <div class="timeline-box">\
                        <div class="timeline-box-header">' + periodo + ' (' + total + ')</div>\
                        <div class="timeline-box-content">\
                            ' + (Object.keys(concessoes).length > 0 ? 
                                Object.entries(concessoes).map(function(entry) {
                                    var nome = entry[0];
                                    var mats = entry[1];
                                    var cor = getCorExata(nome, 'concessao');
                                    return '\
                                        <div class="timeline-item" style="border-left-color: ' + cor + ';">\
                                            <div class="timeline-item-name">' + nome + ' (' + mats.length + ')</div>\
                                            <div class="timeline-item-mats">' + mats.join(', ') + '</div>\
                                        </div>\
                                    ';
                                }).join('') : 
                                '<div class="sem-dados">Nenhuma concessao prevista</div>') + '\
                        </div>\
                    </div>\
                ';
            }).join('') + '\
        </div>\
    ';
}

// =================== RENDER LINHAS HOSPITAL (COM FILTRO UTI) ===================
function renderLinhasHospital(hospitalId) {
    const container = document.getElementById('linhasBoxes' + hospitalId);
    if (!container) return;
    
    const hospital = window.hospitalData[hospitalId];
    if (!hospital || !hospital.leitos) return;
    
    // V7.0: Filtrar UTI
    const leitos = filtrarLeitosSemUTI(hospital.leitos);
    
    const linhasTimeline = {
        'HOJE': {},
        '24H': {},
        '48H': {}
    };
    
    leitos.forEach(leito => {
        if (isOcupado(leito)) {
            const linhas = leito.linhasCuidado || (leito.paciente && leito.paciente.linhasCuidado);
            const prevAlta = leito.prevAlta || (leito.paciente && leito.paciente.prevAlta);
            const matricula = leito.matricula || 'S/N';
            
            if (linhas && prevAlta) {
                const linhasList = Array.isArray(linhas) ? 
                    linhas : 
                    String(linhas).split('|');
                
                const prev = normStr(prevAlta).replace(/\s+/g, ' ');
                let timeline = null;
                
                if (prev.includes('hoje')) timeline = 'HOJE';
                else if (prev.includes('24h') || prev.includes('24 h')) timeline = '24H';
                else if (prev.includes('48h')) timeline = '48H';
                
                if (timeline) {
                    linhasList.forEach(linha => {
                        if (linha && linha.trim()) {
                            const nome = desnormalizarTexto(linha.trim());
                            if (!linhasTimeline[timeline][nome]) {
                                linhasTimeline[timeline][nome] = [];
                            }
                            linhasTimeline[timeline][nome].push(matricula);
                        }
                    });
                }
            }
        }
    });
    
    const periodos = ['HOJE', '24H', '48H'];
    
    container.innerHTML = '\
        <div class="timeline-boxes-grid">\
            ' + periodos.map(function(periodo) {
                const linhas = linhasTimeline[periodo];
                const total = Object.values(linhas).reduce(function(sum, arr) { return sum + arr.length; }, 0);
                
                return '\
                    <div class="timeline-box">\
                        <div class="timeline-box-header">' + periodo + ' (' + total + ')</div>\
                        <div class="timeline-box-content">\
                            ' + (Object.keys(linhas).length > 0 ? 
                                Object.entries(linhas).map(function(entry) {
                                    var nome = entry[0];
                                    var mats = entry[1];
                                    var cor = getCorExata(nome, 'linha');
                                    return '\
                                        <div class="timeline-item" style="border-left-color: ' + cor + ';">\
                                            <div class="timeline-item-name">' + nome + ' (' + mats.length + ')</div>\
                                            <div class="timeline-item-mats">' + mats.join(', ') + '</div>\
                                        </div>\
                                    ';
                                }).join('') : 
                                '<div class="sem-dados">Nenhuma linha de cuidado prevista</div>') + '\
                        </div>\
                    </div>\
                ';
            }).join('') + '\
        </div>\
    ';
}

// =================== CSS DO DASHBOARD ENFERMARIAS V7.0 ===================
function getHospitalConsolidadoCSS() {
    return '\
        <style>\
            @keyframes fadeIn {\
                from { opacity: 0; transform: translateY(10px); }\
                to { opacity: 1; transform: translateY(0); }\
            }\
            \
            .dashboard-hospitalar-wrapper {\
                max-width: 1600px;\
                margin: 0 auto;\
            }\
            \
            .dashboard-header-filtro {\
                display: flex;\
                flex-direction: column;\
                align-items: center;\
                gap: 20px;\
                margin-bottom: 30px;\
                padding: 20px;\
            }\
            \
            .dashboard-title-central {\
                font-size: 28px;\
                font-weight: 700;\
                color: #ffffff;\
                margin: 0;\
                text-align: center;\
                letter-spacing: 0.5px;\
                text-transform: none !important;\
            }\
            \
            .hospital-filter-selector {\
                display: flex;\
                justify-content: center;\
                width: 100%;\
                max-width: 400px;\
            }\
            \
            .hospital-filter-select {\
                width: 100%;\
                min-width: 280px;\
                max-width: 400px;\
                padding: 14px 20px;\
                font-size: 15px;\
                font-weight: 600;\
                color: #ffffff;\
                background: ' + CORES_ARCHIPELAGO.azulEscuro + ';\
                border: 2px solid ' + CORES_ARCHIPELAGO.azulPrincipal + ';\
                border-radius: 10px;\
                cursor: pointer;\
                appearance: none;\
                -webkit-appearance: none;\
                -moz-appearance: none;\
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2360a5fa\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e");\
                background-repeat: no-repeat;\
                background-position: right 15px center;\
                background-size: 20px;\
                transition: all 0.3s ease;\
                font-family: \'Poppins\', sans-serif;\
            }\
            \
            .hospital-filter-select:hover {\
                border-color: #93c5fd;\
                background-color: rgba(96, 165, 250, 0.1);\
            }\
            \
            .hospital-filter-select:focus {\
                outline: none;\
                border-color: #93c5fd;\
                box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);\
            }\
            \
            .hospital-filter-select option {\
                background: ' + CORES_ARCHIPELAGO.azulMarinhoEscuro + ';\
                color: #ffffff;\
                padding: 12px;\
            }\
            \
            .btn-whatsapp-dashboard {\
                background: linear-gradient(135deg, #25d366, #128c7e);\
                color: white;\
                border: none;\
                padding: 14px 28px;\
                border-radius: 10px;\
                font-size: 14px;\
                font-weight: 600;\
                cursor: pointer;\
                transition: all 0.3s ease;\
                font-family: \'Poppins\', sans-serif;\
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);\
            }\
            \
            .btn-whatsapp-dashboard:hover {\
                transform: translateY(-2px);\
                box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);\
            }\
            \
            .hospitais-container {\
                display: flex;\
                flex-direction: column;\
                gap: 40px;\
            }\
            \
            .hospital-card {\
                background: rgba(255, 255, 255, 0.03);\
                border-radius: 16px;\
                padding: 25px;\
                border: 1px solid rgba(255, 255, 255, 0.08);\
                animation: fadeIn 0.4s ease;\
            }\
            \
            .hospital-header {\
                margin-bottom: 25px;\
                padding-bottom: 15px;\
                border-bottom: 2px solid ' + CORES_ARCHIPELAGO.azulPrincipal + ';\
            }\
            \
            .hospital-title {\
                font-size: 22px;\
                font-weight: 700;\
                color: ' + CORES_ARCHIPELAGO.azulPrincipal + ';\
                margin: 0;\
                text-transform: none !important;\
            }\
            \
            .kpis-grid {\
                display: grid;\
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\
                gap: 20px;\
                margin-bottom: 30px;\
            }\
            \
            .kpi-box {\
                background: rgba(255, 255, 255, 0.05);\
                border-radius: 12px;\
                padding: 20px;\
                border: 1px solid rgba(255, 255, 255, 0.1);\
                min-height: 280px;\
                display: flex;\
                flex-direction: column;\
            }\
            \
            .kpi-title {\
                font-size: 14px;\
                font-weight: 700;\
                color: ' + CORES_ARCHIPELAGO.azulPrincipal + ';\
                margin-bottom: 15px;\
                text-align: center;\
                letter-spacing: 0.5px;\
                text-transform: none !important;\
            }\
            \
            /* V7.0: Estilo especifico para box-reservados */\
            .box-reservados .kpi-title {\
                color: ' + CORES_ARCHIPELAGO.reservados + ';\
            }\
            \
            .box-reservados .v5-badge-below.reservados {\
                background: ' + CORES_ARCHIPELAGO.reservados + ';\
                color: ' + CORES_ARCHIPELAGO.azulMarinhoEscuro + ';\
            }\
            \
            .kpi-content {\
                display: flex;\
                align-items: flex-start;\
                gap: 20px;\
                margin-bottom: 15px;\
            }\
            \
            .v5-gauge-container {\
                display: flex;\
                flex-direction: column;\
                align-items: center;\
                min-width: 100px;\
            }\
            \
            .v5-gauge {\
                width: 100px;\
                height: 60px;\
            }\
            \
            .v5-number-inside {\
                position: absolute;\
                bottom: 5px;\
                left: 50%;\
                transform: translateX(-50%);\
                font-size: 28px;\
                font-weight: 800;\
                color: #ffffff;\
            }\
            \
            .v5-badge-below {\
                margin-top: 8px;\
                padding: 4px 12px;\
                border-radius: 12px;\
                font-size: 12px;\
                font-weight: 700;\
            }\
            \
            .v5-badge-below.blue {\
                background: ' + CORES_ARCHIPELAGO.azulPrincipal + ';\
                color: ' + CORES_ARCHIPELAGO.azulMarinhoEscuro + ';\
            }\
            \
            .kpi-items-lista {\
                flex: 1;\
            }\
            \
            .kpi-subtitle {\
                font-size: 11px;\
                color: ' + CORES_ARCHIPELAGO.cinzaMedio + ';\
                margin-bottom: 10px;\
                text-transform: none !important;\
            }\
            \
            .item-lista {\
                display: flex;\
                justify-content: space-between;\
                padding: 6px 0;\
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);\
            }\
            \
            .item-lista .label {\
                color: ' + CORES_ARCHIPELAGO.cinzaClaro + ';\
                font-size: 12px;\
            }\
            \
            .item-lista .valor {\
                color: #ffffff;\
                font-weight: 600;\
                font-size: 13px;\
            }\
            \
            .kpi-detalhes {\
                margin-top: auto;\
                padding-top: 15px;\
                border-top: 1px solid rgba(255, 255, 255, 0.1);\
            }\
            \
            .detalhe-titulo {\
                font-size: 11px;\
                color: ' + CORES_ARCHIPELAGO.cinzaMedio + ';\
                margin-bottom: 10px;\
                text-transform: none !important;\
            }\
            \
            .lista-simples-compacta {\
                display: flex;\
                flex-direction: column;\
                gap: 4px;\
            }\
            \
            .lista-item-compacto {\
                display: flex;\
                justify-content: space-between;\
                font-size: 11px;\
            }\
            \
            .lista-item-compacto .label {\
                color: ' + CORES_ARCHIPELAGO.azulClaro + ';\
            }\
            \
            .lista-item-compacto .valor {\
                color: #ffffff;\
                font-weight: 600;\
            }\
            \
            .kpi-tph-container {\
                text-align: center;\
                padding: 20px 0;\
            }\
            \
            .kpi-tph-numero {\
                font-size: 48px;\
                font-weight: 800;\
                color: #ffffff;\
                line-height: 1;\
            }\
            \
            .kpi-tph-label {\
                font-size: 14px;\
                color: ' + CORES_ARCHIPELAGO.cinzaMedio + ';\
                margin-top: 5px;\
            }\
            \
            .tph-mini-gauge {\
                margin-top: 15px;\
            }\
            \
            .tph-gauge-bar {\
                display: flex;\
                gap: 2px;\
                justify-content: center;\
            }\
            \
            .tph-gauge-block {\
                width: 8px;\
                height: 20px;\
                border-radius: 2px;\
                background: rgba(255, 255, 255, 0.1);\
            }\
            \
            .tph-gauge-bar.green .tph-gauge-block.filled {\
                background: ' + CORES_ARCHIPELAGO.verde + ';\
            }\
            \
            .tph-gauge-bar.yellow .tph-gauge-block.filled {\
                background: ' + CORES_ARCHIPELAGO.amarelo + ';\
            }\
            \
            .tph-gauge-bar.red .tph-gauge-block.filled {\
                background: #ef4444;\
            }\
            \
            .kpi-valores-duplos-divididos {\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                gap: 20px;\
                padding: 20px 0;\
            }\
            \
            .kpi-valor-metade {\
                text-align: center;\
                flex: 1;\
            }\
            \
            .kpi-valor-metade .valor {\
                font-size: 36px;\
                font-weight: 800;\
                color: #ffffff;\
            }\
            \
            .kpi-valor-metade .label {\
                font-size: 12px;\
                color: ' + CORES_ARCHIPELAGO.cinzaMedio + ';\
                margin-top: 5px;\
            }\
            \
            .divisor-vertical {\
                width: 1px;\
                height: 60px;\
                background: rgba(255, 255, 255, 0.2);\
            }\
            \
            .hospitais-table {\
                width: 100%;\
                border-collapse: collapse;\
                font-size: 11px;\
            }\
            \
            .hospitais-table thead th {\
                color: ' + CORES_ARCHIPELAGO.azulPrincipal + ';\
                font-weight: 600;\
                padding: 8px 4px;\
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);\
                font-size: 10px;\
                text-transform: none !important;\
            }\
            \
            .hospitais-table tbody td {\
                color: #ffffff;\
                padding: 6px 4px;\
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);\
            }\
            \
            .box-tph .hospitais-table thead th:nth-child(1),\
            .box-tph .hospitais-table tbody td:nth-child(1) {\
                text-align: left !important;\
            }\
            .box-tph .hospitais-table thead th:nth-child(2),\
            .box-tph .hospitais-table tbody td:nth-child(2) {\
                text-align: center !important;\
            }\
            .box-tph .hospitais-table thead th:nth-child(3),\
            .box-tph .hospitais-table tbody td:nth-child(3) {\
                text-align: right !important;\
            }\
            \
            .box-pps .hospitais-table thead th:nth-child(1),\
            .box-pps .hospitais-table tbody td:nth-child(1),\
            .box-spict .hospitais-table thead th:nth-child(1),\
            .box-spict .hospitais-table tbody td:nth-child(1) {\
                text-align: left !important;\
            }\
            .box-pps .hospitais-table thead th:nth-child(2),\
            .box-pps .hospitais-table tbody td:nth-child(2),\
            .box-spict .hospitais-table thead th:nth-child(2),\
            .box-spict .hospitais-table tbody td:nth-child(2) {\
                text-align: right !important;\
            }\
            \
            .hospitais-table tbody tr:last-child td {\
                border-bottom: none;\
            }\
            \
            .hospitais-table tbody tr:hover {\
                background: rgba(255, 255, 255, 0.03);\
            }\
            \
            .sem-dados {\
                text-align: center;\
                padding: 15px;\
                color: ' + CORES_ARCHIPELAGO.azulAcinzentado + ';\
                font-style: italic;\
                font-size: 11px;\
                text-transform: none !important;\
            }\
            \
            .graficos-verticais {\
                display: flex;\
                flex-direction: column;\
                gap: 25px;\
                width: 100%;\
            }\
            \
            .grafico-item {\
                width: 100%;\
                background: rgba(255, 255, 255, 0.03);\
                border-radius: 12px;\
                padding: 20px;\
                border: 1px solid rgba(255, 255, 255, 0.8);\
                border-top: 3px solid #ffffff;\
                box-sizing: border-box;\
            }\
            \
            .chart-header {\
                display: flex;\
                justify-content: space-between;\
                align-items: center;\
                margin-bottom: 15px;\
                flex-wrap: wrap;\
                gap: 10px;\
            }\
            \
            .chart-header h4 {\
                margin: 0;\
                color: #e2e8f0;\
                font-size: 16px;\
                font-weight: 600;\
                letter-spacing: 0.5px;\
                text-align: center;\
                width: 100%;\
                text-transform: none !important;\
            }\
            \
            .chart-container {\
                position: relative;\
                height: 400px;\
                width: 100%;\
                background: rgba(156, 163, 175, 0.3);\
                border-radius: 8px;\
                padding: 15px;\
                box-sizing: border-box;\
            }\
            \
            .chart-container canvas {\
                width: 100% !important;\
                height: 100% !important;\
                max-height: 370px !important;\
            }\
            \
            .timeline-boxes-container {\
                width: 100%;\
                margin-top: 15px;\
            }\
            \
            .timeline-boxes-grid {\
                display: grid;\
                grid-template-columns: repeat(3, 1fr);\
                gap: 15px;\
                width: 100%;\
            }\
            \
            .timeline-box {\
                background: rgba(255, 255, 255, 0.05);\
                border-radius: 8px;\
                border: 1px solid rgba(255, 255, 255, 0.1);\
                overflow: hidden;\
                min-height: 400px;\
                display: flex;\
                flex-direction: column;\
            }\
            \
            .timeline-box-header {\
                background: rgba(96, 165, 250, 0.2);\
                padding: 12px;\
                text-align: center;\
                font-size: 14px;\
                font-weight: 700;\
                letter-spacing: 0.5px;\
                color: ' + CORES_ARCHIPELAGO.azulPrincipal + ';\
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);\
                text-transform: none !important;\
            }\
            \
            .timeline-chart-container {\
                height: 200px;\
                padding: 15px;\
                background: rgba(0, 0, 0, 0.1);\
                display: flex;\
                align-items: center;\
                justify-content: center;\
            }\
            \
            .timeline-chart {\
                max-height: 180px !important;\
            }\
            \
            .timeline-box-content {\
                padding: 12px;\
                flex: 1;\
                overflow-y: auto;\
                max-height: 250px;\
            }\
            \
            .timeline-item {\
                background: rgba(255, 255, 255, 0.03);\
                border-radius: 6px;\
                padding: 10px;\
                margin-bottom: 8px;\
                border-left: 3px solid;\
                transition: all 0.2s ease;\
            }\
            \
            .timeline-item:hover {\
                background: rgba(255, 255, 255, 0.07);\
                transform: translateX(2px);\
            }\
            \
            .timeline-item:last-child {\
                margin-bottom: 0;\
            }\
            \
            .timeline-item-name {\
                font-size: 13px;\
                font-weight: 600;\
                margin-bottom: 6px;\
                color: #ffffff;\
                text-transform: none !important;\
            }\
            \
            .timeline-item-mats {\
                font-size: 11px;\
                color: #ffffff;\
                line-height: 1.4;\
            }\
            \
            /* =================== RESPONSIVIDADE MOBILE =================== */\
            @media (max-width: 768px) {\
                .hospital-filter-selector {\
                    padding: 0 10px;\
                }\
                \
                .hospital-filter-select {\
                    width: 100%;\
                    min-width: auto;\
                    max-width: 100%;\
                    padding: 12px 16px;\
                    font-size: 14px;\
                }\
                \
                .dashboard-title-central {\
                    font-size: 20px !important;\
                }\
                \
                .btn-whatsapp-dashboard {\
                    width: 100%;\
                }\
                \
                .kpis-grid {\
                    grid-template-columns: 1fr;\
                    padding: 0 10px !important;\
                    margin: 0 auto !important;\
                }\
                \
                .kpi-box {\
                    margin-left: auto !important;\
                    margin-right: auto !important;\
                    max-width: 100% !important;\
                }\
                \
                .hospital-card {\
                    padding: 15px !important;\
                    margin: 0 auto 20px auto !important;\
                    max-width: calc(100vw - 20px) !important;\
                }\
                \
                .timeline-boxes-grid {\
                    grid-template-columns: 1fr;\
                }\
                \
                .dashboard-hospitalar-wrapper {\
                    padding: 10px !important;\
                }\
                \
                .hospitais-container {\
                    padding: 0 !important;\
                }\
            }\
        </style>\
    ';
}

// =================== ALIASES E EXPORTS V7.0 ===================
window.renderizarDashboard = window.renderDashboardHospitalar;
window.renderDashboard = window.renderDashboardHospitalar;

// V7.0: Exportar funcoes de reservas
window.getReservasHospital = getReservasHospital;
window.filtrarLeitosSemUTI = filtrarLeitosSemUTI;

window.forceDataRefresh = function() {
    window.location.reload();
};

console.log('Dashboard Enfermarias V7.0 - Carregado com Sucesso!');