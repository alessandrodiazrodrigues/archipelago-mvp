// =================== CARDS.JS - MAPA DE LEITOS HOSPITALARES ===================
// Versao: 7.0 - 04/Dezembro/2025
// Depende de: cards-config.js (carregar ANTES)
// 
// ALTERACOES V7.0:
// 1. Filtro UTI - Leitos tipo UTI NAO aparecem no Mapa de Leitos
// 2. Sistema de Reservas - Cards reservados, botao RESERVAR, modal de reserva
// 3. Nova Ordenacao - Ocupados > Reservados > Vagos (por tipo em H2/H4)
// 4. Renomeado de "Gestao de Leitos" para "Mapa de Leitos"

console.log('CARDS.JS V7.0 - Carregando...');

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

// =================== CONSTANTES V7.0 - CORES DE RESERVA ===================
const COR_RESERVADO_BG = '#fbbf24';
const COR_RESERVADO_BORDA = '#f59e0b';
const COR_RESERVADO_TEXTO = '#131b2e';

// =================== FUNCAO: FORMATAR INICIAIS AUTOMATICAMENTE ===================
window.formatarIniciaisAutomatico = function(input) {
    let texto = input.value || '';
    texto = texto.replace(/[^a-zA-Z]/g, '');
    texto = texto.toUpperCase();
    if (texto.length > 6) {
        texto = texto.substring(0, 6);
    }
    const resultado = texto.split('').join(' ');
    input.value = resultado;
    return resultado;
};

// =================== FUNCAO: SELECT HOSPITAL ===================
window.selectHospital = function(hospitalId) {
    logInfo('Selecionando hospital: ' + hospitalId + ' (' + window.HOSPITAL_MAPPING[hospitalId] + ')');
    
    window.currentHospital = hospitalId;
    
    document.querySelectorAll('.hospital-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.hospital === hospitalId) {
            btn.classList.add('active');
        }
    });
    
    window.renderCards();
    logSuccess('Hospital selecionado: ' + window.HOSPITAL_MAPPING[hospitalId]);
};

// =================== FUNCAO DE BUSCA ===================
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
    logInfo('Busca: "' + searchTerm + '" - ' + visibleCards.length + ' resultados');
};

// =================== FUNCAO: RENDERIZAR FLAG DE OCUPACAO V7.0 ===================
window.renderFlagOcupacao = function(hospitalId, status, posicaoOcupacao, tipoLeito) {
    // Se leito vago ou reservado, nao exibe flag
    if (status === 'Vago' || status === 'vago' || status === 'Reservado') {
        return '';
    }

    if (!posicaoOcupacao || posicaoOcupacao <= 0) return '';

    const capacidade = window.getCapacidade(hospitalId);
    
    const tipoUpper = (tipoLeito || '').toUpperCase().trim();
    const isApartamento = tipoUpper.includes('APTO') || tipoUpper === 'APARTAMENTO';
    const isEnfermaria = tipoUpper.includes('ENF') || tipoUpper === 'ENFERMARIA';

    let textoTipo = '';
    let totalContratuaisPorTipo = 0;

    if (hospitalId === 'H2' || hospitalId === 'H4') {
        const enfInfo = (hospitalId === 'H2') ? window.CRUZ_AZUL_ENFERMARIAS : window.SANTA_CLARA_ENFERMARIAS;
        
        if (isApartamento) {
            if (enfInfo && enfInfo.contratuais) {
                totalContratuaisPorTipo = capacidade.contratuais - enfInfo.contratuais.length;
            } else {
                totalContratuaisPorTipo = (hospitalId === 'H2') ? 20 : 18;
            }
            textoTipo = 'APARTAMENTO';
            
        } else if (isEnfermaria) {
            if (enfInfo && enfInfo.contratuais) {
                totalContratuaisPorTipo = enfInfo.contratuais.length;
            } else {
                totalContratuaisPorTipo = (hospitalId === 'H2') ? 16 : 8;
            }
            textoTipo = 'ENFERMARIA';
        }
    } else {
        totalContratuaisPorTipo = capacidade.contratuais;
        textoTipo = '';
    }

    const isLeitoExtra = (posicaoOcupacao > totalContratuaisPorTipo);

    if (isLeitoExtra) {
        const numExtra = posicaoOcupacao - totalContratuaisPorTipo;

        return '<div style="background: ' + window.COR_FLAG_EXTRA + '; color: #131b2e; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-align: center; margin-top: 8px; font-family: Poppins, sans-serif;">EXTRA ' + textoTipo + ' ' + numExtra + '/' + numExtra + '</div>';
    } else {
        return '<div style="background: ' + window.COR_FLAG_CONTRATUAL + '; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-align: center; margin-top: 8px; font-family: Poppins, sans-serif;">OCUPACAO ' + textoTipo + ' ' + posicaoOcupacao + '/' + totalContratuaisPorTipo + '</div>';
    }
};

// =================== FUNCAO: OBTER RESERVAS DO HOSPITAL ===================
function getReservasHospital(hospitalId) {
    if (!window.reservasData || !Array.isArray(window.reservasData)) {
        return [];
    }
    return window.reservasData.filter(r => r.hospital === hospitalId && r.tipo !== 'UTI');
}

// =================== FUNCAO PRINCIPAL DE RENDERIZACAO V7.0 ===================
window.renderCards = function() {
    logInfo('[CARDS V7.0] Renderizando - Filtro UTI + Sistema Reservas + Nova Ordenacao');
    console.log('[CARDS V7.0] Logica:');
    console.log('  - Leitos UTI: FILTRADOS (nao aparecem)');
    console.log('  - Ocupados > Reservados > Vagos');
    console.log('  - H2/H4: Separados por tipo (Apto/Enf)');
    
    const container = document.getElementById('cardsContainer');
    if (!container) {
        logError('Container cardsContainer nao encontrado');
        return;
    }

    container.innerHTML = '';
    const hospitalId = window.currentHospital || 'H1';
    const hospital = window.hospitalData[hospitalId];
    const hospitalNome = window.HOSPITAL_MAPPING[hospitalId]?.nome || 'Hospital';
    
    if (!hospital || !hospital.leitos || hospital.leitos.length === 0) {
        container.innerHTML = '<div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><div style="color: #60a5fa; margin-bottom: 15px;"><h3 style="font-family: Poppins, sans-serif;">' + hospitalNome + '</h3></div><div style="background: rgba(96,165,250,0.1); border-radius: 8px; padding: 20px;"><p style="margin-bottom: 15px; font-family: Poppins, sans-serif;">Carregando dados...</p><p style="color: #60a5fa; font-family: Poppins, sans-serif;"><em>API conectada</em></p></div></div>';
        return;
    }
    
    // V7.0: FILTRAR LEITOS UTI - NAO APARECEM NO MAPA DE LEITOS
    const leitosSemUTI = hospital.leitos.filter(l => l.tipo !== 'UTI');
    
    // Separar ocupados e vagos (sem UTI)
    const leitosOcupados = leitosSemUTI.filter(l => 
        l.status === 'Ocupado' || l.status === 'Em uso' || l.status === 'ocupado'
    );
    const leitosVagos = leitosSemUTI.filter(l => 
        l.status === 'Vago' || l.status === 'vago'
    );
    
    // V7.0: OBTER RESERVAS DO HOSPITAL (sem UTI)
    const reservasHospital = getReservasHospital(hospitalId);
    
    console.log('[CARDS V7.0] Leitos sem UTI:', leitosSemUTI.length);
    console.log('[CARDS V7.0] Ocupados:', leitosOcupados.length);
    console.log('[CARDS V7.0] Reservados:', reservasHospital.length);
    console.log('[CARDS V7.0] Vagos:', leitosVagos.length);
    
    // V7.0: ORDENACAO - OCUPADOS > RESERVADOS > VAGOS
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    const isTiposFixos = window.HOSPITAIS_TIPOS_FIXOS.includes(hospitalId);
    
    // Ordenar OCUPADOS
    if (isTiposFixos) {
        // H2/H4: Apartamentos ANTES de Enfermarias, depois por identificacaoLeito
        leitosOcupados.sort((a, b) => {
            const tipoA = (a.tipo || '').toUpperCase();
            const tipoB = (b.tipo || '').toUpperCase();
            
            const isAptoA = tipoA.includes('APTO') || tipoA === 'APARTAMENTO';
            const isAptoB = tipoB.includes('APTO') || tipoB === 'APARTAMENTO';
            
            if (isAptoA && !isAptoB) return -1;
            if (!isAptoA && isAptoB) return 1;
            
            const idA = a.identificacaoLeito || a.identificacao_leito || a.leito;
            const idB = b.identificacaoLeito || b.identificacao_leito || b.leito;
            
            return String(idA).localeCompare(String(idB), undefined, {numeric: true});
        });
    } else {
        // Hibridos: ordenacao padrao por identificacaoLeito
        leitosOcupados.sort((a, b) => {
            const idA = a.identificacaoLeito || a.identificacao_leito || '';
            const idB = b.identificacaoLeito || b.identificacao_leito || '';
            
            if (idA && idB) {
                return idA.localeCompare(idB, undefined, {numeric: true});
            }
            
            if (idA) return -1;
            if (idB) return 1;
            
            return (a.leito || 0) - (b.leito || 0);
        });
    }
    
    // Ordenar RESERVADOS por identificacaoLeito
    reservasHospital.sort((a, b) => {
        const idA = a.identificacaoLeito || '';
        const idB = b.identificacaoLeito || '';
        return String(idA).localeCompare(String(idB), undefined, {numeric: true});
    });
    
    // Ordenar VAGOS por numero do leito
    leitosVagos.sort((a, b) => (a.leito || 0) - (b.leito || 0));
    
    // FILTRO INTELIGENTE DE VAGOS
    let vagosParaMostrar = [];
    
    if (isHibrido) {
        vagosParaMostrar = leitosVagos.length > 0 ? [leitosVagos[0]] : [];
        console.log('[CARDS V7.0] Hibrido: 1 vago (menor ID)');
        
    } else if (isTiposFixos) {
        const vagosApartamentos = leitosVagos.filter(l => {
            const tipo = l.tipo || '';
            return tipo.toUpperCase().includes('APTO') || tipo === 'APTO' || tipo === 'Apartamento';
        });
        
        const vagosEnfermarias = leitosVagos.filter(l => {
            const tipo = l.tipo || '';
            return tipo.toUpperCase().includes('ENF') || tipo === 'ENFERMARIA' || tipo === 'Enfermaria';
        });
        
        const apartamentoParaMostrar = vagosApartamentos.length > 0 ? [vagosApartamentos[0]] : [];
        
        const enfermariasParaMostrar = [];
        let parLivreJaAdicionado = false;
        
        vagosEnfermarias.forEach(leitoVago => {
            const numeroLeito = parseInt(leitoVago.leito);
            const leitoIrmao = window.getLeitoIrmao(hospitalId, numeroLeito);
            
            if (!leitoIrmao) {
                enfermariasParaMostrar.push(leitoVago);
            } else {
                const dadosIrmao = hospital.leitos.find(l => parseInt(l.leito) === leitoIrmao);
                
                if (!dadosIrmao || dadosIrmao.status === 'Vago' || dadosIrmao.status === 'vago') {
                    if (!parLivreJaAdicionado) {
                        enfermariasParaMostrar.push(leitoVago);
                        parLivreJaAdicionado = true;
                    }
                } else {
                    const isolamentoIrmao = dadosIrmao.isolamento || '';
                    
                    if (isolamentoIrmao === 'Isolamento de Contato' || isolamentoIrmao === 'Isolamento Respiratorio') {
                        // Bloqueado
                    } else {
                        enfermariasParaMostrar.push(leitoVago);
                    }
                }
            }
        });
        
        vagosParaMostrar = [...apartamentoParaMostrar, ...enfermariasParaMostrar];
        console.log('[CARDS V7.0] Tipos Fixos: ' + apartamentoParaMostrar.length + ' apto + ' + enfermariasParaMostrar.length + ' enf');
        
    } else {
        vagosParaMostrar = leitosVagos.length > 0 ? [leitosVagos[0]] : [];
    }
    
    // V7.0: RENDERIZAR NA ORDEM - OCUPADOS > RESERVADOS > VAGOS
    let cardsRenderizados = 0;
    
    // 1. OCUPADOS
    leitosOcupados.forEach((leito, index) => {
        let posicaoOcupacao = 1;
        
        if (isTiposFixos) {
            const tipoLeito = (leito.tipo || '').toUpperCase();
            const isApto = tipoLeito.includes('APTO') || tipoLeito === 'APARTAMENTO';
            
            const ocupadosMesmoTipo = leitosOcupados.filter(l => {
                const tipoL = (l.tipo || '').toUpperCase();
                const isAptoL = tipoL.includes('APTO') || tipoL === 'APARTAMENTO';
                return isApto === isAptoL;
            });
            
            posicaoOcupacao = ocupadosMesmoTipo.findIndex(l => l.leito === leito.leito) + 1;
        } else {
            posicaoOcupacao = index + 1;
        }
        
        const card = createCard(leito, hospitalNome, hospitalId, posicaoOcupacao);
        container.appendChild(card);
        cardsRenderizados++;
    });
    
    // 2. RESERVADOS
    reservasHospital.forEach(reserva => {
        const card = createCardReservado(reserva, hospitalNome, hospitalId);
        container.appendChild(card);
        cardsRenderizados++;
    });
    
    // 3. VAGOS
    vagosParaMostrar.forEach(leito => {
        const card = createCard(leito, hospitalNome, hospitalId, 0);
        container.appendChild(card);
        cardsRenderizados++;
    });
    
    logInfo(cardsRenderizados + ' cards renderizados para ' + hospitalNome + ' (' + leitosOcupados.length + ' ocupados + ' + reservasHospital.length + ' reservados + ' + vagosParaMostrar.length + ' vagos)');
};

