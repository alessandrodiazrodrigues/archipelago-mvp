(function() {
    'use strict';
    
    // =================== CARDS UTI V7.0 - DEZEMBRO/2025 ===================
    console.log('CARDS-UTI.JS V7.0 - Carregando...');
    
    // =================== CONFIGURACAO UTI ===================
    var HOSPITAIS_UTI_ATIVOS_CARDS = window.HOSPITAIS_UTI_ATIVOS || ['H2'];
    
    var UTI_CAPACIDADE_CARDS = {
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
    
    var PREV_ALTA_UTI_OPTIONS = ['Hoje', '24h', '48h', '72h', '96h', 'Sem Previsao'];
    var CAMPOS_BLOQUEADOS_UTI = ['pps', 'spict', 'regiao', 'diretivas', 'concessoes', 'linhas'];
    
    // =================== FUNCOES AUXILIARES ===================
    function logInfoUTI(msg) {
        console.log('[CARDS-UTI V7.0] ' + msg);
    }
    
    function showSuccessMessageUTI(msg) {
        var toast = document.createElement('div');
        toast.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 25px; background: #22c55e; color: white; border-radius: 8px; font-family: Poppins, sans-serif; font-weight: 600; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 3000);
    }
    
    function showErrorMessageUTI(msg) {
        var toast = document.createElement('div');
        toast.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 25px; background: #ef4444; color: white; border-radius: 8px; font-family: Poppins, sans-serif; font-weight: 600; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 4000);
    }
    
    function getBadgeIsolamentoUTI(isolamento) {
        if (!isolamento || isolamento === 'Nao Isolamento' || isolamento === 'Nao Isol') {
            return { cor: '#b2adaa', texto: 'Nao Isol', textoCor: '#ffffff' };
        } else if (isolamento === 'Isolamento de Contato' || isolamento === 'Contato') {
            return { cor: '#f59a1d', texto: 'Contato', textoCor: '#131b2e' };
        } else if (isolamento === 'Isolamento Respiratorio' || isolamento === 'Respiratorio') {
            return { cor: '#c86420', texto: 'Respiratorio', textoCor: '#ffffff' };
        }
        return { cor: '#b2adaa', texto: 'Nao Isol', textoCor: '#ffffff' };
    }
    
    function getBadgeGeneroUTI(sexo) {
        if (sexo === 'Masculino') {
            return { cor: 'rgba(96,165,250,0.2)', borda: '#60a5fa', textoCor: '#60a5fa', texto: 'Masculino' };
        } else if (sexo === 'Feminino') {
            return { cor: 'rgba(236,72,153,0.2)', borda: '#ec4899', textoCor: '#ec4899', texto: 'Feminino' };
        }
        return { cor: 'rgba(255,255,255,0.05)', borda: 'rgba(255,255,255,0.1)', textoCor: '#ffffff', texto: '-' };
    }
    
    function formatarMatriculaUTI(matricula) {
        if (!matricula || matricula === '-') return '-';
        var mat = String(matricula).replace(/\D/g, '');
        if (mat.length === 0) return '-';
        if (mat.length === 1) return mat;
        return mat.slice(0, -1) + '-' + mat.slice(-1);
    }
    
    function formatarDataHoraUTI(dataStr) {
        if (!dataStr) return '-';
        try {
            var data = new Date(dataStr);
            if (isNaN(data.getTime())) return dataStr;
            var dia = String(data.getDate()).padStart(2, '0');
            var mes = String(data.getMonth() + 1).padStart(2, '0');
            var ano = data.getFullYear();
            var hora = String(data.getHours()).padStart(2, '0');
            var min = String(data.getMinutes()).padStart(2, '0');
            return dia + '/' + mes + '/' + ano + ', ' + hora + ':' + min;
        } catch (e) {
            return dataStr;
        }
    }
    
    function calcularTempoInternacaoUTI(admissao) {
        if (!admissao) return '';
        try {
            var admData = new Date(admissao);
            if (isNaN(admData.getTime())) return '';
            var hoje = new Date();
            var diffMs = hoje - admData;
            var diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            var diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (diffDias > 0) {
                return diffDias + 'd ' + diffHoras + 'h';
            }
            return diffHoras + 'h';
        } catch (e) {
            return '';
        }
    }
    
    function isLeitoExtraUTI(hospitalId, posicao) {
        var config = UTI_CAPACIDADE_CARDS[hospitalId];
        if (!config) return false;
        return posicao > config.contratuais;
    }
    
    // =================== RENDERIZAR CARDS UTI ===================
    function renderCardsUTI(hospitalId) {
        logInfoUTI('Renderizando cards UTI para ' + hospitalId);
        
        var container = document.getElementById('cardsContainerUTI');
        if (!container) {
            console.error('[CARDS-UTI V7.0] Container cardsContainerUTI nao encontrado');
            return;
        }
        
        container.innerHTML = '';
        
        if (HOSPITAIS_UTI_ATIVOS_CARDS.indexOf(hospitalId) === -1) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.7);"><h3 style="color: #60a5fa; margin-bottom: 10px;">UTI Inativa</h3><p>Este hospital ainda nao possui leitos UTI ativos no sistema.</p></div>';
            return;
        }
        
        var dropdown = document.getElementById('hospitalDropdownUTI');
        if (dropdown && dropdown.value !== hospitalId) {
            dropdown.value = hospitalId;
        }
        
        window.currentHospitalUTI = hospitalId;
        
        var hospital = window.hospitalData ? window.hospitalData[hospitalId] : null;
        var config = UTI_CAPACIDADE_CARDS[hospitalId];
        var hospitalNome = config ? config.nome : hospitalId;
        
        if (!hospital || !hospital.leitos) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;"><p style="color: rgba(255,255,255,0.7);">Carregando dados...</p></div>';
            return;
        }
        
        var leitosUTI = hospital.leitos.filter(function(l) {
            var tipo = (l.tipo || '').toUpperCase();
            return tipo === 'UTI';
        });
        
        logInfoUTI('Total de leitos UTI encontrados: ' + leitosUTI.length);
        
        if (leitosUTI.length === 0) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.7);"><h3 style="color: #60a5fa; margin-bottom: 10px;">Nenhum Leito UTI</h3><p>Nao foram encontrados leitos UTI para este hospital.</p></div>';
            return;
        }
        
        var ocupados = leitosUTI.filter(function(l) {
            return l.status === 'Ocupado' || l.status === 'Em uso' || l.status === 'ocupado';
        });
        var vagos = leitosUTI.filter(function(l) {
            return l.status === 'Vago' || l.status === 'vago';
        });
        
        ocupados.sort(function(a, b) { return (a.leito || 0) - (b.leito || 0); });
        vagos.sort(function(a, b) { return (a.leito || 0) - (b.leito || 0); });
        
        var reservasUTI = (window.reservasData || []).filter(function(r) {
            return r.hospital === hospitalId && r.tipo === 'UTI';
        });
        
        logInfoUTI('Ocupados: ' + ocupados.length + ', Vagos: ' + vagos.length + ', Reservas: ' + reservasUTI.length);
        
        ocupados.forEach(function(leito, index) {
            var posicao = index + 1;
            var card = createCardUTI(leito, hospitalNome, hospitalId, posicao);
            container.appendChild(card);
        });
        
        reservasUTI.forEach(function(reserva) {
            var temMatricula = reserva.matricula && String(reserva.matricula).trim();
            if (temMatricula) {
                var leitoReservado = {
                    leito: reserva.leito,
                    status: 'Reservado',
                    tipo: 'UTI',
                    identificacaoLeito: String(reserva.identificacaoLeito || ''),
                    isolamento: reserva.isolamento || '',
                    genero: reserva.genero || '',
                    nome: reserva.iniciais || '',
                    matricula: String(reserva.matricula || ''),
                    idade: reserva.idade || '',
                    categoriaEscolhida: reserva.categoriaEscolhida || '',
                    prevAlta: '',
                    admAt: '',
                    _isReserva: true
                };
                var card = createCardUTI(leitoReservado, hospitalNome, hospitalId, 0);
                container.appendChild(card);
            }
        });
        
        if (vagos.length > 0) {
            var card = createCardUTI(vagos[0], hospitalNome, hospitalId, 0);
            container.appendChild(card);
        }
        
        logInfoUTI('Cards renderizados: ' + container.children.length);
    }
    
    // =================== CRIAR CARD UTI ===================
    function createCardUTI(leito, hospitalNome, hospitalId, posicaoOcupacao) {
        var card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'background: #1a1f2e; border-radius: 12px; padding: 18px; color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: Poppins, sans-serif;';
        
        var isExtra = isLeitoExtraUTI(hospitalId, posicaoOcupacao);
        if (isExtra && posicaoOcupacao > 0) {
            card.style.cssText += ' border: 2px solid #f59a1d !important;';
        }
        
        var numeroLeito = parseInt(leito.leito);
        
        var isVago = false;
        var isReservado = false;
        var statusBgColor = '#60a5fa';
        var statusTextColor = '#ffffff';
        var statusTexto = 'Disponivel';
        
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
        
        var nome = leito.nome || '';
        var matricula = leito.matricula || '';
        var matriculaFormatada = formatarMatriculaUTI(matricula);
        var idade = leito.idade || null;
        var admissao = leito.admAt || '';
        var previsaoAlta = leito.prevAlta || '';
        var sexo = leito.genero || '';
        
        var isolamento = leito.isolamento || 'Nao Isolamento';
        var isolamentoLower = isolamento.toLowerCase().trim();
        if (isolamentoLower.indexOf('contato') !== -1) {
            isolamento = 'Isolamento de Contato';
        } else if (isolamentoLower.indexOf('respirat') !== -1) {
            isolamento = 'Isolamento Respiratorio';
        } else {
            isolamento = 'Nao Isolamento';
        }
        
        var identificacaoLeito = String(leito.identificacaoLeito || leito.identificacao_leito || '');
        
        var badgeIsolamento = getBadgeIsolamentoUTI(isolamento);
        var badgeGenero = getBadgeGeneroUTI(sexo);
        
        var tempoInternacao = '';
        if (!isVago && admissao) {
            tempoInternacao = calcularTempoInternacaoUTI(admissao);
        }
        
        var iniciais = isVago ? '-' : (nome ? String(nome).trim() : '-');
        var idSequencial = String(numeroLeito).padStart(2, '0');
        
        var leitoDisplay = isVago ? '-' : (identificacaoLeito.trim() || 'LEITO ' + numeroLeito);
        if (!isVago && identificacaoLeito.trim()) {
            leitoDisplay = identificacaoLeito.trim().toUpperCase();
        }
        
        var circuloCor = '#60a5fa';
        var circuloStroke = isVago ? '#1a1f2e' : '#ffffff';
        
        var styleBloqueado = 'background: rgba(100,100,100,0.3); border: 1px solid rgba(100,100,100,0.4); opacity: 0.5;';
        var styleNormal = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);';
        
        var contratuaisUTI = UTI_CAPACIDADE_CARDS[hospitalId] ? UTI_CAPACIDADE_CARDS[hospitalId].contratuais : 0;
        
        var cardHTML = '';
        
        // HEADER
        cardHTML += '<div class="card-header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px;">';
        cardHTML += '<div style="font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">HOSPITAL</div>';
        cardHTML += '<div style="font-size: 16px; color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">' + hospitalNome + '</div>';
        cardHTML += '<div style="font-size: 10px; color: #f59a1d; font-weight: 600; margin-top: 2px;">UTI</div>';
        if (posicaoOcupacao > 0) {
            var flagColor = isExtra ? '#f59a1d' : '#60a5fa';
            var flagTextColor = isExtra ? '#131b2e' : '#ffffff';
            cardHTML += '<div style="background: ' + flagColor + '; color: ' + flagTextColor + '; padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-top: 8px; display: inline-block;">OCUPACAO ' + posicaoOcupacao + '/' + contratuaisUTI + '</div>';
        }
        cardHTML += '</div>';
        
        // LINHA 1: LEITO | TIPO | STATUS
        cardHTML += '<div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px;">';
        cardHTML += '<div class="card-box" style="' + styleNormal + ' border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">LEITO</div>';
        cardHTML += '<div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">' + leitoDisplay + '</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="card-box" style="' + styleNormal + ' border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">TIPO</div>';
        cardHTML += '<div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">UTI</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="status-badge" style="background: ' + statusBgColor + '; color: ' + statusTextColor + '; padding: 12px 6px; border-radius: 6px; font-weight: 800; text-transform: uppercase; text-align: center; font-size: 11px; letter-spacing: 0.5px; min-height: 45px; display: flex; flex-direction: column; align-items: center; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; color: ' + statusTextColor + ';">STATUS</div>';
        cardHTML += '<div class="box-value" style="font-weight: 700; font-size: 11px; line-height: 1.2; color: ' + statusTextColor + ';">' + statusTexto + '</div>';
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // LINHA 2: GENERO | ISOLAMENTO | PREV ALTA
        cardHTML += '<div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 10px;">';
        cardHTML += '<div class="card-box" style="background: ' + badgeGenero.cor + '; border: 1px solid ' + badgeGenero.borda + '; border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: ' + badgeGenero.textoCor + '; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">GENERO</div>';
        cardHTML += '<div class="box-value" style="color: ' + badgeGenero.textoCor + '; font-weight: 700; font-size: 11px; line-height: 1.2;">' + badgeGenero.texto + '</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="card-box" style="background: ' + badgeIsolamento.cor + '; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: ' + badgeIsolamento.textoCor + '; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">ISOLAMENTO</div>';
        cardHTML += '<div class="box-value" style="color: ' + badgeIsolamento.textoCor + '; font-weight: 700; font-size: 11px; line-height: 1.2;">' + badgeIsolamento.texto + '</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="card-box prev-alta" style="background: #60a5fa; border: 1px solid rgba(96,165,250,0.5); border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: #ffffff; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">PREVISAO ALTA</div>';
        cardHTML += '<div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 11px; line-height: 1.2;">' + (previsaoAlta || '-') + '</div>';
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // LINHA DIVISORIA
        cardHTML += '<div class="divider" style="height: 2px; background: #ffffff; margin: 12px 0;"></div>';
        
        // SECAO PESSOA
        cardHTML += '<div class="card-row-pessoa" style="display: grid; grid-template-columns: 100px 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; margin-bottom: 10px;">';
        cardHTML += '<div class="pessoa-circle" style="grid-row: span 2; grid-column: 1; width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ' + circuloCor + ';">';
        cardHTML += '<svg class="pessoa-icon" viewBox="0 0 24 24" fill="none" stroke="' + circuloStroke + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 55%; height: 55%;"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path></svg>';
        cardHTML += '</div>';
        cardHTML += '<div class="small-cell" style="' + styleNormal + ' border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">';
        cardHTML += '<div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">INICIAIS</div>';
        cardHTML += '<div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">' + iniciais + '</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="small-cell" style="' + styleNormal + ' border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">';
        cardHTML += '<div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">MATRICULA</div>';
        cardHTML += '<div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">' + matriculaFormatada + '</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="small-cell" style="' + styleNormal + ' border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">';
        cardHTML += '<div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">IDADE</div>';
        cardHTML += '<div class="box-value" style="color: #ffffff; font-weight: 700; font-size: 10px; line-height: 1.2;">' + (idade ? idade + ' anos' : '-') + '</div>';
        cardHTML += '</div>';
        // REGIAO BLOQUEADA
        cardHTML += '<div class="small-cell" style="' + styleBloqueado + ' border-radius: 6px; padding: 6px; display: flex; flex-direction: column; justify-content: center; min-height: 46px;">';
        cardHTML += '<div class="box-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">REGIAO</div>';
        cardHTML += '<div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 10px; line-height: 1.2;">-</div>';
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // LINHA 3: PPS | SPICT-BR | DIRETIVAS - TODOS BLOQUEADOS
        cardHTML += '<div class="card-row" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; margin-bottom: 12px;">';
        cardHTML += '<div class="card-box" style="' + styleBloqueado + ' border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">PPS</div>';
        cardHTML += '<div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 11px; line-height: 1.2;">-</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="card-box" style="' + styleBloqueado + ' border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">SPICT-BR</div>';
        cardHTML += '<div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 11px; line-height: 1.2;">-</div>';
        cardHTML += '</div>';
        cardHTML += '<div class="card-box" style="' + styleBloqueado + ' border-radius: 6px; padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center;">';
        cardHTML += '<div class="box-label" style="font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">DIRETIVAS</div>';
        cardHTML += '<div class="box-value" style="color: rgba(255,255,255,0.5); font-weight: 700; font-size: 11px; line-height: 1.2;">-</div>';
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // CONCESSOES - BLOQUEADO
        cardHTML += '<div class="card-section" style="margin-bottom: 15px;">';
        cardHTML += '<div class="section-header" style="background: rgba(100,100,100,0.5); color: rgba(255,255,255,0.5); font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">CONCESSOES PREVISTAS NA ALTA</div>';
        cardHTML += '<div class="chips-container" style="' + styleBloqueado + ' display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; border-radius: 6px; padding: 8px;">';
        cardHTML += '<span style="color: rgba(255,255,255,0.4); font-size: 10px; font-style: italic;">Campo nao disponivel para UTI</span>';
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // LINHAS DE CUIDADO - BLOQUEADO
        cardHTML += '<div class="card-section" style="margin-bottom: 15px;">';
        cardHTML += '<div class="section-header" style="background: rgba(100,100,100,0.5); color: rgba(255,255,255,0.5); font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">LINHAS DE CUIDADO</div>';
        cardHTML += '<div class="chips-container" style="' + styleBloqueado + ' display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; border-radius: 6px; padding: 8px;">';
        cardHTML += '<span style="color: rgba(255,255,255,0.4); font-size: 10px; font-style: italic;">Campo nao disponivel para UTI</span>';
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // ANOTACOES
        cardHTML += '<div class="card-section" style="margin-bottom: 15px;">';
        cardHTML += '<div class="section-header" style="background: #60a5fa; color: #ffffff; font-size: 10px; padding: 6px 8px; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">ANOTACOES</div>';
        cardHTML += '<div class="anotacoes-container" style="' + styleNormal + ' border-radius: 6px; padding: 8px; min-height: 40px;">';
        if (leito.anotacoes && leito.anotacoes.trim()) {
            cardHTML += '<span style="color: rgba(255,255,255,0.9); font-size: 11px; line-height: 1.6; white-space: pre-wrap;">' + leito.anotacoes + '</span>';
        } else {
            cardHTML += '<span style="color: rgba(255,255,255,0.5); font-size: 10px; font-style: italic;">Sem anotacoes</span>';
        }
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // FOOTER
        cardHTML += '<div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); gap: 10px;">';
        cardHTML += '<div class="card-info" style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1;">';
        if (!isVago && admissao) {
            cardHTML += '<div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">';
            cardHTML += '<div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">ADMISSAO</div>';
            cardHTML += '<div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">' + formatarDataHoraUTI(admissao) + '</div>';
            cardHTML += '</div>';
        }
        if (!isVago && tempoInternacao) {
            cardHTML += '<div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">';
            cardHTML += '<div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">INTERNADO</div>';
            cardHTML += '<div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">' + tempoInternacao + '</div>';
            cardHTML += '</div>';
        }
        cardHTML += '<div class="info-item" style="display: flex; flex-direction: column; opacity: 0.5;">';
        cardHTML += '<div class="info-label" style="font-size: 8px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; margin-bottom: 1px;">ID</div>';
        cardHTML += '<div class="info-value" style="color: rgba(255,255,255,0.6); font-weight: 600; font-size: 9px;">' + idSequencial + '</div>';
        cardHTML += '</div>';
        cardHTML += '</div>';
        
        // BOTOES
        if (isReservado) {
            cardHTML += '<div style="display: flex; gap: 8px;">';
            cardHTML += '<button class="btn-action btn-cancelar-reserva-uti" data-action="cancelar-reserva-uti" data-leito="' + numeroLeito + '" data-identificacao="' + identificacaoLeito + '" data-matricula="' + matricula + '" style="padding: 10px 16px; background: #c86420; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">CANCELAR</button>';
            cardHTML += '<button class="btn-action btn-admitir-reserva-uti" data-action="admitir-reserva-uti" data-leito="' + numeroLeito + '" style="padding: 10px 16px; background: #60a5fa; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">ADMITIR</button>';
            cardHTML += '</div>';
        } else if (isVago) {
            cardHTML += '<div style="display: flex; gap: 8px;">';
            cardHTML += '<button class="btn-action btn-reservar-uti" data-action="reservar-uti" data-leito="' + numeroLeito + '" style="padding: 10px 16px; background: #f59a1d; color: #131b2e; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">RESERVAR</button>';
            cardHTML += '<button class="btn-action btn-admitir-uti" data-action="admitir-uti" data-leito="' + numeroLeito + '" style="padding: 10px 16px; background: #60a5fa; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 10px;">ADMITIR</button>';
            cardHTML += '</div>';
        } else {
            cardHTML += '<button class="btn-action btn-atualizar-uti" data-action="atualizar-uti" data-leito="' + numeroLeito + '" style="padding: 10px 18px; background: rgba(156,163,175,0.5); color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 11px;">ATUALIZAR</button>';
        }
        cardHTML += '</div>';
        
        card.innerHTML = cardHTML;
        
        // Event listeners
        var admitirBtn = card.querySelector('[data-action="admitir-uti"]');
        if (admitirBtn) {
            admitirBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openModalAdmissaoUTI(numeroLeito, leito);
            });
        }
        
        var reservarBtn = card.querySelector('[data-action="reservar-uti"]');
        if (reservarBtn) {
            reservarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openModalReservaUTI(numeroLeito, leito);
            });
        }
        
        var atualizarBtn = card.querySelector('[data-action="atualizar-uti"]');
        if (atualizarBtn) {
            atualizarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openModalAtualizarUTI(numeroLeito, leito);
            });
        }
        
        var cancelarBtn = card.querySelector('[data-action="cancelar-reserva-uti"]');
        if (cancelarBtn) {
            cancelarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Deseja cancelar esta reserva UTI?')) {
                    if (window.cancelarReserva) {
                        window.cancelarReserva(hospitalId, cancelarBtn.dataset.identificacao, cancelarBtn.dataset.matricula)
                            .then(function() {
                                showSuccessMessageUTI('Reserva UTI cancelada!');
                                setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                            })
                            .catch(function(error) {
                                showErrorMessageUTI('Erro: ' + error.message);
                            });
                    }
                }
            });
        }
        
        var admitirReservaBtn = card.querySelector('[data-action="admitir-reserva-uti"]');
        if (admitirReservaBtn) {
            admitirReservaBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openModalAdmissaoUTI(numeroLeito, leito, true);
            });
        }
        
        return card;
    }
    
    // =================== MODAL DE ADMISSAO UTI ===================
    function openModalAdmissaoUTI(leitoNumero, leito, isFromReserva) {
        var hospitalId = window.currentHospitalUTI || 'H2';
        var config = UTI_CAPACIDADE_CARDS[hospitalId];
        var hospitalNome = config ? config.nome : hospitalId;
        
        var existingModal = document.getElementById('modalAdmissaoUTI');
        if (existingModal) existingModal.remove();
        
        var modal = document.createElement('div');
        modal.id = 'modalAdmissaoUTI';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 20px; box-sizing: border-box;';
        
        var iniciais = isFromReserva ? (leito.nome || '') : '';
        var matricula = isFromReserva ? (leito.matricula || '') : '';
        var idade = isFromReserva ? (leito.idade || '') : '';
        var genero = isFromReserva ? (leito.genero || '') : '';
        var isolamento = isFromReserva ? (leito.isolamento || 'Nao Isolamento') : 'Nao Isolamento';
        var identificacao = isFromReserva ? (leito.identificacaoLeito || '') : '';
        var tipoConvenio = isFromReserva ? (leito.categoriaEscolhida || '') : '';
        
        var modalHTML = '<div style="background: #1a1f2e; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: Poppins, sans-serif;">';
        modalHTML += '<div style="text-align: center; margin-bottom: 25px;">';
        modalHTML += '<h2 style="color: #60a5fa; margin: 0 0 5px 0; font-size: 22px;">' + (isFromReserva ? 'CONFIRMAR ADMISSAO' : 'ADMITIR PACIENTE') + ' - UTI</h2>';
        modalHTML += '<p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">' + hospitalNome + ' - Leito ' + leitoNumero + '</p>';
        modalHTML += '</div>';
        modalHTML += '<form id="formAdmissaoUTI" style="display: flex; flex-direction: column; gap: 15px;">';
        
        // Tipo de Convenio
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">TIPO DE CONVENIO *</label>';
        modalHTML += '<select id="utiTipoConvenio" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">';
        modalHTML += '<option value="">Selecione...</option>';
        modalHTML += '<option value="Apartamento"' + (tipoConvenio === 'Apartamento' ? ' selected' : '') + '>Apartamento</option>';
        modalHTML += '<option value="Enfermaria"' + (tipoConvenio === 'Enfermaria' ? ' selected' : '') + '>Enfermaria</option>';
        modalHTML += '</select></div>';
        
        // Identificacao
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDENTIFICACAO DO LEITO *</label>';
        modalHTML += '<input type="text" id="utiIdentificacao" value="' + identificacao + '" required placeholder="Ex: 101, 201-A" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;"></div>';
        
        // Isolamento
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ISOLAMENTO *</label>';
        modalHTML += '<select id="utiIsolamento" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">';
        modalHTML += '<option value="Nao Isolamento"' + (isolamento === 'Nao Isolamento' ? ' selected' : '') + '>Nao Isolamento</option>';
        modalHTML += '<option value="Isolamento de Contato"' + (isolamento === 'Isolamento de Contato' ? ' selected' : '') + '>Isolamento de Contato</option>';
        modalHTML += '<option value="Isolamento Respiratorio"' + (isolamento === 'Isolamento Respiratorio' ? ' selected' : '') + '>Isolamento Respiratorio</option>';
        modalHTML += '</select></div>';
        
        // Genero
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">GENERO *</label>';
        modalHTML += '<select id="utiGenero" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">';
        modalHTML += '<option value="">Selecione...</option>';
        modalHTML += '<option value="Masculino"' + (genero === 'Masculino' ? ' selected' : '') + '>Masculino</option>';
        modalHTML += '<option value="Feminino"' + (genero === 'Feminino' ? ' selected' : '') + '>Feminino</option>';
        modalHTML += '</select></div>';
        
        // Iniciais
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">INICIAIS DO PACIENTE *</label>';
        modalHTML += '<input type="text" id="utiIniciais" value="' + iniciais + '" required placeholder="Ex: J S M" maxlength="20" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; text-transform: uppercase; box-sizing: border-box;"></div>';
        
        // Matricula
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">MATRICULA *</label>';
        modalHTML += '<input type="text" id="utiMatricula" value="' + matricula + '" required placeholder="Ex: 1234567-8" maxlength="15" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;"></div>';
        
        // Idade
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDADE *</label>';
        modalHTML += '<input type="number" id="utiIdade" value="' + idade + '" required min="0" max="150" placeholder="Ex: 65" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;"></div>';
        
        // Previsao Alta
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">PREVISAO DE ALTA</label>';
        modalHTML += '<select id="utiPrevAlta" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">';
        modalHTML += '<option value="">Selecione...</option>';
        modalHTML += '<option value="Hoje">Hoje</option>';
        modalHTML += '<option value="24h">24h</option>';
        modalHTML += '<option value="48h">48h</option>';
        modalHTML += '<option value="72h">72h</option>';
        modalHTML += '<option value="96h">96h</option>';
        modalHTML += '<option value="Sem Previsao">Sem Previsao</option>';
        modalHTML += '</select></div>';
        
        // Anotacoes
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ANOTACOES</label>';
        modalHTML += '<textarea id="utiAnotacoes" rows="3" maxlength="800" placeholder="Observacoes (max 800 caracteres)" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; resize: vertical; box-sizing: border-box;"></textarea></div>';
        
        // Botoes
        modalHTML += '<div style="display: flex; gap: 10px; margin-top: 10px;">';
        modalHTML += '<button type="button" id="btnCancelarUTI" style="flex: 1; padding: 14px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">CANCELAR</button>';
        modalHTML += '<button type="submit" style="flex: 1; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">' + (isFromReserva ? 'CONFIRMAR' : 'ADMITIR') + '</button>';
        modalHTML += '</div>';
        modalHTML += '</form></div>';
        
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        document.getElementById('btnCancelarUTI').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
        
        document.getElementById('formAdmissaoUTI').addEventListener('submit', function(e) {
            e.preventDefault();
            
            var dados = {
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
                pps: '',
                spict: '',
                regiao: '',
                diretivas: '',
                concessoes: '[]',
                linhas: '[]'
            };
            
            var params = new URLSearchParams();
            params.append('action', 'admitir');
            Object.keys(dados).forEach(function(key) {
                params.append(key, dados[key]);
            });
            
            fetch(window.API_URL + '?' + params.toString())
                .then(function(response) { return response.json(); })
                .then(function(result) {
                    if (result.ok || result.success) {
                        if (isFromReserva && leito._isReserva && window.cancelarReserva) {
                            window.cancelarReserva(hospitalId, leito.identificacaoLeito, leito.matricula).catch(function() {});
                        }
                        modal.remove();
                        showSuccessMessageUTI('Paciente admitido na UTI!');
                        if (window.loadHospitalData) {
                            window.loadHospitalData().then(function() {
                                setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                            });
                        } else {
                            setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                        }
                    } else {
                        throw new Error(result.message || result.error || 'Erro ao admitir');
                    }
                })
                .catch(function(error) {
                    showErrorMessageUTI('Erro: ' + error.message);
                });
        });
    }
    
    // =================== MODAL DE RESERVA UTI ===================
    function openModalReservaUTI(leitoNumero, leito) {
        var hospitalId = window.currentHospitalUTI || 'H2';
        var config = UTI_CAPACIDADE_CARDS[hospitalId];
        var hospitalNome = config ? config.nome : hospitalId;
        
        var existingModal = document.getElementById('modalReservaUTI');
        if (existingModal) existingModal.remove();
        
        var modal = document.createElement('div');
        modal.id = 'modalReservaUTI';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 20px; box-sizing: border-box;';
        
        var modalHTML = '<div style="background: #1a1f2e; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: Poppins, sans-serif;">';
        modalHTML += '<div style="text-align: center; margin-bottom: 25px;">';
        modalHTML += '<h2 style="color: #f59a1d; margin: 0 0 5px 0; font-size: 22px;">RESERVAR LEITO UTI</h2>';
        modalHTML += '<p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">' + hospitalNome + ' - Leito ' + leitoNumero + '</p>';
        modalHTML += '</div>';
        modalHTML += '<form id="formReservaUTI" style="display: flex; flex-direction: column; gap: 15px;">';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">TIPO DE CONVENIO *</label>';
        modalHTML += '<select id="reservaUtiTipoConvenio" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;"><option value="">Selecione...</option><option value="Apartamento">Apartamento</option><option value="Enfermaria">Enfermaria</option></select></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDENTIFICACAO DO LEITO *</label>';
        modalHTML += '<input type="text" id="reservaUtiIdentificacao" required placeholder="Ex: 101" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;"></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ISOLAMENTO *</label>';
        modalHTML += '<select id="reservaUtiIsolamento" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;"><option value="Nao Isolamento">Nao Isolamento</option><option value="Isolamento de Contato">Isolamento de Contato</option><option value="Isolamento Respiratorio">Isolamento Respiratorio</option></select></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">GENERO *</label>';
        modalHTML += '<select id="reservaUtiGenero" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;"><option value="">Selecione...</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">INICIAIS</label>';
        modalHTML += '<input type="text" id="reservaUtiIniciais" placeholder="Ex: J S M" maxlength="20" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; text-transform: uppercase; box-sizing: border-box;"></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">MATRICULA</label>';
        modalHTML += '<input type="text" id="reservaUtiMatricula" placeholder="Ex: 1234567-8" maxlength="15" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;"></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">IDADE</label>';
        modalHTML += '<input type="number" id="reservaUtiIdade" min="0" max="150" placeholder="Ex: 65" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box;"></div>';
        
        modalHTML += '<div style="display: flex; gap: 10px; margin-top: 10px;">';
        modalHTML += '<button type="button" id="btnCancelarReservaUTI" style="flex: 1; padding: 14px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">CANCELAR</button>';
        modalHTML += '<button type="submit" style="flex: 1; padding: 14px; background: #f59a1d; color: #131b2e; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">RESERVAR</button>';
        modalHTML += '</div></form></div>';
        
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        document.getElementById('btnCancelarReservaUTI').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
        
        document.getElementById('formReservaUTI').addEventListener('submit', function(e) {
            e.preventDefault();
            
            var params = new URLSearchParams();
            params.append('action', 'reservar');
            params.append('hospital', hospitalId);
            params.append('leito', leitoNumero);
            params.append('tipo', 'UTI');
            params.append('categoriaEscolhida', document.getElementById('reservaUtiTipoConvenio').value);
            params.append('identificacaoLeito', document.getElementById('reservaUtiIdentificacao').value);
            params.append('isolamento', document.getElementById('reservaUtiIsolamento').value);
            params.append('genero', document.getElementById('reservaUtiGenero').value);
            params.append('iniciais', document.getElementById('reservaUtiIniciais').value.toUpperCase());
            params.append('matricula', document.getElementById('reservaUtiMatricula').value);
            params.append('idade', document.getElementById('reservaUtiIdade').value);
            
            fetch(window.API_URL + '?' + params.toString())
                .then(function(response) { return response.json(); })
                .then(function(result) {
                    if (result.ok || result.success) {
                        modal.remove();
                        showSuccessMessageUTI('Leito UTI reservado!');
                        if (window.carregarReservas) {
                            window.carregarReservas().then(function() {
                                setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                            });
                        } else {
                            setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                        }
                    } else {
                        throw new Error(result.message || result.error || 'Erro ao reservar');
                    }
                })
                .catch(function(error) {
                    showErrorMessageUTI('Erro: ' + error.message);
                });
        });
    }
    
    // =================== MODAL DE ATUALIZAR UTI ===================
    function openModalAtualizarUTI(leitoNumero, leito) {
        var hospitalId = window.currentHospitalUTI || 'H2';
        var config = UTI_CAPACIDADE_CARDS[hospitalId];
        var hospitalNome = config ? config.nome : hospitalId;
        
        var existingModal = document.getElementById('modalAtualizarUTI');
        if (existingModal) existingModal.remove();
        
        var modal = document.createElement('div');
        modal.id = 'modalAtualizarUTI';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 20px; box-sizing: border-box;';
        
        var identificacao = leito.identificacaoLeito || leito.identificacao_leito || '';
        var isolamento = leito.isolamento || 'Nao Isolamento';
        var prevAlta = leito.prevAlta || '';
        var anotacoes = leito.anotacoes || '';
        
        var modalHTML = '<div style="background: #1a1f2e; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: Poppins, sans-serif;">';
        modalHTML += '<div style="text-align: center; margin-bottom: 25px;">';
        modalHTML += '<h2 style="color: #60a5fa; margin: 0 0 5px 0; font-size: 22px;">ATUALIZAR PACIENTE UTI</h2>';
        modalHTML += '<p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">' + hospitalNome + ' - ' + (identificacao || 'Leito ' + leitoNumero) + '</p>';
        modalHTML += '<p style="color: #f59a1d; margin: 5px 0 0 0; font-size: 12px;">' + (leito.nome || '') + ' - ' + formatarMatriculaUTI(leito.matricula) + '</p>';
        modalHTML += '</div>';
        modalHTML += '<form id="formAtualizarUTI" style="display: flex; flex-direction: column; gap: 15px;">';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ISOLAMENTO</label>';
        modalHTML += '<select id="atualizarUtiIsolamento" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">';
        modalHTML += '<option value="Nao Isolamento"' + (isolamento.indexOf('Nao') !== -1 ? ' selected' : '') + '>Nao Isolamento</option>';
        modalHTML += '<option value="Isolamento de Contato"' + (isolamento === 'Isolamento de Contato' ? ' selected' : '') + '>Isolamento de Contato</option>';
        modalHTML += '<option value="Isolamento Respiratorio"' + (isolamento.indexOf('Respirat') !== -1 ? ' selected' : '') + '>Isolamento Respiratorio</option>';
        modalHTML += '</select></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">PREVISAO DE ALTA</label>';
        modalHTML += '<select id="atualizarUtiPrevAlta" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px;">';
        modalHTML += '<option value="">Selecione...</option>';
        modalHTML += '<option value="Hoje"' + (prevAlta === 'Hoje' ? ' selected' : '') + '>Hoje</option>';
        modalHTML += '<option value="24h"' + (prevAlta === '24h' ? ' selected' : '') + '>24h</option>';
        modalHTML += '<option value="48h"' + (prevAlta === '48h' ? ' selected' : '') + '>48h</option>';
        modalHTML += '<option value="72h"' + (prevAlta === '72h' ? ' selected' : '') + '>72h</option>';
        modalHTML += '<option value="96h"' + (prevAlta === '96h' ? ' selected' : '') + '>96h</option>';
        modalHTML += '<option value="Sem Previsao"' + (prevAlta === 'Sem Previsao' ? ' selected' : '') + '>Sem Previsao</option>';
        modalHTML += '</select></div>';
        
        modalHTML += '<div><label style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; display: block; margin-bottom: 5px;">ANOTACOES</label>';
        modalHTML += '<textarea id="atualizarUtiAnotacoes" rows="4" maxlength="800" placeholder="Observacoes" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; resize: vertical; box-sizing: border-box;">' + anotacoes + '</textarea></div>';
        
        modalHTML += '<div style="display: flex; gap: 10px; margin-top: 10px;">';
        modalHTML += '<button type="button" id="btnDarAltaUTI" style="flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">DAR ALTA</button>';
        modalHTML += '<button type="button" id="btnCancelarAtualizarUTI" style="flex: 1; padding: 14px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">CANCELAR</button>';
        modalHTML += '<button type="submit" style="flex: 1; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">SALVAR</button>';
        modalHTML += '</div></form></div>';
        
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        document.getElementById('btnCancelarAtualizarUTI').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
        
        document.getElementById('btnDarAltaUTI').addEventListener('click', function() {
            if (!confirm('Confirma a alta deste paciente UTI?')) return;
            
            var params = new URLSearchParams();
            params.append('action', 'daralta');
            params.append('hospital', hospitalId);
            params.append('leito', leitoNumero);
            
            fetch(window.API_URL + '?' + params.toString())
                .then(function(response) { return response.json(); })
                .then(function(result) {
                    if (result.ok || result.success) {
                        modal.remove();
                        showSuccessMessageUTI('Alta realizada com sucesso!');
                        if (window.loadHospitalData) {
                            window.loadHospitalData().then(function() {
                                setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                            });
                        } else {
                            setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                        }
                    } else {
                        throw new Error(result.message || result.error || 'Erro ao dar alta');
                    }
                })
                .catch(function(error) {
                    showErrorMessageUTI('Erro: ' + error.message);
                });
        });
        
        document.getElementById('formAtualizarUTI').addEventListener('submit', function(e) {
            e.preventDefault();
            
            var params = new URLSearchParams();
            params.append('action', 'atualizar');
            params.append('hospital', hospitalId);
            params.append('leito', leitoNumero);
            params.append('isolamento', document.getElementById('atualizarUtiIsolamento').value);
            params.append('prevAlta', document.getElementById('atualizarUtiPrevAlta').value);
            params.append('anotacoes', document.getElementById('atualizarUtiAnotacoes').value);
            
            fetch(window.API_URL + '?' + params.toString())
                .then(function(response) { return response.json(); })
                .then(function(result) {
                    if (result.ok || result.success) {
                        modal.remove();
                        showSuccessMessageUTI('Dados atualizados!');
                        if (window.loadHospitalData) {
                            window.loadHospitalData().then(function() {
                                setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                            });
                        } else {
                            setTimeout(function() { renderCardsUTI(hospitalId); }, 500);
                        }
                    } else {
                        throw new Error(result.message || result.error || 'Erro ao atualizar');
                    }
                })
                .catch(function(error) {
                    showErrorMessageUTI('Erro: ' + error.message);
                });
        });
    }
    
    // =================== FUNCAO GLOBAL PARA SELECIONAR HOSPITAL UTI ===================
    window.selectHospitalUTI = function(hospitalId) {
        logInfoUTI('Selecionando hospital UTI: ' + hospitalId);
        window.currentHospitalUTI = hospitalId;
        renderCardsUTI(hospitalId);
    };
    
    // =================== EXPORTAR FUNCAO GLOBAL ===================
    window.renderCardsUTI = renderCardsUTI;
    
    console.log('CARDS-UTI.JS V7.0 - Carregado com sucesso!');
    console.log('Hospitais UTI ativos:', HOSPITAIS_UTI_ATIVOS_CARDS.join(', '));
    
})();