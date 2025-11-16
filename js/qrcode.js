// =================== QRCODE V6.0 - 341 LEITOS ===================
// ✅ Total: 341 QR codes (contratuais + extras)
// ✅ Híbridos: "Híbrido 01", "Híbrido 02"...
// ✅ H2/H4 Aptos: "Apartamento 01", "Apartamento 02"...
// ✅ H2/H4 Enfs: "Enfermaria 21", "Enfermaria 22"... (pares empilhados)

const QR_API = {
    BASE_URL: 'https://qr-code-systelos.vercel.app',
    API_URL: 'https://api.qrserver.com/v1/create-qr-code/',
    SIZE: 300,
    DELAY: 150,
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
    }
};

// Variáveis de controle
let isGenerating = false;
let generationProgress = 0;
let totalQRCodes = 0;
let leitosSelecionados = [];

// =================== FUNÇÃO PARA OBTER NOME DO LEITO V6.0 ===================
function getNomeLeitoFormatado(hospitalId, numeroLeito) {
    const hospital = QR_API.HOSPITAIS[hospitalId];
    
    // HÍBRIDOS: "Híbrido 01", "Híbrido 02"...
    if (hospital.tipo === 'hibrido') {
        return `Híbrido ${String(numeroLeito).padStart(2, '0')}`;
    }
    
    // CRUZ AZUL (H2)
    if (hospitalId === 'H2') {
        // Apartamentos: leitos 1-20
        if (numeroLeito >= 1 && numeroLeito <= 20) {
            return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
        }
        // Enfermarias contratuais: leitos 21-36
        if (numeroLeito >= 21 && numeroLeito <= 36) {
            return `Enfermaria ${numeroLeito}`;
        }
        // Enfermarias extras: leitos 37-67
        return `Enfermaria ${numeroLeito}`;
    }
    
    // SANTA CLARA (H4)
    if (hospitalId === 'H4') {
        // Apartamentos contratuais: leitos 1-9
        if (numeroLeito >= 1 && numeroLeito <= 9) {
            return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
        }
        // Enfermarias contratuais (irmãos): leitos 10-17
        if (numeroLeito >= 10 && numeroLeito <= 17) {
            return `Enfermaria ${numeroLeito}`;
        }
        // Enfermarias extras: leitos 18-26
        if (numeroLeito >= 18 && numeroLeito <= 26) {
            return `Enfermaria ${numeroLeito}`;
        }
        // Apartamentos contratuais: leitos 27-35
        if (numeroLeito >= 27 && numeroLeito <= 35) {
            return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
        }
        // Apartamentos extras: leitos 36-57
        return `Apartamento ${String(numeroLeito).padStart(2, '0')}`;
    }
    
    return `Leito ${String(numeroLeito).padStart(2, '0')}`;
}

