// js/dashboards/dashboard-hospital.js
// Dashboard Hospitalar - Archipelago V6.0


// =================== DASHBOARD HOSPITALAR V6.0 ===================
// Versão: 6.0
// Depende de: cards-config.js (carregar ANTES)

console.log('Dashboard Hospitalar V6.0 - Carregando...');

// =================== VALIDAR DEPENDÊNCIAS ===================
if (typeof window.desnormalizarTexto === 'undefined') {
    console.error('ERRO CRITICO: cards-config.js NAO foi carregado!');
    throw new Error('cards-config.js deve ser carregado ANTES de dashboard-hospital.js');
}

console.log('Dependencias validadas - cards-config.js OK');

// =================== CONTINUACAO DO DASHBOARD HOSPITALAR ===================

console.log('Dashboard Hospitalar V6.0 - Inicializando...');

// Variável global para controlar o filtro atual
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
    console.warn('ChartDataLabels não carregado. Números nas pizzas via legenda.');
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

function getCorExata(itemName, tipo = 'concessao') {
    if (!itemName || typeof itemName !== 'string') {
        return CORES_ARCHIPELAGO.cinzaMedio;
    }
    
    const paleta = tipo === 'concessao' ? 
        window.CORES_CONCESSOES : 
        window.CORES_LINHAS;
    
    if (!paleta) {
        console.warn('Paleta de cores não carregada (api.js)');
        return CORES_ARCHIPELAGO.cinzaMedio;
    }
    
    
    // ✅ USAR A FUNÇÃO DE NORMALIZAÇÃO DO cards-config.js
    const itemNormalizado = window.normalizarTexto(itemName);
    
    // Buscar com nome normalizado (SEM acentos)
    let cor = paleta[itemNormalizado];
    if (cor) return cor;
    
    // Tentar com limpeza adicional
    const nomeNorm = itemNormalizado.trim().replace(/\s+/g, ' ').replace(/[–—]/g, '-');
    cor = paleta[nomeNorm];
    if (cor) return cor;
    
    // ⚠️ Se não encontrou, avisar no console
    console.warn(`[CORES] Não encontrada: "${itemName}" → normalizado: "${itemNormalizado}"`);
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
 * @param {HTMLElement} botao - Elemento do botão clicado
 */
window.filtrarHospitalDashboard = function(hospitalId) {
    console.log('[FILTRO] Filtrando:', hospitalId);
    
    // Atualizar variável global
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
    
    console.log('[FILTRO] Visíveis:', totalVisiveis);
};

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
    
    // Verificar qual hospital está selecionado
    const filtroAtual = window.hospitalFiltroAtual || 'todos';
    const hospitaisParaRelatorio = filtroAtual === 'todos' ? hospitaisIds : [filtroAtual];
    
    let texto = filtroAtual === 'todos' ? 
        `*DASHBOARD HOSPITALAR*\n` : 
        `*DASHBOARD HOSPITALAR - ${hospitaisNomes[filtroAtual]}*\n`;
    
    texto += `${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n`;
    
    hospitaisParaRelatorio.forEach((hospitalId, index) => {
        const hospital = window.hospitalData[hospitalId];
        if (!hospital || !hospital.leitos) return;
        
        const nome = hospitaisNomes[hospitalId];
        
        if (filtroAtual === 'todos') {
            texto += `━━━━━━━━━━━━━━━━━\n`;
            texto += `*${index + 1}. ${nome}*\n`;
            texto += `━━━━━━━━━━━━━━━━━\n\n`;
        }
        
        // ========== ALTAS PREVISTAS ==========
        const altasTimeline = {
            'HOJE': { 'Ouro': [], '2R': [], '3R': [] },
            '24H': { 'Ouro': [], '2R': [], '3R': [] },
            '48H': []
        };
        
        hospital.leitos.filter(l => isOcupado(l) && l.prevAlta).forEach(l => {
            const prev = normStr(l.prevAlta);
            const mat = l.matricula || '---';
            
            if (prev.includes('hoje')) {
                if (prev.includes('ouro')) altasTimeline['HOJE']['Ouro'].push(mat);
                else if (prev.includes('2r')) altasTimeline['HOJE']['2R'].push(mat);
                else if (prev.includes('3r')) altasTimeline['HOJE']['3R'].push(mat);
            } else if (prev.includes('24h') || prev.includes('24 h')) {
                if (prev.includes('ouro')) altasTimeline['24H']['Ouro'].push(mat);
                else if (prev.includes('2r')) altasTimeline['24H']['2R'].push(mat);
                else if (prev.includes('3r')) altasTimeline['24H']['3R'].push(mat);
            } else if (prev.includes('48h') || prev.includes('48 h')) {
                altasTimeline['48H'].push(mat);
            }
        });
        
        const temAltasHoje = Object.values(altasTimeline['HOJE']).some(arr => arr.length > 0);
        const temAltas24h = Object.values(altasTimeline['24H']).some(arr => arr.length > 0);
        const temAltas48h = altasTimeline['48H'].length > 0;
        
        if (temAltasHoje) {
            texto += `*Altas Previstas HOJE:*\n`;
            if (altasTimeline['HOJE']['Ouro'].length > 0) {
                texto += `Ouro: ${altasTimeline['HOJE']['Ouro'].join(', ')}\n`;
            }
            if (altasTimeline['HOJE']['2R'].length > 0) {
                texto += `2R: ${altasTimeline['HOJE']['2R'].join(', ')}\n`;
            }
            if (altasTimeline['HOJE']['3R'].length > 0) {
                texto += `3R: ${altasTimeline['HOJE']['3R'].join(', ')}\n`;
            }
            texto += `\n`;
        }
        
        if (temAltas24h) {
            texto += `*Altas Previstas 24H:*\n`;
            if (altasTimeline['24H']['Ouro'].length > 0) {
                texto += `Ouro: ${altasTimeline['24H']['Ouro'].join(', ')}\n`;
            }
            if (altasTimeline['24H']['2R'].length > 0) {
                texto += `2R: ${altasTimeline['24H']['2R'].join(', ')}\n`;
            }
            if (altasTimeline['24H']['3R'].length > 0) {
                texto += `3R: ${altasTimeline['24H']['3R'].join(', ')}\n`;
            }
            texto += `\n`;
        }
        
        if (temAltas48h) {
            texto += `*Altas Previstas 48H:*\n`;
            texto += `${altasTimeline['48H'].join(', ')}\n\n`;
        }
        
        // ========== CONCESSÕES ==========
        const concessoesTimeline = {
            'HOJE': {},
            '24H': {}
        };
        
        hospital.leitos.filter(l => isOcupado(l) && l.concessoes && l.concessoes.length > 0).forEach(l => {
            const prev = normStr(l.prevAlta || '');
            const mat = l.matricula || '---';
            
            l.concessoes.forEach(concessao => {
                const concessaoNorm = window.normalizarTexto(concessao);
                
                if (prev.includes('hoje')) {
                    if (!concessoesTimeline['HOJE'][concessaoNorm]) {
                        concessoesTimeline['HOJE'][concessaoNorm] = [];
                    }
                    concessoesTimeline['HOJE'][concessaoNorm].push(mat);
                } else if (prev.includes('24h') || prev.includes('24 h')) {
                    if (!concessoesTimeline['24H'][concessaoNorm]) {
                        concessoesTimeline['24H'][concessaoNorm] = [];
                    }
                    concessoesTimeline['24H'][concessaoNorm].push(mat);
                }
            });
        });
        
        const temConcessoesHoje = Object.keys(concessoesTimeline['HOJE']).length > 0;
        const temConcessoes24h = Object.keys(concessoesTimeline['24H']).length > 0;
        
        if (temConcessoesHoje) {
            texto += `*Concessões Previstas HOJE:*\n`;
            Object.entries(concessoesTimeline['HOJE']).forEach(([nome, mats]) => {
                // ✅ USAR FUNÇÃO desnormalizarTexto() do cards-config.js
                const desnormalizarTexto = window.desnormalizarTexto || (t => t);
                texto += `${desnormalizarTexto(nome)}: ${mats.join(', ')}\n`;
            });
            texto += `\n`;
        }
        
        if (temConcessoes24h) {
            texto += `*Concessões Previstas 24H:*\n`;
            Object.entries(concessoesTimeline['24H']).forEach(([nome, mats]) => {
                // ✅ APLICAR DESNORMALIZAÇÃO AQUI TAMBÉM
                const desnormalizarTexto = window.desnormalizarTexto || (t => t);
                texto += `${desnormalizarTexto(nome)}: ${mats.join(', ')}\n`;
            });
            texto += `\n`;
        }
        
        // ========== DIRETIVAS PENDENTES ==========
        const diretivasPendentes = hospital.leitos.filter(l => {
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
            texto += `*Diretivas Pendentes:*\n`;
            diretivasPendentes.forEach(l => {
                const leito = l.identificacaoLeito || l.leito || '---';
                const matricula = l.matricula || '---';
                texto += `Leito ${leito} - Mat. ${matricula}\n`;
            });
            texto += `\n`;
        }
        
        // Se não tem nada
        if (!temAltasHoje && !temAltas24h && !temAltas48h && !temConcessoesHoje && !temConcessoes24h && diretivasPendentes.length === 0) {
            texto += `_Nenhuma atividade prevista_\n\n`;
        }
    });
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('Dados copiados para o WhatsApp!\n\nCole e envie.');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar. Tente novamente.');
    });
};

