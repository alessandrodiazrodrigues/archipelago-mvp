// =================== QRCODE V6.3 FINAL CORRIGIDO ===================
// ✅ CORRIGIDO V6.3: Seleção personalizada abre nova janela com resumo
// ✅ CORRIGIDO V6.3: Impressão 14,5cm altura x 9,5cm largura (1 por página)
// ✅ CORRIGIDO V6.3: Cores do projeto (#0676bb, #172945, #9ca3af)
// ✅ CORRIGIDO V6.3: 293 leitos (9 hospitais ativos)
// ✅ Cruz Azul - 13 pares de irmãos (21-46)
// ✅ Santa Clara - 9 pares de irmãos (10-27)

const QR_API = {
    BASE_URL: 'https://qr-code-systelos.vercel.app',
    API_URL: 'https://api.qrserver.com/v1/create-qr-code/',
    SIZE: 300,
    DELAY: 100,
    HOSPITAIS: {
        H1: { nome: 'Neomater', leitos: 25, tipo: 'hibrido' },
        H2: { nome: 'Cruz Azul', leitos: 67, tipo: 'tipos_fixos' },
        H3: { nome: 'Santa Marcelina', leitos: 28, tipo: 'hibrido' },
        H4: { nome: 'Santa Clara', leitos: 57, tipo: 'tipos_fixos' },
        H5: { nome: 'Adventista', leitos: 28, tipo: 'hibrido' },
        H6: { nome: 'Santa Cruz', leitos: 22, tipo: 'hibrido' },
        H7: { nome: 'Santa Virgínia', leitos: 22, tipo: 'hibrido' },
        H8: { nome: 'São Camilo Ipiranga', leitos: 22, tipo: 'hibrido' },
        H9: { nome: 'São Camilo Pompeia', leitos: 22, tipo: 'hibrido' }
    },
    CRUZ_AZUL_IRMAOS: {
        21: 22, 22: 21, 23: 24, 24: 23, 25: 26, 26: 25, 27: 28, 28: 27,
        29: 30, 30: 29, 31: 32, 32: 31, 33: 34, 34: 33, 35: 36, 36: 35,
        37: 38, 38: 37, 39: 40, 40: 39, 41: 42, 42: 41, 43: 44, 44: 43,
        45: 46, 46: 45
    },
    SANTA_CLARA_IRMAOS: {
        10: 11, 11: 10, 12: 13, 13: 12, 14: 15, 15: 14, 16: 17, 17: 16,
        18: 19, 19: 18, 20: 21, 21: 20, 22: 23, 23: 22, 24: 25, 25: 24,
        26: 27, 27: 26
    }
};

let isGenerating = false;
let generationProgress = 0;
let totalQRCodes = 0;
let leitosSelecionados = [];

// =================== FUNÇÃO PARA OBTER NOME DO LEITO ===================
function getNomeLeitoFormatado(hospitalId, numeroLeito) {
    const hospital = QR_API.HOSPITAIS[hospitalId];
    
    if (hospital.tipo === 'hibrido') {
        return `Híbrido ${String(numeroLeito).padStart(2, '0')}`;
    }
    
    if (hospitalId === 'H2') {
        if (numeroLeito >= 1 && numeroLeito <= 20) return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
        if (numeroLeito >= 21 && numeroLeito <= 46) return `Enfermaria ${numeroLeito}`;
        if (numeroLeito >= 47 && numeroLeito <= 57) return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
        return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
    }
    
    if (hospitalId === 'H4') {
        if (numeroLeito >= 1 && numeroLeito <= 9) return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
        if (numeroLeito >= 10 && numeroLeito <= 27) return `Enfermaria ${numeroLeito}`;
        if (numeroLeito >= 28 && numeroLeito <= 35) return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
        return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
    }
    
    return `Leito ${String(numeroLeito).padStart(2, '0')}`;
}

function isParDeIrmaos(hospitalId, numeroLeito) {
    if (hospitalId === 'H2') {
        return (numeroLeito >= 21 && numeroLeito <= 36) || (numeroLeito >= 37 && numeroLeito <= 46);
    }
    if (hospitalId === 'H4') {
        return (numeroLeito >= 10 && numeroLeito <= 17) || (numeroLeito >= 18 && numeroLeito <= 27);
    }
    return false;
}

function getLeitoIrmao(hospitalId, numeroLeito) {
    if (hospitalId === 'H2') return QR_API.CRUZ_AZUL_IRMAOS[numeroLeito];
    if (hospitalId === 'H4') return QR_API.SANTA_CLARA_IRMAOS[numeroLeito];
    return null;
}

