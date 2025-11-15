// =================== CARDS.JS - GESTAO DE LEITOS HOSPITALARES ===================
// Versao: 6.1
// ✅ NOVIDADES V6.1: Filtro inteligente de vagos (só 1 híbrido, 1 apto + todas enf para tipos fixos)
// ✅ NOVIDADES V6.0: H8, H9, sistema de leitos extras, Santa Clara 4 pares, anotações
// Depende de: cards-config.js (carregar ANTES)

console.log('CARDS.JS v6.1 - Carregando...');

// =================== VALIDAR DEPENDENCIAS ===================
if (typeof window.CONCESSOES_DISPLAY_MAP === 'undefined') {
    console.error('ERRO CRITICO: cards-config.js NAO foi carregado!');
    throw new Error('cards-config.js deve ser carregado ANTES de cards.js');
}

if (typeof window.desnormalizarTexto === 'undefined') {
    console.error('ERRO CRITICO: desnormalizarTexto() nao encontrada!');
    throw new Error('cards-config.js nao carregou corretamente');
}

console.log('Dependencias validadas - cards-config.js OK');

// =================== VARIAVEIS GLOBAIS (do cards-config.js) ===================
// ESTAS JA EXISTEM EM cards-config.js - NAO REDECLARAR:
// - window.CONCESSOES_DISPLAY_MAP
// - window.LINHAS_DISPLAY_MAP
// - window.normalizarTexto()
// - window.desnormalizarTexto()
// - window.HOSPITAL_MAPPING
// - window.CRUZ_AZUL_IRMAOS (leitos irmaos)
// - window.selectedLeito
// - window.currentHospital
//
// V6.0 - NOVAS VARIÁVEIS:
// - window.HOSPITAL_CAPACIDADE (extras)
// - window.SANTA_CLARA_IRMAOS (4 pares)
// - window.calcularLeitosExtras()
// - window.isLeitoExtra()
// - window.getHospitalNome()
// - window.getCapacidade()
// - window.getLeitoIrmao()

// =================== LISTAS DE OPCOES (do cards-config.js) ===================
// - window.CONCESSOES_LIST
// - window.LINHAS_CUIDADO_LIST
// - window.PPS_OPTIONS
// - window.PREVISAO_ALTA_OPTIONS
// - window.ISOLAMENTO_OPTIONS
// - window.REGIAO_OPTIONS
// - window.SEXO_OPTIONS
// - window.DIRETIVAS_OPTIONS
// - window.IDADE_OPTIONS

// =================== CONTINUACAO DO CARDS.JS ===================

// =================== FUNÇÃO: SELECT HOSPITAL ===================
window.selectHospital = function(hospitalId) {
    const nomeHospital = window.getHospitalNome(hospitalId);
    logInfo(`Selecionando hospital: ${hospitalId} (${nomeHospital})`);
    
    window.currentHospital = hospitalId;
    
    document.querySelectorAll('.hospital-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.hospital === hospitalId) {
            btn.classList.add('active');
        }
    });
    
    window.renderCards();
    logSuccess(`Hospital selecionado: ${nomeHospital}`);
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
    logInfo(`Busca: "${searchTerm}" - ${visibleCards.length} resultados`);
};

// =================== FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO - V6.1 ===================
window.renderCards = function() {
    logInfo('Renderizando cards - Gestão de Leitos Hospitalares V6.1');
    
    const container = document.getElementById('cardsContainer');
    if (!container) {
        logError('Container cardsContainer não encontrado');
        return;
    }

    container.innerHTML = '';
    const hospitalId = window.currentHospital || 'H1';
    const hospital = window.hospitalData[hospitalId];
    const hospitalNome = window.getHospitalNome(hospitalId);
    
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
    
    // =================== ✅ SEPARAR E ORDENAR ===================
    
    // Separar ocupados e vagos
    const leitosOcupados = hospital.leitos.filter(l => 
        l.status === 'Ocupado' || l.status === 'Em uso' || l.status === 'ocupado'
    );
    const leitosVagos = hospital.leitos.filter(l => 
        l.status === 'Vago' || l.status === 'vago'
    );
    
    // ✅ V6.1: CALCULAR LEITOS EXTRAS
    const capacidade = window.getCapacidade(hospitalId);
    const { contratuais, extras } = window.calcularLeitosExtras(hospitalId, leitosOcupados);
    logInfo(`${hospitalId}: ${contratuais} contratuais + ${extras} extras ocupados`);
    
    // Ordenar OCUPADOS por identificacao_leito (coluna AQ)
    leitosOcupados.sort((a, b) => {
        const idA = a.identificacaoLeito || a.identificacao_leito || '';
        const idB = b.identificacaoLeito || b.identificacao_leito || '';
        
        // Se ambos têm identificação, ordenar alfabeticamente
        if (idA && idB) {
            return idA.localeCompare(idB);
        }
        
        // Se só A tem identificação, A vem primeiro
        if (idA) return -1;
        if (idB) return 1;
        
        // Se nenhum tem, ordenar por número do leito
        return (a.leito || 0) - (b.leito || 0);
    });
    
    // Ordenar VAGOS por número do leito
    leitosVagos.sort((a, b) => (a.leito || 0) - (b.leito || 0));
    
    // =================== ✅ V6.1: FILTRAR VAGOS ===================
    
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    const isCruzAzul = hospitalId === 'H2';
    const isSantaClara = hospitalId === 'H4';
    const isTiposFixos = isCruzAzul || isSantaClara;
    
    let vagosFiltrados = [];
    
    if (isHibrido) {
        // ✅ HÍBRIDOS: Mostrar SÓ 1 vago (menor ID)
        if (leitosVagos.length > 0) {
            vagosFiltrados.push(leitosVagos[0]);
        }
        logInfo(`${hospitalId} (híbrido): ${leitosVagos.length} vagos → mostrando 1`);
        
    } else if (isTiposFixos) {
        // ✅ TIPOS FIXOS: 1 apartamento + TODAS enfermarias (exceto bloqueadas)
        
        // Separar apartamentos e enfermarias
        const vagosApartamento = leitosVagos.filter(l => {
            const numeroLeito = parseInt(l.leito);
            if (isCruzAzul) {
                return numeroLeito >= 1 && numeroLeito <= 20;
            } else if (isSantaClara) {
                return (numeroLeito <= 9) || (numeroLeito >= 27);
            }
            return false;
        });
        
        const vagosEnfermaria = leitosVagos.filter(l => {
            const numeroLeito = parseInt(l.leito);
            if (isCruzAzul) {
                return numeroLeito >= 21 && numeroLeito <= 36;
            } else if (isSantaClara) {
                return numeroLeito >= 10 && numeroLeito <= 26;
            }
            return false;
        });
        
        // 1 apartamento vago (menor ID)
        if (vagosApartamento.length > 0) {
            vagosFiltrados.push(vagosApartamento[0]);
        }
        
        // TODAS as enfermarias vagas (exceto bloqueadas por isolamento)
        vagosEnfermaria.forEach(leitoVago => {
            const numeroLeito = parseInt(leitoVago.leito);
            const leitoIrmao = window.getLeitoIrmao(hospitalId, numeroLeito);
            
            if (!leitoIrmao) {
                // Sem irmão: mostrar
                vagosFiltrados.push(leitoVago);
                return;
            }
            
            // Verificar se irmão está ocupado
            const dadosIrmao = leitosOcupados.find(l => l.leito == leitoIrmao);
            
            if (!dadosIrmao) {
                // Irmão vago: mostrar
                vagosFiltrados.push(leitoVago);
                return;
            }
            
            // Irmão ocupado: verificar isolamento
            const isolamentoIrmao = dadosIrmao.isolamento || '';
            if (isolamentoIrmao && isolamentoIrmao !== 'Não Isolamento') {
                // Bloqueado por isolamento: NÃO mostrar
                logInfo(`Leito ${numeroLeito} bloqueado por isolamento do irmão ${leitoIrmao}`);
                return;
            }
            
            // Irmão ocupado sem isolamento: mostrar (com restrição de gênero)
            vagosFiltrados.push(leitoVago);
        });
        
        logInfo(`${hospitalId} (tipos fixos): ${vagosApartamento.length} aptos → mostrando 1`);
        logInfo(`${hospitalId} (tipos fixos): ${vagosEnfermaria.length} enfs → mostrando ${vagosFiltrados.length - (vagosApartamento.length > 0 ? 1 : 0)}`);
    }
    
    // =================== ✅ JUNTAR E RENDERIZAR ===================
    
    const leitosOrdenados = [...leitosOcupados, ...vagosFiltrados];
    
    console.log('[CARDS V6.1] Total renderizado:', leitosOrdenados.length);
    console.log('[CARDS V6.1] Ocupados:', leitosOcupados.length, '| Vagos filtrados:', vagosFiltrados.length);
    
    leitosOrdenados.forEach((leito, index) => {
        // ✅ V6.1: Passar o índice para calcular se é extra
        const card = createCard(leito, hospitalNome, index, leitosOcupados.length);
        container.appendChild(card);
    });
    
    logInfo(`${leitosOrdenados.length} cards renderizados para ${hospitalNome}`);
};

// =================== FUNÇÃO: BADGE DE ISOLAMENTO ===================
function getBadgeIsolamento(isolamento) {
    if (!isolamento || isolamento === 'Não Isolamento') {
        return { cor: '#b2adaa', texto: 'Não Isol', textoCor: '#ffffff' };
    } else if (isolamento === 'Isolamento de Contato') {
        return { cor: '#f59a1d', texto: 'Contato', textoCor: '#131b2e' };
    } else if (isolamento === 'Isolamento Respiratório') {
        return { cor: '#c86420', texto: 'Respiratório', textoCor: '#ffffff' };
    }
    return getBadgeIsolamento('Não Isolamento');
}