function calcularModalidadesVagos(leitos, hospitalId) {
    const modalidade = {
        flexiveis: 0,
        exclusivo_apto: 0,
        exclusivo_enf_sem_restricao: 0,
        exclusivo_enf_fem: 0,
        exclusivo_enf_masc: 0
    };

    const vagos = leitos.filter(l => isVago(l));

    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        // V6.0: Usar contratuais (não conta extras)
        const capacidadeInfo = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospitalId] : null;
        const contratuais = capacidadeInfo ? capacidadeInfo.contratuais : leitos.length;
        const ocupados = leitos.filter(l => isOcupado(l)).length;
        modalidade.flexiveis = Math.max(0, contratuais - ocupados);
        return modalidade;
    }

    // =================== H2 - CRUZ AZUL ===================
    if (hospitalId === 'H2') {
        vagos.forEach(leitoVago => {
            const tipo = leitoVago.tipo || '';
            
            // APARTAMENTOS: contar direto
            if (tipo === 'APTO' || tipo === 'Apartamento') {
                modalidade.exclusivo_apto++;
                return;
            }
            
            // ENFERMARIAS: considerar sistema de leitos irmãos
            if (tipo === 'ENFERMARIA' || tipo === 'Enfermaria') {
                const numeroLeito = getLeitoNumero(leitoVago.leito);
                
                // Se não conseguiu identificar número, contar como sem restrição
                if (!numeroLeito || numeroLeito < 21 || numeroLeito > 36) {
                    modalidade.exclusivo_enf_sem_restricao++;
                    return;
                }
                
                // Buscar irmão usando CRUZ_AZUL_IRMAOS
                const irmaosMap = window.CRUZ_AZUL_IRMAOS || {};
                const numeroIrmao = irmaosMap[numeroLeito];
                
                if (!numeroIrmao) {
                    modalidade.exclusivo_enf_sem_restricao++;
                    return;
                }
                
                const irmao = leitos.find(l => getLeitoNumero(l.leito) === numeroIrmao);
                
                // Irmão vago: sem restrição
                if (!irmao || isVago(irmao)) {
                    modalidade.exclusivo_enf_sem_restricao++;
                }
                // Irmão com isolamento: NÃO conta (leito bloqueado)
                else if (irmao.isolamento && irmao.isolamento !== 'Não Isolamento') {
                    // Não faz nada - leito bloqueado
                }
                // Irmão ocupado: restrição por gênero
                else {
                    if (irmao.genero === 'Feminino') {
                        modalidade.exclusivo_enf_fem++;
                    } else if (irmao.genero === 'Masculino') {
                        modalidade.exclusivo_enf_masc++;
                    } else {
                        modalidade.exclusivo_enf_sem_restricao++;
                    }
                }
            }
        });
        
        return modalidade;
    }

    // =================== H4 - SANTA CLARA ===================
    if (hospitalId === 'H4') {
        vagos.forEach(leitoVago => {
            const tipo = leitoVago.tipo || '';
            
            // APARTAMENTOS: contar direto
            if (tipo === 'APTO' || tipo === 'Apartamento') {
                modalidade.exclusivo_apto++;
                return;
            }
            
            // ENFERMARIAS: considerar sistema de leitos irmãos
            if (tipo === 'ENFERMARIA' || tipo === 'Enfermaria') {
                const numeroLeito = getLeitoNumero(leitoVago.leito);
                
                // Se não está no range dos leitos irmãos (10-17), contar como sem restrição
                if (!numeroLeito || numeroLeito < 10 || numeroLeito > 17) {
                    modalidade.exclusivo_enf_sem_restricao++;
                    return;
                }
                
                // Buscar irmão usando SANTA_CLARA_IRMAOS
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
                
                const irmao = leitos.find(l => getLeitoNumero(l.leito) === numeroIrmao);
                
                // Irmão vago: sem restrição
                if (!irmao || isVago(irmao)) {
                    modalidade.exclusivo_enf_sem_restricao++;
                }
                // Irmão com isolamento: NÃO conta (leito bloqueado)
                else if (irmao.isolamento && irmao.isolamento !== 'Não Isolamento') {
                    // Não faz nada - leito bloqueado
                }
                // Irmão ocupado: restrição por gênero
                else {
                    if (irmao.genero === 'Feminino') {
                        modalidade.exclusivo_enf_fem++;
                    } else if (irmao.genero === 'Masculino') {
                        modalidade.exclusivo_enf_masc++;
                    } else {
                        modalidade.exclusivo_enf_sem_restricao++;
                    }
                }
            }
        });
        
        return modalidade;
    }

    return modalidade;
}