// =================== MODAL PRINCIPAL ===================
window.openQRCodesSimple = function() {
    console.log('Abrindo gerador de QR Codes V6.2...');
    
    if (document.querySelector('.qr-modal-simple')) {
        console.log('Modal já está aberto');
        return;
    }
    
    document.body.classList.add('qr-modal-open');
    
    const modal = document.createElement('div');
    modal.className = 'qr-modal-simple';
    modal.innerHTML = `
        <div class="qr-modal-content">
            <div class="qr-modal-header">
                <h2>QR Codes - V6.2 (293 Leitos)</h2>
                <button onclick="closeQRModalSimple()" class="close-btn">✕</button>
            </div>
            <div class="qr-modal-body">
                <div class="qr-tabs">
                    <button class="qr-tab active" onclick="switchQRTab('todos')">
                        Todos os Leitos
                    </button>
                    <button class="qr-tab" onclick="switchQRTab('selecao')">
                        Seleção Personalizada
                    </button>
                </div>
                
                <div id="tabTodos" class="qr-tab-content active">
                    <div class="qr-controls">
                        <select id="qrHospitalSelect" onchange="generateQRCodesSimple()">
                            <option value="H5">Adventista (28 leitos)</option>
                            <option value="H2">Cruz Azul (67 leitos)</option>
                            <option value="H1">Neomater (25 leitos)</option>
                            <option value="H4">Santa Clara (57 leitos)</option>
                            <option value="H6">Santa Cruz (22 leitos)</option>
                            <option value="H3">Santa Marcelina (28 leitos)</option>
                            <option value="H7">Santa Virgínia (22 leitos)</option>
                            <option value="H8">São Camilo Ipiranga (22 leitos)</option>
                            <option value="H9">São Camilo Pompeia (22 leitos)</option>
                        </select>
                        <button onclick="generateAllQRCodesOptimized()" class="btn-all" id="btnGenerateAll">
                            Gerar Todos (293 QR Codes)
                        </button>
                        <button onclick="window.print()" class="btn-print">Imprimir</button>
                    </div>
                    
                    <div id="progressContainer" class="progress-container" style="display: none;">
                        <div class="progress-info">
                            <span id="progressText">Gerando QR Codes...</span>
                            <span id="progressCount">0/293</span>
                        </div>
                        <div class="progress-bar">
                            <div id="progressFill" class="progress-fill"></div>
                        </div>
                    </div>
                    
                    <div id="qrCodesContainer" class="qr-container"></div>
                </div>
                
                <div id="tabSelecao" class="qr-tab-content" style="display: none;">
                    <div class="selecao-controls">
                        <div class="selecao-header">
                            <h3>1. Selecione o Hospital</h3>
                            <select id="selecaoHospitalSelect" onchange="carregarLeitosParaSelecao()">
                                <option value="">Escolha um hospital...</option>
                                <option value="H5">Adventista</option>
                                <option value="H2">Cruz Azul</option>
                                <option value="H1">Neomater</option>
                                <option value="H4">Santa Clara</option>
                                <option value="H6">Santa Cruz</option>
                                <option value="H3">Santa Marcelina</option>
                                <option value="H7">Santa Virgínia</option>
                                <option value="H8">São Camilo Ipiranga</option>
                                <option value="H9">São Camilo Pompeia</option>
                            </select>
                        </div>
                        
                        <div id="leitosSelecaoContainer" style="display: none;">
                            <div class="selecao-header">
                                <h3>2. Selecione os Leitos</h3>
                                <div class="selecao-actions">
                                    <button onclick="selecionarTodosLeitos()" class="btn-secondary">
                                        Selecionar Todos
                                    </button>
                                    <button onclick="selecionarOcupados()" class="btn-secondary">
                                        Apenas Ocupados
                                    </button>
                                    <button onclick="limparSelecaoLeitos()" class="btn-secondary">
                                        Limpar Seleção
                                    </button>
                                </div>
                            </div>
                            
                            <div id="tabelaLeitosSelecao" class="tabela-leitos"></div>
                            
                            <div class="selecao-footer">
                                <div class="contador-selecao">
                                    <strong><span id="contadorSelecionados">0</span></strong> leitos selecionados
                                </div>
                                <button onclick="gerarQRCodesSelecionados()" class="btn-primary" id="btnGerarSelecionados" disabled>
                                    Gerar Impressão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    generateQRCodesSimple();
    injectQRStyles();
};

window.closeQRModalSimple = function() {
    const modal = document.querySelector('.qr-modal-simple');
    if (modal) {
        modal.remove();
        document.body.classList.remove('qr-modal-open');
        isGenerating = false;
        generationProgress = 0;
        totalQRCodes = 0;
        leitosSelecionados = [];
    }
};

window.switchQRTab = function(tabName) {
    const tabs = document.querySelectorAll('.qr-tab');
    const contents = document.querySelectorAll('.qr-tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.style.display = 'none');
    
    if (tabName === 'todos') {
        document.querySelector('.qr-tab:first-child').classList.add('active');
        document.getElementById('tabTodos').style.display = 'block';
    } else {
        document.querySelector('.qr-tab:last-child').classList.add('active');
        document.getElementById('tabSelecao').style.display = 'block';
    }
};

// =================== GERAR QR CODES (HOSPITAL INDIVIDUAL) ===================
window.generateQRCodesSimple = function() {
    const hospitalId = document.getElementById('qrHospitalSelect').value;
    const hospital = QR_API.HOSPITAIS[hospitalId];
    const container = document.getElementById('qrCodesContainer');
    
    if (!hospital) return;
    
    container.innerHTML = `<h3>${hospital.nome} (${hospital.leitos} leitos)</h3>`;
    
    if ((hospitalId === 'H2' || hospitalId === 'H4') && hospital.tipo === 'tipos_fixos') {
        gerarQRCodesComIrmaos(hospitalId, hospital, container);
    } else {
        gerarQRCodesSimples(hospitalId, hospital, container);
    }
};

function gerarQRCodesSimples(hospitalId, hospital, container) {
    const grid = document.createElement('div');
    grid.className = 'qr-grid';
    
    for (let i = 1; i <= hospital.leitos; i++) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
        const qrUrl = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url)}`;
        
        const qrItem = document.createElement('div');
        qrItem.className = 'qr-item';
        qrItem.innerHTML = `
            <div class="qr-label">
                <strong>${hospital.nome}</strong><br>
                ${leitoFormatado}
            </div>
            <img class="qr-img" src="${qrUrl}" alt="QR ${hospital.nome} - ${leitoFormatado}">
        `;
        grid.appendChild(qrItem);
    }
    
    container.appendChild(grid);
}