// =================== FUNÇÃO: BADGE DE GÊNERO ===================
function getBadgeGenero(sexo) {
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

// BADGE DE DIRETIVAS
function getBadgeDiretivas(diretivas) {
    if (diretivas === 'Sim') {
        return { cor: 'rgba(96,165,250,0.2)', borda: '#60a5fa', textoCor: '#60a5fa', texto: 'Sim' };
    } else if (diretivas === 'Não') {
        return { cor: 'rgba(60,58,62,0.2)', borda: '#3c3a3e', textoCor: '#b2adaa', texto: 'Não' };
    }
    return { cor: 'rgba(96,165,250,0.2)', borda: '#60a5fa', textoCor: '#60a5fa', texto: 'Não se aplica' };
}

// DETERMINAR TIPO REAL DO LEITO
function getTipoLeito(leito, hospitalId) {
    const categoriaValue = leito.categoriaEscolhida || 
                          leito.categoria || 
                          leito.categoria_escolhida || 
                          leito.tipo_quarto ||
                          leito.tipoQuarto;
    
    const numeroLeito = parseInt(leito.leito);
    
    // ✅ V6.0: SANTA CLARA AGORA É TIPOS FIXOS (não mais híbrido com limites)
    if (hospitalId === 'H4') {
        const isVago = leito.status === 'Vago' || leito.status === 'vago';
        
        // Apartamentos fixos: 1-9 e 27-35 (contratuais) + 36-57 (extras)
        if (numeroLeito <= 9 || numeroLeito >= 27) {
            return 'Apartamento';
        }
        
        // Enfermarias: 10-17 (contratuais com irmãos) + 18-26 (extras)
        if (numeroLeito >= 10 && numeroLeito <= 26) {
            return 'Enfermaria';
        }
        
        return leito.tipo || 'Apartamento';
    }
    
    // VAGOS de híbridos: "Híbrido"
    const isVago = leito.status === 'Vago' || leito.status === 'vago';
    if (window.HOSPITAIS_HIBRIDOS.includes(hospitalId) && isVago) {
        return 'Híbrido';
    }
    
    // OCUPADOS de híbridos: usar categoria
    const isOcupado = leito.status === 'Em uso' || leito.status === 'ocupado' || leito.status === 'Ocupado';
    if (window.HOSPITAIS_HIBRIDOS.includes(hospitalId) && isOcupado) {
        if (categoriaValue && categoriaValue.trim() !== '' && categoriaValue !== 'Híbrido') {
            return categoriaValue;
        }
        if (leito.tipo && leito.tipo !== 'Híbrido') return leito.tipo;
        return 'Apartamento';
    }
    
    return leito.tipo || 'Apartamento';
}

// FORMATAÇÃO DO TIPO (SEM EMOJI)
function formatarTipoTexto(tipo) {
    const tipoUpper = (tipo || '').toUpperCase().trim();
    
    switch(tipoUpper) {
        case 'APARTAMENTO':
        case 'APTO':
            return 'Apartamento';
        case 'ENFERMARIA':
        case 'ENF':
            return 'Enfermaria';
        case 'HIBRIDO':
        case 'HÍBRIDO':
            return 'Híbrido';
        default:
            return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    }
}

// FORMATAR MATRÍCULA COM HÍFEN NO ÚLTIMO DÍGITO
function formatarMatriculaExibicao(matricula) {
    if (!matricula || matricula === '—') return '—';
    const mat = String(matricula).replace(/\D/g, '');
    if (mat.length === 0) return '—';
    if (mat.length === 1) return mat;
    return mat.slice(0, -1) + '-' + mat.slice(-1);
}

// VALIDAÇÃO DE BLOQUEIO CRUZ AZUL E SANTA CLARA (V6.0)
function validarAdmissaoCruzAzul(leitoNumero, generoNovo) {
    const hospitalId = window.currentHospital;
    
    // ✅ V6.0: VALIDAR TANTO CRUZ AZUL QUANTO SANTA CLARA
    if (hospitalId === 'H2' && (leitoNumero < 21 || leitoNumero > 36)) {
        return { permitido: true };
    }
    
    if (hospitalId === 'H4' && (leitoNumero < 10 || leitoNumero > 17)) {
        return { permitido: true };
    }
    
    const leitoIrmao = window.getLeitoIrmao(hospitalId, leitoNumero);
    if (!leitoIrmao) return { permitido: true };
    
    const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
    const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
    
    if (!dadosLeitoIrmao || dadosLeitoIrmao.status === 'Vago' || dadosLeitoIrmao.status === 'vago') {
        return { permitido: true };
    }
    
    const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
    if (isolamentoIrmao && isolamentoIrmao !== 'Não Isolamento' && isolamentoIrmao !== '') {
        return {
            permitido: false,
            motivo: `Leito bloqueado! O leito ${leitoIrmao} está com isolamento: ${isolamentoIrmao}`,
            tipo: 'isolamento'
        };
    }
    
    const generoIrmao = dadosLeitoIrmao.genero || '';
    if (generoIrmao && generoNovo && generoIrmao !== generoNovo) {
        return {
            permitido: false,
            motivo: `Leito bloqueado! O leito ${leitoIrmao} está ocupado por paciente do gênero ${generoIrmao}`,
            tipo: 'genero'
        };
    }
    
    return { permitido: true };
}

// ✅ V6.0: VALIDAÇÃO SANTA CLARA - AGORA USA SISTEMA DE IRMÃOS (NÃO MAIS LIMITES 9+4)
function validarLimiteSantaClara(tipoQuarto) {
    // ✅ V6.0: Santa Clara não tem mais limites de 9+4
    // Agora usa sistema de irmãos igual ao Cruz Azul
    // Esta função pode ser removida ou retornar sempre true
    return { permitido: true };
}

// =================== ✅ V6.0: FUNÇÃO PARA RENDERIZAR FLAG DE OCUPAÇÃO ===================
function renderFlagOcupacao(isExtra, posicao, capacidade) {
    if (isExtra) {
        const numExtra = posicao - capacidade.contratuais;
        return `
            <div class="flag-extra">
                EXTRA ${numExtra}/${capacidade.extras}
            </div>
        `;
    } else {
        return `
            <div class="flag-contratual">
                OCUPAÇÃO ${posicao}/${capacidade.contratuais}
            </div>
        `;
    }
}

// =================== CRIAR CARD INDIVIDUAL - ✅ V6.0 COM LEITOS EXTRAS E ANOTAÇÕES ===================
function createCard(leito, hospitalNome, index, totalOcupados) {
    const card = document.createElement('div');
    
    // ✅ V6.0: CALCULAR SE É LEITO EXTRA
    const hospitalId = window.currentHospital;
    const isOcupado = leito.status === 'Ocupado' || leito.status === 'Em uso' || leito.status === 'ocupado';
    const posicaoOcupacao = isOcupado ? (index + 1) : 0;
    const capacidade = window.getCapacidade(hospitalId);
    const isExtra = isOcupado && window.isLeitoExtra(hospitalId, posicaoOcupacao);
    
    // ✅ V6.0: ADICIONAR CLASSE EXTRA SE NECESSÁRIO
    const cardClass = isExtra ? 'card card-ocupado card-extra' : 'card';
    card.className = cardClass;
    card.style.cssText = 'background: #1a1f2e; border-radius: 12px; padding: 18px; color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: "Poppins", sans-serif;';
    
    // VERIFICAR BLOQUEIO CRUZ AZUL E SANTA CLARA (V6.0)
    let bloqueadoPorIsolamento = false;
    let bloqueadoPorGenero = false;
    let generoPermitido = null;
    let motivoBloqueio = '';
    
    const numeroLeito = parseInt(leito.leito);
    
    // ✅ V6.0: Verificar bloqueio para Cruz Azul E Santa Clara
    const isCruzAzulEnfermaria = (hospitalId === 'H2' && numeroLeito >= 21 && numeroLeito <= 36);
    const isSantaClaraEnfermaria = (hospitalId === 'H4' && numeroLeito >= 10 && numeroLeito <= 17);
    
    if ((isCruzAzulEnfermaria || isSantaClaraEnfermaria) && (leito.status === 'Vago' || leito.status === 'vago')) {
        const leitoIrmao = window.getLeitoIrmao(hospitalId, numeroLeito);
        if (leitoIrmao) {
            const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
            const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
            
            if (dadosLeitoIrmao && (dadosLeitoIrmao.status === 'Em uso' || dadosLeitoIrmao.status === 'ocupado')) {
                const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
                if (isolamentoIrmao && isolamentoIrmao !== 'Não Isolamento') {
                    bloqueadoPorIsolamento = true;
                const identificacaoIrmao = dadosLeitoIrmao?.identificacaoLeito || 
                                           dadosLeitoIrmao?.identificacao_leito || 
                                           `Leito ${leitoIrmao}`;
                motivoBloqueio = `Isolamento no ${identificacaoIrmao}`;
                } else if (dadosLeitoIrmao.genero) {
                    bloqueadoPorGenero = true;
                    generoPermitido = dadosLeitoIrmao.genero;
                }
            }
        }
    }
    
    // Determinar status
    let isVago = false;
    let statusBgColor = '#60a5fa';
    let statusTextColor = '#ffffff';
    let statusTexto = 'Disponível';
    
    if (bloqueadoPorIsolamento) {
        statusBgColor = '#c86420';
        statusTextColor = '#ffffff';
        statusTexto = 'BLOQUEADO';
    } else if (leito.status === 'Em uso' || leito.status === 'ocupado' || leito.status === 'Ocupado') {
        isVago = false;
        statusBgColor = '#f59a1d';
        statusTextColor = '#131b2e';
        statusTexto = 'Ocupado';
    } else if (leito.status === 'Vago' || leito.status === 'vago') {
        isVago = true;
        if (bloqueadoPorGenero) {
            statusTexto = `Disp. ${generoPermitido === 'Masculino' ? 'Masc' : 'Fem'}`;
        }
    }
    
    // Dados do paciente
    const nome = leito.nome || '';
    const matricula = leito.matricula || '';
    const matriculaFormatada = formatarMatriculaExibicao(matricula);
    const idade = leito.idade || null;
    const admissao = leito.admAt || '';
    const pps = leito.pps || null;
    const spict = leito.spict || '';
    const previsaoAlta = leito.prevAlta || '';
    
    // ✅ V6.0: CAMPO ANOTAÇÕES
    const anotacoes = leito.anotacoes || '';
    
    // Normalizar isolamento
    let isolamento = leito.isolamento || 'Não Isolamento';
    const isolamentoLower = isolamento.toLowerCase().trim();
    
    if (isolamentoLower === 'isolamento de contato' || isolamentoLower === 'isolamento contato') {
        isolamento = 'Isolamento de Contato';
    } else if (isolamentoLower === 'isolamento respiratorio' || isolamentoLower === 'isolamento respiratório') {
        isolamento = 'Isolamento Respiratório';
    } else if (isolamentoLower === 'nao isolamento' || isolamentoLower === 'não isolamento' || isolamentoLower.includes('nao isol')) {
        isolamento = 'Não Isolamento';
    }
    
    // Identificação do leito
    let identificacaoLeito = leito.identificacaoLeito || leito.identificacao_leito || '';
    
    const regiao = leito.regiao || '';
    const sexo = leito.genero || '';
    const diretivas = leito.diretivas || 'Não se aplica';
    
    const tipoReal = getTipoLeito(leito, hospitalId);
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    
    const badgeIsolamento = getBadgeIsolamento(isolamento);
    const badgeGenero = getBadgeGenero(sexo);
    const badgeDiretivas = getBadgeDiretivas(diretivas);
    
    // ✅ DESNORMALIZAR CONCESSÕES E LINHAS PARA EXIBIÇÃO - USAR window.desnormalizarTexto
    const concessoesRaw = Array.isArray(leito.concessoes) ? leito.concessoes : [];
    const concessoes = concessoesRaw.map(c => window.desnormalizarTexto(c));
    
    const linhasRaw = Array.isArray(leito.linhas) ? leito.linhas : [];
    const linhas = linhasRaw.map(l => window.desnormalizarTexto(l));
    
    let tempoInternacao = '';
    if (!isVago && admissao) {
        tempoInternacao = calcularTempoInternacao(admissao);
    }
    
    const iniciais = isVago ? '—' : (nome ? String(nome).trim() : '—');
    
    let ppsFormatado = pps ? `${pps}%` : '—';
    if (ppsFormatado !== '—' && !ppsFormatado.includes('%')) {
        ppsFormatado = `${pps}%`;
    }
    
    const spictFormatado = spict === 'elegivel' ? 'Elegível' : 
                          (spict === 'nao_elegivel' ? 'Não elegível' : '—');
    
    const idSequencial = String(numeroLeito).padStart(2, '0');
    
    let leitoDisplay = identificacaoLeito && identificacaoLeito.trim() 
        ? identificacaoLeito.trim().toUpperCase()
        : `LEITO ${numeroLeito}`;
    
    // COR DO CÍRCULO PESSOA
    const circuloCor = '#60a5fa'; // Sempre azul vibrante
    // COR DO DESENHO (SVG): azul escuro quando vago, branco quando ocupado
    const circuloStroke = isVago ? '#1a1f2e' : '#ffffff';
    
    // HTML do Card
    card.innerHTML = `
        <!-- HEADER: HOSPITAL FORA DOS BOXES -->
        <div class="card-header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; font-family: 'Poppins', sans-serif;">
            <div style="font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">HOSPITAL</div>
            <div style="font-size: 16px; color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${hospitalNome}</div>
            ${isHibrido ? '<div style="font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600; margin-top: 2px;">Leito Híbrido</div>' : ''}
        </div>

        <!-- ✅ V6.0: FLAGS DE OCUPAÇÃO (CONTRATUAL/EXTRA) -->
        ${isOcupado ? `
        <div class="flags-container" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            ${renderFlagOcupacao(isExtra, posicaoOcupacao, capacidade)}
        </div>
        ` : ''}

        <!-- LINHA 1: LEITO | TIPO | STATUS -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-box" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">LEITO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;" data-leito-numero="${numeroLeito}">${leitoDisplay}</div>
            </div>
            
            <div class="card-box" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">TIPO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">${formatarTipoTexto(tipoReal)}</div>
            </div>
            
            <div class="status-badge" style="background: ${statusBgColor}; color: ${statusTextColor}; padding: 12px 6px; border-radius: 6px; font-weight: 800; text-transform: uppercase; text-align: center; font-size: 11px; letter-spacing: 0.5px; min-height: 45px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="box-label" style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; color: ${statusTextColor};">STATUS</div>
                <div class="box-value" style="font-weight: 700; font-size: 11px; line-height: 1.2; color: ${statusTextColor};">${statusTexto}</div>
                ${motivoBloqueio ? `<div style="font-size: 8px; margin-top: 2px; color: ${statusTextColor};">${motivoBloqueio}</div>` : ''}
            </div>
        </div>

        <!-- LINHA 2: GÊNERO | ISOLAMENTO | PREVISÃO ALTA -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-box sexo" style="background: ${badgeGenero.cor}; border: 1px solid ${badgeGenero.borda}; border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: ${badgeGenero.textoCor}; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">GÊNERO</div>
                <div class="box-value" style="color: ${badgeGenero.textoCor}; font-weight: 700; font-size: 11px; line-height: 1.2;">${badgeGenero.texto}</div>
            </div>
            
            <div class="card-box isolamento" style="background: ${badgeIsolamento.cor}; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: ${badgeIsolamento.textoCor}; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">ISOLAMENTO</div>
                <div class="box-value" style="color: ${badgeIsolamento.textoCor}; font-weight: 700; font-size: 11px; line-height: 1.2;">${badgeIsolamento.texto}</div>
            </div>
            
            <div class="card-box prev-alta" style="background: #60a5fa; border: 1px solid rgba(96,165,250,0.5); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: #ffffff; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">PREVISÃO ALTA</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">${previsaoAlta || '—'}</div>
            </div>
        </div>

        <!-- LINHA DIVISÓRIA BRANCA SÓLIDA -->
        <div class="divider" style="height: 2px; background: #ffffff; margin: 12px 0;"></div>

        <!-- SEÇÃO PESSOA: CÍRCULO + 4 CÉLULAS -->
        <div class="card-row-pessoa" style="display: grid; grid-template-columns: 100px 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="pessoa-circle" style="grid-row: span 2; grid-column: 1; width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ${circuloCor};">
                <svg class="pessoa-icon" viewBox="0 0 24 24" fill="none" stroke="${circuloStroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 55%; height: 55%;">
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>
                </svg>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">INICIAIS</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;" data-iniciais="${iniciais}">${iniciais}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">MATRÍCULA</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;" data-matricula="${matricula}">${matriculaFormatada}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">IDADE</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${idade ? idade + ' anos' : '—'}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">REGIÃO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${regiao || '—'}</div>
            </div>
        </div>

        <!-- LINHA 3: PPS | SPICT-BR | DIRETIVAS -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 12px; font-family: 'Poppins', sans-serif;">
            <div class="card-box" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">PPS</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">${ppsFormatado}</div>
            </div>
            
            <div class="card-box" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">SPICT-BR</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">${spictFormatado}</div>
            </div>
            
            <div class="card-box" style="background: ${badgeDiretivas.cor}; border: 1px solid ${badgeDiretivas.borda}; border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: ${badgeDiretivas.textoCor}; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">DIRETIVAS</div>
                <div class="box-value" style="color: ${badgeDiretivas.textoCor}; font-weight: 700; font-size: 11px; line-height: 1.2;">${badgeDiretivas.texto}</div>
            </div>
        </div>

        <!-- CONCESSÕES - ✅ COM DESNORMALIZAÇÃO -->
        <div class="card-section" style="margin-bottom: 15px; font-family: 'Poppins', sans-serif;">
            <div class="section-header" style="background: #60a5fa; color: #ffffff; font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
                CONCESSÕES PREVISTAS NA ALTA
            </div>
            <div class="chips-container" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; border-radius: 6px; padding: 8px;">
                ${(concessoes && concessoes.length > 0) 
                    ? concessoes.map(concessao => `<span class="chip" style="font-size: 9px; background: rgba(96,165,250,0.2); border: 1px solid rgba(96,165,250,0.4); color: #60a5fa; padding: 3px 8px; border-radius: 10px; font-weight: 700; font-family: 'Poppins', sans-serif;">${concessao}</span>`).join('') 
                    : '<span style="color: rgba(255,255,255,0.7); font-size: 10px;">Nenhuma</span>'
                }
            </div>
        </div>

        <!-- LINHAS DE CUIDADO - ✅ COM DESNORMALIZAÇÃO -->
        <div class="card-section" style="margin-bottom: 15px; font-family: 'Poppins', sans-serif;">
            <div class="section-header" style="background: #60a5fa; color: #ffffff; font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
                LINHAS DE CUIDADO
            </div>
            <div class="chips-container" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; border-radius: 6px; padding: 8px;">
                ${(linhas && linhas.length > 0) 
                    ? linhas.map(linha => `<span class="chip" style="font-size: 9px; background: rgba(96,165,250,0.2); border: 1px solid rgba(96,165,250,0.4); color: #60a5fa; padding: 3px 8px; border-radius: 10px; font-weight: 700; font-family: 'Poppins', sans-serif;">${linha}</span>`).join('') 
                    : '<span style="color: rgba(255,255,255,0.7); font-size: 10px;">Nenhuma</span>'
                }
            </div>
        </div>

        <!-- ✅ V6.0: CAMPO ANOTAÇÕES -->
        ${anotacoes ? `
        <div class="card-section" style="margin-bottom: 15px; font-family: 'Poppins', sans-serif;">
            <div class="section-header" style="background: #60a5fa; color: #ffffff; font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
                📝 ANOTAÇÕES
            </div>
            <div class="anotacoes-container" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px;">
                <div class="expandable-text" style="color: rgba(255,255,255,0.9); font-size: 10px; white-space: pre-wrap; word-break: break-word; max-height: 100px; overflow-y: auto;">${anotacoes}</div>
            </div>
        </div>
        ` : ''}

        <!-- FOOTER -->
        <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); gap: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-info" style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1;">
                ${!isVago && admissao ? `
                <div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">
                    <div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">ADMISSÃO</div>
                    <div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">${formatarDataHora(admissao)}</div>
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
                
                ${isVago ? `
                <div class="info-item" style="display: flex; flex-direction: column;">
                    <div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">STATUS</div>
                    <div class="info-value" style="color: #60a5fa; font-weight: 700; font-size: 9px;">Disponível</div>
                </div>
                ` : ''}
            </div>
            
            <button class="btn-action" 
                    data-action="${isVago ? 'admitir' : 'atualizar'}" 
                    data-leito="${numeroLeito}" 
                    ${bloqueadoPorIsolamento ? 'disabled' : ''}
                    style="padding: 10px 18px; 
                           background: ${bloqueadoPorIsolamento ? '#b2adaa' : (isVago ? '#60a5fa' : 'rgba(156,163,175,0.5)')}; 
                           color: #ffffff; 
                           border: none; 
                           border-radius: 6px; 
                           cursor: ${bloqueadoPorIsolamento ? 'not-allowed' : 'pointer'}; 
                           font-weight: 800; 
                           text-transform: uppercase; 
                           font-size: 11px; 
                           font-family: 'Poppins', sans-serif;
                           transition: all 0.2s ease; 
                           letter-spacing: 0.5px; 
                           white-space: nowrap; 
                           flex-shrink: 0;
                           opacity: ${bloqueadoPorIsolamento ? '0.5' : '1'};">
                ${bloqueadoPorIsolamento ? 'BLOQUEADO' : (isVago ? 'ADMITIR' : 'ATUALIZAR')}
            </button>
        </div>
    `;

    // Event listeners
    const admitBtn = card.querySelector('[data-action="admitir"]');
    if (admitBtn) {
        admitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAdmissaoFlow(numeroLeito);
        });
    }
    
    const updateBtn = card.querySelector('[data-action="atualizar"]');
    if (updateBtn) {
        updateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAtualizacaoFlow(numeroLeito, leito);
        });
    }

    return card;
}

// =================== FLUXOS DE ADMISSÃO E ATUALIZAÇÃO ===================
function openAdmissaoFlow(leitoNumero) {
    const button = document.querySelector(`[data-action="admitir"][data-leito="${leitoNumero}"]`);
    const originalText = button.innerHTML;
    
    showButtonLoading(button, 'ADMITIR');
    
    setTimeout(() => {
        hideButtonLoading(button, originalText);
        openAdmissaoModal(leitoNumero);
        logInfo(`Modal de admissão aberto: ${window.currentHospital} - Leito ${leitoNumero}`);
    }, 800);
}

function openAtualizacaoFlow(leitoNumero, dadosLeito) {
    const button = document.querySelector(`[data-action="atualizar"][data-leito="${leitoNumero}"]`);
    const originalText = button.innerHTML;
    
    showButtonLoading(button, 'ATUALIZAR');
    
    setTimeout(() => {
        hideButtonLoading(button, originalText);
        openAtualizacaoModal(leitoNumero, dadosLeito);
        logInfo(`Modal de atualização aberto: ${window.currentHospital} - Leito ${leitoNumero}`);
    }, 800);
}

// =================== MODAIS ===================
function openAdmissaoModal(leitoNumero) {
    const hospitalId = window.currentHospital;
    const hospitalNome = window.getHospitalNome(hospitalId);
    
    window.selectedLeito = leitoNumero;
    
    const modal = createModalOverlay();
    modal.innerHTML = createAdmissaoForm(hospitalNome, leitoNumero, hospitalId);
    document.body.appendChild(modal);
    
    setupModalEventListeners(modal, 'admissao');
    setupSearchFilter(modal, 'admConcessoes', 'searchConcessoes');
    setupSearchFilter(modal, 'admLinhas', 'searchLinhas');
    
    // ✅ V6.0: CONFIGURAR CONTADOR DE CARACTERES PARA ANOTAÇÕES
    setupAnotacoesCounter(modal, 'admAnotacoes');
}

function openAtualizacaoModal(leitoNumero, dadosLeito) {
    const hospitalId = window.currentHospital;
    const hospitalNome = window.getHospitalNome(hospitalId);
    
    window.selectedLeito = leitoNumero;
    
    const modal = createModalOverlay();
    modal.innerHTML = createAtualizacaoForm(hospitalNome, leitoNumero, dadosLeito);
    document.body.appendChild(modal);
    
    setupModalEventListeners(modal, 'atualizacao');
    setupSearchFilter(modal, 'updConcessoes', 'searchConcessoesUpd');
    setupSearchFilter(modal, 'updLinhas', 'searchLinhasUpd');
    
    // ✅ V6.0: CONFIGURAR CONTADOR DE CARACTERES PARA ANOTAÇÕES
    setupAnotacoesCounter(modal, 'updAnotacoes');
    
    setTimeout(() => {
        forcarPreMarcacao(modal, dadosLeito);
    }, 100);
}

function createModalOverlay() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease; font-family: 'Poppins', sans-serif;
    `;
    return modal;
}

// ✅ V6.0: FUNÇÃO PARA CONFIGURAR CONTADOR DE CARACTERES NAS ANOTAÇÕES
function setupAnotacoesCounter(modal, fieldId) {
    const anotacoesField = modal.querySelector(`#${fieldId}`);
    if (!anotacoesField) return;
    
    anotacoesField.addEventListener('input', function() {
        const count = this.value.length;
        const counter = this.parentElement.querySelector('.char-count');
        if (counter) {
            counter.textContent = `${count}/800`;
            counter.style.color = count > 750 ? '#f59a1d' : '#9ca3af';
        }
    });
    
    // Atualizar contador inicial se já tem valor
    if (anotacoesField.value) {
        const count = anotacoesField.value.length;
        const counter = anotacoesField.parentElement.querySelector('.char-count');
        if (counter) {
            counter.textContent = `${count}/800`;
        }
    }
}

// FUNÇÃO DE BUSCA DINÂMICA
function setupSearchFilter(modal, containerId, searchId) {
    const searchInput = modal.querySelector(`#${searchId}`);
    const container = modal.querySelector(`#${containerId}`);
    
    if (!searchInput || !container) {
        logError(`Elementos não encontrados: ${searchId} ou ${containerId}`);
        return;
    }
    
    const labels = container.querySelectorAll('label');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        labels.forEach(label => {
            const text = label.textContent.toLowerCase();
            const checkbox = label.querySelector('input[type="checkbox"]');
            
            if (searchTerm === '' || text.includes(searchTerm)) {
                label.style.display = 'flex';
            } else {
                label.style.display = 'none';
            }
        });
        
        // Mensagem se não encontrar nada
        const visibleLabels = Array.from(labels).filter(l => l.style.display !== 'none');
        
        let msgNoResults = container.querySelector('.no-results-message');
        
        if (visibleLabels.length === 0) {
            if (!msgNoResults) {
                msgNoResults = document.createElement('div');
                msgNoResults.className = 'no-results-message';
                msgNoResults.style.cssText = 'padding: 10px; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px;';
                msgNoResults.textContent = `Nenhum resultado para "${searchTerm}"`;
                container.appendChild(msgNoResults);
            }
        } else {
            if (msgNoResults) {
                msgNoResults.remove();
            }
        }
    });
    
    logSuccess(`Busca dinâmica configurada: ${searchId}`);
}

