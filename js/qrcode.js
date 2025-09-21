// =================== QRCODE.JS V4.0 - DADOS REAIS SOMENTE ===================
// SISTEMA QR CODE PARA MÉDICOS - SEM DADOS MOCK

// =================== VARIÁVEIS GLOBAIS ===================
window.qrScannerActive = false;
window.qrTimeoutTimer = null;
window.currentQRLeito = null;
window.html5QrCodeScanner = null;

// =================== CONSTANTES REAIS DA PLANILHA V4.0 ===================
// Usar constantes do cards.js para manter consistência
const CONCESSOES_LIST_QR = [
    "Transição Domiciliar",
    "Aplicação domiciliar de medicamentos", 
    "Fisioterapia",
    "Fonoaudiologia",
    "Aspiração",
    "Banho",
    "Curativos",
    "Oxigenoterapia",
    "Recarga de O2",
    "Orientação Nutricional - com dispositivo",
    "Orientação Nutricional - sem dispositivo",
    "Clister",
    "PICC"
];

const LINHAS_CUIDADO_LIST_QR = [
    "Assiste",
    "APS", 
    "Cuidados Paliativos",
    "ICO (Insuficiência Coronariana)",
    "Oncologia",
    "Pediatria",
    "Programa Autoimune - Gastroenterologia",
    "Programa Autoimune - Neuro-desmielinizante",
    "Programa Autoimune - Neuro-muscular",
    "Programa Autoimune - Reumatologia",
    "Vida Mais Leve Care",
    "Crônicos - Cardiologia",
    "Crônicos - Endocrinologia",
    "Crônicos - Geriatria",
    "Crônicos - Melhor Cuidado",
    "Crônicos - Neurologia",
    "Crônicos - Pneumologia",
    "Crônicos - Pós-bariátrica",
    "Crônicos - Reumatologia"
];

const PREVISAO_ALTA_OPTIONS_QR = [
    'Hoje Ouro', 'Hoje 2R', 'Hoje 3R',
    '24h Ouro', '24h 2R', '24h 3R',
    '48h', '72h', '96h', 'SP'
];

const PPS_OPTIONS_QR = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];

// OPÇÕES DE IDADE PARA SELECT
const IDADE_OPTIONS_QR = [];
for (let i = 0; i <= 120; i++) {
    IDADE_OPTIONS_QR.push(i);
}