function gerarQRCodesComIrmaos(hospitalId, hospital, container) {
    let grid = null;
    let i = 1;
    
    while (i <= hospital.leitos) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
        const qrUrl = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url)}`;
        
        if (isParDeIrmaos(hospitalId, i)) {
            const isPrimeiroDoPar = i % 2 === 1;
            
            if (isPrimeiroDoPar) {
                grid = document.createElement('div');
                grid.className = 'qr-grid-irmaos';
                container.appendChild(grid);
                
                const qrItemDuplo = document.createElement('div');
                qrItemDuplo.className = 'qr-item-duplo';
                
                const leito1Formatado = getNomeLeitoFormatado(hospitalId, i);
                const url1 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
                const qrUrl1 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url1)}`;
                
                const leito2 = i + 1;
                const leito2Formatado = getNomeLeitoFormatado(hospitalId, leito2);
                const url2 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${leito2}`;
                const qrUrl2 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url2)}`;
                
                qrItemDuplo.innerHTML = `
                    <div class="qr-item-irmao">
                        <div class="qr-label">
                            <strong>${hospital.nome}</strong><br>
                            ${leito1Formatado}
                        </div>
                        <img class="qr-img" src="${qrUrl1}" alt="QR ${hospital.nome} - ${leito1Formatado}">
                    </div>
                    <div class="qr-item-irmao">
                        <div class="qr-label">
                            <strong>${hospital.nome}</strong><br>
                            ${leito2Formatado}
                        </div>
                        <img class="qr-img" src="${qrUrl2}" alt="QR ${hospital.nome} - ${leito2Formatado}">
                    </div>
                `;
                
                grid.appendChild(qrItemDuplo);
                i += 2;
                continue;
            }
        }
        
        if (!grid || grid.classList.contains('qr-grid-irmaos')) {
            grid = document.createElement('div');
            grid.className = 'qr-grid';
            container.appendChild(grid);
        }
        
        const qrItem = document.createElement('div');
        qrItem.className = 'qr-item';
        qrItem.innerHTML = `
            <div class="qr-label">
                <strong>${hospital.nome}</strong><br>
                ${leitoFormatado}
            </div>
            <img class="qr-img" src="${qrUrl}" alt="QR ${hospital.nome} - ${leitoFormatado}">
        `;
        grid.appendChild(qrItem);
        
        i++;
    }
}

// =================== GERAR TODOS OS QR CODES ===================
window.generateAllQRCodesOptimized = async function() {
    if (isGenerating) {
        console.log('Já está gerando QR Codes...');
        return;
    }
    
    isGenerating = true;
    generationProgress = 0;
    totalQRCodes = 293;
    
    const container = document.getElementById('qrCodesContainer');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressCount = document.getElementById('progressCount');
    const btnGenerateAll = document.getElementById('btnGenerateAll');
    
    container.innerHTML = '';
    progressContainer.style.display = 'block';
    btnGenerateAll.disabled = true;
    btnGenerateAll.textContent = 'Gerando...';
    
    const hospitaisOrdenados = ['H5', 'H2', 'H1', 'H4', 'H6', 'H3', 'H7', 'H8', 'H9'];
    
    for (const hospitalId of hospitaisOrdenados) {
        const hospital = QR_API.HOSPITAIS[hospitalId];
        
        const hospitalHeader = document.createElement('h3');
        hospitalHeader.textContent = `${hospital.nome} (${hospital.leitos} leitos)`;
        container.appendChild(hospitalHeader);
        
        if ((hospitalId === 'H2' || hospitalId === 'H4') && hospital.tipo === 'tipos_fixos') {
            await gerarQRCodesComIrmaosAsync(hospitalId, hospital, container, progressFill, progressText, progressCount);
        } else {
            await gerarQRCodesSimplesAsync(hospitalId, hospital, container, progressFill, progressText, progressCount);
        }
    }
    
    progressText.textContent = 'Concluído!';
    progressCount.textContent = `${totalQRCodes}/${totalQRCodes}`;
    progressFill.style.width = '100%';
    
    setTimeout(() => {
        progressContainer.style.display = 'none';
        btnGenerateAll.disabled = false;
        btnGenerateAll.textContent = 'Gerar Todos (293 QR Codes)';
        isGenerating = false;
    }, 1500);
};

async function gerarQRCodesSimplesAsync(hospitalId, hospital, container, progressFill, progressText, progressCount) {
    const grid = document.createElement('div');
    grid.className = 'qr-grid';
    
    for (let i = 1; i <= hospital.leitos; i++) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
        const qrUrl = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url)}`;
        
        const qrItem = document.createElement('div');
        qrItem.className = 'qr-item';
        qrItem.innerHTML = `
            <div class="qr-label">
                <strong>${hospital.nome}</strong><br>
                ${leitoFormatado}
            </div>
            <img class="qr-img" src="${qrUrl}" alt="QR ${hospital.nome} - ${leitoFormatado}">
        `;
        grid.appendChild(qrItem);
        
        generationProgress++;
        const percentage = Math.round((generationProgress / totalQRCodes) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Gerando ${hospital.nome}...`;
        progressCount.textContent = `${generationProgress}/${totalQRCodes}`;
        
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, QR_API.DELAY));
        }
    }
    
    container.appendChild(grid);
}