// =================== FORMULÁRIO DE ADMISSÃO - V6.0 COM CAMPO ANOTAÇÕES ===================
function createAdmissaoForm(hospitalNome, leitoNumero, hospitalId) {
    const idSequencial = String(leitoNumero).padStart(2, '0');
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    const isSantaClara = hospitalId === 'H4';
    
    // ✅ V6.0: Santa Clara agora é tipos fixos, não mais híbrido
    const mostrarTipoQuarto = isHibrido;
    
    const isCruzAzulEnfermaria = (hospitalId === 'H2' && leitoNumero >= 21 && leitoNumero <= 36);
    const isSantaClaraEnfermaria = (hospitalId === 'H4' && leitoNumero >= 10 && leitoNumero <= 17);
    
    let generoPreDefinido = null;
    let generoDisabled = false;
    
    if (isCruzAzulEnfermaria || isSantaClaraEnfermaria) {
        const leitoIrmao = window.getLeitoIrmao(hospitalId, leitoNumero);
        if (leitoIrmao) {
            const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
            const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
            
            if (dadosLeitoIrmao && (dadosLeitoIrmao.status === 'Em uso' || dadosLeitoIrmao.status === 'ocupado')) {
                const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
                if (!isolamentoIrmao || isolamentoIrmao === 'Não Isolamento') {
                    if (dadosLeitoIrmao.genero) {
                        generoPreDefinido = dadosLeitoIrmao.genero;
                        generoDisabled = true;
                    }
                }
            }
        }
    }
    
    const isCruzAzulApartamento = (hospitalId === 'H2' && leitoNumero >= 1 && leitoNumero <= 20);
    const isSantaClaraApartamento = (hospitalId === 'H4' && (leitoNumero <= 9 || leitoNumero >= 27));
    const isApartamentoFixo = isCruzAzulApartamento || isSantaClaraApartamento;
    
    const isEnfermariaFixa = isCruzAzulEnfermaria || isSantaClaraEnfermaria;
    
    let identificacaoFixa = '';
    if (isCruzAzulEnfermaria) {
        const leitosHospital = window.hospitalData['H2']?.leitos || [];
        const dadosLeitoAtual = leitosHospital.find(l => l.leito == leitoNumero);
        identificacaoFixa = dadosLeitoAtual?.identificacaoLeito || 
                           dadosLeitoAtual?.identificacao_leito || 
                           '';
    }
    
    return `
        <div class="modal-content" style="background: #1a1f2e; border-radius: 12px; padding: 30px; max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto; color: #ffffff; font-family: 'Poppins', sans-serif;">
            <h2 style="margin: 0 0 20px 0; text-align: center; color: #60a5fa; font-size: 24px; font-weight: 700; text-transform: uppercase;">
                Admitir Paciente
            </h2>
            
            <div style="text-align: center; margin-bottom: 30px; padding: 15px; background: rgba(96,165,250,0.1); border-radius: 8px;">
                <div style="margin-bottom: 8px;">
                    <strong>Hospital:</strong> ${hospitalNome} | <strong>ID:</strong> ${idSequencial} | <strong>Leito:</strong> ${leitoNumero}${isHibrido ? ' | <strong>LEITO HÍBRIDO</strong>' : ''}
                </div>
            </div>
            
            <!-- LINHA 1: IDENTIFICAÇÃO | TIPO QUARTO | ISOLAMENTO -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: ${(isHibrido || isEnfermariaFixa || isApartamentoFixo) ? '1fr 1fr 1fr' : '1fr 1fr'}; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600; font-size: 12px; white-space: nowrap;">Identificação do Leito <span style="color: #c86420;">*</span></label>
                        ${isCruzAzulEnfermaria 
                            ? `<input id="admIdentificacaoLeito" type="text" value="${identificacaoFixa}" readonly style="width: 100%; padding: 12px; background: #1f2937; color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; cursor: not-allowed; font-family: 'Poppins', sans-serif;">
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Numeração fixa (Cruz Azul)</div>`
                            : `<input id="admIdentificacaoLeito" type="text" placeholder="Ex: 1A, 21, 711.1" maxlength="6" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Aceita números e letras (1-6)</div>`
                        }
                    </div>
                    
                    ${(isHibrido || isEnfermariaFixa || isApartamentoFixo) ? `
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Quarto <span style="color: #c86420;">*</span></label>
                        ${isEnfermariaFixa
                            ? `<select id="admTipoQuarto" disabled style="width: 100%; padding: 12px; background: #1f2937 !important; color: #9ca3af !important; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; cursor: not-allowed; font-family: 'Poppins', sans-serif;">
                                <option value="Enfermaria" selected>Enfermaria</option>
                               </select>
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Tipo fixo (Enfermaria)</div>`
                            : isApartamentoFixo
                            ? `<select id="admTipoQuarto" disabled style="width: 100%; padding: 12px; background: #1f2937 !important; color: #9ca3af !important; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; cursor: not-allowed; font-family: 'Poppins', sans-serif;">
                                <option value="Apartamento" selected>Apartamento</option>
                               </select>
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Tipo fixo (Apartamento)</div>`
                            : `<select id="admTipoQuarto" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                                <option value="">Selecionar...</option>
                                ${window.TIPO_QUARTO_OPTIONS.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('')}
                               </select>`
                        }
                    </div>
                    ` : ''}
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento <span style="color: #c86420;">*</span></label>
                        <select id="admIsolamento" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="">Selecione...</option>
                            ${window.ISOLAMENTO_OPTIONS.map(opcao => `<option value="${opcao}">${opcao}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 2: GÊNERO | REGIÃO | PREVISÃO ALTA -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Gênero <span style="color: #c86420;">*</span></label>
                        <select id="admSexo" required ${generoDisabled ? 'disabled' : ''} style="width: 100%; padding: 12px; background: ${generoDisabled ? '#1f2937' : '#374151'} !important; color: ${generoDisabled ? '#9ca3af' : '#ffffff'} !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${generoPreDefinido 
                                ? `<option value="${generoPreDefinido}" selected>${generoPreDefinido}</option>`
                                : `<option value="">Selecionar...</option>
                                   ${window.SEXO_OPTIONS.map(sexo => `<option value="${sexo}">${sexo}</option>`).join('')}`
                            }
                        </select>
                        ${generoDisabled ? '<div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Gênero definido pelo leito irmão</div>' : ''}
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Região <span style="color: #c86420;">*</span></label>
                        <select id="admRegiao" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="">Selecionar...</option>
                            ${window.REGIAO_OPTIONS.map(regiao => `<option value="${regiao}">${regiao}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Previsão Alta</label>
                        <select id="admPrevAlta" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.PREVISAO_ALTA_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 3: NOME | MATRÍCULA | IDADE -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Iniciais (A D R) <span style="color: #c86420;">*</span></label>
                        <input id="admNome" type="text" placeholder="A D R" required maxlength="10" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; text-transform: uppercase;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Matrícula <span style="color: #c86420;">*</span></label>
                        <input id="admMatricula" type="text" placeholder="123456789-0" required maxlength="11" oninput="formatarMatriculaInput(this)" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade</label>
                        <select id="admIdade" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.IDADE_OPTIONS.map(idade => `<option value="${idade}">${idade}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 4: PPS | SPICT-BR | DIRETIVAS -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">PPS</label>
                        <select id="admPPS" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.PPS_OPTIONS.map(pps => `<option value="${pps}">${pps}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">SPICT-BR</label>
                        <select id="admSPICT" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="nao_elegivel">Não Elegível</option>
                            <option value="elegivel">Elegível</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Diretivas</label>
                        <select id="admDiretivas" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.DIRETIVAS_OPTIONS.map(dir => `<option value="${dir}">${dir}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- ✅ V6.0: CAMPO ANOTAÇÕES -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">📝 Anotações (800 caracteres)</label>
                <textarea 
                    id="admAnotacoes" 
                    maxlength="800" 
                    rows="4" 
                    placeholder="Observações sobre o paciente..."
                    style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; resize: vertical;"
                ></textarea>
                <small class="char-count" style="display: block; text-align: right; font-size: 11px; color: #9ca3af; margin-top: 4px;">0/800</small>
            </div>
            
            <!-- CONCESSÕES -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: #e2e8f0; font-weight: 600;">Concessões Previstas na Alta</label>
                <input id="searchConcessoes" type="text" placeholder="🔍 Buscar concessões..." style="width: 100%; padding: 10px; margin-bottom: 10px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                <div id="admConcessoes" style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 180px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                    ${window.CONCESSOES_LIST.map(concessao => `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-radius: 4px; transition: background 0.2s;">
                            <input type="checkbox" value="${concessao}" style="width: 16px; height: 16px; accent-color: #60a5fa;">
                            <span style="font-size: 13px; color: #e2e8f0; flex: 1;">${concessao}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <!-- LINHAS DE CUIDADO -->
            <div style="margin-bottom: 30px;">
                <label style="display: block; margin-bottom: 8px; color: #e2e8f0; font-weight: 600;">Linhas de Cuidado</label>
                <input id="searchLinhas" type="text" placeholder="🔍 Buscar linhas..." style="width: 100%; padding: 10px; margin-bottom: 10px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                <div id="admLinhas" style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 180px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                    ${window.LINHAS_CUIDADO_LIST.map(linha => `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-radius: 4px; transition: background 0.2s;">
                            <input type="checkbox" value="${linha}" style="width: 16px; height: 16px; accent-color: #60a5fa;">
                            <span style="font-size: 13px; color: #e2e8f0; flex: 1;">${linha}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <!-- BOTÕES -->
            <div class="modal-buttons" style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn-cancelar" style="padding: 12px 30px; background: rgba(255,255,255,0.1); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: 'Poppins', sans-serif;">Cancelar</button>
                <button class="btn-salvar" style="padding: 12px 30px; background: #60a5fa; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: 'Poppins', sans-serif;">Salvar</button>
            </div>
        </div>
    `;
}

// =================== FORMULÁRIO DE ATUALIZAÇÃO - V6.0 COM CAMPO ANOTAÇÕES ===================
function createAtualizacaoForm(hospitalNome, leitoNumero, dadosLeito) {
    const idSequencial = String(leitoNumero).padStart(2, '0');
    const hospitalId = window.currentHospital;
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    const isSantaClara = hospitalId === 'H4';
    
    // ✅ V6.0: Santa Clara agora é tipos fixos
    const mostrarTipoQuarto = isHibrido;
    
    const isCruzAzulEnfermaria = (hospitalId === 'H2' && leitoNumero >= 21 && leitoNumero <= 36);
    const isSantaClaraEnfermaria = (hospitalId === 'H4' && leitoNumero >= 10 && leitoNumero <= 17);
    
    let generoPreDefinido = null;
    let generoDisabled = false;
    
    if (isCruzAzulEnfermaria || isSantaClaraEnfermaria) {
        const leitoIrmao = window.getLeitoIrmao(hospitalId, leitoNumero);
        if (leitoIrmao) {
            const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
            const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
            
            if (dadosLeitoIrmao && (dadosLeitoIrmao.status === 'Em uso' || dadosLeitoIrmao.status === 'ocupado')) {
                const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
                if (!isolamentoIrmao || isolamentoIrmao === 'Não Isolamento') {
                    if (dadosLeitoIrmao.genero) {
                        generoPreDefinido = dadosLeitoIrmao.genero;
                        generoDisabled = true;
                    }
                }
            }
        }
    }
    
    const isCruzAzulApartamento = (hospitalId === 'H2' && leitoNumero >= 1 && leitoNumero <= 20);
    const isSantaClaraApartamento = (hospitalId === 'H4' && (leitoNumero <= 9 || leitoNumero >= 27));
    const isApartamentoFixo = isCruzAzulApartamento || isSantaClaraApartamento;
    
    const isEnfermariaFixa = isCruzAzulEnfermaria || isSantaClaraEnfermaria;
    
    let identificacaoFixa = '';
    if (isCruzAzulEnfermaria) {
        const leitosHospital = window.hospitalData['H2']?.leitos || [];
        const dadosLeitoAtual = leitosHospital.find(l => l.leito == leitoNumero);
        identificacaoFixa = dadosLeitoAtual?.identificacaoLeito || 
                           dadosLeitoAtual?.identificacao_leito || 
                           '';
    }
    
    const identificacaoAtual = dadosLeito.identificacaoLeito || dadosLeito.identificacao_leito || '';
    const admissaoData = dadosLeito.admAt || '';
    let tempoInternacao = '';
    if (admissaoData) {
        tempoInternacao = calcularTempoInternacao(admissaoData);
    }
    
    return `
        <div class="modal-content" style="background: #1a1f2e; border-radius: 12px; padding: 30px; max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto; color: #ffffff; font-family: 'Poppins', sans-serif;">
            <h2 style="margin: 0 0 20px 0; text-align: center; color: #60a5fa; font-size: 24px; font-weight: 700; text-transform: uppercase;">
                Atualizar Paciente
            </h2>
            
            <div style="text-align: center; margin-bottom: 30px; padding: 15px; background: rgba(96,165,250,0.1); border-radius: 8px;">
                <div style="margin-bottom: 8px;">
                    <strong>Hospital:</strong> ${hospitalNome} | <strong>ID:</strong> ${idSequencial} | <strong>Leito:</strong> ${leitoNumero}${isHibrido ? ' | <strong>LEITO HÍBRIDO</strong>' : ''}
                </div>
            </div>
            
            <!-- LINHA 1: IDENTIFICAÇÃO | TIPO QUARTO | ISOLAMENTO -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: ${(isHibrido || isEnfermariaFixa || isApartamentoFixo) ? '1fr 1fr 1fr' : '1fr 1fr'}; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600; font-size: 12px; white-space: nowrap;">Identificação do Leito <span style="color: #c86420;">*</span></label>
                        ${isCruzAzulEnfermaria 
                            ? `<input id="updIdentificacaoLeito" type="text" value="${identificacaoFixa}" readonly style="width: 100%; padding: 12px; background: #1f2937; color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; cursor: not-allowed; font-family: 'Poppins', sans-serif;">
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Numeração fixa (Cruz Azul)</div>`
                            : `<input id="updIdentificacaoLeito" type="text" value="${identificacaoAtual}" placeholder="Ex: 1A, 21, 711.1" maxlength="6" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Aceita números e letras (1-6)</div>`
                        }
                    </div>
                    
                    ${(isHibrido || isEnfermariaFixa || isApartamentoFixo) ? `
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Quarto <span style="color: #c86420;">*</span></label>
                        ${isEnfermariaFixa
                            ? `<select id="updTipoQuarto" disabled style="width: 100%; padding: 12px; background: #1f2937 !important; color: #9ca3af !important; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; cursor: not-allowed; font-family: 'Poppins', sans-serif;">
                                <option value="Enfermaria" selected>Enfermaria</option>
                               </select>
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Tipo fixo (Enfermaria)</div>`
                            : isApartamentoFixo
                            ? `<select id="updTipoQuarto" disabled style="width: 100%; padding: 12px; background: #1f2937 !important; color: #9ca3af !important; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; cursor: not-allowed; font-family: 'Poppins', sans-serif;">
                                <option value="Apartamento" selected>Apartamento</option>
                               </select>
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Tipo fixo (Apartamento)</div>`
                            : `<select id="updTipoQuarto" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                                <option value="">Selecionar...</option>
                                ${window.TIPO_QUARTO_OPTIONS.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('')}
                               </select>`
                        }
                    </div>
                    ` : ''}
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento <span style="color: #c86420;">*</span></label>
                        <select id="updIsolamento" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="">Selecione...</option>
                            ${window.ISOLAMENTO_OPTIONS.map(opcao => `<option value="${opcao}">${opcao}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 2: GÊNERO | REGIÃO | PREVISÃO ALTA -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Gênero <span style="color: #c86420;">*</span></label>
                        <select id="updSexo" required ${generoDisabled ? 'disabled' : ''} style="width: 100%; padding: 12px; background: ${generoDisabled ? '#1f2937' : '#374151'} !important; color: ${generoDisabled ? '#9ca3af' : '#ffffff'} !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${generoPreDefinido 
                                ? `<option value="${generoPreDefinido}" selected>${generoPreDefinido}</option>`
                                : `<option value="">Selecionar...</option>
                                   ${window.SEXO_OPTIONS.map(sexo => `<option value="${sexo}">${sexo}</option>`).join('')}`
                            }
                        </select>
                        ${generoDisabled ? '<div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Gênero definido pelo leito irmão</div>' : ''}
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Região <span style="color: #c86420;">*</span></label>
                        <select id="updRegiao" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="">Selecionar...</option>
                            ${window.REGIAO_OPTIONS.map(regiao => `<option value="${regiao}">${regiao}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Previsão Alta</label>
                        <select id="updPrevAlta" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.PREVISAO_ALTA_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 3: IDADE | PPS | SPICT-BR -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade</label>
                        <select id="updIdade" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.IDADE_OPTIONS.map(idade => `<option value="${idade}">${idade}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">PPS</label>
                        <select id="updPPS" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.PPS_OPTIONS.map(pps => `<option value="${pps}">${pps}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">SPICT-BR</label>
                        <select id="updSPICT" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="nao_elegivel">Não Elegível</option>
                            <option value="elegivel">Elegível</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 4: DIRETIVAS -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Diretivas Antecipadas</label>
                <select id="updDiretivas" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                    ${window.DIRETIVAS_OPTIONS.map(dir => `<option value="${dir}">${dir}</option>`).join('')}
                </select>
            </div>
            
            <!-- ✅ V6.0: CAMPO ANOTAÇÕES -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">📝 Anotações (800 caracteres)</label>
                <textarea 
                    id="updAnotacoes" 
                    maxlength="800" 
                    rows="4" 
                    placeholder="Observações sobre o paciente..."
                    style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; resize: vertical;"
                >${dadosLeito.anotacoes || ''}</textarea>
                <small class="char-count" style="display: block; text-align: right; font-size: 11px; color: #9ca3af; margin-top: 4px;">${(dadosLeito.anotacoes || '').length}/800</small>
            </div>
            
            <!-- CONCESSÕES -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: #e2e8f0; font-weight: 600;">Concessões Previstas na Alta</label>
                <input id="searchConcessoesUpd" type="text" placeholder="🔍 Buscar concessões..." style="width: 100%; padding: 10px; margin-bottom: 10px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                <div id="updConcessoes" style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 180px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                    ${window.CONCESSOES_LIST.map(concessao => `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-radius: 4px; transition: background 0.2s;">
                            <input type="checkbox" value="${concessao}" style="width: 16px; height: 16px; accent-color: #60a5fa;">
                            <span style="font-size: 13px; color: #e2e8f0; flex: 1;">${concessao}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <!-- LINHAS DE CUIDADO -->
            <div style="margin-bottom: 30px;">
                <label style="display: block; margin-bottom: 8px; color: #e2e8f0; font-weight: 600;">Linhas de Cuidado</label>
                <input id="searchLinhasUpd" type="text" placeholder="🔍 Buscar linhas..." style="width: 100%; padding: 10px; margin-bottom: 10px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                <div id="updLinhas" style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 180px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                    ${window.LINHAS_CUIDADO_LIST.map(linha => `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-radius: 4px; transition: background 0.2s;">
                            <input type="checkbox" value="${linha}" style="width: 16px; height: 16px; accent-color: #60a5fa;">
                            <span style="font-size: 13px; color: #e2e8f0; flex: 1;">${linha}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <!-- BOTÕES -->
            <div class="modal-buttons" style="display: flex; gap: 12px; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <button class="btn-alta" style="padding: 12px 30px; background: #c86420; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: 'Poppins', sans-serif;">Alta</button>
                
                <div style="text-align: center; font-size: 10px; color: rgba(255,255,255,0.5);">
                    ${admissaoData ? `<div>Admissão: ${formatarDataHora(admissaoData)}</div>` : ''}
                    ${tempoInternacao ? `<div>Internado: ${tempoInternacao}</div>` : ''}
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button class="btn-cancelar" style="padding: 12px 30px; background: rgba(255,255,255,0.1); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: 'Poppins', sans-serif;">Cancelar</button>
                    <button class="btn-salvar" style="padding: 12px 30px; background: #60a5fa; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: 'Poppins', sans-serif;">Salvar</button>
                </div>
            </div>
        </div>
    `;
}

// =================== ✅ PRÉ-MARCAÇÃO COM NORMALIZAÇÃO - V6.0 COM ANOTAÇÕES ===================
function forcarPreMarcacao(modal, dadosLeito) {
    logDebug(`Forçando pré-marcação com normalização...`);
    
    // ✅ CONCESSÕES - Normalizar antes de comparar
    const concessoesAtuais = Array.isArray(dadosLeito?.concessoes) ? dadosLeito.concessoes : [];
    const concessoesCheckboxes = modal.querySelectorAll('#updConcessoes input[type="checkbox"]');
    const naoSeAplicaCheckbox = Array.from(concessoesCheckboxes)
        .find(cb => cb.value === 'Não se aplica');
    
    concessoesCheckboxes.forEach(checkbox => {
        if (checkbox.value === 'Não se aplica') {
            checkbox.checked = concessoesAtuais.length === 0;
        } else {
            // ✅ NORMALIZAR ambos os lados antes de comparar
            const checkboxNormalizado = normalizarTexto(checkbox.value);
            const isChecked = concessoesAtuais.some(atual => 
                normalizarTexto(atual) === checkboxNormalizado
            );
            checkbox.checked = isChecked;
        }
    });

    // ✅ LINHAS - Normalizar antes de comparar
    const linhasAtuais = Array.isArray(dadosLeito?.linhas) ? dadosLeito.linhas : [];
    const linhasCheckboxes = modal.querySelectorAll('#updLinhas input[type="checkbox"]');

    linhasCheckboxes.forEach(checkbox => {
        // ✅ NORMALIZAR ambos os lados antes de comparar
        const linhaNormalizada = normalizarTexto(checkbox.value);
        const isChecked = linhasAtuais.some(atual => 
            normalizarTexto(atual) === linhaNormalizada
        );
        checkbox.checked = isChecked;
    });

    logDebug(`Concessões pré-marcadas: ${concessoesAtuais.length}`);
    logDebug(`Linhas pré-marcadas: ${linhasAtuais.length}`);
    logSuccess(`Pré-marcação concluída com normalização!`);
}

// LÓGICA "NÃO SE APLICA" PARA CONCESSÕES
function setupConcessoesLogic(modal, concessoesId) {
    const container = modal.querySelector(`#${concessoesId}`);
    if (!container) return;
    
    const naoSeAplicaCheckbox = Array.from(container.querySelectorAll('input[type="checkbox"]'))
        .find(cb => cb.value === 'Não se aplica');
    
    if (!naoSeAplicaCheckbox) return;
    
    const outrasCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'))
        .filter(cb => cb.value !== 'Não se aplica');
    
    naoSeAplicaCheckbox.addEventListener('change', function() {
        if (this.checked) {
            outrasCheckboxes.forEach(cb => cb.checked = false);
        }
    });
    
    outrasCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                naoSeAplicaCheckbox.checked = false;
            } else {
                const algumaOutraMarcada = outrasCheckboxes.some(cb => cb.checked);
                if (!algumaOutraMarcada) {
                    naoSeAplicaCheckbox.checked = true;
                }
            }
        });
    });
    
    const algumaOutraMarcada = outrasCheckboxes.some(cb => cb.checked);
    if (!algumaOutraMarcada) {
        naoSeAplicaCheckbox.checked = true;
    }
}