// =================== FUNÇÃO PRINCIPAL - MODAL COM OPÇÕES ===================
window.openQRCodesSimple = function() {
    console.log('Abrindo gerador de QR Codes V6.0...');
    
    if (document.querySelector('.qr-modal-simple')) {
        console.log('Modal já está aberto');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'qr-modal-simple';
    modal.innerHTML = `
        <div class="qr-modal-content">
            <div class="qr-modal-header">
                <h2>QR Codes - V6.0 (341 Leitos)</h2>
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
                
                <!-- TAB 1: TODOS OS LEITOS -->
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
                            Gerar Todos (341 QR Codes)
                        </button>
                        <button onclick="window.print()" class="btn-print">Imprimir</button>
                    </div>
                    
                    <div id="progressContainer" class="progress-container" style="display: none;">
                        <div class="progress-info">
                            <span id="progressText">Gerando QR Codes...</span>
                            <span id="progressCount">0/341</span>
                        </div>
                        <div class="progress-bar">
                            <div id="progressFill" class="progress-fill"></div>
                        </div>
                    </div>
                    
                    <div id="qrCodesContainer" class="qr-container"></div>
                </div>
                
                <!-- TAB 2: SELEÇÃO PERSONALIZADA -->
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
                                <h3>2. Selecione os Leitos Ocupados</h3>
                                <div class="selecao-actions">
                                    <button onclick="selecionarTodosLeitos()" class="btn-secondary">
                                        Selecionar Todos
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
                                    Gerar QR Codes
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="progressContainerSelecao" class="progress-container" style="display: none;">
                        <div class="progress-info">
                            <span id="progressTextSelecao">Gerando QR Codes...</span>
                            <span id="progressCountSelecao">0/0</span>
                        </div>
                        <div class="progress-bar">
                            <div id="progressFillSelecao" class="progress-fill"></div>
                        </div>
                    </div>
                    
                    <div id="qrCodesContainerSelecao" class="qr-container"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Carregar primeiro hospital por padrão (Adventista - H5)
    generateQRCodesSimple();
    
    // Injetar estilos
    injectQRStyles();
};

// =================== FECHAR MODAL ===================
window.closeQRModalSimple = function() {
    const modal = document.querySelector('.qr-modal-simple');
    if (modal) {
        modal.remove();
        isGenerating = false;
        generationProgress = 0;
        totalQRCodes = 0;
        leitosSelecionados = [];
    }
};

// =================== ALTERNAR TABS ===================
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
    
    // VERIFICAR SE É HOSPITAL COM IRMÃOS (H2 ou H4 enfermarias)
    if ((hospitalId === 'H2' || hospitalId === 'H4') && hospital.tipo === 'tipos_fixos') {
        gerarQRCodesComIrmaos(hospitalId, hospital, container);
    } else {
        gerarQRCodesSimples(hospitalId, hospital, container);
    }
};

// =================== GERAR QR CODES SIMPLES (HÍBRIDOS) ===================
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

// =================== GERAR QR CODES COM IRMÃOS (H2/H4) ===================
function gerarQRCodesComIrmaos(hospitalId, hospital, container) {
    let grid = null;
    
    for (let i = 1; i <= hospital.leitos; i++) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
        const qrUrl = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url)}`;
        
        // APARTAMENTOS (grid normal)
        if (hospitalId === 'H2' && i <= 20) {
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
        }
        // APARTAMENTOS SANTA CLARA (leitos 1-9, 27-57)
        else if (hospitalId === 'H4' && (i <= 9 || i >= 27)) {
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
        }
        // ENFERMARIAS COM IRMÃOS (EMPILHADOS)
        else {
            // H2: leitos 21-36 (pares)
            // H4: leitos 10-17 (pares), 18-26 (sem irmãos)
            
            // Verificar se é irmão (número ímpar)
            const isIrmao = (hospitalId === 'H2' && i >= 21 && i <= 36 && i % 2 === 1) ||
                           (hospitalId === 'H4' && i >= 10 && i <= 17 && i % 2 === 0);
            
            if (isIrmao) {
                // Criar novo grid de irmãos
                grid = document.createElement('div');
                grid.className = 'qr-grid-irmaos';
                container.appendChild(grid);
                
                // Criar item duplo (2 leitos empilhados)
                const qrItemDuplo = document.createElement('div');
                qrItemDuplo.className = 'qr-item-duplo';
                
                // Leito atual (ímpar para H2, par para H4)
                const leito1Formatado = getNomeLeitoFormatado(hospitalId, i);
                const url1 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
                const qrUrl1 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url1)}`;
                
                // Leito irmão (próximo número)
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
                
                // Pular o próximo número (já foi processado como irmão)
                i++;
            }
            // Enfermarias sem irmãos (H4 leitos 18-26)
            else if (hospitalId === 'H4' && i >= 18 && i <= 26) {
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
            }
        }
    }
}

// =================== GERAR TODOS OS QR CODES (OTIMIZADO) ===================
window.generateAllQRCodesOptimized = async function() {
    if (isGenerating) {
        console.log('Já está gerando QR codes...');
        return;
    }
    
    isGenerating = true;
    const container = document.getElementById('qrCodesContainer');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressCount = document.getElementById('progressCount');
    const btnGenerateAll = document.getElementById('btnGenerateAll');
    
    // Mostrar progresso
    progressContainer.style.display = 'block';
    btnGenerateAll.disabled = true;
    btnGenerateAll.textContent = 'Gerando...';
    
    container.innerHTML = '';
    
    // Calcular total de QR codes
    totalQRCodes = 0;
    Object.values(QR_API.HOSPITAIS).forEach(h => totalQRCodes += h.leitos);
    
    generationProgress = 0;
    
    // Gerar QR codes por hospital
    for (const [hospitalId, hospital] of Object.entries(QR_API.HOSPITAIS)) {
        const hospitalHeader = document.createElement('h3');
        hospitalHeader.textContent = `${hospital.nome} (${hospital.leitos} leitos)`;
        container.appendChild(hospitalHeader);
        
        // Verificar se é hospital com irmãos
        if ((hospitalId === 'H2' || hospitalId === 'H4') && hospital.tipo === 'tipos_fixos') {
            await gerarQRCodesComIrmaosAsync(hospitalId, hospital, container, progressFill, progressText, progressCount);
        } else {
            await gerarQRCodesSimplesAsync(hospitalId, hospital, container, progressFill, progressText, progressCount);
        }
    }
    
    // Finalizar
    progressText.textContent = 'Concluído!';
    progressCount.textContent = `${totalQRCodes}/${totalQRCodes}`;
    progressFill.style.width = '100%';
    
    setTimeout(() => {
        progressContainer.style.display = 'none';
        btnGenerateAll.disabled = false;
        btnGenerateAll.textContent = 'Gerar Todos (341 QR Codes)';
        isGenerating = false;
    }, 1500);
};

// =================== GERAR QR CODES ASYNC (SIMPLES) ===================
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
        
        // Atualizar progresso
        generationProgress++;
        const percentage = Math.round((generationProgress / totalQRCodes) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Gerando ${hospital.nome}...`;
        progressCount.textContent = `${generationProgress}/${totalQRCodes}`;
        
        // Delay para não sobrecarregar
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, QR_API.DELAY));
        }
    }
    
    container.appendChild(grid);
}