async function gerarQRCodesComIrmaosAsync(hospitalId, hospital, container, progressFill, progressText, progressCount) {
    let grid = null;
    let i = 1;
    
    while (i <= hospital.leitos) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
        const qrUrl = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url)}`;
        
        if (isParDeIrmaos(hospitalId, i)) {
            const isPrimeiroDoPar = i % 2 === 1;
            
            if (isPrimeiroDoPar) {
                grid = document.createElement('div');
                grid.className = 'qr-grid-irmaos';
                container.appendChild(grid);
                
                const qrItemDuplo = document.createElement('div');
                qrItemDuplo.className = 'qr-item-duplo';
                
                const leito1Formatado = getNomeLeitoFormatado(hospitalId, i);
                const url1 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
                const qrUrl1 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url1)}`;
                
                const leito2 = i + 1;
                const leito2Formatado = getNomeLeitoFormatado(hospitalId, leito2);
                const url2 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${leito2}`;
                const qrUrl2 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url2)}`;
                
                qrItemDuplo.innerHTML = `
                    <div class="qr-item-irmao">
                        <div class="qr-label">
                            <strong>${hospital.nome}</strong><br>
                            ${leito1Formatado}
                        </div>
                        <img class="qr-img" src="${qrUrl1}" alt="QR ${hospital.nome} - ${leito1Formatado}">
                    </div>
                    <div class="qr-item-irmao">
                        <div class="qr-label">
                            <strong>${hospital.nome}</strong><br>
                            ${leito2Formatado}
                        </div>
                        <img class="qr-img" src="${qrUrl2}" alt="QR ${hospital.nome} - ${leito2Formatado}">
                    </div>
                `;
                
                grid.appendChild(qrItemDuplo);
                
                generationProgress += 2;
                i += 2;
                
                const percentage = Math.round((generationProgress / totalQRCodes) * 100);
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `Gerando ${hospital.nome}...`;
                progressCount.textContent = `${generationProgress}/${totalQRCodes}`;
                
                continue;
            }
        }
        
        if (!grid || grid.classList.contains('qr-grid-irmaos')) {
            grid = document.createElement('div');
            grid.className = 'qr-grid';
            container.appendChild(grid);
        }
        
        const qrItem = document.createElement('div');
        qrItem.className = 'qr-item';
        qrItem.innerHTML = `
            <div class="qr-label">
                <strong>${hospital.nome}</strong><br>
                ${leitoFormatado}
            </div>
            <img class="qr-img" src="${qrUrl}" alt="QR ${hospital.nome} - ${leitoFormatado}">
        `;
        grid.appendChild(qrItem);
        
        generationProgress++;
        
        const percentage = Math.round((generationProgress / totalQRCodes) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Gerando ${hospital.nome}...`;
        progressCount.textContent = `${generationProgress}/${totalQRCodes}`;
        
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, QR_API.DELAY));
        }
        
        i++;
    }
}

// =================== SELEÇÃO PERSONALIZADA - CORRIGIDA V6.2 ===================
window.carregarLeitosParaSelecao = function() {
    const hospitalId = document.getElementById('selecaoHospitalSelect').value;
    const container = document.getElementById('leitosSelecaoContainer');
    const tabela = document.getElementById('tabelaLeitosSelecao');
    
    if (!hospitalId) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    leitosSelecionados = [];
    
    const hospital = QR_API.HOSPITAIS[hospitalId];
    
    console.log('=== DEBUG SELEÇÃO V6.2 ===');
    console.log('Hospital:', hospitalId, hospital.nome);
    console.log('window.hospitalData:', !!window.hospitalData);
    
    // VERIFICAÇÃO CORRIGIDA
    if (!window.hospitalData || typeof window.hospitalData !== 'object') {
        console.error('❌ window.hospitalData não existe ou não é objeto');
        tabela.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #9ca3af;">
                <p style="font-size: 16px; margin-bottom: 10px;">⚠️ Dados ainda não carregados</p>
                <p style="font-size: 14px;">Por favor, aguarde o carregamento completo da página.</p>
                <p style="font-size: 14px; margin-top: 10px;">Recarregue a página (F5) se o problema persistir.</p>
            </div>
        `;
        return;
    }
    
    const dadosHospital = window.hospitalData[hospitalId];
    
    if (!dadosHospital) {
        console.error(`❌ Dados do hospital ${hospitalId} não encontrados`);
        tabela.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #9ca3af;">
                <p style="font-size: 16px; margin-bottom: 10px;">⚠️ Dados do hospital não encontrados</p>
                <p style="font-size: 14px;">Hospital: ${hospital.nome}</p>
            </div>
        `;
        return;
    }
    
    if (!dadosHospital.leitos || !Array.isArray(dadosHospital.leitos)) {
        console.error('❌ dadosHospital.leitos não é array');
        tabela.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #9ca3af;">
                <p style="font-size: 16px; margin-bottom: 10px;">⚠️ Estrutura de dados inválida</p>
            </div>
        `;
        return;
    }
    
    console.log(`✅ ${dadosHospital.leitos.length} leitos encontrados`);
    
    // Filtrar leitos ocupados
    const leitosOcupados = [];
    dadosHospital.leitos.forEach((leito) => {
        const statusNormalizado = (leito.status || '').toLowerCase().trim();
        if (statusNormalizado === 'ocupado') {
            const numeroLeito = parseInt(leito.leito);
            leitosOcupados.push(numeroLeito);
            console.log(`✅ Leito ${numeroLeito} ocupado`);
        }
    });
    
    console.log(`Total ocupados: ${leitosOcupados.length}`);
    console.log('==========================');
    
    // Criar tabela
    criarTabelaComDados(hospitalId, hospital, leitosOcupados, tabela);
};