// =================== EVENT LISTENERS DOS MODAIS ===================
function setupModalEventListeners(modal, tipo) {
    const btnCancelar = modal.querySelector('.btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal(modal);
        });
    }
    
    const btnSalvar = modal.querySelector('.btn-salvar');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const identificacaoField = modal.querySelector(tipo === 'admissao' ? '#admIdentificacaoLeito' : '#updIdentificacaoLeito');
            if (!identificacaoField.value.trim()) {
                showErrorMessage('Campo "Identificação do Leito" é obrigatório!');
                identificacaoField.focus();
                return;
            }
            
            const identificacao = identificacaoField.value.trim();
            if (identificacao.length < 1 || identificacao.length > 6) {
                showErrorMessage('Identificação deve ter de 1 a 6 caracteres!');
                identificacaoField.focus();
                return;
            }
            
            const isolamentoField = modal.querySelector(tipo === 'admissao' ? '#admIsolamento' : '#updIsolamento');
            const regiaoField = modal.querySelector(tipo === 'admissao' ? '#admRegiao' : '#updRegiao');
            const sexoField = modal.querySelector(tipo === 'admissao' ? '#admSexo' : '#updSexo');
            
            if (!isolamentoField.value) {
                showErrorMessage('Campo "Isolamento" é obrigatório!');
                isolamentoField.focus();
                return;
            }
            
            if (!regiaoField.value) {
                showErrorMessage('Campo "Região" é obrigatório!');
                regiaoField.focus();
                return;
            }
            
            if (!sexoField.value) {
                showErrorMessage('Campo "Gênero" é obrigatório!');
                sexoField.focus();
                return;
            }
            
            const hospitalId = window.currentHospital;
            const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
            const leitoNumero = parseInt(modal.querySelector('h3')?.textContent?.match(/\d+/)?.[0] || 0) || window.selectedLeito;
            const isSantaClara = hospitalId === 'H4';
            
            if (isHibrido) {
                const tipoQuartoField = modal.querySelector(tipo === 'admissao' ? '#admTipoQuarto' : '#updTipoQuarto');
                if (tipoQuartoField && !tipoQuartoField.disabled && !tipoQuartoField.value) {
                    showErrorMessage('Campo "Tipo de Quarto" é obrigatório para hospitais híbridos!');
                    tipoQuartoField.focus();
                    return;
                }
            }
            
            if (tipo === 'admissao' && hospitalId === 'H2') {
                const generoNovo = sexoField.value;
                const validacaoCruz = validarAdmissaoCruzAzul(leitoNumero, generoNovo);
                
                if (!validacaoCruz.permitido) {
                    showErrorMessage(validacaoCruz.motivo);
                    return;
                }
            }
            
            // ✅ V6.0: Validação Santa Clara removida (não tem mais limite 9+4)
            
            const originalText = this.innerHTML;
            showButtonLoading(this, 'SALVANDO...');
            
            try {
                const dadosFormulario = coletarDadosFormulario(modal, tipo);
                
                if (tipo === 'admissao') {
                    await window.admitirPaciente(dadosFormulario.hospital, dadosFormulario.leito, dadosFormulario);
                    showSuccessMessage('Paciente admitido com sucesso!');
                } else {
                    await window.atualizarPaciente(dadosFormulario.hospital, dadosFormulario.leito, dadosFormulario);
                    showSuccessMessage('Dados atualizados com sucesso!');
                }
                
                hideButtonLoading(this, originalText);
                closeModal(modal);
                
                await window.refreshAfterAction();
                
            } catch (error) {
                hideButtonLoading(this, originalText);
                showErrorMessage('Erro ao salvar: ' + error.message);
                logError('Erro ao salvar:', error);
            }
        });
    }
    
    const btnAlta = modal.querySelector('.btn-alta');
    if (btnAlta) {
        btnAlta.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!confirm("Confirmar ALTA deste paciente?")) return;
            
            const originalText = this.innerHTML;
            showButtonLoading(this, 'PROCESSANDO ALTA...');
            
            try {
                await window.darAltaPaciente(window.currentHospital, window.selectedLeito);
                
                hideButtonLoading(this, originalText);
                showSuccessMessage('Alta processada!');
                closeModal(modal);
                
                await window.refreshAfterAction();
                
            } catch (error) {
                hideButtonLoading(this, originalText);
                showErrorMessage('Erro ao processar alta: ' + error.message);
                logError('Erro alta:', error);
            }
        });
    }
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    if (tipo === 'admissao') {
        setupConcessoesLogic(modal, 'admConcessoes');
    } else {
        setupConcessoesLogic(modal, 'updConcessoes');
    }
}