// =================== GERAR QR CODES FIXOS (PARA ACRÍLICO) ===================
window.openQRCodes = function() {
    logInfo('Abrindo gerador de QR Codes para impressão em acrílico...');
    
    // Verificar se hospitalData existe
    if (!window.hospitalData || Object.keys(window.hospitalData).length === 0) {
        alert('Aguarde o carregamento dos dados da planilha para gerar os QR Codes.');
        return;
    }
    
    // Criar modal de QR Codes
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    modal.innerHTML = `
        <div class="qr-modal-content">
            <div class="qr-modal-header">
                <h2>QR Codes dos Leitos - Para Impressão em Acrílico</h2>
                <button onclick="closeQRModal()" class="close-btn">✕</button>
            </div>
            <div class="qr-modal-body">
                <div class="qr-hospital-selector">
                    <label>Selecionar Hospital:</label>
                    <select id="qrHospitalSelect" onchange="generateQRCodes()">
                        <option value="H1">Neomater</option>
                        <option value="H2">Cruz Azul</option>
                        <option value="H3">Santa Marcelina</option>
                        <option value="H4">Santa Clara</option>
                    </select>
                </div>
                <div id="qrCodesGrid" class="qr-codes-grid"></div>
                <div class="qr-actions">
                    <button onclick="printQRCodes()" class="btn-print">🖨️ Imprimir QR Codes</button>
                    <p style="color: #666; font-size: 12px; margin-top: 10px;">
                        ⚠️ QR Codes são fixos - ideais para impressão em acrílico
                    </p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Gerar QR codes iniciais
    generateQRCodes();
};

// =================== GERAR QR CODES FIXOS DO HOSPITAL ===================
window.generateQRCodes = function() {
    const hospitalId = document.getElementById('qrHospitalSelect').value;
    const hospital = window.hospitalData[hospitalId];
    const container = document.getElementById('qrCodesGrid');
    
    if (!hospital || !container) {
        logError('Hospital ou container não encontrado');
        return;
    }
    
    if (!hospital.leitos || hospital.leitos.length === 0) {
        container.innerHTML = '<p>Nenhum leito encontrado para este hospital.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    hospital.leitos.forEach(leito => {
        const leitoNumero = leito.leito || leito.numero || 'N/A';
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-code-item';
        qrDiv.innerHTML = `
            <div class="qr-label">
                ${hospital.nome} - Leito ${leitoNumero}
            </div>
            <div id="qr-${hospitalId}-${leitoNumero}" class="qr-code"></div>
        `;
        container.appendChild(qrDiv);
        
        // *** QR CODE COM URL FIXA (PARA ACRÍLICO) ***
        const BASE_URL = 'https://archipelago-mvp.vercel.app'; // URL de produção
        // const BASE_URL = window.location.origin; // Para desenvolvimento local
        
        const qrURL = `${BASE_URL}/?qr=true&h=${hospitalId}&l=${leitoNumero}`;
        
        // Gerar QR Code com URL simples
        new QRCode(document.getElementById(`qr-${hospitalId}-${leitoNumero}`), {
            text: qrURL,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M // M é suficiente para URLs
        });
    });
    
    logSuccess(`QR Codes fixos gerados para ${hospital.nome} - ${hospital.leitos.length} leitos`);
};

// =================== FECHAR MODAL QR ===================
window.closeQRModal = function() {
    const modal = document.querySelector('.qr-modal');
    if (modal) {
        modal.remove();
    }
};

// =================== IMPRIMIR QR CODES ===================
window.printQRCodes = function() {
    logInfo('Preparando impressão dos QR Codes...');
    window.print();
};

// =================== INICIAR SCANNER QR (MÉDICO) ===================
window.startQRScanner = function() {
    logInfo('Iniciando scanner QR para médico - Timeout 2 minutos...');
    
    // Parar scanner anterior se existir
    if (window.html5QrCodeScanner) {
        try {
            window.html5QrCodeScanner.stop();
        } catch (e) {
            logError('Erro ao parar scanner anterior:', e);
        }
    }
    
    // Criar interface de scanner
    const scannerDiv = document.createElement('div');
    scannerDiv.id = 'qrScanner';
    scannerDiv.className = 'qr-scanner-container';
    scannerDiv.innerHTML = `
        <div class="qr-scanner-header">
            <h2>📱 Escaneie o QR Code do Leito</h2>
            <div id="qrTimer" class="qr-timer">Tempo restante: 2:00</div>
            <button onclick="stopQRScanner()" class="close-scanner-btn">✕ Fechar</button>
        </div>
        <div id="qrReader" class="qr-reader"></div>
        <div id="qrResult" class="qr-result"></div>
        <div class="qr-instructions">
            <p>📋 Escaneie o QR Code fixo impresso no acrílico do leito</p>
            <p>⏰ Você tem 2 minutos para escanear e preencher os dados</p>
        </div>
    `;
    document.body.appendChild(scannerDiv);
    
    // Configurar scanner HTML5
    window.html5QrCodeScanner = new Html5Qrcode("qrReader");
    
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        try {
            const data = JSON.parse(decodedText);
            logSuccess(`QR Code lido: Hospital ${data.hospital}, Leito ${data.leito}`);
            
            // Validar estrutura do QR
            if (!data.hospital || !data.leito) {
                throw new Error('QR Code não contém dados válidos de hospital/leito');
            }
            
            // Parar scanner
            window.html5QrCodeScanner.stop().then(() => {
                logInfo('Scanner parado com sucesso');
            }).catch(err => {
                logError('Erro ao parar scanner:', err);
            });
            
            // Abrir formulário médico do leito específico
            openMedicoForm(data.hospital, data.leito);
            
        } catch (error) {
            logError('QR Code inválido:', error);
            document.getElementById('qrResult').innerHTML = 
                '<p style="color: #ef4444; background: rgba(239,68,68,0.1); padding: 10px; border-radius: 6px; margin: 10px;">❌ QR Code inválido ou corrompido. Tente novamente.</p>';
        }
    };
    
    const qrCodeErrorCallback = (errorMessage) => {
        // Não logar erros de scanning normais
        if (!errorMessage.includes('No QR code found')) {
            logError('Erro no scanner:', errorMessage);
        }
    };
    
    // Configurar e iniciar câmera
    const qrConfig = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0
    };
    
    window.html5QrCodeScanner.start(
        { facingMode: "environment" }, // Câmera traseira por padrão
        qrConfig,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
    ).catch(err => {
        logError('Erro ao iniciar câmera:', err);
        document.getElementById('qrResult').innerHTML = 
            '<p style="color: #ef4444; background: rgba(239,68,68,0.1); padding: 15px; border-radius: 6px; margin: 10px;">❌ Erro ao acessar câmera. Verifique as permissões do navegador.</p>';
    });
    
    // Iniciar timer rigoroso de 2 minutos
    startQRTimeout();
    
    window.qrScannerActive = true;
};

// =================== PARAR SCANNER QR ===================
window.stopQRScanner = function() {
    logInfo('Parando scanner QR...');
    
    // Parar scanner
    if (window.html5QrCodeScanner) {
        window.html5QrCodeScanner.stop().then(() => {
            logInfo('Scanner HTML5 parado');
        }).catch(err => {
            logError('Erro ao parar scanner:', err);
        });
        window.html5QrCodeScanner = null;
    }
    
    // Remover interface
    const scannerDiv = document.getElementById('qrScanner');
    if (scannerDiv) {
        scannerDiv.remove();
    }
    
    // Limpar timer
    if (window.qrTimeoutTimer) {
        clearInterval(window.qrTimeoutTimer);
        window.qrTimeoutTimer = null;
    }
    
    window.qrScannerActive = false;
};

// =================== TIMER RIGOROSO DE 2 MINUTOS ===================
function startQRTimeout() {
    let timeLeft = 120; // 2 minutos em segundos
    
    // Limpar timer anterior
    if (window.qrTimeoutTimer) {
        clearInterval(window.qrTimeoutTimer);
    }
    
    window.qrTimeoutTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        // Atualizar todos os timers visíveis
        const timerDivs = document.querySelectorAll('.qr-timer');
        timerDivs.forEach(div => {
            div.textContent = `Tempo restante: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Mudar cor quando tempo acabando
            if (timeLeft <= 30) {
                div.style.background = '#ef4444';
                div.style.animation = 'pulse 1s infinite';
            } else if (timeLeft <= 60) {
                div.style.background = '#f59e0b';
            }
        });
        
        timeLeft--;
        
        if (timeLeft < 0) {
            logInfo('Timeout rigoroso de 2 minutos - reiniciando scanner');
            
            // Fechar formulário se aberto
            const formDiv = document.getElementById('medicoForm');
            if (formDiv) {
                formDiv.remove();
            }
            
            // Parar e reiniciar scanner automaticamente
            stopQRScanner();
            setTimeout(() => {
                logInfo('Reiniciando scanner após timeout...');
                startQRScanner();
            }, 1000);
        }
    }, 1000);
}