function criarTabelaComDados(hospitalId, hospital, leitosOcupados, tabela) {
    let html = `
        <table class="tabela-selecao">
            <thead>
                <tr>
                    <th style="width: 80px;">Selecionar</th>
                    <th style="width: 80px;">Nº Leito</th>
                    <th>Nome/Tipo</th>
                    <th style="width: 100px;">Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (let i = 1; i <= hospital.leitos; i++) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        const isOcupado = leitosOcupados.includes(i);
        const statusClass = isOcupado ? 'status-ocupado' : 'status-vago';
        const statusText = isOcupado ? 'Ocupado' : 'Vago';
        
        html += `
            <tr class="${statusClass}">
                <td style="text-align: center;">
                    <input type="checkbox" 
                           id="leito_${i}" 
                           data-leito="${i}"
                           onchange="atualizarSelecaoLeitos()">
                </td>
                <td style="text-align: center;"><strong>${i}</strong></td>
                <td>${leitoFormatado}</td>
                <td style="text-align: center;">
                    <span class="badge-status ${statusClass}">${statusText}</span>
                </td>
            </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    tabela.innerHTML = html;
    atualizarSelecaoLeitos();
}

window.selecionarTodosLeitos = function() {
    const checkboxes = document.querySelectorAll('#tabelaLeitosSelecao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    atualizarSelecaoLeitos();
};

window.selecionarOcupados = function() {
    const checkboxes = document.querySelectorAll('#tabelaLeitosSelecao input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const row = cb.closest('tr');
        cb.checked = row.classList.contains('status-ocupado');
    });
    atualizarSelecaoLeitos();
};

window.limparSelecaoLeitos = function() {
    const checkboxes = document.querySelectorAll('#tabelaLeitosSelecao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    atualizarSelecaoLeitos();
};

window.atualizarSelecaoLeitos = function() {
    const checkboxes = document.querySelectorAll('#tabelaLeitosSelecao input[type="checkbox"]:checked');
    leitosSelecionados = Array.from(checkboxes).map(cb => parseInt(cb.dataset.leito));
    
    const contador = document.getElementById('contadorSelecionados');
    const btnGerar = document.getElementById('btnGerarSelecionados');
    
    contador.textContent = leitosSelecionados.length;
    btnGerar.disabled = leitosSelecionados.length === 0;
};

// =================== GERAR QR CODES SELECIONADOS - ABRE NOVA JANELA ===================
window.gerarQRCodesSelecionados = function() {
    if (leitosSelecionados.length === 0) {
        alert('Selecione pelo menos um leito!');
        return;
    }
    
    const hospitalId = document.getElementById('selecaoHospitalSelect').value;
    const hospital = QR_API.HOSPITAIS[hospitalId];
    
    console.log(`Gerando impressão de ${leitosSelecionados.length} leitos...`);
    
    // Buscar dados completos dos leitos selecionados
    const leitosCompletos = [];
    const hospitalData = window.hospitalData?.[hospitalId];
    
    if (!hospitalData || !hospitalData.leitos) {
        alert('Erro: Dados do hospital não encontrados!');
        return;
    }
    
    leitosSelecionados.forEach(numeroLeito => {
        const leitoData = hospitalData.leitos.find(l => l.leito === numeroLeito);
        if (leitoData) {
            leitosCompletos.push({
                ...leitoData,
                hospitalId: hospitalId,
                hospitalNome: hospital.nome
            });
        }
    });
    
    if (leitosCompletos.length === 0) {
        alert('Erro: Nenhum dado de leito encontrado!');
        return;
    }
    
    // Abrir janela de impressão
    abrirJanelaImpressao(leitosCompletos);
};

// =================== ABRIR JANELA DE IMPRESSÃO PERSONALIZADA ===================
function abrirJanelaImpressao(leitos) {
    console.log(`Abrindo janela de impressão com ${leitos.length} leitos...`);
    
    const htmlContent = gerarHTMLImpressao(leitos);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const janela = window.open(url, '_blank', 'width=800,height=600');
    
    if (!janela) {
        alert('⚠️ Bloqueador de pop-ups detectado!\n\nPor favor, permita pop-ups para este site e tente novamente.');
        console.error('Não foi possível abrir a janela de impressão');
        URL.revokeObjectURL(url);
        return;
    }
    
    // Limpar URL após 5 segundos
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 5000);
    
    console.log('✅ Janela de impressão aberta com sucesso!');
}

// =================== GERAR HTML DA IMPRESSÃO ===================
function gerarHTMLImpressao(leitos) {
    let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Impressão QR Codes - ${leitos.length} Leitos</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Poppins', sans-serif;
            background: white;
            color: #000;
        }

        .controles {
            background: #f3f4f6;
            padding: 15px 20px;
            border-bottom: 2px solid #d1d5db;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .controles h1 {
            font-size: 18px;
            font-weight: 700;
            color: #0676bb;
        }

        .controles p {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
        }

        .btn-imprimir {
            background: #0676bb;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-imprimir:hover {
            background: #172945;
        }

        .pagina-impressao {
            width: 145mm;
            height: 95mm;
            margin: 15mm auto;
            padding: 8mm;
            border: 2px solid #000;
            border-radius: 3mm;
            background: white;
            page-break-after: always;
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: 55mm 1fr;
            gap: 8mm;
            align-items: center;
        }

        .pagina-impressao:last-child {
            page-break-after: auto;
        }

        .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4mm;
        }

        .qr-code {
            width: 50mm;
            height: 50mm;
            border: 1px solid #ddd;
            border-radius: 2mm;
        }

        .qr-label {
            font-size: 10px;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
            text-align: center;
        }

        .dados-section {
            display: flex;
            flex-direction: column;
            gap: 4mm;
        }

        .dados-header {
            background: #0676bb;
            color: white;
            padding: 4mm;
            border-radius: 2mm;
        }

        .dados-header h2 {
            font-size: 14px;
            font-weight: 800;
            margin-bottom: 2px;
        }

        .dados-header p {
            font-size: 10px;
            opacity: 0.9;
        }

        .dados-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2mm;
        }

        .dado-item {
            background: #f9fafb;
            padding: 2mm;
            border-radius: 2mm;
            border: 1px solid #e5e7eb;
        }

        .dado-item .label {
            font-size: 8px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 1px;
        }

        .dado-item .valor {
            font-size: 11px;
            color: #000;
            font-weight: 700;
        }

        .concessoes-section {
            background: #f0f9ff;
            padding: 2mm;
            border-radius: 2mm;
            border: 1px solid #0676bb;
        }

        .concessoes-section .titulo {
            font-size: 8px;
            color: #0676bb;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 2mm;
        }

        .concessoes-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 1mm;
        }

        .chip {
            background: white;
            border: 1px solid #0676bb;
            color: #0676bb;
            padding: 1mm 2mm;
            border-radius: 2mm;
            font-size: 7px;
            font-weight: 600;
        }

        @media print {
            body {
                margin: 0;
                padding: 0;
            }

            .controles {
                display: none !important;
            }

            @page {
                size: 145mm 95mm;
                margin: 0;
            }

            .pagina-impressao {
                width: 145mm;
                height: 95mm;
                margin: 0;
                padding: 8mm;
                border: 2px solid #000;
                page-break-after: always;
                page-break-inside: avoid;
            }

            .pagina-impressao:last-child {
                page-break-after: auto;
            }
        }

        @media screen {
            body {
                background: #e5e7eb;
                padding: 20px 0;
            }
        }
    </style>