// =================== CLOSE MODAL ===================
function closeModal(modal) {
    if (modal && modal.parentNode) {
        modal.style.animation = 'fadeOut 0.3s ease';
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            window.selectedLeito = null;
        }, 300);
    }
}

// =================== ✅ V6.0: COLETAR DADOS DO FORMULÁRIO - COM ANOTAÇÕES ===================
function coletarDadosFormulario(modal, tipo) {
    const dados = {
        hospital: window.currentHospital,
        leito: window.selectedLeito
    };
    
    if (tipo === 'admissao') {
        dados.nome = modal.querySelector('#admNome')?.value?.trim() || '';
        const matriculaInput = modal.querySelector('#admMatricula')?.value?.trim() || '';
        dados.matricula = matriculaInput.replace(/-/g, '');
        dados.idade = parseInt(modal.querySelector('#admIdade')?.value) || null;
        dados.pps = modal.querySelector('#admPPS')?.value?.replace('%', '') || null;
        dados.spict = modal.querySelector('#admSPICT')?.value || 'nao_elegivel';
        dados.prevAlta = modal.querySelector('#admPrevAlta')?.value || 'Sem Previsão';
        dados.isolamento = modal.querySelector('#admIsolamento')?.value || '';
        dados.identificacaoLeito = modal.querySelector('#admIdentificacaoLeito')?.value?.trim() || '';
        dados.regiao = modal.querySelector('#admRegiao')?.value || '';
        dados.genero = modal.querySelector('#admSexo')?.value || '';
        dados.diretivas = modal.querySelector('#admDiretivas')?.value || 'Não se aplica';
        
        // ✅ V6.0: CAMPO ANOTAÇÕES
        dados.anotacoes = modal.querySelector('#admAnotacoes')?.value?.trim() || '';
        
        const tipoQuartoField = modal.querySelector('#admTipoQuarto');
        if (tipoQuartoField) {
            dados.categoriaEscolhida = tipoQuartoField.value || '';
        }
        
        dados.concessoes = coletarCheckboxesSelecionados(modal, '#admConcessoes');
        dados.linhas = coletarCheckboxesSelecionados(modal, '#admLinhas');
        
    } else {
        dados.idade = parseInt(modal.querySelector('#updIdade')?.value) || null;
        dados.pps = modal.querySelector('#updPPS')?.value?.replace('%', '') || null;
        dados.spict = modal.querySelector('#updSPICT')?.value || 'nao_elegivel';
        dados.prevAlta = modal.querySelector('#updPrevAlta')?.value || 'Sem Previsão';
        dados.isolamento = modal.querySelector('#updIsolamento')?.value || '';
        dados.identificacaoLeito = modal.querySelector('#updIdentificacaoLeito')?.value?.trim() || '';
        dados.regiao = modal.querySelector('#updRegiao')?.value || '';
        dados.genero = modal.querySelector('#updSexo')?.value || '';
        dados.diretivas = modal.querySelector('#updDiretivas')?.value || 'Não se aplica';
        
        // ✅ V6.0: CAMPO ANOTAÇÕES
        dados.anotacoes = modal.querySelector('#updAnotacoes')?.value?.trim() || '';
        
        const tipoQuartoField = modal.querySelector('#updTipoQuarto');
        if (tipoQuartoField) {
            dados.categoriaEscolhida = tipoQuartoField.value || '';
        }
        
        dados.concessoes = coletarCheckboxesSelecionados(modal, '#updConcessoes');
        dados.linhas = coletarCheckboxesSelecionados(modal, '#updLinhas');
    }
    
    return dados;
}