// =================== FUNCAO: BADGE DE ISOLAMENTO ===================
function getBadgeIsolamento(isolamento) {
    if (!isolamento || isolamento === 'Nao Isolamento') {
        return { cor: '#b2adaa', texto: 'Nao Isol', textoCor: '#ffffff' };
    } else if (isolamento === 'Isolamento de Contato') {
        return { cor: '#f59a1d', texto: 'Contato', textoCor: '#131b2e' };
    } else if (isolamento === 'Isolamento Respiratorio') {
        return { cor: '#c86420', texto: 'Respiratorio', textoCor: '#ffffff' };
    }
    return getBadgeIsolamento('Nao Isolamento');
}

// =================== FUNCAO: BADGE DE GENERO ===================
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
    } else if (diretivas === 'Nao') {
        return { cor: 'rgba(60,58,62,0.2)', borda: '#3c3a3e', textoCor: '#b2adaa', texto: 'Nao' };
    }
    return { cor: 'rgba(96,165,250,0.2)', borda: '#60a5fa', textoCor: '#60a5fa', texto: 'Nao se aplica' };
}

// DETERMINAR TIPO REAL DO LEITO
function getTipoLeito(leito, hospitalId) {
    const categoriaValue = leito.categoriaEscolhida || 
                          leito.categoria || 
                          leito.categoria_escolhida || 
                          leito.tipo_quarto ||
                          leito.tipoQuarto;
    
    const numeroLeito = parseInt(leito.leito);
    
    if (hospitalId === 'H4') {
        if (leito.tipo && leito.tipo !== 'Hibrido' && leito.tipo !== 'Hibrido') {
            return leito.tipo;
        }
        return numeroLeito <= 27 ? 'ENFERMARIA' : 'APTO';
    }
    
    const isVago = leito.status === 'Vago' || leito.status === 'vago';
    if (window.HOSPITAIS_HIBRIDOS.includes(hospitalId) && isVago) {
        return 'Hibrido';
    }
    
    const isOcupado = leito.status === 'Em uso' || leito.status === 'ocupado' || leito.status === 'Ocupado';
    if (window.HOSPITAIS_HIBRIDOS.includes(hospitalId) && isOcupado) {
        if (categoriaValue && categoriaValue.trim() !== '' && categoriaValue !== 'Hibrido') {
            return categoriaValue;
        }
        if (leito.tipo && leito.tipo !== 'Hibrido') return leito.tipo;
        return 'Apartamento';
    }
    
    return leito.tipo || 'Apartamento';
}

// FORMATACAO DO TIPO (SEM EMOJI)
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
        case 'HIBRIDO':
            return 'Hibrido';
        default:
            return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    }
}

// FORMATAR MATRICULA COM HIFEN NO ULTIMO DIGITO
function formatarMatriculaExibicao(matricula) {
    if (!matricula || matricula === '—') return '—';
    const mat = String(matricula).replace(/\D/g, '');
    if (mat.length === 0) return '—';
    if (mat.length === 1) return mat;
    return mat.slice(0, -1) + '-' + mat.slice(-1);
}

// VALIDACAO DE BLOQUEIO CRUZ AZUL E SANTA CLARA (LEITOS IRMAOS)
function validarAdmissaoCruzAzul(leitoNumero, generoNovo) {
    const hospitalId = window.currentHospital;
    
    const isCruzAzul = (hospitalId === 'H2') && (leitoNumero in window.CRUZ_AZUL_IRMAOS);
    const isSantaClara = (hospitalId === 'H4') && (leitoNumero in window.SANTA_CLARA_IRMAOS);
    
    if (!isCruzAzul && !isSantaClara) {
        return { permitido: true };
    }
    
    const mapaIrmaos = isCruzAzul ? window.CRUZ_AZUL_IRMAOS : window.SANTA_CLARA_IRMAOS;
    const leitoIrmao = mapaIrmaos[leitoNumero];
    if (!leitoIrmao) return { permitido: true };
    
    const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
    const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
    
    if (!dadosLeitoIrmao || dadosLeitoIrmao.status === 'Vago' || dadosLeitoIrmao.status === 'vago') {
        return { permitido: true };
    }
    
    const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
    if (isolamentoIrmao && isolamentoIrmao !== 'Nao Isolamento' && isolamentoIrmao !== '') {
        return {
            permitido: false,
            motivo: 'Leito bloqueado! O leito ' + leitoIrmao + ' esta com isolamento: ' + isolamentoIrmao,
            tipo: 'isolamento'
        };
    }
    
    const generoIrmao = dadosLeitoIrmao.genero || '';
    if (generoIrmao && generoNovo && generoIrmao !== generoNovo) {
        return {
            permitido: false,
            motivo: 'Leito bloqueado! O leito ' + leitoIrmao + ' esta ocupado por paciente do genero ' + generoIrmao,
            tipo: 'genero'
        };
    }
    
    return { permitido: true };
}

// =================== V7.0: CRIAR CARD DE RESERVA ===================
function createCardReservado(reserva, hospitalNome, hospitalId) {
    const card = document.createElement('div');
    card.className = 'card card-reservado';
    card.style.cssText = 'background: #1a1f2e; border-radius: 12px; padding: 18px; color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: "Poppins", sans-serif; border: 2px solid ' + COR_RESERVADO_BORDA + ' !important;';
    
    const tipo = reserva.tipo || 'Apartamento';
    const identificacaoLeito = reserva.identificacaoLeito || '—';
    const isolamento = reserva.isolamento || 'Nao Isolamento';
    const genero = reserva.genero || '';
    const iniciais = reserva.iniciais || '—';
    const matricula = reserva.matricula || '';
    const idade = reserva.idade || null;
    
    const badgeIsolamento = getBadgeIsolamento(isolamento);
    const badgeGenero = getBadgeGenero(genero);
    const matriculaFormatada = formatarMatriculaExibicao(matricula);
    
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    
    card.innerHTML = `
        <!-- HEADER: HOSPITAL -->
        <div class="card-header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; font-family: 'Poppins', sans-serif;">
            <div style="font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">HOSPITAL</div>
            <div style="font-size: 16px; color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${hospitalNome}</div>
            ${isHibrido ? '<div style="font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600; margin-top: 2px;">Leito Hibrido</div>' : ''}
        </div>

        <!-- LINHA 1: LEITO | TIPO | STATUS RESERVADO -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-box" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">LEITO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">${identificacaoLeito}</div>
            </div>
            
            <div class="card-box" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">TIPO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">${formatarTipoTexto(tipo)}</div>
            </div>
            
            <div class="status-badge" style="background: ${COR_RESERVADO_BG}; color: ${COR_RESERVADO_TEXTO}; padding: 12px 6px; border-radius: 6px; font-weight: 800; text-transform: uppercase; text-align: center; font-size: 11px; letter-spacing: 0.5px; min-height: 45px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="box-label" style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; color: ${COR_RESERVADO_TEXTO};">STATUS</div>
                <div class="box-value" style="font-weight: 700; font-size: 11px; line-height: 1.2; color: ${COR_RESERVADO_TEXTO};">Reservado</div>
            </div>
        </div>

        <!-- LINHA 2: GENERO | ISOLAMENTO | PREV ALTA (cinza) -->
        <div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="card-box" style="background: ${badgeGenero.cor}; border: 1px solid ${badgeGenero.borda}; border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: ${badgeGenero.textoCor}; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">GENERO</div>
                <div class="box-value" style="color: ${badgeGenero.textoCor}; font-weight: 700; font-size: 11px; line-height: 1.2;">${badgeGenero.texto}</div>
            </div>
            
            <div class="card-box" style="background: ${badgeIsolamento.cor}; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">
                <div class="box-label" style="font-size: 9px; color: ${badgeIsolamento.textoCor}; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">ISOLAMENTO</div>
                <div class="box-value" style="color: ${badgeIsolamento.textoCor}; font-weight: 700; font-size: 11px; line-height: 1.2;">${badgeIsolamento.texto}</div>
            </div>
            
            <div class="card-box prev-alta" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center; opacity: 0.5;">
                <div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">PREVISAO ALTA</div>
                <div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 11px; line-height: 1.2;">—</div>
            </div>
        </div>

        <!-- LINHA DIVISORIA -->
        <div class="divider" style="height: 2px; background: ${COR_RESERVADO_BG}; margin: 12px 0;"></div>

        <!-- SECAO PESSOA: CIRCULO AMARELO + 4 CELULAS -->
        <div class="card-row-pessoa" style="display: grid; grid-template-columns: 100px 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-family: 'Poppins', sans-serif;">
            <div class="pessoa-circle" style="grid-row: span 2; grid-column: 1; width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ${COR_RESERVADO_BG};">
                <svg class="pessoa-icon" viewBox="0 0 24 24" fill="none" stroke="${COR_RESERVADO_TEXTO}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 55%; height: 55%;">
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>
                </svg>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">INICIAIS</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${iniciais}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">MATRICULA</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${matriculaFormatada}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">IDADE</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${idade ? idade + ' anos' : '—'}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px; opacity: 0.5;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">REGIAO</div>
                <div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 10px; line-height: 1.2;">—</div>
            </div>
        </div>

        <!-- SECAO CLINICA (CINZA - RESERVA) -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin-bottom: 12px; opacity: 0.5;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px;">
                <div style="text-align: center;">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">PPS</div>
                    <div style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 10px;">—</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">SPICT-BR</div>
                    <div style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 10px;">—</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">DIRETIVAS</div>
                    <div style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 10px;">—</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">CONCESSOES</div>
                    <div style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 10px;">—</div>
                </div>
            </div>
            <div style="text-align: center; font-size: 9px; color: rgba(255,255,255,0.4); font-style: italic;">
                Reserva - dados completos na admissao
            </div>
        </div>

        <!-- FOOTER: BOTOES -->
        <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <div class="info-item" style="display: flex; flex-direction: column;">
                    <div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">STATUS</div>
                    <div class="info-value" style="color: ${COR_RESERVADO_BG}; font-weight: 700; font-size: 9px;">RESERVADO</div>
                </div>
            </div>
            
            <button class="btn-action btn-cancelar-reserva" 
                    data-action="cancelar-reserva" 
                    data-hospital="${hospitalId}"
                    data-identificacao="${identificacaoLeito}"
                    data-matricula="${matricula}"
                    style="padding: 10px 18px; 
                           background: #c86420; 
                           color: #ffffff; 
                           border: none; 
                           border-radius: 6px; 
                           cursor: pointer; 
                           font-weight: 800; 
                           text-transform: uppercase; 
                           font-size: 11px; 
                           font-family: 'Poppins', sans-serif;
                           transition: all 0.2s ease; 
                           letter-spacing: 0.5px; 
                           white-space: nowrap; 
                           flex-shrink: 0;">
                CANCELAR RESERVA
            </button>
        </div>
    `;

    // Event listener para cancelar reserva
    const cancelarBtn = card.querySelector('[data-action="cancelar-reserva"]');
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!confirm('Deseja cancelar esta reserva?')) return;
            
            const hospital = cancelarBtn.dataset.hospital;
            const identificacao = cancelarBtn.dataset.identificacao;
            const matriculaReserva = cancelarBtn.dataset.matricula;
            
            const originalText = cancelarBtn.innerHTML;
            showButtonLoading(cancelarBtn, 'CANCELANDO...');
            
            try {
                await window.cancelarReserva(hospital, identificacao, matriculaReserva);
                hideButtonLoading(cancelarBtn, originalText);
                showSuccessMessage('Reserva cancelada com sucesso!');
                await window.refreshAfterAction();
            } catch (error) {
                hideButtonLoading(cancelarBtn, originalText);
                showErrorMessage('Erro ao cancelar reserva: ' + error.message);
            }
        });
    }

    return card;
}