// =================== GERAR QR CODES ASYNC (COM IRMÃOS) ===================
async function gerarQRCodesComIrmaosAsync(hospitalId, hospital, container, progressFill, progressText, progressCount) {
    let grid = null;
    
    for (let i = 1; i <= hospital.leitos; i++) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
        const qrUrl = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url)}`;
        
        // APARTAMENTOS (grid normal)
        if (hospitalId === 'H2' && i <= 20) {
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
        }
        // APARTAMENTOS SANTA CLARA (leitos 1-9, 27-57)
        else if (hospitalId === 'H4' && (i <= 9 || i >= 27)) {
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
        }
        // ENFERMARIAS COM IRMÃOS (EMPILHADOS)
        else {
            // Verificar se é irmão (número ímpar para H2, par para H4)
            const isIrmao = (hospitalId === 'H2' && i >= 21 && i <= 36 && i % 2 === 1) ||
                           (hospitalId === 'H4' && i >= 10 && i <= 17 && i % 2 === 0);
            
            if (isIrmao) {
                // Criar novo grid de irmãos
                grid = document.createElement('div');
                grid.className = 'qr-grid-irmaos';
                container.appendChild(grid);
                
                // Criar item duplo (2 leitos empilhados)
                const qrItemDuplo = document.createElement('div');
                qrItemDuplo.className = 'qr-item-duplo';
                
                // Leito atual
                const leito1Formatado = getNomeLeitoFormatado(hospitalId, i);
                const url1 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${i}`;
                const qrUrl1 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url1)}`;
                
                // Leito irmão
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
                
                // Atualizar progresso (2 leitos de uma vez)
                generationProgress += 2;
                const percentage = Math.round((generationProgress / totalQRCodes) * 100);
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `Gerando ${hospital.nome}...`;
                progressCount.textContent = `${generationProgress}/${totalQRCodes}`;
                
                // Pular o próximo número
                i++;
            }
            // Enfermarias sem irmãos (H4 leitos 18-26)
            else if (hospitalId === 'H4' && i >= 18 && i <= 26) {
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
            }
        }
        
        // Delay para não sobrecarregar
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, QR_API.DELAY));
        }
    }
}

// =================== SELEÇÃO PERSONALIZADA - CARREGAR LEITOS ===================
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
    
    // Criar tabela
    let html = `
        <table class="tabela-selecao">
            <thead>
                <tr>
                    <th>Selecionar</th>
                    <th>Leito</th>
                    <th>Nome</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (let i = 1; i <= hospital.leitos; i++) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, i);
        html += `
            <tr>
                <td>
                    <input type="checkbox" 
                           id="leito_${i}" 
                           onchange="atualizarSelecaoLeitos()">
                </td>
                <td>${i}</td>
                <td>${leitoFormatado}</td>
            </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    tabela.innerHTML = html;
    atualizarSelecaoLeitos();
};

// =================== SELECIONAR TODOS OS LEITOS ===================
window.selecionarTodosLeitos = function() {
    const checkboxes = document.querySelectorAll('#tabelaLeitosSelecao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    atualizarSelecaoLeitos();
};

// =================== LIMPAR SELEÇÃO DE LEITOS ===================
window.limparSelecaoLeitos = function() {
    const checkboxes = document.querySelectorAll('#tabelaLeitosSelecao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    atualizarSelecaoLeitos();
};

// =================== ATUALIZAR CONTAGEM DE LEITOS SELECIONADOS ===================
window.atualizarSelecaoLeitos = function() {
    const checkboxes = document.querySelectorAll('#tabelaLeitosSelecao input[type="checkbox"]:checked');
    leitosSelecionados = Array.from(checkboxes).map(cb => {
        const id = cb.id.replace('leito_', '');
        return parseInt(id);
    });
    
    const contador = document.getElementById('contadorSelecionados');
    const btnGerar = document.getElementById('btnGerarSelecionados');
    
    contador.textContent = leitosSelecionados.length;
    btnGerar.disabled = leitosSelecionados.length === 0;
};

// =================== GERAR QR CODES SELECIONADOS ===================
window.gerarQRCodesSelecionados = async function() {
    if (leitosSelecionados.length === 0) {
        alert('Selecione pelo menos um leito!');
        return;
    }
    
    const hospitalId = document.getElementById('selecaoHospitalSelect').value;
    const hospital = QR_API.HOSPITAIS[hospitalId];
    const container = document.getElementById('qrCodesContainerSelecao');
    const progressContainer = document.getElementById('progressContainerSelecao');
    const progressFill = document.getElementById('progressFillSelecao');
    const progressText = document.getElementById('progressTextSelecao');
    const progressCount = document.getElementById('progressCountSelecao');
    const btnGerar = document.getElementById('btnGerarSelecionados');
    
    // Mostrar progresso
    progressContainer.style.display = 'block';
    btnGerar.disabled = true;
    container.innerHTML = '';
    
    const total = leitosSelecionados.length;
    let current = 0;
    
    container.innerHTML = `<h3>${hospital.nome} (${total} leitos selecionados)</h3>`;
    
    // Verificar se há leitos irmãos na seleção (H2 ou H4)
    const hasIrmaos = (hospitalId === 'H2' || hospitalId === 'H4') && hospital.tipo === 'tipos_fixos';
    
    if (hasIrmaos) {
        await gerarQRCodesSelecionadosComIrmaos(hospitalId, hospital, container, progressFill, progressText, progressCount, total, current);
    } else {
        await gerarQRCodesSelecionadosSimples(hospitalId, hospital, container, progressFill, progressText, progressCount, total, current);
    }
    
    // Finalizar
    progressText.textContent = 'Concluído!';
    progressCount.textContent = `${total}/${total}`;
    progressFill.style.width = '100%';
    
    setTimeout(() => {
        progressContainer.style.display = 'none';
        btnGerar.disabled = false;
    }, 1500);
};

// =================== GERAR QR CODES SELECIONADOS - SIMPLES ===================
async function gerarQRCodesSelecionadosSimples(hospitalId, hospital, container, progressFill, progressText, progressCount, total, current) {
    const grid = document.createElement('div');
    grid.className = 'qr-grid';
    
    for (const numeroLeito of leitosSelecionados) {
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, numeroLeito);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${numeroLeito}`;
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
        
        // Atualizar progresso
        current++;
        const percentage = Math.round((current / total) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Gerando ${hospital.nome}...`;
        progressCount.textContent = `${current}/${total}`;
        
        // Delay
        if (current % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, QR_API.DELAY));
        }
    }
    
    container.appendChild(grid);
}

// =================== GERAR QR CODES SELECIONADOS - COM IRMÃOS ===================
async function gerarQRCodesSelecionadosComIrmaos(hospitalId, hospital, container, progressFill, progressText, progressCount, total, current) {
    let grid = null;
    const processados = new Set();
    
    // Ordenar leitos selecionados
    const leitosOrdenados = [...leitosSelecionados].sort((a, b) => a - b);
    
    for (const numeroLeito of leitosOrdenados) {
        if (processados.has(numeroLeito)) continue;
        
        const leitoFormatado = getNomeLeitoFormatado(hospitalId, numeroLeito);
        const url = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${numeroLeito}`;
        const qrUrl = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url)}`;
        
        // APARTAMENTOS (grid normal)
        if ((hospitalId === 'H2' && numeroLeito <= 20) || 
            (hospitalId === 'H4' && (numeroLeito <= 9 || numeroLeito >= 27))) {
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
            
            processados.add(numeroLeito);
            current++;
        }
        // ENFERMARIAS COM IRMÃOS
        else {
            // Verificar se é irmão
            const isIrmao = (hospitalId === 'H2' && numeroLeito >= 21 && numeroLeito <= 36 && numeroLeito % 2 === 1) ||
                           (hospitalId === 'H4' && numeroLeito >= 10 && numeroLeito <= 17 && numeroLeito % 2 === 0);
            
            const numeroIrmao = isIrmao ? numeroLeito + 1 : numeroLeito - 1;
            const ambosOcupados = leitosSelecionados.includes(numeroLeito) && leitosSelecionados.includes(numeroIrmao);
            
            if (ambosOcupados && !processados.has(numeroIrmao)) {
                // Criar grid de irmãos
                grid = document.createElement('div');
                grid.className = 'qr-grid-irmaos';
                container.appendChild(grid);
                
                // Par completo
                const leito1 = Math.min(numeroLeito, numeroIrmao);
                const leito2 = Math.max(numeroLeito, numeroIrmao);
                
                const leito1Formatado = getNomeLeitoFormatado(hospitalId, leito1);
                const url1 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${leito1}`;
                const qrUrl1 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url1)}`;
                
                const leito2Formatado = getNomeLeitoFormatado(hospitalId, leito2);
                const url2 = `${QR_API.BASE_URL}/?h=${hospitalId}&l=${leito2}`;
                const qrUrl2 = `${QR_API.API_URL}?size=${QR_API.SIZE}x${QR_API.SIZE}&data=${encodeURIComponent(url2)}`;
                
                const qrItemDuplo = document.createElement('div');
                qrItemDuplo.className = 'qr-item-duplo';
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
                
                processados.add(leito1);
                processados.add(leito2);
                current += 2;
            } else {
                // Leito individual (irmão não selecionado ou enfermaria H4 18-26)
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
                
                processados.add(numeroLeito);
                current++;
            }
        }
        
        // Atualizar progresso
        const percentage = Math.round((current / total) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Gerando ${hospital.nome}...`;
        progressCount.textContent = `${current}/${total}`;
        
        // Delay
        if (current % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, QR_API.DELAY));
        }
    }
}