// =================== ✅ COLETAR CHECKBOXES - PRESERVA ACENTOS UTF-8 ===================
function coletarCheckboxesSelecionados(modal, seletor) {
    const checkboxes = modal.querySelectorAll(`${seletor} input[type="checkbox"]`);
    const selecionados = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked && checkbox.value !== 'Não se aplica') {
            // ✅ MANTÉM os acentos UTF-8 - api.js fará a normalização depois
            selecionados.push(checkbox.value);
        }
    });
    
    return selecionados;
}

// FORMATAÇÃO AUTOMÁTICA MATRÍCULA COM HÍFEN NO INPUT
function formatarMatriculaInput(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 10) {
        valor = valor.substring(0, 10);
    }
    if (valor.length > 1) {
        input.value = valor.slice(0, -1) + '-' + valor.slice(-1);
    } else {
        input.value = valor;
    }
}

// Criar função global para o oninput do HTML
window.formatarMatriculaInput = formatarMatriculaInput;

// =================== FUNÇÕES AUXILIARES ===================
function showButtonLoading(button, loadingText) {
    if (button) {
        button.disabled = true;
        button.innerHTML = loadingText;
        button.style.opacity = '0.7';
    }
}

function hideButtonLoading(button, originalText) {
    if (button) {
        button.disabled = false;
        button.innerHTML = originalText;
        button.style.opacity = '1';
    }
}