// =================== V7.0: CANCELAR RESERVA ===================
window.cancelarReserva = async function(hospital, identificacaoLeito, matricula) {
    logInfo(`[V7.0] Cancelando reserva: ${hospital} - ${identificacaoLeito}`);
    
    try {
        const response = await fetch(window.API_URL + '?action=cancelarReserva', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hospital: hospital,
                identificacaoLeito: identificacaoLeito,
                matricula: matricula
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Atualizar dados locais
            if (window.reservasData) {
                window.reservasData = window.reservasData.filter(r => 
                    !(r.hospital === hospital && 
                      (r.identificacaoLeito === identificacaoLeito || r.matricula === matricula))
                );
            }
            return true;
        } else {
            throw new Error(result.message || 'Erro ao cancelar reserva');
        }
    } catch (error) {
        logError('Erro ao cancelar reserva:', error);
        throw error;
    }
};

// =================== CRIAR CARD INDIVIDUAL ===================
function createCard(leito, hospitalNome, hospitalId, posicaoOcupacao) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'background: #1a1f2e; border-radius: 12px; padding: 18px; color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: "Poppins", sans-serif;';
    
    // ADICIONAR BORDA LARANJA SE LEITO EXTRA
    const isExtra = window.isLeitoExtra(hospitalId, posicaoOcupacao);
    if (isExtra) {
        card.style.cssText += ' border: 2px solid #f59a1d !important;';
    }
    
    // VERIFICAR BLOQUEIO CRUZ AZUL
    let bloqueadoPorIsolamento = false;
    let bloqueadoPorGenero = false;
    let generoPermitido = null;
    let motivoBloqueio = '';

    const numeroLeito = parseInt(leito.leito);
    
    const isCruzAzulEnfermaria = (hospitalId === 'H2') && (numeroLeito in window.CRUZ_AZUL_IRMAOS);
    const isSantaClaraEnfermaria = (hospitalId === 'H4') && (numeroLeito in window.SANTA_CLARA_IRMAOS);

    if ((isCruzAzulEnfermaria || isSantaClaraEnfermaria) && (leito.status === 'Vago' || leito.status === 'vago')) {
        const mapaIrmaos = isCruzAzulEnfermaria ? window.CRUZ_AZUL_IRMAOS : window.SANTA_CLARA_IRMAOS;
        const leitoIrmao = mapaIrmaos[numeroLeito];
        
        if (leitoIrmao) {
            const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
            const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
            
            if (dadosLeitoIrmao && (dadosLeitoIrmao.status === 'Em uso' || dadosLeitoIrmao.status === 'ocupado' || dadosLeitoIrmao.status === 'Ocupado')) {
                const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
                if (isolamentoIrmao && isolamentoIrmao !== 'Nao Isolamento') {
                    bloqueadoPorIsolamento = true;
                    const identificacaoIrmao = dadosLeitoIrmao?.identificacaoLeito || 
                                               dadosLeitoIrmao?.identificacao_leito || 
                                               'Leito ' + leitoIrmao;
                    motivoBloqueio = 'Isolamento no ' + identificacaoIrmao;
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
    let statusTexto = 'Disponivel';
    
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
            statusTexto = 'Disp. ' + (generoPermitido === 'Masculino' ? 'Masc' : 'Fem');
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
    
    // Normalizar isolamento
    let isolamento = leito.isolamento || 'Nao Isolamento';
    const isolamentoLower = isolamento.toLowerCase().trim();
    
    if (isolamentoLower === 'isolamento de contato' || isolamentoLower === 'isolamento contato') {
        isolamento = 'Isolamento de Contato';
    } else if (isolamentoLower === 'isolamento respiratorio' || isolamentoLower === 'isolamento respiratorio') {
        isolamento = 'Isolamento Respiratorio';
    } else if (isolamentoLower === 'nao isolamento' || isolamentoLower === 'nao isolamento' || isolamentoLower.includes('nao isol')) {
        isolamento = 'Nao Isolamento';
    }
    
    // Identificacao do leito
    let identificacaoLeito = leito.identificacaoLeito || leito.identificacao_leito || '';
    
    const regiao = leito.regiao || '';
    const sexo = leito.genero || '';
    const diretivas = leito.diretivas || 'Nao se aplica';
    
    const tipoReal = getTipoLeito(leito, hospitalId);
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    
    const badgeIsolamento = getBadgeIsolamento(isolamento);
    const badgeGenero = getBadgeGenero(sexo);
    const badgeDiretivas = getBadgeDiretivas(diretivas);
    
    // DESNORMALIZAR CONCESSOES E LINHAS
    const concessoesRaw = Array.isArray(leito.concessoes) ? leito.concessoes : [];
    const concessoes = concessoesRaw.map(c => window.desnormalizarTexto(c));
    
    const linhasRaw = Array.isArray(leito.linhas) ? leito.linhas : [];
    const linhas = linhasRaw.map(l => window.desnormalizarTexto(l));
    
    let tempoInternacao = '';
    if (!isVago && admissao) {
        tempoInternacao = calcularTempoInternacao(admissao);
    }
    
    const iniciais = isVago ? '—' : (nome ? String(nome).trim() : '—');
    
    let ppsFormatado = pps ? pps + '%' : '—';
    if (ppsFormatado !== '—' && !ppsFormatado.includes('%')) {
        ppsFormatado = pps + '%';
    }
    
    const spictFormatado = spict === 'elegivel' ? 'Elegivel' : 
                          (spict === 'nao_elegivel' ? 'Nao elegivel' : '—');
    
    const idSequencial = String(numeroLeito).padStart(2, '0');
    
    // AJUSTE: Leitos vagos mostram "-" se nao tiver identificacao
    let leitoDisplay;
    if (isVago) {
        leitoDisplay = (identificacaoLeito && identificacaoLeito.trim()) 
            ? identificacaoLeito.trim().toUpperCase()
            : '—';
    } else {
        leitoDisplay = (identificacaoLeito && identificacaoLeito.trim()) 
            ? identificacaoLeito.trim().toUpperCase()
            : 'LEITO ' + numeroLeito;
    }
    
    // COR DO CIRCULO PESSOA
    const circuloCor = '#60a5fa';
    const circuloStroke = isVago ? '#1a1f2e' : '#ffffff';
    
    // HTML do Card
    card.innerHTML = `
        <!-- HEADER: HOSPITAL FORA DOS BOXES -->
        <div class="card-header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; font-family: 'Poppins', sans-serif;">
            <div style="font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">HOSPITAL</div>
            <div style="font-size: 16px; color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${hospitalNome}</div>
            ${isHibrido ? '<div style="font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600; margin-top: 2px;">Leito Hibrido</div>' : ''}
            ${window.renderFlagOcupacao(hospitalId, leito.status, posicaoOcupacao, tipoReal)}
        </div>

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
                ${motivoBloqueio ? '<div style="font-size: 8px; margin-top: 2px; color: ' + statusTextColor + ';">' + motivoBloqueio + '</div>' : ''}
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

        <!-- LINHA DIVISORIA BRANCA SOLIDA -->
        <div class="divider" style="height: 2px; background: #ffffff; margin: 12px 0;"></div>

        <!-- SECAO PESSOA: CIRCULO + 4 CELULAS -->
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
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">MATRICULA</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;" data-matricula="${matricula}">${matriculaFormatada}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">IDADE</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${idade ? idade + ' anos' : '—'}</div>
            </div>

            <div class="small-cell" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">
                <div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">REGIAO</div>
                <div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">${regiao || '—'}</div>
            </div>
        </div>

        <!-- SECAO CLINICA -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px;">
                <div style="text-align: center;">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">PPS</div>
                    <div style="color: #ffffff; font-weight: 700; font-size: 10px;">${ppsFormatado}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">SPICT-BR</div>
                    <div style="color: #ffffff; font-weight: 700; font-size: 10px;">${spictFormatado}</div>
                </div>
                <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">DIRETIVAS</div>
                    <div style="background: ${badgeDiretivas.cor}; border: 1px solid ${badgeDiretivas.borda}; color: ${badgeDiretivas.textoCor}; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; display: inline-block;">${badgeDiretivas.texto}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 8px; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">CONCESSOES</div>
                    <div style="color: #ffffff; font-weight: 700; font-size: 10px;">${concessoes.length > 0 ? concessoes.length : '—'}</div>
                </div>
            </div>
            
            ${concessoes.length > 0 ? '<div style="font-size: 9px; color: rgba(255,255,255,0.6); margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">' + concessoes.slice(0, 3).join(', ') + (concessoes.length > 3 ? ' (+' + (concessoes.length - 3) + ')' : '') + '</div>' : ''}
            
            ${linhas.length > 0 ? '<div style="font-size: 9px; color: #60a5fa; margin-top: 4px;">Linhas: ' + linhas.slice(0, 2).join(', ') + (linhas.length > 2 ? ' (+' + (linhas.length - 2) + ')' : '') + '</div>' : ''}
        </div>

        <!-- FOOTER: INFO + BOTOES V7.0 -->
        <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
                ${!isVago && admissao ? '<div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;"><div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">ADMISSAO</div><div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">' + formatarDataHora(admissao) + '</div></div>' : ''}
                
                ${!isVago && tempoInternacao ? '<div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;"><div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">INTERNADO</div><div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">' + tempoInternacao + '</div></div>' : ''}
                
                <div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">
                    <div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">ID</div>
                    <div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">${idSequencial}</div>
                </div>
                
                ${isVago ? '<div class="info-item" style="display: flex; flex-direction: column;"><div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">STATUS</div><div class="info-value" style="color: #60a5fa; font-weight: 700; font-size: 9px;">' + statusTexto + '</div></div>' : ''}
            </div>
            
            <!-- V7.0: BOTOES - RESERVAR + ADMITIR (vago) ou ATUALIZAR (ocupado) -->
            <div style="display: flex; gap: 8px;">
                ${isVago && !bloqueadoPorIsolamento ? '<button class="btn-action btn-reservar" data-action="reservar" data-leito="' + numeroLeito + '" style="padding: 10px 18px; background: ' + COR_RESERVADO_BG + '; color: ' + COR_RESERVADO_TEXTO + '; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 11px; font-family: Poppins, sans-serif; transition: all 0.2s ease; letter-spacing: 0.5px; white-space: nowrap; flex-shrink: 0;">RESERVAR</button>' : ''}
                
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
    
    // V7.0: Event listener para RESERVAR
    const reservarBtn = card.querySelector('[data-action="reservar"]');
    if (reservarBtn) {
        reservarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openReservaFlow(numeroLeito, leito);
        });
    }

    return card;
}

// =================== FLUXOS DE ADMISSAO, ATUALIZACAO E RESERVA ===================
function openAdmissaoFlow(leitoNumero) {
    const button = document.querySelector('[data-action="admitir"][data-leito="' + leitoNumero + '"]');
    const originalText = button.innerHTML;
    
    showButtonLoading(button, 'ADMITIR');
    
    setTimeout(() => {
        hideButtonLoading(button, originalText);
        openAdmissaoModal(leitoNumero);
        logInfo('Modal de admissao aberto: ' + window.currentHospital + ' - Leito ' + leitoNumero);
    }, 800);
}

function openAtualizacaoFlow(leitoNumero, dadosLeito) {
    const button = document.querySelector('[data-action="atualizar"][data-leito="' + leitoNumero + '"]');
    const originalText = button.innerHTML;
    
    showButtonLoading(button, 'ATUALIZAR');
    
    setTimeout(() => {
        hideButtonLoading(button, originalText);
        openAtualizacaoModal(leitoNumero, dadosLeito);
        logInfo('Modal de atualizacao aberto: ' + window.currentHospital + ' - Leito ' + leitoNumero);
    }, 800);
}

// V7.0: FLUXO DE RESERVA
function openReservaFlow(leitoNumero, dadosLeito) {
    const button = document.querySelector('[data-action="reservar"][data-leito="' + leitoNumero + '"]');
    const originalText = button.innerHTML;
    
    showButtonLoading(button, 'RESERVAR');
    
    setTimeout(() => {
        hideButtonLoading(button, originalText);
        openReservaModal(leitoNumero, dadosLeito);
        logInfo('Modal de reserva aberto: ' + window.currentHospital + ' - Leito ' + leitoNumero);
    }, 800);
}

// =================== MODAIS ===================
function openAdmissaoModal(leitoNumero) {
    const hospitalId = window.currentHospital;
    const hospitalNome = window.HOSPITAL_MAPPING[hospitalId]?.nome || 'Hospital';
    
    window.selectedLeito = leitoNumero;
    
    const modal = createModalOverlay();
    modal.innerHTML = createAdmissaoForm(hospitalNome, leitoNumero, hospitalId);
    document.body.appendChild(modal);
    
    setupModalEventListeners(modal, 'admissao');
    setupSearchFilter(modal, 'admConcessoes', 'searchConcessoes');
    setupSearchFilter(modal, 'admLinhas', 'searchLinhas');
}

function openAtualizacaoModal(leitoNumero, dadosLeito) {
    const hospitalId = window.currentHospital;
    const hospitalNome = window.HOSPITAL_MAPPING[hospitalId]?.nome || 'Hospital';
    
    window.selectedLeito = leitoNumero;
    
    const modal = createModalOverlay();
    modal.innerHTML = createAtualizacaoForm(hospitalNome, leitoNumero, dadosLeito);
    document.body.appendChild(modal);
    
    setupModalEventListeners(modal, 'atualizacao');
    setupSearchFilter(modal, 'updConcessoes', 'searchConcessoesUpd');
    setupSearchFilter(modal, 'updLinhas', 'searchLinhasUpd');
    
    setTimeout(() => {
        forcarPreMarcacao(modal, dadosLeito);
    }, 100);
}

// V7.0: MODAL DE RESERVA
function openReservaModal(leitoNumero, dadosLeito) {
    const hospitalId = window.currentHospital;
    const hospitalNome = window.HOSPITAL_MAPPING[hospitalId]?.nome || 'Hospital';
    
    window.selectedLeito = leitoNumero;
    
    const modal = createModalOverlay();
    modal.innerHTML = createReservaForm(hospitalNome, leitoNumero, hospitalId);
    document.body.appendChild(modal);
    
    setupReservaModalEventListeners(modal);
}

function createModalOverlay() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease; font-family: Poppins, sans-serif;';
    return modal;
}

// FUNCAO DE BUSCA DINAMICA
function setupSearchFilter(modal, containerId, searchId) {
    const searchInput = modal.querySelector('#' + searchId);
    const container = modal.querySelector('#' + containerId);
    
    if (!searchInput || !container) {
        logError('Elementos nao encontrados: ' + searchId + ' ou ' + containerId);
        return;
    }
    
    const labels = container.querySelectorAll('label');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        labels.forEach(label => {
            const text = label.textContent.toLowerCase();
            
            if (searchTerm === '' || text.includes(searchTerm)) {
                label.style.display = 'flex';
            } else {
                label.style.display = 'none';
            }
        });
        
        const visibleLabels = Array.from(labels).filter(l => l.style.display !== 'none');
        
        let msgNoResults = container.querySelector('.no-results-message');
        
        if (visibleLabels.length === 0) {
            if (!msgNoResults) {
                msgNoResults = document.createElement('div');
                msgNoResults.className = 'no-results-message';
                msgNoResults.style.cssText = 'padding: 10px; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px;';
                msgNoResults.textContent = 'Nenhum resultado para "' + searchTerm + '"';
                container.appendChild(msgNoResults);
            }
        } else {
            if (msgNoResults) {
                msgNoResults.remove();
            }
        }
    });
    
    logSuccess('Busca dinamica configurada: ' + searchId);
}

// =================== V7.0: FORMULARIO DE RESERVA ===================
function createReservaForm(hospitalNome, leitoNumero, hospitalId) {
    const idSequencial = String(leitoNumero).padStart(2, '0');
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    const isCruzAzulEnfermaria = (hospitalId === 'H2') && (window.CRUZ_AZUL_IRMAOS[leitoNumero] !== undefined);
    const isSantaClaraEnfermaria = (hospitalId === 'H4') && (window.SANTA_CLARA_IRMAOS[leitoNumero] !== undefined);
    
    // Determinar opcoes de tipo
    let tipoOptions = '';
    if (isHibrido) {
        tipoOptions = '<option value="">Selecionar...</option><option value="Apartamento">Apartamento</option><option value="Enfermaria">Enfermaria</option>';
    } else if (isCruzAzulEnfermaria || isSantaClaraEnfermaria) {
        tipoOptions = '<option value="Enfermaria" selected>Enfermaria</option>';
    } else {
        tipoOptions = '<option value="Apartamento" selected>Apartamento</option>';
    }
    
    // Sufixos para leitos irmaos
    let sufixoOptions = '';
    if (isCruzAzulEnfermaria) {
        sufixoOptions = '<option value="">...</option><option value="1">1</option><option value="3">3</option>';
    } else if (isSantaClaraEnfermaria) {
        sufixoOptions = '<option value="">...</option><option value="A">A</option><option value="C">C</option>';
    }
    
    return '<div class="modal-content" style="background: #1a1f2e; border-radius: 12px; padding: 30px; max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto; color: #ffffff; font-family: Poppins, sans-serif; border: 2px solid ' + COR_RESERVADO_BORDA + ';">' +
        '<h2 style="margin: 0 0 20px 0; text-align: center; color: ' + COR_RESERVADO_BG + '; font-size: 24px; font-weight: 700; text-transform: uppercase;">Reservar Leito</h2>' +
        
        '<div style="text-align: center; margin-bottom: 30px; padding: 15px; background: rgba(251,191,36,0.1); border: 1px solid ' + COR_RESERVADO_BORDA + '; border-radius: 8px;">' +
            '<strong>Hospital:</strong> ' + hospitalNome + ' | <strong>ID:</strong> ' + idSequencial +
        '</div>' +
        
        '<div style="background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center;">' +
            '<div style="font-size: 11px; color: ' + COR_RESERVADO_BG + '; font-weight: 600;">Os demais campos serao preenchidos no momento da admissao</div>' +
        '</div>' +
        
        '<!-- LINHA 1: TIPO QUARTO | IDENTIFICACAO -->' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">' +
            '<div>' +
                '<label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Quarto <span style="color: #c86420;">*</span></label>' +
                '<select id="resTipoQuarto" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;">' +
                    tipoOptions +
                '</select>' +
            '</div>' +
            '<div>' +
                '<label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Identificacao do Leito <span style="color: #c86420;">*</span></label>' +
                ((isCruzAzulEnfermaria || isSantaClaraEnfermaria) 
                    ? '<div style="display: flex; gap: 8px;"><input id="resIdentificacaoNumero" type="text" placeholder="Numero" maxlength="4" required style="flex: 2; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;"><select id="resIdentificacaoSufixo" required style="flex: 1; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;">' + sufixoOptions + '</select></div>'
                    : '<input id="resIdentificacaoLeito" type="text" placeholder="Ex: 101, 202-A" maxlength="10" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;">') +
            '</div>' +
        '</div>' +
        
        '<!-- LINHA 2: ISOLAMENTO | GENERO -->' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">' +
            '<div>' +
                '<label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento <span style="color: #c86420;">*</span></label>' +
                '<select id="resIsolamento" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;">' +
                    '<option value="">Selecionar...</option>' +
                    '<option value="Nao Isolamento">Nao Isolamento</option>' +
                    '<option value="Isolamento de Contato">Isolamento de Contato</option>' +
                    '<option value="Isolamento Respiratorio">Isolamento Respiratorio</option>' +
                '</select>' +
            '</div>' +
            '<div>' +
                '<label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Genero <span style="color: #c86420;">*</span></label>' +
                '<select id="resGenero" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;">' +
                    '<option value="">Selecionar...</option>' +
                    '<option value="Feminino">Feminino</option>' +
                    '<option value="Masculino">Masculino</option>' +
                '</select>' +
            '</div>' +
        '</div>' +
        
        '<!-- LINHA 3: INICIAIS | MATRICULA | IDADE (opcionais) -->' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">' +
            '<div>' +
                '<label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Iniciais</label>' +
                '<input id="resIniciais" type="text" placeholder="Ex: ADR" maxlength="20" oninput="window.formatarIniciaisAutomatico(this)" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif; letter-spacing: 2px;">' +
            '</div>' +
            '<div>' +
                '<label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Matricula</label>' +
                '<input id="resMatricula" type="text" placeholder="Ex: 123456789-0" maxlength="11" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;" oninput="formatarMatriculaInput(this)">' +
            '</div>' +
            '<div>' +
                '<label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade</label>' +
                '<select id="resIdade" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: Poppins, sans-serif;">' +
                    '<option value="">Selecionar...</option>' +
                    window.IDADE_OPTIONS.map(function(idade) { return '<option value="' + idade + '">' + idade + ' anos</option>'; }).join('') +
                '</select>' +
            '</div>' +
        '</div>' +
        
        '<!-- CAMPOS BLOQUEADOS (CINZA) -->' +
        '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 20px; opacity: 0.5;">' +
            '<div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; font-weight: 700; margin-bottom: 10px;">Campos disponiveis na admissao</div>' +
            '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 11px; color: rgba(255,255,255,0.4);">' +
                '<div>PPS</div>' +
                '<div>SPICT-BR</div>' +
                '<div>Diretivas</div>' +
                '<div>Regiao</div>' +
                '<div>Prev. Alta</div>' +
                '<div>Concessoes</div>' +
                '<div>Linhas</div>' +
                '<div>Anotacoes</div>' +
            '</div>' +
        '</div>' +
        
        '<!-- BOTOES -->' +
        '<div class="modal-buttons" style="display: flex; justify-content: flex-end; gap: 12px; padding: 20px 0 0 0; border-top: 1px solid rgba(255,255,255,0.1);">' +
            '<button class="btn-cancelar" style="padding: 12px 30px; background: rgba(255,255,255,0.1); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: Poppins, sans-serif;">Cancelar</button>' +
            '<button class="btn-salvar-reserva" style="padding: 12px 30px; background: ' + COR_RESERVADO_BG + '; color: ' + COR_RESERVADO_TEXTO + '; border: none; border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: Poppins, sans-serif;">Reservar</button>' +
        '</div>' +
    '</div>';
}

// V7.0: EVENT LISTENERS DO MODAL DE RESERVA
function setupReservaModalEventListeners(modal) {
    const btnCancelar = modal.querySelector('.btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(modal);
        });
    }
    
    const btnSalvar = modal.querySelector('.btn-salvar-reserva');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const hospitalId = window.currentHospital;
            const leitoNumero = window.selectedLeito;
            
            // Validar campos obrigatorios
            const tipoQuarto = modal.querySelector('#resTipoQuarto')?.value || '';
            const isolamento = modal.querySelector('#resIsolamento')?.value || '';
            const genero = modal.querySelector('#resGenero')?.value || '';
            
            // Identificacao do leito
            let identificacaoLeito = '';
            const identificacaoNumero = modal.querySelector('#resIdentificacaoNumero');
            const identificacaoSufixo = modal.querySelector('#resIdentificacaoSufixo');
            const identificacaoSimples = modal.querySelector('#resIdentificacaoLeito');
            
            if (identificacaoNumero && identificacaoSufixo) {
                const numero = identificacaoNumero.value.trim();
                const sufixo = identificacaoSufixo.value;
                if (!numero) {
                    showErrorMessage('Campo "Numero do Leito" e obrigatorio!');
                    identificacaoNumero.focus();
                    return;
                }
                if (!sufixo) {
                    showErrorMessage('Campo "Sufixo" e obrigatorio!');
                    identificacaoSufixo.focus();
                    return;
                }
                identificacaoLeito = numero + '-' + sufixo;
            } else if (identificacaoSimples) {
                identificacaoLeito = identificacaoSimples.value.trim();
                if (!identificacaoLeito) {
                    showErrorMessage('Campo "Identificacao do Leito" e obrigatorio!');
                    identificacaoSimples.focus();
                    return;
                }
            }
            
            if (!tipoQuarto) {
                showErrorMessage('Campo "Tipo de Quarto" e obrigatorio!');
                modal.querySelector('#resTipoQuarto').focus();
                return;
            }
            
            if (!isolamento) {
                showErrorMessage('Campo "Isolamento" e obrigatorio!');
                modal.querySelector('#resIsolamento').focus();
                return;
            }
            
            if (!genero) {
                showErrorMessage('Campo "Genero" e obrigatorio!');
                modal.querySelector('#resGenero').focus();
                return;
            }
            
            // Dados opcionais
            const iniciais = modal.querySelector('#resIniciais')?.value?.trim() || '';
            const matriculaInput = modal.querySelector('#resMatricula')?.value?.trim() || '';
            const matricula = matriculaInput.replace(/-/g, '');
            const idade = parseInt(modal.querySelector('#resIdade')?.value) || null;
            
            const originalText = this.innerHTML;
            showButtonLoading(this, 'RESERVANDO...');
            
            try {
                const dadosReserva = {
                    hospital: hospitalId,
                    tipo: tipoQuarto,
                    identificacaoLeito: identificacaoLeito,
                    isolamento: isolamento,
                    genero: genero,
                    iniciais: iniciais,
                    matricula: matricula,
                    idade: idade
                };
                
                await window.criarReserva(dadosReserva);
                
                hideButtonLoading(this, originalText);
                showSuccessMessage('Reserva criada com sucesso!');
                closeModal(modal);
                
                await window.refreshAfterAction();
                
            } catch (error) {
                hideButtonLoading(this, originalText);
                showErrorMessage('Erro ao criar reserva: ' + error.message);
                logError('Erro ao criar reserva:', error);
            }
        });
    }
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}
function createAdmissaoForm(hospitalNome, leitoNumero, hospitalId) {
    const idSequencial = String(leitoNumero).padStart(2, '0');
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    
    // APENAS hospitais híbridos puros mostram campo "Tipo de Quarto"
    // Santa Clara (H4) e Cruz Azul (H2) são tipos fixos - tipos hardcoded na planilha
    const mostrarTipoQuarto = isHibrido;

    // CRUZ AZUL: TODAS as enfermarias com irmão (contratuais + extras)
    const isCruzAzulEnfermaria = (hospitalId === 'H2') && (window.CRUZ_AZUL_IRMAOS[leitoNumero] !== undefined);

    // SANTA CLARA: TODAS as enfermarias com irmão (contratuais + extras)
    const isSantaClaraEnfermaria = (hospitalId === 'H4') && (window.SANTA_CLARA_IRMAOS[leitoNumero] !== undefined);

    let generoPreDefinido = null;
    let generoDisabled = false;
    let isolamentoPreDefinido = null;
    let isolamentoDisabled = false;
    
    // LÓGICA DE LEITOS IRMÃOS - CRUZ AZUL
    let numeroBasePreenchido = '';
    let sufixoPreDefinido = '';
    
    if (isCruzAzulEnfermaria) {
        const leitoIrmao = window.CRUZ_AZUL_IRMAOS[leitoNumero];
        if (leitoIrmao) {
            const leitosHospital = window.hospitalData['H2']?.leitos || [];
            const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
            
            if (dadosLeitoIrmao && (dadosLeitoIrmao.status === 'Em uso' || dadosLeitoIrmao.status === 'ocupado' || dadosLeitoIrmao.status === 'Ocupado')) {
                const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
                
                // Se irmão NÃO tem isolamento → forçar "Não Isolamento" no leito atual
                if (!isolamentoIrmao || isolamentoIrmao === 'Não Isolamento') {
                    isolamentoPreDefinido = 'Não Isolamento';
                    isolamentoDisabled = true;
                    
                    if (dadosLeitoIrmao.genero) {
                        generoPreDefinido = dadosLeitoIrmao.genero;
                        generoDisabled = true;
                    }
                }
                
                // PRÉ-PREENCHER NÚMERO BASE SE IRMÃO OCUPADO
                const identificacaoIrmao = dadosLeitoIrmao.identificacaoLeito || dadosLeitoIrmao.identificacao_leito || '';
                if (identificacaoIrmao) {
                    // Extrair número base (ex: "101-1" → "101")
                    const partes = identificacaoIrmao.split('-');
                    if (partes.length > 0) {
                        numeroBasePreenchido = partes[0];
                    }
                }
            }
        }
        
        // Definir sufixo padrão baseado no número do leito (par=3, ímpar=1)
        sufixoPreDefinido = (leitoNumero % 2 === 0) ? '3' : '1';
    }
    
    // LÓGICA DE LEITOS IRMÃOS - SANTA CLARA
    if (isSantaClaraEnfermaria) {
        const leitoIrmao = window.SANTA_CLARA_IRMAOS[leitoNumero];
        if (leitoIrmao) {
            const leitosHospital = window.hospitalData['H4']?.leitos || [];
            const dadosLeitoIrmao = leitosHospital.find(l => l.leito == leitoIrmao);
            
            if (dadosLeitoIrmao && (dadosLeitoIrmao.status === 'Em uso' || dadosLeitoIrmao.status === 'ocupado' || dadosLeitoIrmao.status === 'Ocupado')) {
                const isolamentoIrmao = dadosLeitoIrmao.isolamento || '';
                
                // Se irmão NÃO tem isolamento → forçar "Não Isolamento" no leito atual
                if (!isolamentoIrmao || isolamentoIrmao === 'Não Isolamento') {
                    isolamentoPreDefinido = 'Não Isolamento';
                    isolamentoDisabled = true;
                    
                    if (dadosLeitoIrmao.genero) {
                        generoPreDefinido = dadosLeitoIrmao.genero;
                        generoDisabled = true;
                    }
                }
                
                // PRÉ-PREENCHER NÚMERO BASE SE IRMÃO OCUPADO
                const identificacaoIrmao = dadosLeitoIrmao.identificacaoLeito || dadosLeitoIrmao.identificacao_leito || '';
                if (identificacaoIrmao) {
                    // Extrair número base (ex: "201-A" → "201")
                    const partes = identificacaoIrmao.split('-');
                    if (partes.length > 0) {
                        numeroBasePreenchido = partes[0];
                    }
                }
            }
        }
        
        // Definir sufixo padrão baseado no número do leito (par=C, ímpar=A)
        sufixoPreDefinido = (leitoNumero % 2 === 0) ? 'C' : 'A';
    }
    
    // Buscar tipo estrutural do leito
    let isApartamentoFixo = false;
    let isEnfermariaFixa = false;
    
    // Para hospitais com tipos fixos (H2, H4), buscar tipo da estrutura
    if (hospitalId === 'H2' || hospitalId === 'H4') {
        const hospital = window.hospitalData && window.hospitalData[hospitalId];
        if (hospital && hospital.leitos) {
            const dadosLeito = hospital.leitos.find(l => parseInt(l.leito) === parseInt(leitoNumero));
            if (dadosLeito && dadosLeito.tipo) {
                const tipoUpper = dadosLeito.tipo.toUpperCase();
                isApartamentoFixo = tipoUpper.includes('APTO') || tipoUpper === 'APARTAMENTO';
                isEnfermariaFixa = tipoUpper.includes('ENF') || tipoUpper === 'ENFERMARIA';
            }
        }
        
        // Fallback: lógica antiga para contratuais
        if (!isApartamentoFixo && !isEnfermariaFixa) {
            if (hospitalId === 'H2') {
                isApartamentoFixo = (leitoNumero >= 1 && leitoNumero <= 20) || (leitoNumero >= 47 && leitoNumero <= 67);
                isEnfermariaFixa = (leitoNumero >= 21 && leitoNumero <= 46);
            } else if (hospitalId === 'H4') {
                isApartamentoFixo = ((leitoNumero >= 1 && leitoNumero <= 9) || (leitoNumero >= 28 && leitoNumero <= 57));
                isEnfermariaFixa = (leitoNumero >= 10 && leitoNumero <= 27);
            }
        }
    }
    
    return `
        <div class="modal-content" style="background: #1a1f2e; border-radius: 12px; padding: 30px; max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto; color: #ffffff; font-family: 'Poppins', sans-serif;">
            <h2 style="margin: 0 0 20px 0; text-align: center; color: #60a5fa; font-size: 24px; font-weight: 700; text-transform: uppercase;">
                Admitir Paciente
            </h2>
            
            <div style="text-align: center; margin-bottom: 30px; padding: 15px; background: rgba(96,165,250,0.1); border-radius: 8px;">
                <div style="margin-bottom: 8px;">
                    <strong>Hospital:</strong> ${hospitalNome} | <strong>ID:</strong> ${idSequencial}${isHibrido ? ' | <strong>LEITO HÍBRIDO</strong>' : ''}
                </div>
            </div>
            
            <!-- LINHA 1: IDENTIFICAÇÃO | TIPO QUARTO | ISOLAMENTO -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600; font-size: 12px; white-space: nowrap;">Identificação do Leito <span style="color: #c86420;">*</span></label>
                        ${isCruzAzulEnfermaria 
                            ? `<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
                                <input id="admIdentificacaoNumero" type="text" value="${numeroBasePreenchido}" placeholder="Ex: 101" maxlength="4" required ${numeroBasePreenchido ? 'readonly' : ''} oninput="this.value = this.value.replace(/[^0-9]/g, '')" style="width: 100%; padding: 12px; background: ${numeroBasePreenchido ? '#1f2937' : '#374151'}; color: ${numeroBasePreenchido ? '#9ca3af' : '#ffffff'}; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; ${numeroBasePreenchido ? 'cursor: not-allowed;' : ''}">
                                <select id="admIdentificacaoSufixo" required ${numeroBasePreenchido ? 'disabled' : ''} style="width: 100%; padding: 12px; background: ${numeroBasePreenchido ? '#1f2937' : '#374151'} !important; color: ${numeroBasePreenchido ? '#9ca3af' : '#ffffff'} !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; ${numeroBasePreenchido ? 'cursor: not-allowed;' : ''}">
                                    <option value="1" ${sufixoPreDefinido === '1' ? 'selected' : ''}>1</option>
                                    <option value="3" ${sufixoPreDefinido === '3' ? 'selected' : ''}>3</option>
                                </select>
                               </div>
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Número + Sufixo (1 ou 3)</div>`
                            : isSantaClaraEnfermaria
                            ? `<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
                                <input id="admIdentificacaoNumero" type="text" value="${numeroBasePreenchido}" placeholder="Ex: 201" maxlength="4" required ${numeroBasePreenchido ? 'readonly' : ''} oninput="this.value = this.value.replace(/[^0-9]/g, '')" style="width: 100%; padding: 12px; background: ${numeroBasePreenchido ? '#1f2937' : '#374151'}; color: ${numeroBasePreenchido ? '#9ca3af' : '#ffffff'}; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; ${numeroBasePreenchido ? 'cursor: not-allowed;' : ''}">
                                <select id="admIdentificacaoSufixo" required ${numeroBasePreenchido ? 'disabled' : ''} style="width: 100%; padding: 12px; background: ${numeroBasePreenchido ? '#1f2937' : '#374151'} !important; color: ${numeroBasePreenchido ? '#9ca3af' : '#ffffff'} !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; ${numeroBasePreenchido ? 'cursor: not-allowed;' : ''}">
                                    <option value="A" ${sufixoPreDefinido === 'A' ? 'selected' : ''}>A</option>
                                    <option value="C" ${sufixoPreDefinido === 'C' ? 'selected' : ''}>C</option>
                                </select>
                               </div>
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Número + Sufixo (A ou C)</div>`
                            : `<input id="admIdentificacaoLeito" type="text" placeholder="Ex: 1A, 21, 711.1" maxlength="6" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                               <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Aceita números e letras (1-6)</div>`
                        }
                    </div>
                    
                    
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Quarto <span style="color: #c86420;">*</span></label>
                        ${isCruzAzulEnfermaria || isSantaClaraEnfermaria
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
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento <span style="color: #c86420;">*</span></label>
                        <select id="admIsolamento" required ${isolamentoDisabled ? 'disabled' : ''} style="width: 100%; padding: 12px; background: ${isolamentoDisabled ? '#1f2937' : '#374151'} !important; color: ${isolamentoDisabled ? '#9ca3af' : '#ffffff'} !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; ${isolamentoDisabled ? 'cursor: not-allowed;' : ''}">
                            ${isolamentoPreDefinido ? '' : '<option value="">Selecione...</option>'}
                            ${window.ISOLAMENTO_OPTIONS.map(opcao => `<option value="${opcao}" ${isolamentoPreDefinido === opcao ? 'selected' : ''}>${opcao}</option>`).join('')}
                        </select>
                        ${isolamentoDisabled ? '<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">⚠️ Leito irmão ocupado sem isolamento</div>' : ''}
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
            
            <!-- LINHA 3: INICIAIS, MATRÍCULA, IDADE -->
            <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Iniciais</label>
                    <input id="admNome" type="text" placeholder="Ex: ADR" maxlength="20" oninput="window.formatarIniciaisAutomatico(this)" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif; letter-spacing: 2px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Matrícula</label>
                    <input id="admMatricula" type="text" placeholder="Ex: 123456789-0" maxlength="11" style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;" oninput="formatarMatriculaInput(this)">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade</label>
                    <select id="admIdade" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecionar...</option>
                        ${window.IDADE_OPTIONS.map(idade => `<option value="${idade}">${idade} anos</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <!-- LINHA 4: PPS | SPICT-BR | DIRETIVAS -->
            <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">PPS</label>
                    <select id="admPPS" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecionar...</option>
                        ${window.PPS_OPTIONS.map(pps => `<option value="${pps}">${pps}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">SPICT-BR</label>
                    <select id="admSPICT" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="nao_elegivel">Não elegível</option>
                        <option value="elegivel">Elegível</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Diretivas</label>
                    <select id="admDiretivas" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        ${window.DIRETIVAS_OPTIONS.map((opcao, index) => `<option value="${opcao}" ${index === 0 ? 'selected' : ''}>${opcao}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <!-- CONCESSÕES COM BUSCA - VISUAL ANTIGO -->
            <div style="margin-bottom: 20px;">
                <div style="background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); padding: 10px 15px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #ffffff; text-transform: uppercase; font-weight: 700;">
                        Concessões Previstas na Alta
                    </div>
                </div>
                
                <div style="position: relative; margin-bottom: 8px;">
                    <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #9ca3af; pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" id="searchConcessoes" placeholder="Digite para buscar... (ex: 'o2', 'banho')" style="width: 100%; padding: 10px 10px 10px 36px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div id="admConcessoes" style="max-height: 150px; overflow-y: auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; display: grid; grid-template-columns: 1fr; gap: 6px;">
                    ${window.CONCESSOES_LIST.map(c => `
                        <label style="display: flex; align-items: center; padding: 4px 0; cursor: pointer; font-size: 12px; font-family: 'Poppins', sans-serif;">
                            <input type="checkbox" value="${c}" style="margin-right: 8px; accent-color: #60a5fa;">
                            <span>${c}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <!-- LINHAS DE CUIDADO COM BUSCA - VISUAL ANTIGO -->
            <div style="margin-bottom: 20px;">
                <div style="background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); padding: 10px 15px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #ffffff; text-transform: uppercase; font-weight: 700;">
                        Linhas de Cuidado
                    </div>
                </div>
                
                <div style="position: relative; margin-bottom: 8px;">
                    <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #9ca3af; pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" id="searchLinhas" placeholder="Digite para buscar... (ex: 'cardiologia', 'geriatria')" style="width: 100%; padding: 10px 10px 10px 36px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div id="admLinhas" style="max-height: 150px; overflow-y: auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; display: grid; grid-template-columns: 1fr; gap: 6px;">
                    ${window.LINHAS_CUIDADO_LIST.map(linha => `
                        <label style="display: flex; align-items: center; padding: 4px 0; cursor: pointer; font-size: 12px; font-family: 'Poppins', sans-serif;">
                            <input type="checkbox" value="${linha}" style="margin-right: 8px; accent-color: #60a5fa;">
                            <span>${linha}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <!-- ANOTAÇÕES (800 CARACTERES) - VISUAL ANTIGO -->
            <div style="margin-bottom: 20px;">
                <div style="background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); padding: 10px 15px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #ffffff; text-transform: uppercase; font-weight: 700;">
                        Anotações (800 caracteres)
                    </div>
                </div>
                
                <div style="position: relative;">
                    <textarea id="admAnotacoes" maxlength="800" rows="4" placeholder="Digite observações adicionais..." style="width: 100%; padding: 12px; background: rgba(255,255,255,0.03); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif; resize: vertical;"></textarea>
                    <div id="admAnotacoesCount" style="position: absolute; bottom: 8px; right: 12px; font-size: 10px; color: rgba(255,255,255,0.5);">0/800</div>
                </div>
            </div>
            
            <!-- BOTÕES -->
            <div class="modal-buttons" style="display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <button class="btn-cancelar" style="padding: 12px 30px; background: rgba(255,255,255,0.1); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: 'Poppins', sans-serif;">Cancelar</button>
                <button class="btn-salvar" style="padding: 12px 30px; background: #60a5fa; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; text-transform: uppercase; cursor: pointer; font-family: 'Poppins', sans-serif;">Salvar</button>
            </div>
        </div>
    `;
}
// =================== FORMULÁRIO DE ATUALIZAÇÃO - CORRIGIDO ===================
function createAtualizacaoForm(hospitalNome, leitoNumero, dadosLeito) {
    const tempoInternacao = dadosLeito?.admAt ? calcularTempoInternacao(dadosLeito.admAt) : '';
    const iniciais = dadosLeito?.nome ? dadosLeito.nome.trim() : '';
    const idSequencial = String(leitoNumero).padStart(2, '0');
    
    const concessoesAtuais = Array.isArray(dadosLeito?.concessoes) ? dadosLeito.concessoes : [];
    
    let isolamentoAtual = dadosLeito?.isolamento || 'Não Isolamento';
    const isolamentoLower = isolamentoAtual.toLowerCase().trim();
    
    if (isolamentoLower === 'isolamento de contato' || isolamentoLower === 'isolamento contato') {
        isolamentoAtual = 'Isolamento de Contato';
    } else if (isolamentoLower === 'isolamento respiratorio' || isolamentoLower === 'isolamento respiratório') {
        isolamentoAtual = 'Isolamento Respiratório';
    } else if (isolamentoLower === 'nao isolamento' || isolamentoLower === 'não isolamento' || isolamentoLower.includes('nao isol')) {
        isolamentoAtual = 'Não Isolamento';
    }
    
    const hospitalId = window.currentHospital;
    // ✅ Verificar diretamente nos mapas de irmãos (sem depender de função externa)
    const isCruzAzulEnfermaria = (hospitalId === 'H2') && (leitoNumero in window.CRUZ_AZUL_IRMAOS);
    const isSantaClaraEnfermaria = (hospitalId === 'H4') && (leitoNumero in window.SANTA_CLARA_IRMAOS);
    const isCruzAzulApartamento = (hospitalId === 'H2' && leitoNumero >= 1 && leitoNumero <= 20);
    const isApartamentoFixo = isCruzAzulApartamento;
    
    let identificacaoAtual = dadosLeito?.identificacaoLeito || 
                        dadosLeito?.identificacao_leito || 
                        '';
    
    let leitoDisplay = identificacaoAtual && identificacaoAtual.trim() 
        ? identificacaoAtual.trim().toUpperCase()
        : `LEITO ${leitoNumero}`;
    
    const regiaoAtual = dadosLeito?.regiao || '';
    const sexoAtual = dadosLeito?.genero || '';
    const diretivasAtual = dadosLeito?.diretivas || 'Não se aplica';
    const admissaoData = dadosLeito?.admAt || '';
    
    const isHibrido = window.HOSPITAIS_HIBRIDOS.includes(hospitalId);
    const tipoAtual = dadosLeito?.categoriaEscolhida || '';
    
    const matriculaAtual = dadosLeito?.matricula || '';
    const matriculaFormatada = formatarMatriculaExibicao(matriculaAtual);
    
    const idadeAtual = dadosLeito?.idade || '';
    const ppsAtual = dadosLeito?.pps || '';
    const spictAtual = dadosLeito?.spict || 'nao_elegivel';
    const prevAltaAtual = dadosLeito?.prevAlta || 'Sem Previsão';
    
    const anotacoesAtual = dadosLeito?.anotacoes || '';
    
    return `
        <div class="modal-content" style="background: #1a1f2e; border-radius: 12px; padding: 30px; max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto; color: #ffffff; font-family: 'Poppins', sans-serif;">
            <h2 style="margin: 0 0 20px 0; text-align: center; color: #60a5fa; font-size: 24px; font-weight: 700; text-transform: uppercase;">
                Atualizar Paciente
            </h2>
            
            <div style="text-align: center; margin-bottom: 30px; padding: 15px; background: rgba(96,165,250,0.1); border-radius: 8px;">
                <strong>Hospital:</strong> ${hospitalNome} | <strong>ID:</strong> ${idSequencial} | <strong>Leito:</strong> ${leitoDisplay}
            </div>
            
            <!-- LINHA 1: IDENTIFICAÇÃO | TIPO QUARTO | ISOLAMENTO -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600; white-space: nowrap;">Identificação do Leito <span style="color: #c86420;">*</span></label>
                        ${(isCruzAzulEnfermaria || isSantaClaraEnfermaria) 
                            ? `<input id="updIdentificacaoLeito" type="text" value="${identificacaoAtual}" readonly style="width: 100%; padding: 12px; background: #1f2937; color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; cursor: not-allowed; font-family: 'Poppins', sans-serif;">`
                            : `<input id="updIdentificacaoLeito" type="text" value="${identificacaoAtual}" placeholder="Ex: 1A, 21, 711.1" maxlength="6" required style="width: 100%; padding: 12px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">`
                        }
                        ${(isCruzAzulEnfermaria || isSantaClaraEnfermaria) ? '<div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Identificação fixa</div>' : '<div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">Aceita números e letras (1-6)</div>'}
                    </div>
                    
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Tipo de Quarto <span style="color: #c86420;">*</span></label>
                        ${isCruzAzulEnfermaria 
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
                                ${window.TIPO_QUARTO_OPTIONS.map(tipo => `<option value="${tipo}" ${tipoAtual === tipo ? 'selected' : ''}>${tipo}</option>`).join('')}
                               </select>`
                        }
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Isolamento <span style="color: #c86420;">*</span></label>
                        <select id="updIsolamento" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.ISOLAMENTO_OPTIONS.map(opcao => `<option value="${opcao}" ${isolamentoAtual === opcao ? 'selected' : ''}>${opcao}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 2: GÊNERO | REGIÃO | PREVISÃO ALTA -->
            <div style="margin-bottom: 20px;">
                <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Gênero <span style="color: #c86420;">*</span></label>
                        <select id="updSexo" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="">Selecionar...</option>
                            ${window.SEXO_OPTIONS.map(sexo => `<option value="${sexo}" ${sexoAtual === sexo ? 'selected' : ''}>${sexo}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Região <span style="color: #c86420;">*</span></label>
                        <select id="updRegiao" required style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            <option value="">Selecionar...</option>
                            ${window.REGIAO_OPTIONS.map(regiao => `<option value="${regiao}" ${regiaoAtual === regiao ? 'selected' : ''}>${regiao}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Previsão Alta</label>
                        <select id="updPrevAlta" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                            ${window.PREVISAO_ALTA_OPTIONS.map(opt => `<option value="${opt}" ${prevAltaAtual === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- LINHA 3: INICIAIS, MATRÍCULA, IDADE -->
            <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Iniciais</label>
                    <input value="${iniciais}" readonly style="width: 100%; padding: 12px; background: #1f2937; color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Matrícula</label>
                    <input value="${matriculaFormatada}" readonly style="width: 100%; padding: 12px; background: #1f2937; color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Idade</label>
                    <select id="updIdade" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecionar...</option>
                        ${window.IDADE_OPTIONS.map(idade => `<option value="${idade}" ${idadeAtual == idade ? 'selected' : ''}>${idade} anos</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <!-- LINHA 4: PPS | SPICT-BR | DIRETIVAS -->
            <div class="form-grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">PPS</label>
                    <select id="updPPS" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="">Selecionar...</option>
                        ${window.PPS_OPTIONS.map(pps => `<option value="${pps}" ${ppsAtual && `${ppsAtual}%` === pps ? 'selected' : ''}>${pps}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">SPICT-BR</label>
                    <select id="updSPICT" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        <option value="nao_elegivel" ${spictAtual === 'nao_elegivel' ? 'selected' : ''}>Não elegível</option>
                        <option value="elegivel" ${spictAtual === 'elegivel' ? 'selected' : ''}>Elegível</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #e2e8f0; font-weight: 600;">Diretivas</label>
                    <select id="updDiretivas" style="width: 100%; padding: 12px; background: #374151 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-family: 'Poppins', sans-serif;">
                        ${window.DIRETIVAS_OPTIONS.map(opcao => `<option value="${opcao}" ${diretivasAtual === opcao ? 'selected' : ''}>${opcao}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <!-- CONCESSÕES COM BUSCA - VISUAL ANTIGO -->
            <div style="margin-bottom: 20px;">
                <div style="background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); padding: 10px 15px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #ffffff; text-transform: uppercase; font-weight: 700;">
                        Concessões Previstas na Alta
                    </div>
                </div>
                
                <div style="position: relative; margin-bottom: 8px;">
                    <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #9ca3af; pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" id="searchConcessoesUpd" placeholder="Digite para buscar... (ex: 'o2', 'banho')" style="width: 100%; padding: 10px 10px 10px 36px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div id="updConcessoes" style="max-height: 150px; overflow-y: auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; display: grid; grid-template-columns: 1fr; gap: 6px;">
                    ${window.CONCESSOES_LIST.map(c => {
                        const checkboxNormalizado = normalizarTexto(c);
                        const isChecked = concessoesAtuais.some(atual => 
                            normalizarTexto(atual) === checkboxNormalizado
                        );
                        
                        return `
                            <label style="display: flex; align-items: center; padding: 4px 0; cursor: pointer; font-size: 12px; font-family: 'Poppins', sans-serif;">
                                <input type="checkbox" value="${c}" ${isChecked ? 'checked' : ''} style="margin-right: 8px; accent-color: #60a5fa;">
                                <span>${c}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- LINHAS DE CUIDADO COM BUSCA - VISUAL ANTIGO -->
            <div style="margin-bottom: 20px;">
                <div style="background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); padding: 10px 15px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #ffffff; text-transform: uppercase; font-weight: 700;">
                        Linhas de Cuidado
                    </div>
                </div>
                
                <div style="position: relative; margin-bottom: 8px;">
                    <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #9ca3af; pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" id="searchLinhasUpd" placeholder="Digite para buscar... (ex: 'cardiologia', 'geriatria')" style="width: 100%; padding: 10px 10px 10px 36px; background: #374151; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif;">
                </div>
                
                <div id="updLinhas" style="max-height: 150px; overflow-y: auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; display: grid; grid-template-columns: 1fr; gap: 6px;">
                    ${window.LINHAS_CUIDADO_LIST.map(linha => {
                        const linhasAtuais = Array.isArray(dadosLeito?.linhas) ? dadosLeito.linhas : [];
                        const linhaNormalizada = normalizarTexto(linha);
                        const isChecked = linhasAtuais.some(atual => 
                            normalizarTexto(atual) === linhaNormalizada
                        );
                        
                        return `
                            <label style="display: flex; align-items: center; padding: 4px 0; cursor: pointer; font-size: 12px; font-family: 'Poppins', sans-serif;">
                                <input type="checkbox" value="${linha}" ${isChecked ? 'checked' : ''} style="margin-right: 8px; accent-color: #60a5fa;">
                                <span>${linha}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- ANOTAÇÕES (800 CARACTERES) - VISUAL ANTIGO -->
            <div style="margin-bottom: 20px;">
                <div style="background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); padding: 10px 15px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 11px; color: #ffffff; text-transform: uppercase; font-weight: 700;">
                        Anotações (800 caracteres)
                    </div>
                </div>
                
                <div style="position: relative;">
                    <textarea id="updAnotacoes" maxlength="800" rows="4" placeholder="Digite observações adicionais..." style="width: 100%; padding: 12px; background: rgba(255,255,255,0.03); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif; resize: vertical;">${anotacoesAtual}</textarea>
                    <div id="updAnotacoesCount" style="position: absolute; bottom: 8px; right: 12px; font-size: 10px; color: rgba(255,255,255,0.5);">${anotacoesAtual.length}/800</div>
                </div>
            </div>
            
            <!-- BOTÕES -->
            <div class="modal-buttons" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
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

// =================== PRÉ-MARCAÇÃO COM NORMALIZAÇÃO ===================
function forcarPreMarcacao(modal, dadosLeito) {
    logDebug(`Forçando pré-marcação com normalização...`);
    
    // CONCESSÕES
    const concessoesAtuais = Array.isArray(dadosLeito?.concessoes) ? dadosLeito.concessoes : [];
    const concessoesCheckboxes = modal.querySelectorAll('#updConcessoes input[type="checkbox"]');
    const naoSeAplicaCheckbox = Array.from(concessoesCheckboxes)
        .find(cb => cb.value === 'Não se aplica');
    
    concessoesCheckboxes.forEach(checkbox => {
        if (checkbox.value === 'Não se aplica') {
            checkbox.checked = concessoesAtuais.length === 0;
        } else {
            const checkboxNormalizado = normalizarTexto(checkbox.value);
            const isChecked = concessoesAtuais.some(atual => 
                normalizarTexto(atual) === checkboxNormalizado
            );
            checkbox.checked = isChecked;
        }
    });

    // LINHAS
    const linhasAtuais = Array.isArray(dadosLeito?.linhas) ? dadosLeito.linhas : [];
    const linhasCheckboxes = modal.querySelectorAll('#updLinhas input[type="checkbox"]');

    linhasCheckboxes.forEach(checkbox => {
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
    // CONTADOR DE CARACTERES PARA ANOTAÇÕES
    const anotacoesField = modal.querySelector(tipo === 'admissao' ? '#admAnotacoes' : '#updAnotacoes');
    const anotacoesCount = modal.querySelector(tipo === 'admissao' ? '#admAnotacoesCount' : '#updAnotacoesCount');
    
    if (anotacoesField && anotacoesCount) {
        anotacoesField.addEventListener('input', function() {
            const length = this.value.length;
            anotacoesCount.textContent = `${length}/800`;
        });
    }
    
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
            
            const hospitalId = window.currentHospital;
            const leitoNumero = window.selectedLeito;
            const isCruzAzulEnfermaria = (hospitalId === 'H2' && leitoNumero >= 21 && leitoNumero <= 46);
            const isSantaClaraEnfermaria = (hospitalId === 'H4' && leitoNumero >= 10 && leitoNumero <= 27);
            
            // VALIDAR IDENTIFICAÇÃO DO LEITO
            if (isCruzAzulEnfermaria || isSantaClaraEnfermaria) {
                const numeroField = modal.querySelector(tipo === 'admissao' ? '#admIdentificacaoNumero' : '#updIdentificacaoNumero');
                const sufixoField = modal.querySelector(tipo === 'admissao' ? '#admIdentificacaoSufixo' : '#updIdentificacaoSufixo');
                
                if (numeroField && sufixoField) {
                    if (!numeroField.value.trim()) {
                        showErrorMessage('Campo "Número do Leito" é obrigatório!');
                        numeroField.focus();
                        return;
                    }
                    if (!sufixoField.value) {
                        showErrorMessage('Campo "Sufixo" é obrigatório!');
                        sufixoField.focus();
                        return;
                    }
                }
            } else {
                const identificacaoField = modal.querySelector(tipo === 'admissao' ? '#admIdentificacaoLeito' : '#updIdentificacaoLeito');
                if (identificacaoField && !identificacaoField.value.trim()) {
                    showErrorMessage('Campo "Identificação do Leito" é obrigatório!');
                    identificacaoField.focus();
                    return;
                }
                
                if (identificacaoField) {
                    const identificacao = identificacaoField.value.trim();
                    if (identificacao.length < 1 || identificacao.length > 6) {
                        showErrorMessage('Identificação deve ter de 1 a 6 caracteres!');
                        identificacaoField.focus();
                        return;
                    }
                }
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
            
            // Validação específica para hospitais HÍBRIDOS PUROS (H1, H3, H5, H6, H7, H8, H9)
            const hospitaisHibridos = ['H1', 'H3', 'H5', 'H6', 'H7', 'H8', 'H9'];
            if (hospitaisHibridos.includes(hospitalId)) {
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
            
            
            
            // ✅ VALIDAR DUPLICATAS COM TRY/CATCH
            try {
                const identificacaoNumeroField = modal.querySelector(tipo === 'admissao' ? '#admIdentificacaoNumero' : null);
                const identificacaoSufixoField = modal.querySelector(tipo === 'admissao' ? '#admIdentificacaoSufixo' : null);
                
                let identificacaoParaValidar = '';
                if (identificacaoNumeroField && identificacaoSufixoField) {
                    const numero = identificacaoNumeroField.value.trim();
                    const sufixo = identificacaoSufixoField.value;
                    identificacaoParaValidar = numero && sufixo ? `${numero}-${sufixo}` : numero;
                } else {
                    const identificacaoFieldSimples = modal.querySelector(tipo === 'admissao' ? '#admIdentificacaoLeito' : '#updIdentificacaoLeito');
                    if (identificacaoFieldSimples) {
                        identificacaoParaValidar = identificacaoFieldSimples.value.trim();
                    }
                }
                
                if (identificacaoParaValidar && window.hospitalData && window.hospitalData[hospitalId]) {
                    const validacaoId = validarIdentificacaoDuplicada(
                        hospitalId, 
                        identificacaoParaValidar,
                        tipo === 'atualizacao' ? leitoNumero : null
                    );
                    if (!validacaoId.valido) {
                        showErrorMessage(validacaoId.mensagem);
                        return;
                    }
                }
                
                const matriculaField = modal.querySelector(tipo === 'admissao' ? '#admMatricula' : null);
                if (matriculaField && tipo === 'admissao' && window.hospitalData && window.hospitalData[hospitalId]) {
                    const matriculaParaValidar = matriculaField.value.trim();
                    if (matriculaParaValidar) {
                        const validacaoMat = validarMatriculaDuplicada(
                            hospitalId, 
                            matriculaParaValidar,
                            null
                        );
                        if (!validacaoMat.valido) {
                            showErrorMessage(validacaoMat.mensagem);
                            return;
                        }
                    }
                }
            } catch (error) {
                console.warn('[VALIDAÇÃO] Erro ao validar duplicatas:', error);
            }
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

// =================== COLETAR DADOS DO FORMULÁRIO ===================

// =================== VALIDAÇÕES DE DUPLICATAS ===================

// Validar se identificação já está sendo usada no hospital
function validarIdentificacaoDuplicada(hospitalId, identificacao, leitoAtual = null) {
    if (!identificacao || !identificacao.trim()) return { valido: true };
    
    const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
    const duplicado = leitosHospital.find(l => {
        const idLeito = l.identificacaoLeito || l.identificacao_leito || '';
        const statusOcupado = (l.status === 'Ocupado' || l.status === 'ocupado' || l.status === 'Em uso');
        
        // Se for atualização, ignorar o próprio leito
        if (leitoAtual && parseInt(l.leito) === parseInt(leitoAtual)) {
            return false;
        }
        
        return statusOcupado && idLeito.trim().toUpperCase() === identificacao.trim().toUpperCase();
    });
    
    if (duplicado) {
        const matricula = duplicado.matricula || 'sem matrícula';
        return {
            valido: false,
            mensagem: `Esse número de leito já está sendo usado pelo paciente de matrícula ${matricula}`
        };
    }
    
    return { valido: true };
}

// Validar se matrícula já está sendo usada no hospital
function validarMatriculaDuplicada(hospitalId, matricula, leitoAtual = null) {
    if (!matricula || !matricula.trim()) return { valido: true };
    
    // Remover hífen para comparação
    const matriculaSemHifen = matricula.replace(/-/g, '').trim();
    if (!matriculaSemHifen) return { valido: true };
    
    const leitosHospital = window.hospitalData[hospitalId]?.leitos || [];
    const duplicado = leitosHospital.find(l => {
        const matLeito = (l.matricula || '').replace(/-/g, '').trim();
        const statusOcupado = (l.status === 'Ocupado' || l.status === 'ocupado' || l.status === 'Em uso');
        
        // Se for atualização, ignorar o próprio leito
        if (leitoAtual && parseInt(l.leito) === parseInt(leitoAtual)) {
            return false;
        }
        
        return statusOcupado && matLeito === matriculaSemHifen;
    });
    
    if (duplicado) {
        const numeroLeito = duplicado.identificacaoLeito || duplicado.identificacao_leito || `Leito ${duplicado.leito}`;
        return {
            valido: false,
            mensagem: `Essa matrícula já está sendo usada por paciente do ${numeroLeito}`
        };
    }
    
    return { valido: true };
}

function coletarDadosFormulario(modal, tipo) {
    const dados = {
        hospital: window.currentHospital,
        leito: window.selectedLeito
    };
    
    const hospitalId = window.currentHospital;
    const leitoNumero = window.selectedLeito;
    const isCruzAzulEnfermaria = (hospitalId === 'H2') && (window.CRUZ_AZUL_IRMAOS[leitoNumero] !== undefined);
    const isSantaClaraEnfermaria = (hospitalId === 'H4') && (window.SANTA_CLARA_IRMAOS[leitoNumero] !== undefined);
    
    if (tipo === 'admissao') {
        dados.nome = modal.querySelector('#admNome')?.value?.trim() || '';
        const matriculaInput = modal.querySelector('#admMatricula')?.value?.trim() || '';
        dados.matricula = matriculaInput.replace(/-/g, '');
        dados.idade = parseInt(modal.querySelector('#admIdade')?.value) || null;
        dados.pps = modal.querySelector('#admPPS')?.value?.replace('%', '') || null;
        dados.spict = modal.querySelector('#admSPICT')?.value || 'nao_elegivel';
        dados.prevAlta = modal.querySelector('#admPrevAlta')?.value || 'Sem Previsão';
        dados.isolamento = modal.querySelector('#admIsolamento')?.value || '';
        
        // IDENTIFICAÇÃO DO LEITO - CONCATENAR NÚMERO + SUFIXO SE FOR IRMÃO
        if (isCruzAzulEnfermaria || isSantaClaraEnfermaria) {
            const numero = modal.querySelector('#admIdentificacaoNumero')?.value?.trim() || '';
            const sufixo = modal.querySelector('#admIdentificacaoSufixo')?.value || '';
            dados.identificacaoLeito = numero && sufixo ? `${numero}-${sufixo}` : numero;
        } else {
            dados.identificacaoLeito = modal.querySelector('#admIdentificacaoLeito')?.value?.trim() || '';
        }
        
        dados.regiao = modal.querySelector('#admRegiao')?.value || '';
        dados.genero = modal.querySelector('#admSexo')?.value || '';
        dados.diretivas = modal.querySelector('#admDiretivas')?.value || 'Não se aplica';
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

// =================== COLETAR CHECKBOXES ===================
function coletarCheckboxesSelecionados(modal, seletor) {
    const checkboxes = modal.querySelectorAll(`${seletor} input[type="checkbox"]`);
    const selecionados = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked && checkbox.value !== 'Não se aplica') {
            selecionados.push(checkbox.value);
        }
    });
    
    return selecionados;
}

// FORMATAÇÃO AUTOMÁTICA MATRÍCULA
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
                        return 'Data inválida';
                    }
                } else {
                    return 'Data incompleta';
                }
            } else {
                dataAdmissao = new Date(admissao);
            }
        } else {
            dataAdmissao = new Date(admissao);
        }
        
        if (!dataAdmissao || isNaN(dataAdmissao.getTime())) {
            return 'Data inválida';
        }
        
        const agora = new Date();
        const diffTime = agora - dataAdmissao;
        
        if (diffTime < 0) return 'Data futura';
        if (diffTime > (2 * 365 * 24 * 60 * 60 * 1000)) return 'Data antiga';
        
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays === 0) return `${diffHours}h`;
        if (diffDays === 1) return `1d ${diffHours}h`;
        return `${diffDays}d ${diffHours}h`;
        
    } catch (error) {
        logError('Erro ao calcular tempo internação:', error);
        return 'Erro no cálculo';
    }
}

function formatarDataHora(dataISO) {
    if (!dataISO) return '—';
    
    try {
        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        logError('Erro ao formatar data:', error);
        return '—';
    }
}

// =================== FUNÇÕES DE LOG ===================
function logInfo(message, data = null) {
    console.log(`[CARDS] ${message}`, data || '');
}

function logError(message, error = null) {
    console.error(`[CARDS ERROR] ${message}`, error || '');
}

function logSuccess(message) {
    console.log(`[CARDS SUCCESS] ${message}`);
}

function logDebug(message, data = null) {
    console.log(`[CARDS DEBUG] ${message}`, data || '');
}

// =================== CSS CONSOLIDADO ===================
if (!document.getElementById('cardsConsolidadoCSS')) {
    const style = document.createElement('style');
    style.id = 'cardsConsolidadoCSS';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Poppins', sans-serif !important;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.9); }
        }
        
        .btn-action {
            transition: all 0.2s ease;
        }
        
        .btn-action:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .btn-action:disabled {
            cursor: not-allowed;
            transform: none !important;
        }
        
        select {
            background-color: #374151 !important;
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
                padding: 12px 10px !important;
                margin: 0 -20px -20px -20px !important;
                border-top: 2px solid rgba(96, 165, 250, 0.3) !important;
                z-index: 10 !important;
                display: flex !important;
                flex-direction: row !important;
                justify-content: center !important;
                gap: 6px !important;
                flex-wrap: nowrap !important;
            }
            
            .modal-buttons button {
                flex: 1 !important;
                max-width: 31% !important;
                min-width: 85px !important;
                padding: 11px 6px !important;
                font-size: 11px !important;
                white-space: nowrap !important;
            }
            
            .btn-alta {
                /* Botão de alta na mesma linha - sem order */
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

// =================== INICIALIZACAO V7.0 ===================
document.addEventListener('DOMContentLoaded', function() {
    logSuccess('CARDS.JS V7.0 CARREGADO - FILTRO UTI + SISTEMA RESERVAS');
    
    if (window.CONCESSOES_LIST && window.CONCESSOES_LIST.length !== 13) {
        logError('ERRO: Esperadas 13 concessoes (12 + "Nao se aplica"), encontradas ' + window.CONCESSOES_LIST.length);
    } else if (window.CONCESSOES_LIST) {
        logSuccess(window.CONCESSOES_LIST.length + ' concessoes confirmadas');
    }
    
    if (window.LINHAS_CUIDADO_LIST && window.LINHAS_CUIDADO_LIST.length !== 45) {
        logError('ERRO: Esperadas 45 linhas, encontradas ' + window.LINHAS_CUIDADO_LIST.length);
    } else if (window.LINHAS_CUIDADO_LIST) {
        logSuccess(window.LINHAS_CUIDADO_LIST.length + ' linhas de cuidado confirmadas');
    }
});

// =================== EXPORTS V7.0 ===================
window.renderCards = renderCards;
window.selectHospital = selectHospital;
window.createCard = createCard;
window.createCardReservado = createCardReservado;
window.openAdmissaoModal = openAdmissaoModal;
window.openAtualizacaoModal = openAtualizacaoModal;
window.openReservaModal = openReservaModal;
window.forcarPreMarcacao = forcarPreMarcacao;
window.coletarDadosFormulario = coletarDadosFormulario;
window.getBadgeIsolamento = getBadgeIsolamento;
window.getBadgeGenero = getBadgeGenero;
window.getBadgeDiretivas = getBadgeDiretivas;
window.formatarMatriculaInput = formatarMatriculaInput;
window.formatarMatriculaExibicao = formatarMatriculaExibicao;
window.setupSearchFilter = setupSearchFilter;
window.searchLeitos = searchLeitos;
window.getReservasHospital = getReservasHospital;

console.log('CARDS.JS V7.0 COMPLETO - FILTRO UTI + SISTEMA RESERVAS + NOVA ORDENACAO!');