// =================== INJETAR ESTILOS CSS ===================
function injectQRStyles() {
    if (document.getElementById('qr-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'qr-styles';
    styles.textContent = `
        /* MODAL BASE */
        .qr-modal-simple {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            overflow-y: auto;
            padding: 20px;
        }
        
        .qr-modal-simple .qr-modal-content {
            background: white;
            border-radius: 12px;
            max-width: 1400px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        
        .qr-modal-simple .qr-modal-header {
            background: linear-gradient(135deg, #0676bb, #172945);
            color: white;
            padding: 20px 30px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .qr-modal-simple .qr-modal-header h2 {
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
        
        /* TABS */
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
        
        /* CONTROLES */
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
            background: linear-gradient(135deg, #0676bb, #172945);
            color: white;
        }
        
        .qr-modal-simple .btn-all:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(6, 118, 187, 0.3);
        }
        
        .qr-modal-simple .btn-all:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .qr-modal-simple .btn-print {
            background: #10b981;
            color: white;
        }
        
        .qr-modal-simple .btn-print:hover {
            background: #059669;
        }
        
        .qr-modal-simple .btn-primary {
            background: linear-gradient(135deg, #0676bb, #172945);
            color: white;
        }
        
        .qr-modal-simple .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(6, 118, 187, 0.3);
        }
        
        .qr-modal-simple .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .qr-modal-simple .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }
        
        .qr-modal-simple .btn-secondary:hover {
            background: #d1d5db;
        }
        
        /* PROGRESSO */
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
            background: linear-gradient(90deg, #0676bb, #10b981);
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        /* CONTAINER DE QR CODES */
        .qr-modal-simple .qr-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        
        .qr-modal-simple .qr-container h3 {
            margin: 0 0 15px 0;
            padding: 12px 20px;
            background: linear-gradient(135deg, #0676bb, #172945);
            color: white;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 700;
        }
        
        /* GRID NORMAL (HÍBRIDOS E APARTAMENTOS) */
        .qr-modal-simple .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
        }
        
        /* GRID DE IRMÃOS (EMPILHADOS) */
        .qr-modal-simple .qr-grid-irmaos {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        
        /* ITEM NORMAL */
        .qr-modal-simple .qr-item {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            transition: all 0.2s;
        }
        
        .qr-modal-simple .qr-item:hover {
            border-color: #0676bb;
            box-shadow: 0 4px 12px rgba(6, 118, 187, 0.15);
        }
        
        /* ITEM DUPLO (IRMÃOS EMPILHADOS) */
        .qr-modal-simple .qr-item-duplo {
            background: white;
            border: 3px solid #0676bb;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .qr-modal-simple .qr-item-irmao {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }
        
        .qr-modal-simple .qr-label {
            text-align: center;
            font-size: 14px;
            color: #374151;
            line-height: 1.5;
        }
        
        .qr-modal-simple .qr-label strong {
            display: block;
            font-size: 16px;
            color: #0676bb;
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
        
        /* SELEÇÃO PERSONALIZADA */
        .qr-modal-simple .selecao-header {
            margin-bottom: 20px;
        }
        
        .qr-modal-simple .selecao-header h3 {
            margin: 0 0 15px 0;
            color: #0676bb;
            font-size: 18px;
            font-weight: 700;
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
        }
        
        .qr-modal-simple .tabela-selecao {
            width: 100%;
            border-collapse: collapse;
        }
        
        .qr-modal-simple .tabela-selecao thead {
            background: #f3f4f6;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .qr-modal-simple .tabela-selecao th {
            padding: 12px 16px;
            text-align: left;
            font-weight: 700;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .qr-modal-simple .tabela-selecao td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .qr-modal-simple .tabela-selecao tbody tr:hover {
            background: #f9fafb;
        }
        
        .qr-modal-simple .tabela-selecao input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .qr-modal-simple .selecao-footer {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #f3f4f6;
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
        
        /* ESTILOS DE IMPRESSÃO */
        @media print {
            body * {
                visibility: hidden !important;
            }
            
            .qr-modal-simple,
            .qr-modal-simple * {
                visibility: visible !important;
            }
            
            .qr-modal-simple {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: auto;
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
                page-break-before: always;
                page-break-after: avoid;
                margin: 0 0 5mm 0 !important;
                font-size: 16px !important;
                background: white !important;
                border: none !important;
                padding: 2mm 0 !important;
                color: #000 !important;
                text-align: left !important;
            }
            
            .qr-modal-simple .qr-container h3:first-child {
                page-break-before: auto;
            }
            
            .qr-modal-simple .qr-grid {
                display: block !important;
                page-break-inside: auto !important;
                margin-bottom: 5mm !important;
            }
            
            .qr-modal-simple .qr-grid-irmaos {
                display: block !important;
                page-break-inside: auto !important;
                margin-bottom: 5mm !important;
            }
            
            .qr-modal-simple .qr-item-duplo {
                width: 95mm !important;
                height: 145mm !important;
                border: 2px solid #000 !important;
                border-radius: 2mm !important;
                padding: 5mm !important;
                background: white !important;
                page-break-inside: avoid !important;
                page-break-after: always !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-around !important;
                align-items: center !important;
                margin: 0 auto 5mm !important;
            }
            
            .qr-modal-simple .qr-item-duplo:last-child {
                page-break-after: auto !important;
            }
            
            .qr-modal-simple .qr-item-irmao {
                width: 100% !important;
                border: 1px solid #333 !important;
                border-radius: 2mm !important;
                padding: 3mm !important;
                background: white !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .qr-modal-simple .qr-item {
                width: 95mm !important;
                height: 145mm !important;
                padding: 5mm !important;
                page-break-inside: avoid !important;
                page-break-after: always !important;
                border: 2px solid #000 !important;
                background: white !important;
                margin: 0 auto 5mm !important;
                border-radius: 2mm !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .qr-modal-simple .qr-item:last-child {
                page-break-after: auto !important;
            }
            
            .qr-modal-simple .qr-label {
                font-size: 14px !important;
                margin-bottom: 5mm !important;
                color: #000 !important;
                line-height: 1.4 !important;
                text-align: center !important;
            }
            
            .qr-modal-simple .qr-label strong {
                color: #000 !important;
                font-size: 16px !important;
                font-weight: bold !important;
            }
            
            .qr-modal-simple .qr-img {
                width: 70mm !important;
                height: 70mm !important;
                border: none !important;
                border-radius: 2mm !important;
                display: block !important;
            }
            
            .qr-modal-simple .qr-item-irmao .qr-img {
                width: 60mm !important;
                height: 60mm !important;
            }
            
            .qr-modal-simple .qr-item-irmao .qr-label {
                font-size: 12px !important;
                margin-bottom: 3mm !important;
            }
            
            .qr-modal-simple .qr-item-irmao .qr-label strong {
                font-size: 14px !important;
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
    console.log('Sistema QR Code V6.0 carregado');
    console.log('✅ 341 QR codes (9 hospitais)');
    console.log('✅ Híbridos: "Híbrido 01, 02..."');
    console.log('✅ H2/H4 Aptos: "Apartamento 01, 02..."');
    console.log('✅ H2/H4 Enfs: "Enfermaria 21, 22..." (pares empilhados)');
});