function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #60a5fa;
        color: white; padding: 15px 20px; border-radius: 8px; font-weight: 500;
        z-index: 10000; animation: slideIn 0.3s ease; font-family: 'Poppins', sans-serif;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #c86420;
        color: white; padding: 15px 20px; border-radius: 8px; font-weight: 500;
        z-index: 10000; animation: slideIn 0.3s ease; font-family: 'Poppins', sans-serif;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function calcularTempoInternacao(admissao) {
    if (!admissao) return '';
    
    try {
        let dataAdmissao;
        
        if (typeof admissao === 'string') {
            if (admissao.includes('/')) {
                const [datePart] = admissao.split(' ');
                const [dia, mes, ano] = datePart.split('/');
                
                if (dia && mes && ano) {
                    const d = parseInt(dia);
                    const m = parseInt(mes);
                    const a = parseInt(ano);
                    
                    if (!isNaN(d) && !isNaN(m) && !isNaN(a) && 
                        d >= 1 && d <= 31 && m >= 1 && m <= 12 && a >= 1900) {
                        dataAdmissao = new Date(a, m - 1, d);
                    } else {
                        dataAdmissao = new Date(admissao);
                    }
                } else {
                    dataAdmissao = new Date(admissao);
                }
            } else {
                dataAdmissao = new Date(admissao);
            }
        } else if (admissao instanceof Date) {
            dataAdmissao = admissao;
        } else {
            return '';
        }
        
        if (isNaN(dataAdmissao.getTime())) {
            return '';
        }
        
        const agora = new Date();
        const diffMs = agora - dataAdmissao;
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDias === 0) return 'Hoje';
        if (diffDias === 1) return '1 dia';
        return `${diffDias} dias`;
        
    } catch (error) {
        console.error('Erro ao calcular tempo de internação:', error);
        return '';
    }
}