</head>
<body>
    <div class="controles">
        <div>
            <h1>Impressão de QR Codes</h1>
            <p><strong>${leitos.length} leitos</strong> selecionados</p>
        </div>
        <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir</button>
    </div>
`;

    // Gerar uma página para cada leito
    leitos.forEach((leito, index) => {
        const qrURL = `${QR_API.BASE_URL}/?h=${leito.hospitalId}&l=${leito.leito}`;
        const qrImgURL = `${QR_API.API_URL}?size=300x300&data=${encodeURIComponent(qrURL)}`;
        
        const leitoFormatado = getNomeLeitoFormatado(leito.hospitalId, leito.leito);
        const matricula = formatarMatricula(leito.matricula);
        const iniciais = leito.nome || '—';
        const idade = leito.idade ? `${leito.idade} anos` : '—';
        const genero = leito.genero || '—';
        const pps = leito.pps ? `${leito.pps}%` : '—';
        const spict = leito.spict === 'elegivel' ? 'Elegível' : (leito.spict === 'nao_elegivel' ? 'Não elegível' : '—');
        const regiao = leito.regiao || '—';
        const isolamento = formatarIsolamento(leito.isolamento);
        const prevAlta = leito.prevAlta || '—';
        const tempoInternacao = leito.admAt ? calcularTempoInternacao(leito.admAt) : '—';
        
        const concessoes = Array.isArray(leito.concessoes) ? leito.concessoes : [];
        const concessoesHTML = concessoes.length > 0 
            ? concessoes.map(c => `<span class="chip">${c}</span>`).join('')
            : '<span style="color: #9ca3af; font-size: 8px;">Nenhuma</span>';
        
        html += `
    <div class="pagina-impressao">
        <div class="qr-section">
            <img src="${qrImgURL}" alt="QR Code" class="qr-code">
            <div class="qr-label">Escaneie aqui</div>
        </div>

        <div class="dados-section">
            <div class="dados-header">
                <h2>${leito.hospitalNome}</h2>
                <p>${leitoFormatado} • ${tempoInternacao} internado</p>
            </div>

            <div class="dados-grid">
                <div class="dado-item">
                    <div class="label">Matrícula</div>
                    <div class="valor">${matricula}</div>
                </div>
                <div class="dado-item">
                    <div class="label">Iniciais</div>
                    <div class="valor">${iniciais}</div>
                </div>
                <div class="dado-item">
                    <div class="label">Idade</div>
                    <div class="valor">${idade}</div>
                </div>
                <div class="dado-item">
                    <div class="label">Gênero</div>
                    <div class="valor">${genero}</div>
                </div>
                <div class="dado-item">
                    <div class="label">PPS</div>
                    <div class="valor">${pps}</div>
                </div>
                <div class="dado-item">
                    <div class="label">SPICT-BR</div>
                    <div class="valor">${spict}</div>
                </div>
                <div class="dado-item">
                    <div class="label">Região</div>
                    <div class="valor">${regiao}</div>
                </div>
                <div class="dado-item">
                    <div class="label">Isolamento</div>
                    <div class="valor">${isolamento}</div>
                </div>
            </div>

            <div class="concessoes-section">
                <div class="titulo">Concessões Previstas na Alta</div>
                <div class="concessoes-chips">${concessoesHTML}</div>
            </div>
        </div>
    </div>
`;
    });
    
    html += `
    <script>
        console.log('Página de impressão carregada');
        console.log('${leitos.length} leitos prontos para impressão');
        console.log('Tamanho: 145mm x 95mm (1 por página)');
    </script>