function calcularModalidadePorTipo(leitos, hospitalId) {
    const modalidade = {
        flexiveis: 0,
        exclusivo_apto: 0,
        exclusivo_enf_sem_restricao: 0,
        exclusivo_enf_fem: 0,
        exclusivo_enf_masc: 0
    };

    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        modalidade.flexiveis = leitos.length;
        return modalidade;
    }

    leitos.forEach(leito => {
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
        
        // Para híbridos: usar categoriaEscolhida
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

window.processarDadosHospital = function(hospitalId) {
    const hospitalObj = window.hospitalData[hospitalId] || {};
    
    let leitos = hospitalObj.leitos || hospitalObj || [];
    if (!Array.isArray(leitos)) {
        leitos = [];
    }
    
    const ocupados = leitos.filter(l => isOcupado(l));
    
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
    
    // =================== DISPONÍVEIS POR TIPO - CORRIGIDO ===================
    let vagosApto, vagosEnfFem, vagosEnfMasc;
    
    // =================== H2 e H4: CONTAR APENAS VAGOS REAIS ===================
    if (hospitalId === 'H2' || hospitalId === 'H4') {
        // APARTAMENTOS: Contar apenas apartamentos vagos
        vagosApto = vagos.filter(l => 
            l.tipo === 'Apartamento' || l.tipo === 'APTO'
        ).length;
        
        // ENFERMARIAS: Contar vagos considerando restrições de irmão
        let vagosEnfSemRestricao = 0;
        let vagosEnfFemRestrita = 0;
        let vagosEnfMascRestrita = 0;
        
        // Determinar pares baseado no hospital
        let paresEnfermarias;
        let irmaosMap;
        
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
        } else {
            irmaosMap = window.SANTA_CLARA_IRMAOS || {
                10: 11, 11: 10,
                12: 13, 13: 12,
                14: 15, 15: 14,
                16: 17, 17: 16
            };
        }
        
        // Processar cada leito vago de enfermaria
        vagos.forEach(leitoVago => {
            const tipo = leitoVago.tipo || '';
            
            if (tipo === 'ENFERMARIA' || tipo === 'Enfermaria') {
                const numeroLeito = getLeitoNumero(leitoVago.leito);
                
                // Se não está no range correto, contar como sem restrição
                if (!numeroLeito) {
                    vagosEnfSemRestricao++;
                    return;
                }
                
                // Para H2: range 21-36
                if (hospitalId === 'H2' && (numeroLeito < 21 || numeroLeito > 36)) {
                    vagosEnfSemRestricao++;
                    return;
                }
                
                // Para H4: range 10-17
                if (hospitalId === 'H4' && (numeroLeito < 10 || numeroLeito > 17)) {
                    vagosEnfSemRestricao++;
                    return;
                }
                
                // Buscar irmão
                const numeroIrmao = irmaosMap[numeroLeito];
                
                if (!numeroIrmao) {
                    vagosEnfSemRestricao++;
                    return;
                }
                
                const irmao = leitos.find(l => getLeitoNumero(l.leito) === numeroIrmao);
                
                // Irmão vago: sem restrição
                if (!irmao || isVago(irmao)) {
                    vagosEnfSemRestricao++;
                }
                // Irmão com isolamento: NÃO conta (leito bloqueado)
                else if (irmao.isolamento && irmao.isolamento !== 'Não Isolamento') {
                    // Não conta nada - leito bloqueado
                }
                // Irmão ocupado: contar por gênero
                else {
                    if (irmao.genero === 'Feminino') {
                        vagosEnfFemRestrita++;
                    } else if (irmao.genero === 'Masculino') {
                        vagosEnfMascRestrita++;
                    } else {
                        vagosEnfSemRestricao++;
                    }
                }
            }
        });
        
        // CAPACIDADE TOTAL: somar todas as possibilidades
        vagosEnfFem = vagosEnfSemRestricao + vagosEnfFemRestrita;
        vagosEnfMasc = vagosEnfSemRestricao + vagosEnfMascRestrita;
        
        // REGRA: Se disponíveis contratuais = 0, zerar TUDO
        const capacidadeInfo = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospitalId] : null;
        const contratuais = capacidadeInfo ? capacidadeInfo.contratuais : leitos.length;
        const disponiveisTotais = Math.max(0, contratuais - ocupados.length);
        
        if (disponiveisTotais === 0) {
            vagosApto = 0;
            vagosEnfFem = 0;
            vagosEnfMasc = 0;
        }
    }
    // =================== HÍBRIDOS PUROS ===================
    else {
        vagosApto = vagos.filter(l => 
            l.tipo === 'Apartamento' || l.tipo === 'APTO' || l.tipo === 'Híbrido'
        ).length;
        vagosEnfFem = vagos.filter(l => 
            l.tipo === 'Enfermaria Feminina'
        ).length;
        vagosEnfMasc = vagos.filter(l => 
            l.tipo === 'Enfermaria Masculina'
        ).length;
    }

    // =================== APLICAR LÓGICA CONTRATUAIS (NÃO EXTRAS) ===================
    let vagosAptoFinal = vagosApto;
    let vagosEnfFemFinal = vagosEnfFem;
    let vagosEnfMascFinal = vagosEnfMasc;
    
    if (hospitalId === 'H1' || hospitalId === 'H3' || hospitalId === 'H5' || hospitalId === 'H6' || hospitalId === 'H7' || hospitalId === 'H8' || hospitalId === 'H9') {
        // V6.0: Usar contratuais - ocupados (não conta extras)
        const capacidadeInfo = window.HOSPITAL_CAPACIDADE ? window.HOSPITAL_CAPACIDADE[hospitalId] : null;
        const contratuais = capacidadeInfo ? capacidadeInfo.contratuais : leitos.length;
        
        // Calcular total de disponíveis
        const disponiveisTotais = Math.max(0, contratuais - ocupados.length);
        
        // REGRA: Se disponíveis = 0, zerar TUDO
        if (disponiveisTotais === 0) {
            vagosAptoFinal = 0;
            vagosEnfFemFinal = 0;
            vagosEnfMascFinal = 0;
        } else {
            // Caso contrário, calcular normalmente
            const dispApto = Math.max(0, contratuais - ocupadosApto);
            const dispEnfFem = Math.max(0, contratuais - ocupadosEnfFem);
            const dispEnfMasc = Math.max(0, contratuais - ocupadosEnfMasc);
            
            vagosAptoFinal = dispApto;
            vagosEnfFemFinal = dispEnfFem;
            vagosEnfMascFinal = dispEnfMasc;
        }
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
    
    // V6.0: Usar HOSPITAL_CAPACIDADE para base de cálculo
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
        'H7': 'Santa Virgínia',
        'H8': 'São Camilo Ipiranga',
        'H9': 'São Camilo Pompeia'
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
        previsao: {
            total: previsaoAlta.length,
            apartamento: previsaoApto,
            enf_feminina: previsaoEnfFem,
            enf_masculina: previsaoEnfMasc,
            modalidade: modalidadePrevisao
        },
        disponiveis: {
            total: Math.max(contratuais - ocupados.length, 0),
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

function calcularGaugeOffset_Hosp(porcentagem) {
    const circunferencia = Math.PI * 55;
    const progresso = (porcentagem / 100) * circunferencia;
    return circunferencia - progresso;
}

function renderGaugeV5_Hosp(porcentagem, cor, numero) {
    const offset = calcularGaugeOffset_Hosp(porcentagem);
    const badgeClass = 'blue';
    cor = CORES_ARCHIPELAGO.azulPrincipal; 
    
    return `
        <div class="v5-gauge-container">
            <div style="position: relative;">
                <svg class="v5-gauge" viewBox="0 0 140 80">
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
                <div class="v5-number-inside">${numero.toString().padStart(2, '0')}</div>
            </div>
            <div class="v5-badge-below ${badgeClass}">${porcentagem.toFixed(0)}%</div>
        </div>
    `;
}

function renderModalidadeContratual_Hosp(modalidade) {
    return `
        <div class="lista-simples-compacta">
            <div class="lista-item-compacto">
                <span class="label">Flexíveis Quanto ao Plano</span>
                <span class="valor">${modalidade.flexiveis || 0}</span>
            </div>
            <div class="lista-item-compacto">
                <span class="label">Exclusivamente Apartamentos</span>
                <span class="valor">${modalidade.exclusivo_apto || 0}</span>
            </div>
            <div class="lista-item-compacto">
                <span class="label">Exclus. Enf Sem Restrição</span>
                <span class="valor">${modalidade.exclusivo_enf_sem_restricao || 0}</span>
            </div>
            <div class="lista-item-compacto">
                <span class="label">Exclus. Enf Feminina</span>
                <span class="valor">${modalidade.exclusivo_enf_fem || 0}</span>
            </div>
            <div class="lista-item-compacto">
                <span class="label">Exclus. Enf Masculina</span>
                <span class="valor">${modalidade.exclusivo_enf_masc || 0}</span>
            </div>
        </div>
    `;
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
        blocos += `<div class="tph-gauge-block ${i < blocosCheios ? 'filled' : 'empty'}"></div>`;
    }
    
    return `
        <div class="tph-mini-gauge">
            <div class="tph-gauge-bar ${corClass}">
                ${blocos}
            </div>
            <span class="tph-gauge-label">${diasNum.toFixed(2)}/${maxDias}</span>
        </div>
    `;
}

window.renderDashboardHospitalar = function() {
    console.log('Renderizando Dashboard Hospitalar V6.0');
    
    let container = document.getElementById('dashHospitalarContent');
    if (!container) {
        console.error('Elemento dashHospitalarContent não encontrado');
        return;
    }

    if (!window.hospitalData) {
        container.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Carregando dados...</p>';
        return;
    }

    const hospitaisOrdem = ['H5', 'H2', 'H1', 'H4', 'H6', 'H3', 'H7', 'H8', 'H9'];
    const hospitaisNomes = {
        'H1': 'Neomater',
        'H2': 'Cruz Azul',
        'H3': 'Santa Marcelina',
        'H4': 'Santa Clara',
        'H5': 'Adventista',
        'H6': 'Santa Cruz',
        'H7': 'Santa Virgínia',
        'H8': 'São Camilo Ipiranga',
        'H9': 'São Camilo Pompeia'
    };
    
    let hospitaisDisponiveis = hospitaisOrdem.filter(id => window.hospitalData[id]);
    
    if (hospitaisDisponiveis.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Nenhum hospital com dados disponíveis</p>';
        return;
    }

    container.innerHTML = `
        <div class="dashboard-hospitalar-wrapper">
            ${renderStyles_Hosp()}
            
            <div class="hospital-filter-selector">
                <select id="hospitalFilterDropdown" class="hospital-filter-select" onchange="window.filtrarHospitalDashboard(this.value)">
                    <option value="todos">Todos os Hospitais</option>
                    ${hospitaisDisponiveis.map(id => 
                        `<option value="${id}">${hospitaisNomes[id]}</option>`
                    ).join('')}
                </select>
            </div>
            
            <h2 class="dashboard-title-central">Dashboard Hospitalar</h2>
            
            <button class="btn-whatsapp-dashboard" onclick="window.copiarDashboardParaWhatsApp()">
                Copiar para WhatsApp
            </button>
            
            <div class="hospitais-container">
                ${hospitaisDisponiveis.map(hospitalId => {
                    const dados = window.processarDadosHospital(hospitalId);
                    return renderHospitalCard_V5(hospitalId, dados);
                }).join('')}
            </div>
        </div>
    `;
    
    hospitaisDisponiveis.forEach(hospitalId => {
        renderCharts_Hosp(hospitalId);
    });
    
    console.log('Dashboard Hospitalar renderizado com sucesso');
};

function renderHospitalCard_V5(hospitalId, dados) {
    return `
        <div class="hospital-card" data-hospital="${hospitalId}">
            <div class="hospital-header">
                <h3 class="hospital-name">${dados.nome}</h3>
            </div>
            
            <div class="hospital-content">
                <div class="box-ocupacao">
                    <div class="box-title">Taxa de Ocupação</div>
                    <div class="gauge-center">
                        ${renderGaugeV5_Hosp(dados.taxaOcupacao, CORES_ARCHIPELAGO.ocupados, dados.ocupados.total)}
                    </div>
                </div>
                
                <div class="box-leitos">
                    <div class="box-title">Leitos Ocupados</div>
                    <div class="lista-simples-compacta">
                        <div class="lista-item-compacto">
                            <span class="label">Apartamento</span>
                            <span class="valor">${dados.ocupados.apartamento}</span>
                        </div>
                        <div class="lista-item-compacto">
                            <span class="label">Enfermaria Feminina</span>
                            <span class="valor">${dados.ocupados.enf_feminina}</span>
                        </div>
                        <div class="lista-item-compacto">
                            <span class="label">Enfermaria Masculina</span>
                            <span class="valor">${dados.ocupados.enf_masculina}</span>
                        </div>
                    </div>
                    
                    <div class="box-title" style="margin-top: 20px; margin-bottom: 10px;">Modalidade Contratual</div>
                    ${renderModalidadeContratual_Hosp(dados.ocupados.modalidade)}
                </div>
                
                <div class="box-previsao">
                    <div class="box-title">Previsão de Alta Hoje</div>
                    <div class="gauge-center">
                        ${renderGaugeV5_Hosp((dados.previsao.total / Math.max(dados.ocupados.total, 1)) * 100, CORES_ARCHIPELAGO.previsao, dados.previsao.total)}
                    </div>
                </div>
                
                <div class="box-leitos">
                    <div class="box-title">Previsão Por Tipo</div>
                    <div class="lista-simples-compacta">
                        <div class="lista-item-compacto">
                            <span class="label">Apartamento</span>
                            <span class="valor">${dados.previsao.apartamento}</span>
                        </div>
                        <div class="lista-item-compacto">
                            <span class="label">Enfermaria Feminina</span>
                            <span class="valor">${dados.previsao.enf_feminina}</span>
                        </div>
                        <div class="lista-item-compacto">
                            <span class="label">Enfermaria Masculina</span>
                            <span class="valor">${dados.previsao.enf_masculina}</span>
                        </div>
                    </div>
                    
                    <div class="box-title" style="margin-top: 20px; margin-bottom: 10px;">Modalidade Contratual</div>
                    ${renderModalidadeContratual_Hosp(dados.previsao.modalidade)}
                </div>
                
                <div class="box-disponiveis">
                    <div class="box-title">Leitos Disponíveis</div>
                    <div class="gauge-center">
                        ${renderGaugeV5_Hosp((dados.disponiveis.total / Math.max(dados.contratuais, 1)) * 100, CORES_ARCHIPELAGO.disponiveis, dados.disponiveis.total)}
                    </div>
                </div>
                
                <div class="box-leitos">
                    <div class="box-title">Capacidade Total por Tipo de Leito (não Simultâneo)</div>
                    <div class="lista-simples-compacta">
                        <div class="lista-item-compacto">
                            <span class="label">Apartamento</span>
                            <span class="valor">até ${dados.disponiveis.apartamento}</span>
                        </div>
                        <div class="lista-item-compacto">
                            <span class="label">Enfermaria Feminina</span>
                            <span class="valor">até ${dados.disponiveis.enf_feminina}</span>
                        </div>
                        <div class="lista-item-compacto">
                            <span class="label">Enfermaria Masculina</span>
                            <span class="valor">até ${dados.disponiveis.enf_masculina}</span>
                        </div>
                    </div>
                    
                    <div class="box-title" style="margin-top: 20px; margin-bottom: 10px;">Total por Modalidade Contratual</div>
                    ${renderModalidadeContratual_Hosp(dados.disponiveis.modalidade)}
                </div>
                
                <div class="box-tph">
                    <div class="box-title">TPH (Tempo de Permanência)</div>
                    <div style="text-align: center; margin: 15px 0;">
                        ${renderMiniGaugeTPH_Hosp(dados.tph.medio)}
                    </div>
                    
                    ${dados.tph.lista.length > 0 ? `
                        <div class="box-subtitle">Leitos com +5 Diárias</div>
                        <div class="hospitais-table-wrapper">
                            <table class="hospitais-table">
                                <thead>
                                    <tr>
                                        <th>Leito</th>
                                        <th>Matrícula</th>
                                        <th>Dias</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${dados.tph.lista.map(item => `
                                        <tr>
                                            <td>${item.leito}</td>
                                            <td>${item.matricula}</td>
                                            <td>${item.dias}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<div class="sem-dados">Nenhum leito com +5 diárias</div>'}
                </div>
                
                <div class="box-pps">
                    <div class="box-title">PPS (Palliative Performance Scale)</div>
                    <div style="display: flex; justify-content: center; align-items: center; margin: 20px 0; flex-direction: column;">
                        <div style="font-size: 42px; font-weight: 700; color: ${CORES_ARCHIPELAGO.azulPrincipal};">${dados.pps.medio}</div>
                        <div style="font-size: 12px; color: ${CORES_ARCHIPELAGO.cinzaMedio}; margin-top: 5px;">Média</div>
                    </div>
                    
                    ${dados.pps.menor40.length > 0 ? `
                        <div class="box-subtitle">PPS Menor que 40</div>
                        <div class="hospitais-table-wrapper">
                            <table class="hospitais-table">
                                <thead>
                                    <tr>
                                        <th>Leito</th>
                                        <th>Matrícula</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${dados.pps.menor40.map(item => `
                                        <tr>
                                            <td>${item.leito}</td>
                                            <td>${item.matricula}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<div class="sem-dados">Nenhum leito com PPS < 40</div>'}
                </div>
                
                <div class="box-spict">
                    <div class="box-title">SPICT (Elegíveis)</div>
                    <div style="display: flex; justify-content: center; align-items: center; margin: 20px 0; flex-direction: column;">
                        <div style="font-size: 42px; font-weight: 700; color: ${CORES_ARCHIPELAGO.azulPrincipal};">${dados.spict.elegiveis}</div>
                        <div style="font-size: 12px; color: ${CORES_ARCHIPELAGO.cinzaMedio}; margin-top: 5px;">Pacientes</div>
                    </div>
                    
                    ${dados.spict.diretivas > 0 ? `
                        <div class="box-subtitle">Diretivas Pendentes</div>
                        <div class="hospitais-table-wrapper">
                            <table class="hospitais-table">
                                <thead>
                                    <tr>
                                        <th>Leito</th>
                                        <th>Matrícula</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${dados.spict.listaDiretivas.map(item => `
                                        <tr>
                                            <td>${item.leito}</td>
                                            <td>${item.matricula}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<div class="sem-dados">Nenhuma diretiva pendente</div>'}
                </div>
            </div>
            
            <div class="timeline-boxes-container">
                <div class="box-title" style="text-align: center; margin-bottom: 15px;">Timeline de Altas Previstas</div>
                <div class="timeline-boxes-grid">
                    <div id="timeline-hoje-${hospitalId}" class="timeline-box"></div>
                    <div id="timeline-24h-${hospitalId}" class="timeline-box"></div>
                    <div id="timeline-48h-${hospitalId}" class="timeline-box"></div>
                </div>
            </div>
            
            ${CONFIG_DASHBOARD.MOSTRAR_LINHAS_CUIDADO ? `
                <div class="graficos-verticais">
                    <div class="grafico-item">
                        <div class="chart-header">
                            <h4>Concessões (Ocupados)</h4>
                        </div>
                        <div class="chart-container">
                            <canvas id="chart-concessoes-${hospitalId}"></canvas>
                        </div>
                    </div>
                    
                    <div class="grafico-item">
                        <div class="chart-header">
                            <h4>Linhas de Cuidado (Ocupados)</h4>
                        </div>
                        <div class="chart-container">
                            <canvas id="chart-linhas-${hospitalId}"></canvas>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderCharts_Hosp(hospitalId) {
    const hospitalObj = window.hospitalData[hospitalId] || {};
    let leitos = hospitalObj.leitos || hospitalObj || [];
    if (!Array.isArray(leitos)) leitos = [];
    
    const ocupados = leitos.filter(l => isOcupado(l));
    
    // ========== TIMELINE DE ALTAS ==========
    const altasTimeline = {
        'HOJE': { 'Ouro': [], '2R': [], '3R': [] },
        '24H': { 'Ouro': [], '2R': [], '3R': [] },
        '48H': []
    };
    
    ocupados.filter(l => l.prevAlta).forEach(l => {
        const prev = normStr(l.prevAlta);
        const mat = l.matricula || '---';
        
        if (prev.includes('hoje')) {
            if (prev.includes('ouro')) altasTimeline['HOJE']['Ouro'].push(mat);
            else if (prev.includes('2r')) altasTimeline['HOJE']['2R'].push(mat);
            else if (prev.includes('3r')) altasTimeline['HOJE']['3R'].push(mat);
        } else if (prev.includes('24h') || prev.includes('24 h')) {
            if (prev.includes('ouro')) altasTimeline['24H']['Ouro'].push(mat);
            else if (prev.includes('2r')) altasTimeline['24H']['2R'].push(mat);
            else if (prev.includes('3r')) altasTimeline['24H']['3R'].push(mat);
        } else if (prev.includes('48h') || prev.includes('48 h')) {
            altasTimeline['48H'].push(mat);
        }
    });
    
    renderTimelineBox_Hosp(hospitalId, 'hoje', altasTimeline['HOJE']);
    renderTimelineBox_Hosp(hospitalId, '24h', altasTimeline['24H']);
    renderTimelineBox_Hosp(hospitalId, '48h', { 'Total': altasTimeline['48H'] });
    
    // ========== CONCESSÕES ==========
    if (CONFIG_DASHBOARD.MOSTRAR_LINHAS_CUIDADO) {
        const concessoesData = {};
        
        ocupados.forEach(leito => {
            if (leito.concessoes && Array.isArray(leito.concessoes)) {
                leito.concessoes.forEach(concessao => {
                    const concessaoNorm = window.normalizarTexto(concessao);
                    concessoesData[concessaoNorm] = (concessoesData[concessaoNorm] || 0) + 1;
                });
            }
        });
        
        const concessoesOrdenadas = Object.entries(concessoesData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (concessoesOrdenadas.length > 0) {
            renderBarChart_Hosp(
                `chart-concessoes-${hospitalId}`,
                concessoesOrdenadas.map(([nome]) => window.desnormalizarTexto(nome)),
                concessoesOrdenadas.map(([, count]) => count),
                concessoesOrdenadas.map(([nome]) => getCorExata(nome, 'concessao'))
            );
        }
        
        // ========== LINHAS DE CUIDADO ==========
        const linhasData = {};
        
        ocupados.forEach(leito => {
            if (leito.linhas && Array.isArray(leito.linhas)) {
                leito.linhas.forEach(linha => {
                    const linhaNorm = window.normalizarTexto(linha);
                    linhasData[linhaNorm] = (linhasData[linhaNorm] || 0) + 1;
                });
            }
        });
        
        const linhasOrdenadas = Object.entries(linhasData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (linhasOrdenadas.length > 0) {
            renderBarChart_Hosp(
                `chart-linhas-${hospitalId}`,
                linhasOrdenadas.map(([nome]) => window.desnormalizarTexto(nome)),
                linhasOrdenadas.map(([, count]) => count),
                linhasOrdenadas.map(([nome]) => getCorExata(nome, 'linha'))
            );
        }
    }
}

function renderTimelineBox_Hosp(hospitalId, periodo, dados) {
    const periodoTitulo = {
        'hoje': 'HOJE',
        '24h': '24 HORAS',
        '48h': '48 HORAS'
    };
    
    const container = document.getElementById(`timeline-${periodo}-${hospitalId}`);
    if (!container) return;
    
    const categorias = Object.keys(dados);
    const valores = Object.values(dados).map(arr => Array.isArray(arr) ? arr.length : 0);
    const total = valores.reduce((a, b) => a + b, 0);
    
    const canvasId = `timeline-chart-${periodo}-${hospitalId}`;
    
    container.innerHTML = `
        <div class="timeline-box-header">${periodoTitulo[periodo]}</div>
        <div class="timeline-chart-container">
            <canvas id="${canvasId}" class="timeline-chart"></canvas>
        </div>
        <div class="timeline-box-content">
            ${total === 0 ? '<div class="sem-dados">Nenhuma alta prevista</div>' : ''}
            ${Object.entries(dados).map(([categoria, mats]) => {
                if (!Array.isArray(mats) || mats.length === 0) return '';
                
                const cor = categoria === 'Ouro' ? CORES_ARCHIPELAGO.amarelo :
                           categoria === '2R' ? CORES_ARCHIPELAGO.azulPrincipal :
                           categoria === '3R' ? CORES_ARCHIPELAGO.verde :
                           CORES_ARCHIPELAGO.azulAcinzentado;
                
                return `
                    <div class="timeline-item" style="border-left-color: ${cor};">
                        <div class="timeline-item-name">${categoria} (${mats.length})</div>
                        <div class="timeline-item-mats">${mats.join(', ')}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Renderizar gráfico de pizza
    const ctx = document.getElementById(canvasId);
    if (ctx && total > 0) {
        const cores = categorias.map(cat => {
            if (cat === 'Ouro') return CORES_ARCHIPELAGO.amarelo;
            if (cat === '2R') return CORES_ARCHIPELAGO.azulPrincipal;
            if (cat === '3R') return CORES_ARCHIPELAGO.verde;
            return CORES_ARCHIPELAGO.azulAcinzentado;
        });
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categorias,
                datasets: [{
                    data: valores,
                    backgroundColor: cores,
                    borderColor: CORES_ARCHIPELAGO.azulEscuro,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: CORES_ARCHIPELAGO.azulMarinhoEscuro,
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: CORES_ARCHIPELAGO.azulPrincipal,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}`;
                            }
                        }
                    },
                    datalabels: hasDataLabels ? {
                        color: '#ffffff',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        formatter: (value) => value > 0 ? value : ''
                    } : false
                }
            },
            plugins: hasDataLabels ? [ChartDataLabels] : []
        });
    }
}

function renderBarChart_Hosp(canvasId, labels, data, cores) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    const corTexto = window.fundoBranco ? CORES_ARCHIPELAGO.cinzaEscuro : '#ffffff';
    const corGrid = window.fundoBranco ? 'rgba(60, 58, 62, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: cores,
                borderColor: cores.map(c => c),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: CORES_ARCHIPELAGO.azulMarinhoEscuro,
                    titleColor: corTexto,
                    bodyColor: corTexto,
                    borderColor: CORES_ARCHIPELAGO.azulPrincipal,
                    borderWidth: 1,
                    padding: 10
                },
                datalabels: hasDataLabels ? {
                    anchor: 'end',
                    align: 'end',
                    color: corTexto,
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: (value) => value > 0 ? value : ''
                } : false
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: corTexto,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: corGrid
                    }
                },
                y: {
                    ticks: {
                        color: corTexto,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: hasDataLabels ? [ChartDataLabels] : []
    });
}

function renderStyles_Hosp() {
    return `
        <style>
            .dashboard-hospitalar-wrapper {
                width: 100%;
                max-width: 1400px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .hospital-filter-selector {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto 30px auto;
                width: 100%;
                max-width: 500px;
            }
            
            .hospital-filter-select {
                width: 100%;
                padding: 14px 20px;
                font-size: 15px;
                font-family: 'Poppins', sans-serif;
                font-weight: 600;
                color: #ffffff;
                background: ${CORES_ARCHIPELAGO.azulEscuro};
                border: 2px solid ${CORES_ARCHIPELAGO.azulPrincipal};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                appearance: none;
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 12px center;
                background-size: 20px;
                padding-right: 45px;
            }
            
            .hospital-filter-select:hover {
                background: ${CORES_ARCHIPELAGO.azulMedio};
                border-color: ${CORES_ARCHIPELAGO.azulClaro};
                transform: translateY(-1px);
            }
            
            .hospital-filter-select:focus {
                outline: none;
                border-color: ${CORES_ARCHIPELAGO.azulPrincipal};
                box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
            }
            
            .hospital-filter-select option {
                background: ${CORES_ARCHIPELAGO.azulMarinhoEscuro};
                color: #ffffff;
                padding: 10px;
                font-size: 14px;
            }
            
            .dashboard-title-central {
                text-align: center;
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
                margin: 0 0 30px 0;
                letter-spacing: 0.5px;
                text-transform: none !important;
            }
            
            .btn-whatsapp-dashboard {
                display: block;
                margin: 0 auto 30px auto;
                padding: 14px 32px;
                background: ${CORES_ARCHIPELAGO.verde};
                color: #ffffff;
                border: none;
                border-radius: 8px;
                font-family: 'Poppins', sans-serif;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(41, 173, 141, 0.3);
                text-transform: none !important;
            }
            
            .btn-whatsapp-dashboard:hover {
                background: #23976f;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(41, 173, 141, 0.4);
            }
            
            .hospitais-container {
                display: flex;
                flex-direction: column;
                gap: 30px;
                width: 100%;
            }
            
            .hospital-card {
                background: ${CORES_ARCHIPELAGO.azulEscuro};
                border-radius: 16px;
                padding: 25px;
                width: 100%;
                box-sizing: border-box;
                border: 2px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            }
            
            .hospital-card:hover {
                border-color: ${CORES_ARCHIPELAGO.azulPrincipal};
                box-shadow: 0 8px 24px rgba(96, 165, 250, 0.15);
            }
            
            .hospital-header {
                border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 15px;
                margin-bottom: 25px;
            }
            
            .hospital-name {
                color: #ffffff;
                font-size: 22px;
                font-weight: 700;
                margin: 0;
                text-align: center;
                letter-spacing: 0.5px;
                text-transform: none !important;
            }
            
            .hospital-content {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 25px;
            }
            
            .box-ocupacao,
            .box-previsao,
            .box-disponiveis,
            .box-tph,
            .box-pps,
            .box-spict,
            .box-leitos {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.8);
                border-top: 3px solid #ffffff;
            }
            
            .box-title {
                font-size: 15px;
                font-weight: 700;
                color: #e2e8f0;
                margin-bottom: 15px;
                text-align: center;
                letter-spacing: 0.5px;
                text-transform: none !important;
            }
            
            .box-subtitle {
                font-size: 13px;
                font-weight: 600;
                color: ${CORES_ARCHIPELAGO.azulPrincipal};
                margin: 15px 0 10px 0;
                text-align: center;
                letter-spacing: 0.3px;
                text-transform: none !important;
            }
            
            .gauge-center {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 120px;
            }
            
            .v5-gauge-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }
            
            .v5-gauge {
                width: 140px;
                height: 80px;
                filter: drop-shadow(0 2px 8px rgba(96, 165, 250, 0.3));
            }
            
            .v5-number-inside {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -10%);
                font-size: 36px;
                font-weight: 800;
                color: #ffffff;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .v5-badge-below {
                background: ${CORES_ARCHIPELAGO.azulPrincipal};
                color: #ffffff;
                padding: 6px 18px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(96, 165, 250, 0.4);
                text-transform: none !important;
            }
            
            .lista-simples-compacta {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .lista-item-compacto {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                border-left: 3px solid ${CORES_ARCHIPELAGO.azulPrincipal};
                transition: all 0.2s ease;
            }
            
            .lista-item-compacto:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: translateX(2px);
            }
            
            .lista-item-compacto .label {
                font-size: 12px;
                font-weight: 600;
                color: ${CORES_ARCHIPELAGO.cinzaMedio};
                letter-spacing: 0.3px;
                text-transform: none !important;
            }
            
            .lista-item-compacto .valor {
                font-size: 14px;
                font-weight: 700;
                color: ${CORES_ARCHIPELAGO.azulPrincipal};
            }
            
            .tph-mini-gauge {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .tph-gauge-bar {
                display: flex;
                gap: 2px;
                height: 24px;
                width: 100%;
                max-width: 240px;
                border-radius: 4px;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.05);
                padding: 2px;
            }
            
            .tph-gauge-block {
                flex: 1;
                border-radius: 2px;
                transition: all 0.3s ease;
            }
            
            .tph-gauge-bar.green .tph-gauge-block.filled {
                background: ${CORES_ARCHIPELAGO.verde};
            }
            
            .tph-gauge-bar.yellow .tph-gauge-block.filled {
                background: ${CORES_ARCHIPELAGO.amarelo};
            }
            
            .tph-gauge-bar.red .tph-gauge-block.filled {
                background: ${CORES_ARCHIPELAGO.laranja};
            }
            
            .tph-gauge-block.empty {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .tph-gauge-label {
                font-size: 14px;
                font-weight: 700;
                color: ${CORES_ARCHIPELAGO.azulPrincipal};
                letter-spacing: 0.5px;
            }
            
            .hospitais-table-wrapper {
                width: 100%;
                overflow-x: auto;
                margin-top: 10px;
            }
            
            .hospitais-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            
            .hospitais-table thead th {
                background: rgba(96, 165, 250, 0.1);
                color: ${CORES_ARCHIPELAGO.azulPrincipal};
                padding: 10px 8px;
                text-align: center;
                font-weight: 700;
                font-size: 11px;
                letter-spacing: 0.3px;
                border-bottom: 2px solid ${CORES_ARCHIPELAGO.azulPrincipal};
                text-transform: none !important;
            }
            
            .hospitais-table tbody td {
                padding: 10px 8px;
                text-align: center;
                color: #ffffff;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                font-size: 11px;
            }
            
            .box-tph .hospitais-table thead th:nth-child(1),
            .box-tph .hospitais-table tbody td:nth-child(1) {
                text-align: left !important;
            }
            .box-tph .hospitais-table thead th:nth-child(2),
            .box-tph .hospitais-table tbody td:nth-child(2),
            .box-tph .hospitais-table thead th:nth-child(3),
            .box-tph .hospitais-table tbody td:nth-child(3) {
                text-align: right !important;
            }
            
            .box-pps .hospitais-table thead th:nth-child(1),
            .box-pps .hospitais-table tbody td:nth-child(1),
            .box-spict .hospitais-table thead th:nth-child(1),
            .box-spict .hospitais-table tbody td:nth-child(1) {
                text-align: left !important;
            }
            .box-pps .hospitais-table thead th:nth-child(2),
            .box-pps .hospitais-table tbody td:nth-child(2),
            .box-spict .hospitais-table thead th:nth-child(2),
            .box-spict .hospitais-table tbody td:nth-child(2) {
                text-align: right !important;
            }
            
            .hospitais-table tbody tr:last-child td {
                border-bottom: none;
            }
            
            .hospitais-table tbody tr:hover {
                background: rgba(255, 255, 255, 0.03);
            }
            
            .sem-dados {
                text-align: center;
                padding: 15px;
                color: ${CORES_ARCHIPELAGO.azulAcinzentado};
                font-style: italic;
                font-size: 11px;
                text-transform: none !important;
            }
            
            .graficos-verticais {
                display: flex;
                flex-direction: column;
                gap: 25px;
                width: 100%;
            }
            
            .grafico-item {
                width: 100%;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.8);
                border-top: 3px solid #ffffff;
                box-sizing: border-box;
            }
            
            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .chart-header h4 {
                margin: 0;
                color: #e2e8f0;
                font-size: 16px;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-align: center;
                width: 100%;
                text-transform: none !important;
            }
            
            .chart-container {
                position: relative;
                height: 400px;
                width: 100%;
                background: rgba(156, 163, 175, 0.3);
                border-radius: 8px;
                padding: 15px;
                box-sizing: border-box;
            }
            
            .chart-container canvas {
                width: 100% !important;
                height: 100% !important;
                max-height: 370px !important;
            }
            
            .timeline-boxes-container {
                width: 100%;
                margin-top: 15px;
            }
            
            .timeline-boxes-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                width: 100%;
            }
            
            .timeline-box {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
                min-height: 400px;
                display: flex;
                flex-direction: column;
            }
            
            .timeline-box-header {
                background: rgba(96, 165, 250, 0.2);
                padding: 12px;
                text-align: center;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.5px;
                color: ${CORES_ARCHIPELAGO.azulPrincipal};
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                text-transform: none !important;
            }
            
            .timeline-chart-container {
                height: 200px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .timeline-chart {
                max-height: 180px !important;
            }
            
            .timeline-box-content {
                padding: 12px;
                flex: 1;
                overflow-y: auto;
                max-height: 250px;
            }
            
            .timeline-item {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
                border-left: 3px solid;
                transition: all 0.2s ease;
            }
            
            .timeline-item:hover {
                background: rgba(255, 255, 255, 0.07);
                transform: translateX(2px);
            }
            
            .timeline-item:last-child {
                margin-bottom: 0;
            }
            
            .timeline-item-name {
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 6px;
                color: #ffffff;
                text-transform: none !important;
            }
            
            .timeline-item-mats {
                font-size: 11px;
                color: #ffffff;
                line-height: 1.4;
            }
            
            /* =================== RESPONSIVIDADE MOBILE =================== */
            @media (max-width: 768px) {
                .hospital-filter-selector {
                    padding: 0 10px;
                }
                
                .hospital-filter-select {
                    width: 100%;
                    min-width: auto;
                    max-width: 100%;
                    padding: 12px 16px;
                    font-size: 14px;
                }
                
                .dashboard-title-central {
                    font-size: 20px !important;
                }
                
                .btn-whatsapp-dashboard {
                    width: 100%;
                }
                
                .kpis-grid {
                    grid-template-columns: 1fr;
                    padding: 0 10px !important;
                    margin: 0 auto !important;
                }
                
                .kpi-box {
                    margin-left: auto !important;
                    margin-right: auto !important;
                    max-width: 100% !important;
                }
                
                .hospital-card {
                    padding: 15px !important;
                    margin: 0 auto 20px auto !important;
                    max-width: calc(100vw - 20px) !important;
                }
                
                .hospital-content {
                    grid-template-columns: 1fr !important;
                }
                
                .timeline-boxes-grid {
                    grid-template-columns: 1fr;
                }
                
                .dashboard-hospitalar-wrapper {
                    padding: 10px !important;
                }
                
                .hospitais-container {
                    padding: 0 !important;
                }
            }
        </style>
    `;
}

window.renderizarDashboard = window.renderDashboardHospitalar;
window.renderDashboard = window.renderDashboardHospitalar;

window.forceDataRefresh = function() {
    window.location.reload();
};

console.log('Dashboard Hospitalar V6.0 - Carregado com Sucesso!');