function formatarDataHora(dataStr) {
    if (!dataStr) return '—';
    
    try {
        let data;
        
        if (dataStr.includes('/')) {
            const partes = dataStr.split(' ');
            const [dia, mes, ano] = partes[0].split('/');
            const hora = partes[1] || '00:00';
            
            const d = parseInt(dia);
            const m = parseInt(mes);
            const a = parseInt(ano);
            
            if (!isNaN(d) && !isNaN(m) && !isNaN(a) && 
                d >= 1 && d <= 31 && m >= 1 && m <= 12 && a >= 1900) {
                const [h, min] = hora.split(':');
                data = new Date(a, m - 1, d, parseInt(h) || 0, parseInt(min) || 0);
            } else {
                data = new Date(dataStr);
            }
        } else {
            data = new Date(dataStr);
        }
        
        if (isNaN(data.getTime())) {
            return dataStr;
        }
        
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, '0');
        const min = String(data.getMinutes()).padStart(2, '0');
        
        return `${dia}/${mes}/${ano} ${hora}:${min}`;
        
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return dataStr;
    }
}

// =================== ✅ V6.0: ESTILOS CSS COM LEITOS EXTRAS ===================
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        /* =================== LEITOS EXTRAS V6.1 =================== */
        .flag-contratual {
            background: #60a5fa;
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            display: inline-block;
            margin-right: 8px;
            text-align: center; /* ✅ V6.1: Centralizar texto */
        }

        .flag-extra {
            background: #f59a1d;
            color: #131b2e;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            display: inline-block;
            margin-right: 8px;
            text-align: center; /* ✅ V6.1: Centralizar texto */
        }

        .card-extra {
            border: 2px solid #f59a1d !important;
        }

        .flags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
            justify-content: center; /* ✅ V6.1: Centralizar flags */
        }

        /* Campo anotações */
        .expandable-text {
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 100px;
            overflow-y: auto;
        }

        .expandable-text::-webkit-scrollbar {
            width: 6px;
        }

        .expandable-text::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 3px;
        }

        .expandable-text::-webkit-scrollbar-thumb {
            background: #60a5fa;
            border-radius: 3px;
        }

        textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #9ca3af;
            border-radius: 4px;
            font-family: 'Poppins', sans-serif;
            font-size: 13px;
            resize: vertical;
        }

        .char-count {
            display: block;
            text-align: right;
            font-size: 11px;
            color: #9ca3af;
            margin-top: 4px;
        }

        /* =================== ESTILOS EXISTENTES =================== */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 20px;
            padding: 10px;
            font-family: 'Poppins', sans-serif;
        }

        .modal-overlay {
            font-family: 'Poppins', sans-serif;
        }

        .modal-content {
            font-family: 'Poppins', sans-serif;
        }

        .modal-content h2,
        .modal-content h3,
        .modal-content label,
        .modal-content button {
            font-family: 'Poppins', sans-serif;
        }

        input, select {
            font-family: 'Poppins', sans-serif !important;
        }

        select {
            width: 100% !important;
            padding: 12px !important;
            background: #374151 !important;
            color: #ffffff !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
            border-radius: 6px !important;
            appearance: none !important;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0.7rem center;
            background-size: 1em;
            padding-right: 2.5rem !important;
        }

        select option {
            background-color: #374151 !important;
            color: #ffffff !important;
        }

        select:focus {
            outline: none !important;
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2) !important;
        }

        input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #60a5fa;
            cursor: pointer;
        }
        
        label:has(input[type="checkbox"]) {
            cursor: pointer;
            transition: background-color 0.2s ease;
            border-radius: 4px;
            padding: 4px !important;
        }
        
        label:has(input[type="checkbox"]):hover {
            background-color: rgba(96, 165, 250, 0.1);
        }

        .card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .form-grid-3-cols {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 15px !important;
        }
        
        @media (max-width: 1024px) and (min-width: 769px) {
            .cards-grid {
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 18px;
            }
            
            .form-grid-3-cols {
                grid-template-columns: 1fr 1fr 1fr !important;
                gap: 12px !important;
            }
        }

        @media (max-width: 768px) {
            .cards-grid {
                grid-template-columns: 1fr !important;
                gap: 15px !important;
            }
            
            .card-row,
            .card-row-pessoa {
                display: grid !important;
                grid-template-columns: 100px 1fr 1fr !important;
                gap: 8px !important;
            }
            
            .pessoa-circle {
                width: 100px !important;
                height: 100px !important;
            }
            
            .modal-overlay .modal-content {
                width: 95% !important;
                max-width: none !important;
                margin: 10px !important;
                max-height: 95vh !important;
                padding: 20px !important;
            }
            
            .form-grid-3-cols {
                display: grid !important;
                grid-template-columns: 1fr 1fr 1fr !important;
                gap: 8px !important;
            }
            
            .form-grid-3-cols input,
            .form-grid-3-cols select {
                padding: 8px 6px !important;
                font-size: 12px !important;
            }
            
            .form-grid-3-cols label {
                font-size: 10px !important;
                margin-bottom: 3px !important;
            }
            
            .modal-content div[id$="Concessoes"],
            .modal-content div[id$="Linhas"] {
                grid-template-columns: 1fr !important;
                max-height: 120px !important;
            }
            
            input[type="checkbox"] {
                width: 18px !important;
                height: 18px !important;
                margin-right: 10px !important;
            }
            
            label:has(input[type="checkbox"]) {
                padding: 8px !important;
                font-size: 12px !important;
            }
            
            .modal-buttons {
                position: sticky !important;
                bottom: 0 !important;
                background: #1a1f2e !important;
                padding: 15px 10px !important;
                margin: 0 -20px -20px -20px !important;
                border-top: 2px solid rgba(96, 165, 250, 0.3) !important;
                z-index: 10 !important;
                flex-wrap: wrap !important;
                justify-content: center !important;
            }
            
            .modal-buttons button {
                flex: 1 1 auto !important;
                min-width: 120px !important;
                padding: 14px 20px !important;
                font-size: 13px !important;
            }
            
            .btn-alta {
                order: 1 !important;
                flex: 1 1 100% !important;
                margin-bottom: 10px !important;
            }
        }
        
        @media (max-width: 480px) {
            .card {
                padding: 12px !important;
            }
            
            .card-row,
            .card-row-pessoa {
                gap: 6px !important;
            }
            
            .modal-content {
                padding: 15px !important;
            }
            
            .form-grid-3-cols {
                gap: 6px !important;
            }
        }
        
        @media (max-width: 768px) and (orientation: landscape) {
            .cards-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 12px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// =================== ✅ V6.1: INICIALIZAÇÃO ===================
document.addEventListener('DOMContentLoaded', function() {
    logSuccess('✅ CARDS.JS V6.1 CARREGADO - Gestão de Leitos Hospitalares');
    
    console.log('📊 Sistema de leitos extras: ATIVO');
    console.log('🏥 Hospitais: 9 ativos (H1-H9)');
    console.log('🛏️ Leitos: 341 totais');
    console.log('👥 Cruz Azul: 8 pares de irmãos');
    console.log('👥 Santa Clara: 4 pares de irmãos');
    console.log('📝 Campo Anotações: 800 caracteres');
    console.log('🎯 V6.1: Filtro inteligente de vagos ATIVO');
    console.log('   - Híbridos: 1 vago (menor ID)');
    console.log('   - Tipos fixos: 1 apto + todas enfs (exceto bloqueadas)');
    
    if (window.CONCESSOES_LIST.length !== 13) {
        logError(`ERRO: Esperadas 13 concessões (12 + "Não se aplica"), encontradas ${window.CONCESSOES_LIST.length}`);
    } else {
        logSuccess(`✅ ${window.CONCESSOES_LIST.length} concessões confirmadas (12 + "Não se aplica")`);
    }
    
    if (window.LINHAS_CUIDADO_LIST.length !== 45) {
        logError(`ERRO: Esperadas 45 linhas, encontradas ${window.LINHAS_CUIDADO_LIST.length}`);
    } else {
        logSuccess(`✅ ${window.LINHAS_CUIDADO_LIST.length} linhas de cuidado confirmadas`);
    }
});

// =================== EXPORTS ===================
window.createCard = createCard;
window.openAdmissaoModal = openAdmissaoModal;
window.openAtualizacaoModal = openAtualizacaoModal;
window.forcarPreMarcacao = forcarPreMarcacao;
window.coletarDadosFormulario = coletarDadosFormulario;
window.getBadgeIsolamento = getBadgeIsolamento;
window.getBadgeGenero = getBadgeGenero;
window.getBadgeDiretivas = getBadgeDiretivas;
window.formatarMatriculaInput = formatarMatriculaInput;
window.formatarMatriculaExibicao = formatarMatriculaExibicao;
window.setupSearchFilter = setupSearchFilter;
window.searchLeitos = searchLeitos;

// =================== 🔵 DEBUG FINAL V6.1 ===================
console.log('🔵 [DEBUG] CARDS.JS V6.1 - FIM DO CARREGAMENTO');
console.log('🔵 [DEBUG] Timestamp:', new Date().toISOString());
console.log('✅ CARDS.JS V6.1 - SISTEMA DE LEITOS EXTRAS ATIVO!');
console.log('✅ SANTA CLARA COM 4 PARES DE IRMÃOS (10-11, 12-13, 14-15, 16-17)');
console.log('✅ CAMPO ANOTAÇÕES (800 CARACTERES) IMPLEMENTADO');
console.log('✅ FILTRO INTELIGENTE DE VAGOS ATIVO (híbridos: 1 vago | tipos fixos: 1 apto + todas enf)');