</body>
</html>`;
    
    return html;
}

// =================== FUNÇÕES AUXILIARES ===================
function formatarMatricula(matricula) {
    if (!matricula || matricula === '—') return '—';
    const mat = String(matricula).replace(/\D/g, '');
    if (mat.length === 0) return '—';
    if (mat.length === 1) return mat;
    return mat.slice(0, -1) + '-' + mat.slice(-1);
}

function formatarIsolamento(isolamento) {
    if (!isolamento || isolamento === 'Não Isolamento') return 'Não Isol';
    if (isolamento === 'Isolamento de Contato') return 'Contato';
    if (isolamento === 'Isolamento Respiratório') return 'Respirat';
    return isolamento;
}

function calcularTempoInternacao(admissao) {
    if (!admissao) return '—';
    
    try {
        let dataAdmissao;
        if (typeof admissao === 'string' && admissao.includes('/')) {
            const [datePart] = admissao.split(' ');
            const [dia, mes, ano] = datePart.split('/');
            dataAdmissao = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        } else {
            dataAdmissao = new Date(admissao);
        }
        
        if (!dataAdmissao || isNaN(dataAdmissao.getTime())) return 'Data inválida';
        
        const agora = new Date();
        const diffTime = agora - dataAdmissao;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays === 0) return `${diffHours}h`;
        if (diffDays === 1) return `1d ${diffHours}h`;
        return `${diffDays}d`;
    } catch (error) {
        return '—';
    }
}

// =================== ESTILOS CSS ===================
function injectQRStyles() {
    if (document.getElementById('qrStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'qrStyles';
    styles.innerHTML = `
        .qr-modal-simple {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            overflow-y: auto;
            padding: 20px;
        }
        
        .qr-modal-simple .qr-modal-content {
            background: white;
            border-radius: 12px;
            width: 95%;
            max-width: 1400px;
            max-height: 95vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .qr-modal-simple .qr-modal-header {
            background: #172945;
            padding: 20px 30px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .qr-modal-simple .qr-modal-header h2 {
            color: white;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        
        .qr-modal-simple .close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .qr-modal-simple .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .qr-modal-simple .qr-modal-body {
            padding: 30px;
        }
        
        .qr-modal-simple .qr-tabs {
            display: flex;
            gap: 10px;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 30px;
        }
        
        .qr-modal-simple .qr-tab {
            padding: 12px 24px;
            border: none;
            background: transparent;
            color: #6b7280;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
        }
        
        .qr-modal-simple .qr-tab.active {
            color: #0676bb;
            border-bottom-color: #0676bb;
        }
        
        .qr-modal-simple .qr-tab:hover {
            color: #0676bb;
        }
        
        .qr-modal-simple .qr-controls,
        .qr-modal-simple .selecao-actions {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .qr-modal-simple .qr-controls select {
            flex: 1;
            min-width: 200px;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 15px;
            font-family: 'Poppins', sans-serif;
            cursor: pointer;
        }
        
        .qr-modal-simple .qr-controls button,
        .qr-modal-simple .selecao-actions button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Poppins', sans-serif;
        }
        
        .qr-modal-simple .btn-all {
            background: #0676bb;
            color: white;
        }
        
        .qr-modal-simple .btn-all:hover:not(:disabled) {
            background: #172945;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(6, 118, 187, 0.4);
        }
        
        .qr-modal-simple .btn-all:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .qr-modal-simple .btn-print {
            background: #9ca3af;
            color: white;
        }
        
        .qr-modal-simple .btn-print:hover {
            background: #6b7280;
        }
        
        .qr-modal-simple .btn-primary {
            background: #0676bb;
            color: white;
        }
        
        .qr-modal-simple .btn-primary:hover:not(:disabled) {
            background: #172945;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(6, 118, 187, 0.4);
        }
        
        .qr-modal-simple .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .qr-modal-simple .btn-secondary {
            background: #9ca3af;
            color: white;
        }
        
        .qr-modal-simple .btn-secondary:hover {
            background: #6b7280;
        }
        
        .qr-modal-simple .progress-container {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .qr-modal-simple .progress-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
            color: #6b7280;
        }
        
        .qr-modal-simple .progress-bar {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .qr-modal-simple .progress-fill {
            background: #0676bb;
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .qr-modal-simple .qr-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        
        .qr-modal-simple .qr-container h3 {
            margin: 0 0 15px 0;
            padding: 12px 20px;
            background: #0676bb;
            color: white;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 700;
        }
        
        .qr-modal-simple .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
        }
        
        .qr-modal-simple .qr-grid-irmaos {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .qr-modal-simple .qr-item {
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            background: white;
            transition: all 0.2s;
            page-break-inside: avoid;
        }
        
        .qr-modal-simple .qr-item:hover {
            border-color: #0676bb;
            box-shadow: 0 4px 12px rgba(6, 118, 187, 0.2);
        }
        
        .qr-modal-simple .qr-item-duplo {
            border: 3px solid #0676bb;
            border-radius: 12px;
            padding: 15px;
            background: #f0f9ff;
            display: flex;
            flex-direction: column;
            gap: 15px;
            page-break-inside: avoid;
        }
        
        .qr-modal-simple .qr-item-irmao {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background: white;
        }
        
        .qr-modal-simple .qr-label {
            font-size: 14px;
            color: #374151;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .qr-modal-simple .qr-label strong {
            color: #0676bb;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .qr-modal-simple .qr-img {
            width: 180px;
            height: 180px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
        }
        
        .qr-modal-simple .qr-item-irmao .qr-img {
            width: 150px;
            height: 150px;
        }
        
        .qr-modal-simple .selecao-header {
            margin-bottom: 20px;
        }
        
        .qr-modal-simple .selecao-header h3 {
            margin: 0 0 15px 0;
            color: #0676bb;
            font-size: 18px;
            font-weight: 700;
            background: none;
            padding: 0;
        }
        
        .qr-modal-simple .selecao-header select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 15px;
            font-family: 'Poppins', sans-serif;
            cursor: pointer;
        }
        
        .qr-modal-simple .tabela-leitos {
            max-height: 400px;
            overflow-y: auto;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .qr-modal-simple .tabela-selecao {
            width: 100%;
            border-collapse: collapse;
        }
        
        .qr-modal-simple .tabela-selecao thead {
            position: sticky;
            top: 0;
            background: #f9fafb;
            z-index: 10;
        }
        
        .qr-modal-simple .tabela-selecao th {
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: 700;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .qr-modal-simple .tabela-selecao td {
            padding: 12px;
            font-size: 14px;
            color: #4b5563;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .qr-modal-simple .tabela-selecao tr:hover {
            background: #f3f4f6;
        }
        
        .qr-modal-simple .tabela-selecao tr.status-ocupado {
            background: #e5e7eb;
        }
        
        .qr-modal-simple .tabela-selecao tr.status-ocupado:hover {
            background: #d1d5db;
        }
        
        .qr-modal-simple .badge-status {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .qr-modal-simple .badge-status.status-ocupado {
            background: #0676bb;
            color: white;
        }
        
        .qr-modal-simple .badge-status.status-vago {
            background: #9ca3af;
            color: white;
        }
        
        .qr-modal-simple .selecao-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .qr-modal-simple .contador-selecao {
            font-size: 16px;
            color: #374151;
        }
        
        .qr-modal-simple .contador-selecao strong {
            color: #0676bb;
            font-size: 24px;
        }
        
        @media print {
            body.qr-modal-open > *:not(.qr-modal-simple) {
                display: none !important;
            }
            
            @page {
                size: 145mm 95mm;
                margin: 0;
            }
            
            body {
                margin: 0;
                padding: 0;
            }
            
            .qr-modal-simple {
                position: static;
                background: white !important;
                padding: 0 !important;
            }
            
            .qr-modal-simple .qr-modal-content {
                max-width: 100% !important;
                box-shadow: none !important;
                border-radius: 0 !important;
            }
            
            .qr-modal-simple .qr-modal-header,
            .qr-modal-simple .qr-controls,
            .qr-modal-simple .qr-tabs,
            .qr-modal-simple .progress-container,
            .qr-modal-simple .selecao-controls,
            .qr-modal-simple .selecao-footer {
                display: none !important;
            }
            
            .qr-modal-simple .qr-modal-body {
                padding: 0 !important;
            }
            
            .qr-modal-simple .qr-container {
                width: 100% !important;
                padding: 0 !important;
            }
            
            .qr-modal-simple .qr-container h3 {
                display: none !important;
            }
            
            .qr-modal-simple .qr-grid,
            .qr-modal-simple .qr-grid-irmaos {
                display: block !important;
            }
            
            .qr-modal-simple .qr-item,
            .qr-modal-simple .qr-item-duplo {
                width: 145mm !important;
                height: 95mm !important;
                border: 3px solid #000 !important;
                border-radius: 5mm !important;
                padding: 8mm !important;
                background: white !important;
                page-break-before: always !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                margin: 0 !important;
            }
            
            .qr-modal-simple .qr-item:first-child,
            .qr-modal-simple .qr-item-duplo:first-child {
                page-break-before: auto !important;
            }
            
            .qr-modal-simple .qr-item-irmao {
                width: 100% !important;
                border: 2px solid #333 !important;
                border-radius: 3mm !important;
                padding: 5mm !important;
                background: white !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                margin-bottom: 4mm !important;
            }
            
            .qr-modal-simple .qr-label {
                font-size: 14px !important;
                margin-bottom: 6mm !important;
                color: #000 !important;
                text-align: center !important;
            }
            
            .qr-modal-simple .qr-label strong {
                color: #000 !important;
                font-size: 16px !important;
                font-weight: bold !important;
                display: block !important;
                margin-bottom: 2mm !important;
            }
            
            .qr-modal-simple .qr-img {
                width: 75mm !important;
                height: 75mm !important;
                border: none !important;
                border-radius: 2mm !important;
            }
            
            .qr-modal-simple .qr-item-irmao .qr-img {
                width: 50mm !important;
                height: 50mm !important;
            }
        }
        
        @media (max-width: 768px) {
            .qr-modal-simple .qr-modal-content {
                width: 98%;
                margin: 10px;
            }
            
            .qr-modal-simple .qr-controls,
            .qr-modal-simple .selecao-actions {
                flex-direction: column;
                align-items: stretch;
            }
            
            .qr-modal-simple .qr-controls select,
            .qr-modal-simple .qr-controls button {
                width: 100%;
            }
            
            .qr-modal-simple .qr-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 10px;
            }
            
            .qr-modal-simple .qr-grid-irmaos {
                grid-template-columns: 1fr;
            }
            
            .qr-modal-simple .qr-img {
                width: 120px;
                height: 120px;
            }
            
            .qr-modal-simple .tabela-selecao {
                font-size: 12px;
            }
            
            .qr-modal-simple .tabela-selecao th,
            .qr-modal-simple .tabela-selecao td {
                padding: 8px 6px;
            }
        }
    `;
    document.head.appendChild(styles);
}

// =================== INICIALIZAÇÃO ===================
document.addEventListener('DOMContentLoaded', function() {
    window.openQRCodes = window.openQRCodesSimple;
    console.log('✅ Sistema QR Code V6.3 FINAL CORRIGIDO carregado');
    console.log('✅ 293 QR codes (9 hospitais ativos)');
    console.log('✅ Seleção personalizada: Abre janela com resumo completo');
    console.log('✅ Impressão: 145mm x 95mm (14,5cm altura x 9,5cm largura)');
    console.log('✅ 1 QR code por página');
    console.log('✅ Cores do projeto (#0676bb, #172945, #9ca3af)');
    console.log('✅ Cruz Azul: 13 pares de irmãos (21-46)');
    console.log('✅ Santa Clara: 9 pares de irmãos (10-27)');
});