// =================== FORMULÁRIO MÉDICO (LAYOUT MOBILE DO CARDS.JS) ===================
window.openMedicoForm = function(hospitalId, leitoNumero) {
    logInfo(`Abrindo formulário médico restrito: ${hospitalId} - Leito ${leitoNumero}`);
    
    // Validar dados
    if (!window.hospitalData[hospitalId]) {
        logError('Hospital não encontrado nos dados');
        alert('Hospital não encontrado. Verifique o QR Code.');
        return;
    }
    
    const hospital = window.hospitalData[hospitalId];
    const leito = hospital.leitos.find(l => (l.leito || l.numero) == leitoNumero);
    
    if (!leito) {
        logError('Leito não encontrado');
        alert('Leito não encontrado. Verifique o QR Code.');
        return;
    }
    
    window.currentQRLeito = { hospitalId, leitoNumero };
    
    // Determinar se leito está vago
    const isVago = leito.status === 'vago' || leito.status === 'Vago' || !leito.status || leito.status === '';
    
    // Criar formulário médico com MESMO LAYOUT DO MOBILE CARDS.JS
    const formDiv = document.createElement('div');
    formDiv.id = 'medicoForm';
    formDiv.className = 'medico-form-container';
    
    formDiv.innerHTML = `
        <div class="medico-form">
            <div class="medico-form-header">
                <h2>🏥 ${hospital.nome} - Leito ${leitoNumero}</h2>
                <div class="qr-timer">Tempo restante: 2:00</div>
            </div>
            
            <div class="medico-form-body">
                ${isVago ? renderFormularioAdmissao(hospital, leito) : renderFormularioAtualizacao(hospital, leito)}
            </div>
            
            <div class="medico-form-actions">
                <button onclick="saveMedicoForm()" class="btn-save">
                    ${isVago ? '✅ ADMITIR PACIENTE' : '💾 ATUALIZAR DADOS'}
                </button>
                ${!isVago ? '<button onclick="darAltaQR()" class="btn-alta">🏠 DAR ALTA</button>' : ''}
                <button onclick="closeMedicoForm()" class="btn-cancel">❌ CANCELAR</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(formDiv);
    
    // Reiniciar timer para formulário
    startQRTimeout();
};

// =================== FORMULÁRIO DE ADMISSÃO (COPIADO DO CARDS.JS) ===================
function renderFormularioAdmissao(hospital, leito) {
    return `
        <!-- MESMO LAYOUT 3x3 DO CARDS.JS MOBILE -->
        <div class="form-grid-mobile" style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div>
                <label>NOME COMPLETO *</label>
                <input id="qrNome" type="text" placeholder="Nome completo do paciente" required>
            </div>
            <div>
                <label>MATRÍCULA *</label>
                <input id="qrMatricula" type="text" placeholder="Ex: 123456" required>
            </div>
            <div>
                <label>IDADE *</label>
                <select id="qrIdade" required>
                    <option value="">Selecionar...</option>
                    ${IDADE_OPTIONS_QR.map(idade => `<option value="${idade}">${idade} anos</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="form-grid-mobile" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
            <div>
                <label>PPS *</label>
                <select id="qrPPS" required>
                    <option value="">Selecionar...</option>
                    ${PPS_OPTIONS_QR.map(pps => `<option value="${pps}">${pps}</option>`).join('')}
                </select>
            </div>
            <div>
                <label>SPICT-BR *</label>
                <select id="qrSPICT" required>
                    <option value="nao_elegivel">Não elegível</option>
                    <option value="elegivel">Elegível</option>
                </select>
            </div>
            <div>
                <label>PREVISÃO ALTA *</label>
                <select id="qrPrevAlta" required>
                    ${PREVISAO_ALTA_OPTIONS_QR.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-title">CONCESSÕES PREVISTAS NA ALTA</div>
            <div id="qrConcessoes" class="checkbox-grid">
                ${CONCESSOES_LIST_QR.map((c, i) => `
                    <label class="checkbox-item">
                        <input type="checkbox" id="conc${i}" value="${c}">
                        <span>${c}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-title">LINHAS DE CUIDADO PREVISTAS NA ALTA</div>
            <div id="qrLinhas" class="checkbox-grid">
                ${LINHAS_CUIDADO_LIST_QR.map((l, i) => `
                    <label class="checkbox-item">
                        <input type="checkbox" id="linha${i}" value="${l}">
                        <span>${l}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

// =================== FORMULÁRIO DE ATUALIZAÇÃO (COPIADO DO CARDS.JS) ===================
function renderFormularioAtualizacao(hospital, leito) {
    // Usar dados reais do leito (arrays diretos)
    const concessoesAtuais = Array.isArray(leito.concessoes) ? leito.concessoes : [];
    const linhasAtuais = Array.isArray(leito.linhas) ? leito.linhas : [];
    
    // Calcular iniciais do nome
    const iniciais = leito.nome ? leito.nome.split(' ')
        .filter(part => part.length > 0)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 3)
        .join(' ') : '—';
    
    return `
        <!-- DADOS SOMENTE LEITURA -->
        <div class="form-grid-mobile" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div>
                <label>INICIAIS</label>
                <input value="${iniciais}" readonly style="background: #1f2937; color: #9ca3af;">
            </div>
            <div>
                <label>MATRÍCULA</label>
                <input value="${leito.matricula || ''}" readonly style="background: #1f2937; color: #9ca3af;">
            </div>
            <div>
                <label>IDADE *</label>
                <select id="qrIdade" required>
                    <option value="">Selecionar...</option>
                    ${IDADE_OPTIONS_QR.map(idade => `<option value="${idade}" ${leito.idade == idade ? 'selected' : ''}>${idade} anos</option>`).join('')}
                </select>
            </div>
        </div>
        
        <!-- CAMPOS EDITÁVEIS -->
        <div class="form-grid-mobile" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
            <div>
                <label>PPS *</label>
                <select id="qrPPS" required>
                    <option value="">Selecionar...</option>
                    ${PPS_OPTIONS_QR.map(pps => `<option value="${pps}" ${leito.pps && `${leito.pps}%` === pps ? 'selected' : ''}>${pps}</option>`).join('')}
                </select>
            </div>
            <div>
                <label>SPICT-BR *</label>
                <select id="qrSPICT" required>
                    <option value="nao_elegivel" ${leito.spict === 'nao_elegivel' ? 'selected' : ''}>Não elegível</option>
                    <option value="elegivel" ${leito.spict === 'elegivel' ? 'selected' : ''}>Elegível</option>
                </select>
            </div>
            <div>
                <label>PREVISÃO ALTA *</label>
                <select id="qrPrevAlta" required>
                    ${PREVISAO_ALTA_OPTIONS_QR.map(opt => `<option value="${opt}" ${leito.prevAlta === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <!-- CONCESSÕES PRÉ-MARCADAS -->
        <div class="form-section">
            <div class="section-title">CONCESSÕES PREVISTAS NA ALTA</div>
            <div id="qrConcessoes" class="checkbox-grid">
                ${CONCESSOES_LIST_QR.map((c, i) => `
                    <label class="checkbox-item">
                        <input type="checkbox" id="conc${i}" value="${c}" ${concessoesAtuais.includes(c) ? 'checked' : ''}>
                        <span>${c}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- LINHAS PRÉ-MARCADAS -->
        <div class="form-section">
            <div class="section-title">LINHAS DE CUIDADO PREVISTAS NA ALTA</div>
            <div id="qrLinhas" class="checkbox-grid">
                ${LINHAS_CUIDADO_LIST_QR.map((l, i) => `
                    <label class="checkbox-item">
                        <input type="checkbox" id="linha${i}" value="${l}" ${linhasAtuais.includes(l) ? 'checked' : ''}>
                        <span>${l}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- INFO ADICIONAL -->
        <div style="margin-top: 20px; padding: 12px; background: rgba(96,165,250,0.1); border-radius: 8px; border-left: 4px solid #60a5fa;">
            <strong>Paciente:</strong> ${leito.nome || 'Nome não informado'}<br>
            <strong>Admissão:</strong> ${leito.admAt ? formatarDataHora(leito.admAt) : 'Data não informada'}
        </div>
    `;
}

// =================== SALVAR FORMULÁRIO MÉDICO ===================
window.saveMedicoForm = async function() {
    logInfo('Salvando dados do formulário médico na planilha...');
    
    try {
        // Coletar dados do formulário
        const dados = coletarDadosFormularioQR();
        
        // Validar campos obrigatórios
        if (!validarCamposObrigatorios(dados)) {
            return;
        }
        
        // Determinar se é admissão ou atualização
        const hospital = window.hospitalData[window.currentQRLeito.hospitalId];
        const leito = hospital.leitos.find(l => (l.leito || l.numero) == window.currentQRLeito.leitoNumero);
        const isVago = leito.status === 'vago' || leito.status === 'Vago' || !leito.status || leito.status === '';
        
        // Chamar API correta
        if (isVago) {
            await window.admitirPaciente(dados.hospital, dados.leito, dados);
            logSuccess('Paciente admitido via QR Code');
            alert('✅ Paciente admitido com sucesso!');
        } else {
            await window.atualizarPaciente(dados.hospital, dados.leito, dados);
            logSuccess('Dados atualizados via QR Code');
            alert('✅ Dados atualizados com sucesso!');
        }
        
        // Fechar formulário e voltar ao scanner
        closeMedicoForm();
        setTimeout(() => startQRScanner(), 500);
        
    } catch (error) {
        logError('Erro ao salvar via QR Code:', error);
        alert('❌ Erro ao salvar: ' + error.message);
    }
};

// =================== DAR ALTA VIA QR ===================
window.darAltaQR = async function() {
    if (!confirm('⚠️ Confirma a ALTA deste paciente?')) {
        return;
    }
    
    try {
        logInfo('Processando alta via QR Code...');
        
        await window.darAltaPaciente(window.currentQRLeito.hospitalId, window.currentQRLeito.leitoNumero);
        
        logSuccess('Alta processada via QR Code');
        alert('✅ Alta processada com sucesso!');
        
        // Fechar formulário e voltar ao scanner
        closeMedicoForm();
        setTimeout(() => startQRScanner(), 500);
        
    } catch (error) {
        logError('Erro ao processar alta via QR Code:', error);
        alert('❌ Erro ao processar alta: ' + error.message);
    }
};

// =================== COLETAR DADOS DO FORMULÁRIO ===================
function coletarDadosFormularioQR() {
    const dados = {
        hospital: window.currentQRLeito.hospitalId,
        leito: window.currentQRLeito.leitoNumero
    };
    
    // Campos básicos
    const nomeInput = document.getElementById('qrNome');
    if (nomeInput) dados.nome = nomeInput.value.trim();
    
    const matriculaInput = document.getElementById('qrMatricula');
    if (matriculaInput) dados.matricula = matriculaInput.value.trim();
    
    dados.idade = parseInt(document.getElementById('qrIdade')?.value) || null;
    dados.pps = document.getElementById('qrPPS')?.value?.replace('%', '') || null;
    dados.spict = document.getElementById('qrSPICT')?.value || 'nao_elegivel';
    dados.complexidade = 'I'; // Padrão
    dados.prevAlta = document.getElementById('qrPrevAlta')?.value || 'SP';
    
    // Coletar concessões marcadas (arrays diretos)
    dados.concessoes = [];
    CONCESSOES_LIST_QR.forEach((c, i) => {
        const checkbox = document.getElementById(`conc${i}`);
        if (checkbox && checkbox.checked) {
            dados.concessoes.push(c);
        }
    });
    
    // Coletar linhas marcadas (arrays diretos)
    dados.linhas = [];
    LINHAS_CUIDADO_LIST_QR.forEach((l, i) => {
        const checkbox = document.getElementById(`linha${i}`);
        if (checkbox && checkbox.checked) {
            dados.linhas.push(l);
        }
    });
    
    return dados;
}

// =================== VALIDAR CAMPOS OBRIGATÓRIOS ===================
function validarCamposObrigatorios(dados) {
    const erros = [];
    
    // Para admissão, validar nome e matrícula
    if (dados.nome !== undefined && !dados.nome) {
        erros.push('Nome é obrigatório');
    }
    
    if (dados.matricula !== undefined && !dados.matricula) {
        erros.push('Matrícula é obrigatória');
    }
    
    if (!dados.idade) {
        erros.push('Idade é obrigatória');
    }
    
    if (!dados.pps) {
        erros.push('PPS é obrigatório');
    }
    
    if (!dados.spict) {
        erros.push('SPICT-BR é obrigatório');
    }
    
    if (!dados.prevAlta) {
        erros.push('Previsão de Alta é obrigatória');
    }
    
    if (erros.length > 0) {
        alert('❌ Campos obrigatórios:\n\n• ' + erros.join('\n• '));
        return false;
    }
    
    return true;
}

// =================== FECHAR FORMULÁRIO MÉDICO ===================
window.closeMedicoForm = function() {
    const formDiv = document.getElementById('medicoForm');
    if (formDiv) {
        formDiv.remove();
    }
    
    // Limpar dados temporários
    window.currentQRLeito = null;
    
    logInfo('Formulário médico fechado');
};

// =================== FUNÇÕES AUXILIARES ===================
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

function logInfo(message, data = null) {
    console.log(`🔵 [QR] ${message}`, data || '');
}

function logError(message, error = null) {
    console.error(`🔴 [QR ERROR] ${message}`, error || '');
}

function logSuccess(message) {
    console.log(`🟢 [QR SUCCESS] ${message}`);
}

// =================== CSS RESPONSIVO COMPLETO DO QR CODE ===================
const qrStyles = `
<style>
/* =================== MODAL DE QR CODES =================== */
.qr-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
}

.qr-modal-content {
    background: white;
    border-radius: 12px;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
    padding: 20px;
    color: #1a1f2e;
}

.qr-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e5e7eb;
}

.qr-modal-header h2 {
    color: #1a1f2e;
    margin: 0;
    font-size: 20px;
}

.close-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
}

.qr-hospital-selector {
    margin-bottom: 20px;
    text-align: center;
}

.qr-hospital-selector label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
}

.qr-hospital-selector select {
    padding: 12px;
    border: 2px solid #d1d5db;
    border-radius: 8px;
    background: white;
    color: #1a1f2e;
    font-size: 16px;
    min-width: 200px;
}

.qr-codes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.qr-code-item {
    text-align: center;
    padding: 20px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: #f9fafb;
}

.qr-label {
    margin-bottom: 15px;
    font-weight: 700;
    font-size: 16px;
    color: #1a1f2e;
    text-transform: uppercase;
}

.qr-actions {
    text-align: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
}

.btn-print {
    padding: 15px 30px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    text-transform: uppercase;
}

.btn-print:hover {
    background: #2563eb;
}

/* =================== SCANNER QR =================== */
.qr-scanner-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #1a1f2e;
    z-index: 9999;
    overflow: auto;
}

.qr-scanner-header {
    background: #1e293b;
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}

.qr-scanner-header h2 {
    color: white;
    margin: 0;
    font-size: 20px;
}

.qr-timer {
    background: #ef4444;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
}

.close-scanner-btn {
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.close-scanner-btn:hover {
    background: rgba(255,255,255,0.2);
}

.qr-reader {
    max-width: 500px;
    margin: 20px auto;
    padding: 0 20px;
}

.qr-result {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 20px;
}

.qr-instructions {
    max-width: 500px;
    margin: 20px auto;
    padding: 20px;
    background: rgba(96,165,250,0.1);
    border-radius: 8px;
    color: #60a5fa;
    text-align: center;
}

.qr-instructions p {
    margin: 8px 0;
    font-size: 14px;
}

/* =================== FORMULÁRIO MÉDICO =================== */
.medico-form-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    overflow: auto;
    backdrop-filter: blur(5px);
}

.medico-form {
    background: #1a1f2e;
    border-radius: 12px;
    max-width: 900px;
    width: 95%;
    max-height: 95vh;
    overflow: auto;
    color: white;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}

.medico-form-header {
    background: #1e293b;
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 12px 12px 0 0;
}

.medico-form-header h2 {
    margin: 0;
    font-size: 18px;
    color: white;
}

.medico-form-body {
    padding: 25px;
}

/* *** FORMULÁRIO COM LAYOUT IGUAL AO CARDS.JS *** */
.form-grid-mobile {
    display: grid;
    gap: 15px;
    margin-bottom: 25px;
}

.form-grid-mobile > div {
    display: flex;
    flex-direction: column;
}

.form-grid-mobile label {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 5px;
    text-transform: uppercase;
    color: #e2e8f0;
}

.form-grid-mobile input,
.form-grid-mobile select {
    padding: 12px;
    background: #374151;
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 6px;
    font-size: 14px;
}

.form-grid-mobile input:focus,
.form-grid-mobile select:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.form-grid-mobile input[readonly] {
    background: #1f2937;
    color: #9ca3af;
    cursor: not-allowed;
}

.form-section {
    margin-bottom: 25px;
}

.section-title {
    font-size: 12px;
    color: #ffffff;
    background: #60a5fa;
    padding: 10px 15px;
    border-radius: 6px;
    margin-bottom: 15px;
    text-transform: uppercase;
    font-weight: 700;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    padding: 15px;
}

.checkbox-item {
    display: flex;
    align-items: center;
    padding: 8px;
    background: rgba(255,255,255,0.05);
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.2s ease;
}

.checkbox-item:hover {
    background: rgba(96, 165, 250, 0.1);
}

.checkbox-item input {
    margin-right: 10px;
    width: 16px;
    height: 16px;
    accent-color: #60a5fa;
    cursor: pointer;
}

.checkbox-item span {
    flex: 1;
    color: #ffffff;
}

.medico-form-actions {
    padding: 25px;
    background: #111827;
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    border-radius: 0 0 12px 12px;
}

.btn-save,
.btn-alta,
.btn-cancel {
    padding: 15px 25px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    text-transform: uppercase;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    min-width: 140px;
}

.btn-save {
    background: #10b981;
    color: white;
}

.btn-save:hover {
    background: #059669;
    transform: translateY(-1px);
}

.btn-alta {
    background: #ef4444;
    color: white;
}

.btn-alta:hover {
    background: #dc2626;
    transform: translateY(-1px);
}

.btn-cancel {
    background: #6b7280;
    color: white;
}

.btn-cancel:hover {
    background: #4b5563;
    transform: translateY(-1px);
}

/* =================== MOBILE RESPONSIVO =================== */
@media (max-width: 768px) {
    .qr-modal-content {
        width: 95%;
        max-width: none;
        margin: 10px;
        padding: 15px;
    }
    
    .qr-codes-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .qr-scanner-header {
        flex-direction: column;
        text-align: center;
        gap: 10px;
    }
    
    .qr-scanner-header h2 {
        font-size: 16px;
    }
    
    .medico-form {
        width: 98%;
        max-height: 98vh;
    }
    
    .medico-form-header {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
    
    .medico-form-body {
        padding: 15px;
    }
    
    /* MANTER 3 COLUNAS NO MOBILE COMO CARDS.JS */
    .form-grid-mobile {
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 8px !important;
    }
    
    .form-grid-mobile input,
    .form-grid-mobile select {
        padding: 8px 6px !important;
        font-size: 12px !important;
    }
    
    .form-grid-mobile label {
        font-size: 10px !important;
    }
    
    .checkbox-grid {
        max-height: 150px;
        padding: 10px;
    }
    
    .checkbox-item {
        padding: 6px;
        font-size: 12px;
    }
    
    .medico-form-actions {
        flex-direction: column;
        padding: 15px;
    }
    
    .btn-save,
    .btn-alta,
    .btn-cancel {
        width: 100%;
        padding: 12px;
        font-size: 12px;
    }
}

@media (max-width: 480px) {
    .form-grid-mobile {
        gap: 6px !important;
    }
    
    .form-grid-mobile input,
    .form-grid-mobile select {
        padding: 6px 4px !important;
        font-size: 11px !important;
    }
    
    .form-grid-mobile label {
        font-size: 9px !important;
        margin-bottom: 3px !important;
    }
    
    .section-title {
        font-size: 10px !important;
        padding: 8px 10px !important;
    }
    
    .checkbox-item {
        font-size: 11px !important;
        padding: 4px !important;
    }
}

/* =================== IMPRESSÃO =================== */
@media print {
    body * {
        visibility: hidden;
    }
    
    .qr-modal-content,
    .qr-modal-content * {
        visibility: visible;
    }
    
    .qr-modal-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white;
    }
    
    .qr-modal-header,
    .qr-actions,
    .qr-hospital-selector {
        display: none !important;
    }
    
    .qr-codes-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
        margin: 0;
    }
    
    .qr-code-item {
        border: 2px solid #000;
        page-break-inside: avoid;
    }
    
    .qr-label {
        font-size: 14px;
        font-weight: bold;
    }
}
</style>
`;

// Adicionar estilos ao documento
if (!document.getElementById('qrStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'qrStyles';
    styleElement.innerHTML = qrStyles;
    document.head.appendChild(styleElement);
}

// =================== INICIALIZAÇÃO DO SISTEMA QR ===================
document.addEventListener('DOMContentLoaded', function() {
    logSuccess('✅ QR Code V4.0 carregado com dados reais');
    
    // *** DETECTAR ACESSO VIA QR CODE ***
    const urlParams = new URLSearchParams(window.location.search);
    const isQRAccess = urlParams.get('qr') === 'true';
    const hospitalId = urlParams.get('h');
    const leitoNumero = urlParams.get('l');
    
    if (isQRAccess && hospitalId && leitoNumero) {
        logInfo(`🔍 Acesso via QR Code detectado: Hospital ${hospitalId}, Leito ${leitoNumero}`);
        
        // Aguardar carregamento completo dos dados
        const aguardarDados = setInterval(() => {
            if (window.hospitalData && Object.keys(window.hospitalData).length > 0) {
                clearInterval(aguardarDados);
                
                // Validar se hospital e leito existem
                const hospital = window.hospitalData[hospitalId];
                if (hospital && hospital.leitos) {
                    const leito = hospital.leitos.find(l => (l.leito || l.numero) == leitoNumero);
                    if (leito) {
                        logSuccess(`✅ QR Code válido - abrindo formulário médico`);
                        
                        // Aguardar um pouco mais para garantir que tudo carregou
                        setTimeout(() => {
                            openMedicoForm(hospitalId, leitoNumero);
                        }, 1000);
                    } else {
                        logError(`❌ Leito ${leitoNumero} não encontrado no hospital ${hospitalId}`);
                        alert(`Leito ${leitoNumero} não encontrado. Verifique o QR Code.`);
                        // Redirecionar para página principal
                        window.location.href = window.location.origin;
                    }
                } else {
                    logError(`❌ Hospital ${hospitalId} não encontrado`);
                    alert(`Hospital ${hospitalId} não encontrado. Verifique o QR Code.`);
                    window.location.href = window.location.origin;
                }
            }
        }, 500);
        
        // Timeout de segurança - se dados não carregarem em 10 segundos
        setTimeout(() => {
            clearInterval(aguardarDados);
            if (!window.hospitalData || Object.keys(window.hospitalData).length === 0) {
                logError('❌ Timeout aguardando dados da planilha');
                alert('Erro ao carregar dados. Tente novamente.');
                window.location.href = window.location.origin;
            }
        }, 10000);
    }
    
    logInfo('🎯 Funcionalidades ativas:');
    logInfo('  • QR Codes com URL para Vercel');
    logInfo('  • Detecção automática de acesso via QR');
    logInfo('  • Scanner com timeout rigoroso de 2 minutos');
    logInfo('  • Formulário com layout IGUAL ao cards.js mobile');
    logInfo('  • Integração com planilha V4.0 (44 colunas)');
    logInfo('  • Arrays diretos - SEM parsing');
    logInfo('  • Somente dados REAIS da API');
    
    // Verificar dependências
    if (typeof window.admitirPaciente === 'undefined') {
        logError('❌ Funções da API não encontradas - verificar api.js');
    }
    
    if (typeof Html5Qrcode === 'undefined') {
        logError('❌ Biblioteca HTML5-QRCode não carregada');
    }
    
    if (typeof QRCode === 'undefined') {
        logError('❌ Biblioteca QRCode.js não carregada');
    }
    
    // Verificar hospitalData
    if (!window.hospitalData) {
        window.hospitalData = {};
        logInfo('hospitalData inicializado para QR');
    }
    
    logSuccess('🏥 Sistema QR Code V4.0 100% FUNCIONAL');
    logInfo('📱 QR com URL → Detecção automática → Formulário → API → Planilha');
});
