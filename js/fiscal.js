/**
 * fiscal.js - Módulo de Faturamento Fiscal & Simulador de Notas Fiscais (NF-e / DANFE)
 * Padrão Enterprise Cloud ERP (NG Cloud / Totvs / Omie)
 */

// Estado interno do rascunho da nova nota
let draftItens = [];
let currentNotaDanfeId = null;

// Inicialização do Módulo Fiscal
function initFiscal() {
  setupFiscalEvents();
  populateFiscalSelects();
  initDraftDefaults();
  renderDraftItensTable();
  renderHistoricoNotas();
  renderParceirosTable();
}

function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatDateBR(isoStr) {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}

function formatChave44(chave) {
  if (!chave) return '';
  return chave.replace(/(\d{4})/g, '$1 ').trim();
}

// Inicializa itens padrão para emissão rápida
function initDraftDefaults() {
  const products = window.store.getProducts();
  const palletProd = products.find(p => p.category === 'Produto Acabado') || products[0];

  draftItens = [
    {
      id: 1,
      produto_id: palletProd ? palletProd.id : null,
      codigo: palletProd ? palletProd.code : 'PAL-PBR1',
      descricao: palletProd ? palletProd.name : 'Pallet PBR 1 Padronizado (1000 x 1200 mm - 4 Entradas)',
      ncm: '4415.20.00',
      cst: '000',
      cfop: '5.101',
      unidade: palletProd ? palletProd.unit : 'un',
      quantidade: 50,
      valor_unitario: palletProd ? palletProd.salePrice : 68.00,
      valor_total: (palletProd ? palletProd.salePrice : 68.00) * 50,
      base_calculo_icms: (palletProd ? palletProd.salePrice : 68.00) * 50,
      aliq_icms: 18.00,
      valor_icms: ((palletProd ? palletProd.salePrice : 68.00) * 50 * 18) / 100,
      aliq_ipi: 0,
      valor_ipi: 0
    }
  ];
}

// Popula selects de Emitente, Destinatário e Produtos
function populateFiscalSelects() {
  const parceiros = window.store.getParceiros();
  const selectEmit = document.getElementById('nf-emitente-select');
  const selectDest = document.getElementById('nf-destinatario-select');
  const selectItemProd = document.getElementById('modal-item-produto-select');

  // Emitentes (Default: Pallets Brasil)
  if (selectEmit) {
    selectEmit.innerHTML = parceiros.map(p => `
      <option value="${p.id}" ${p.cnpj === '14.892.401/0001-88' || p.tipo === 'EMITENTE' ? 'selected' : ''}>
        ${p.razao_social} (${p.cnpj})
      </option>
    `).join('');
  }

  // Destinatários (Clientes e Fornecedores)
  if (selectDest) {
    const clientes = parceiros.filter(p => p.tipo !== 'EMITENTE');
    selectDest.innerHTML = clientes.map((p, idx) => `
      <option value="${p.id}" ${idx === 0 ? 'selected' : ''}>
        ${p.razao_social} • ${p.cnpj} (${p.tipo})
      </option>
    `).join('');
  }

  // Produtos no modal de adicionar item
  if (selectItemProd) {
    const products = window.store.getProducts();
    selectItemProd.innerHTML = `
      <option value="">-- Selecionar do Estoque de Pallets & Madeiras --</option>
      ${products.map(p => `
        <option value="${p.id}" data-code="${p.code}" data-price="${p.salePrice}" data-cost="${p.costPrice}" data-unit="${p.unit}" data-cat="${p.category}">
          [${p.code}] ${p.name} - ${formatBRL(p.salePrice)} (Saldo: ${p.stock} ${p.unit})
        </option>
      `).join('')}
    `;
  }
}

// Tabela de itens da nota em digitação
function renderDraftItensTable() {
  const tbody = document.getElementById('nf-draft-itens-tbody');
  if (!tbody) return;

  if (draftItens.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
          <i class="fas fa-boxes-stacked" style="font-size: 1.5rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
          Nenhum item adicionado à nota fiscal. Clique em <strong>"+ Adicionar Item"</strong> abaixo.
        </td>
      </tr>
    `;
    updateDraftCalculos();
    return;
  }

  tbody.innerHTML = draftItens.map((it, idx) => `
    <tr>
      <td style="font-weight: 600; color: var(--text-muted);">${idx + 1}</td>
      <td>
        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${it.descricao}</div>
        <div style="font-size: 0.725rem; color: var(--text-muted); font-family: monospace;">Cód: ${it.codigo} • NCM: ${it.ncm} • CFOP: ${it.cfop}</div>
      </td>
      <td style="text-align: center;"><span class="badge badge-neutral">${it.unidade}</span></td>
      <td style="text-align: right; font-weight: 700;">${it.quantidade}</td>
      <td style="text-align: right;">${formatBRL(it.valor_unitario)}</td>
      <td style="text-align: right; font-weight: 700; color: var(--color-primary);">${formatBRL(it.valor_total)}</td>
      <td style="text-align: right; font-size: 0.8rem;">
        <div>${it.aliq_icms}%</div>
        <div style="color: var(--text-muted); font-size: 0.7rem;">${formatBRL(it.valor_icms)}</div>
      </td>
      <td style="text-align: right; font-size: 0.8rem;">
        <div>${it.aliq_ipi}%</div>
        <div style="color: var(--text-muted); font-size: 0.7rem;">${formatBRL(it.valor_ipi)}</div>
      </td>
      <td style="text-align: center;">
        <button class="btn-icon-only text-danger" onclick="removeDraftItem(${idx})" title="Remover item da nota">
          <i class="fas fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');

  updateDraftCalculos();
}

function removeDraftItem(index) {
  draftItens.splice(index, 1);
  renderDraftItensTable();
}

// Atualização de totais e impostos em tempo real
function updateDraftCalculos() {
  const vlrProdutos = draftItens.reduce((acc, it) => acc + (Number(it.valor_total) || 0), 0);
  const baseIcms = draftItens.reduce((acc, it) => acc + (Number(it.base_calculo_icms) || 0), 0);
  const vlrIcms = draftItens.reduce((acc, it) => acc + (Number(it.valor_icms) || 0), 0);
  const vlrIpi = draftItens.reduce((acc, it) => acc + (Number(it.valor_ipi) || 0), 0);

  const freteInput = document.getElementById('nf-frete');
  const seguroInput = document.getElementById('nf-seguro');
  const despesasInput = document.getElementById('nf-outras-despesas');
  const descontoInput = document.getElementById('nf-desconto');

  const vlrFrete = parseFloat(freteInput?.value) || 0;
  const vlrSeguro = parseFloat(seguroInput?.value) || 0;
  const vlrDespesas = parseFloat(despesasInput?.value) || 0;
  const vlrDesconto = parseFloat(descontoInput?.value) || 0;

  const vlrTotalNota = (vlrProdutos + vlrFrete + vlrSeguro + vlrDespesas + vlrIpi) - vlrDesconto;

  // Atualizar cards de resumo na tela
  const elTotProd = document.getElementById('card-tot-produtos');
  const elTotIcms = document.getElementById('card-tot-icms');
  const elTotIpi = document.getElementById('card-tot-ipi');
  const elTotNota = document.getElementById('card-tot-nota');
  const elBaseIcms = document.getElementById('card-base-icms');

  if (elTotProd) elTotProd.textContent = formatBRL(vlrProdutos);
  if (elTotIcms) elTotIcms.textContent = formatBRL(vlrIcms);
  if (elTotIpi) elTotIpi.textContent = formatBRL(vlrIpi);
  if (elTotNota) elTotNota.textContent = formatBRL(vlrTotalNota);
  if (elBaseIcms) elBaseIcms.textContent = `Base ICMS: ${formatBRL(baseIcms)}`;

  // Atualizar parcelamento sugerido
  renderDuplicatasPreview(vlrTotalNota);
}

function renderDuplicatasPreview(totalNota) {
  const parcelasSelect = document.getElementById('nf-parcelas-select');
  const container = document.getElementById('nf-duplicatas-preview');
  if (!container) return;

  const nParcelas = parseInt(parcelasSelect?.value || '2', 10);
  const valorParcela = totalNota > 0 ? (totalNota / nParcelas) : 0;

  const d = new Date();
  const dupList = [];
  for (let i = 1; i <= nParcelas; i++) {
    const vencto = new Date();
    vencto.setDate(d.getDate() + (i * 30));
    dupList.push({
      numero: `DUP-${String(i).padStart(2, '0')}`,
      vencimento: vencto.toLocaleDateString('pt-BR'),
      valor: valorParcela
    });
  }

  container.innerHTML = dupList.map(dup => `
    <div class="duplicata-pill">
      <span class="dup-num">${dup.numero}</span>
      <span class="dup-date"><i class="far fa-calendar-alt"></i> ${dup.vencimento}</span>
      <strong class="dup-val">${formatBRL(dup.valor)}</strong>
    </div>
  `).join('');
}

// Modal Adicionar Item
function openModalAdicionarItem() {
  const modal = document.getElementById('modal-fiscal-item');
  if (modal) {
    document.getElementById('modal-item-form')?.reset();
    openModal('modal-fiscal-item');
  }
}

function setupFiscalEvents() {
  // Mudança no select de produto do modal de item preenche campos
  const selProd = document.getElementById('modal-item-produto-select');
  if (selProd) {
    selProd.addEventListener('change', () => {
      const opt = selProd.options[selProd.selectedIndex];
      if (!opt || !opt.value) return;

      const descInput = document.getElementById('modal-item-descricao');
      const codInput = document.getElementById('modal-item-codigo');
      const precoInput = document.getElementById('modal-item-preco');
      const unInput = document.getElementById('modal-item-un');
      const ncmInput = document.getElementById('modal-item-ncm');

      if (descInput) descInput.value = opt.text.split('] ')[1]?.split(' - ')[0] || '';
      if (codInput) codInput.value = opt.dataset.code || '';
      if (precoInput) precoInput.value = opt.dataset.price || '0';
      if (unInput) unInput.value = opt.dataset.unit || 'un';
      if (ncmInput && !ncmInput.value) {
        ncmInput.value = opt.dataset.cat?.includes('Pallet') ? '4415.20.00' : '4407.11.00';
      }
    });
  }

  // Form de inclusão de item
  const itemForm = document.getElementById('modal-item-form');
  if (itemForm) {
    itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const selProdOpt = selProd?.options[selProd.selectedIndex];
      const produtoId = selProdOpt?.value || null;
      const desc = document.getElementById('modal-item-descricao')?.value.trim() || 'Produto Diverso';
      const cod = document.getElementById('modal-item-codigo')?.value.trim() || 'PROD-01';
      const ncm = document.getElementById('modal-item-ncm')?.value.trim() || '4415.20.00';
      const cfop = document.getElementById('modal-item-cfop')?.value.trim() || '5.101';
      const un = document.getElementById('modal-item-un')?.value.trim() || 'un';
      const qtd = parseFloat(document.getElementById('modal-item-qtd')?.value) || 1;
      const preco = parseFloat(document.getElementById('modal-item-preco')?.value) || 0;
      const aliqIcms = parseFloat(document.getElementById('modal-item-aliq-icms')?.value) || 18;
      const aliqIpi = parseFloat(document.getElementById('modal-item-aliq-ipi')?.value) || 0;

      const tot = qtd * preco;
      const vlrIcms = (tot * aliqIcms) / 100;
      const vlrIpi = (tot * aliqIpi) / 100;

      draftItens.push({
        id: Date.now(),
        produto_id: produtoId,
        codigo: cod,
        descricao: desc,
        ncm: ncm,
        cst: '000',
        cfop: cfop,
        unidade: un,
        quantidade: qtd,
        valor_unitario: preco,
        valor_total: tot,
        base_calculo_icms: tot,
        aliq_icms: aliqIcms,
        valor_icms: vlrIcms,
        aliq_ipi: aliqIpi,
        valor_ipi: vlrIpi
      });

      closeModal('modal-fiscal-item');
      renderDraftItensTable();
      if (window.showToast) window.showToast(`Item "${desc}" adicionado à nota!`, 'success');
    });
  }

  // Form Principal de Emissão de Nota
  const novaNotaForm = document.getElementById('form-nova-nota-fiscal');
  if (novaNotaForm) {
    novaNotaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      emitirNotaSubmit();
    });
  }

  // Inputs de frete, seguro, desconto alterando totais
  ['nf-frete', 'nf-seguro', 'nf-outras-despesas', 'nf-desconto', 'nf-parcelas-select'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateDraftCalculos);
  });

  // Form de Parceiro Fiscal (Modal)
  const parceiroForm = document.getElementById('form-modal-parceiro');
  if (parceiroForm) {
    parceiroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      salvarParceiroSubmit();
    });
  }

  // Filtros no histórico de notas
  const searchNotas = document.getElementById('busca-historico-notas');
  const statusNotas = document.getElementById('filtro-status-notas');
  if (searchNotas) {
    searchNotas.addEventListener('input', () => renderHistoricoNotas());
  }
  if (statusNotas) {
    statusNotas.addEventListener('change', () => renderHistoricoNotas());
  }

  // Filtros em parceiros
  const searchParc = document.getElementById('busca-parceiros');
  const tipoParc = document.getElementById('filtro-tipo-parceiros');
  if (searchParc) searchParc.addEventListener('input', () => renderParceirosTable());
  if (tipoParc) tipoParc.addEventListener('change', () => renderParceirosTable());
}

// Emissão e Gravação da NF-e
function emitirNotaSubmit() {
  if (draftItens.length === 0) {
    if (window.showToast) window.showToast('Adicione ao menos um item antes de emitir a nota fiscal.', 'warning');
    return;
  }

  const emitenteId = Number(document.getElementById('nf-emitente-select')?.value);
  const destinatarioId = Number(document.getElementById('nf-destinatario-select')?.value);
  const tipoOp = document.getElementById('nf-tipo-operacao')?.value || 'SAIDA';
  const natOp = document.getElementById('nf-natureza-op')?.value.trim() || 'VENDA DE PRODUCAO DO ESTABELECIMENTO';
  const serie = document.getElementById('nf-serie')?.value.trim() || '1';
  const darBaixaEstoque = document.getElementById('nf-baixar-estoque-check')?.checked || false;

  const emitente = window.store.getParceiroById(emitenteId) || window.store.getParceiros()[0];
  const destinatario = window.store.getParceiroById(destinatarioId);

  if (!destinatario) {
    if (window.showToast) window.showToast('Selecione o destinatário da nota fiscal.', 'warning');
    return;
  }

  const vlrProdutos = draftItens.reduce((acc, it) => acc + (Number(it.valor_total) || 0), 0);
  const baseIcms = draftItens.reduce((acc, it) => acc + (Number(it.base_calculo_icms) || 0), 0);
  const vlrIcms = draftItens.reduce((acc, it) => acc + (Number(it.valor_icms) || 0), 0);
  const vlrIpi = draftItens.reduce((acc, it) => acc + (Number(it.valor_ipi) || 0), 0);

  const vlrFrete = parseFloat(document.getElementById('nf-frete')?.value) || 0;
  const vlrSeguro = parseFloat(document.getElementById('nf-seguro')?.value) || 0;
  const vlrDespesas = parseFloat(document.getElementById('nf-outras-despesas')?.value) || 0;
  const vlrDesconto = parseFloat(document.getElementById('nf-desconto')?.value) || 0;
  const vlrTotalNota = (vlrProdutos + vlrFrete + vlrSeguro + vlrDespesas + vlrIpi) - vlrDesconto;

  const nParcelas = parseInt(document.getElementById('nf-parcelas-select')?.value || '2', 10);
  const duplicatas = [];
  const d = new Date();
  for (let i = 1; i <= nParcelas; i++) {
    const vencto = new Date();
    vencto.setDate(d.getDate() + (i * 30));
    duplicatas.push({
      id: i,
      numero: `DUP-0${i}`,
      vencimento: vencto.toISOString().split('T')[0],
      valor: vlrTotalNota / nParcelas,
      forma_pagamento: 'BOLETO BANCARIO'
    });
  }

  const transpNome = document.getElementById('nf-transp-nome')?.value.trim() || 'Frota Própria / Retirada';
  const transpPlaca = document.getElementById('nf-transp-placa')?.value.trim() || 'BRA2E19';
  const transpUf = document.getElementById('nf-transp-uf')?.value.trim().toUpperCase() || 'SP';
  const volQtd = parseInt(document.getElementById('nf-vol-qtd')?.value, 10) || draftItens.reduce((a, b) => a + b.quantidade, 0);
  const pesoB = parseFloat(document.getElementById('nf-peso-bruto')?.value) || (volQtd * 25);

  const notaPayload = {
    tipo_operacao: tipoOp,
    natureza_operacao: natOp,
    serie: serie,
    emitente_id: emitente.id,
    destinatario_id: destinatario.id,
    emitente_nome: emitente.razao_social,
    emitente_cnpj: emitente.cnpj,
    emitente_ie: emitente.inscricao_estadual,
    emitente_endereco: `${emitente.logradouro}, ${emitente.numero} - ${emitente.municipio}/${emitente.uf}`,
    destinatario_nome: destinatario.razao_social,
    destinatario_cnpj: destinatario.cnpj,
    destinatario_ie: destinatario.inscricao_estadual,
    destinatario_endereco: `${destinatario.logradouro}, ${destinatario.numero} - ${destinatario.municipio}/${destinatario.uf}`,
    valor_produtos: vlrProdutos,
    base_calculo_icms: baseIcms,
    valor_icms: vlrIcms,
    valor_ipi: vlrIpi,
    valor_frete: vlrFrete,
    valor_seguro: vlrSeguro,
    valor_desconto: vlrDesconto,
    outras_despesas: vlrDespesas,
    valor_total: vlrTotalNota,
    modalidade_frete: document.getElementById('nf-modalidade-frete')?.value || '0 - Por conta do Emitente (CIF)',
    transportadora_nome: transpNome,
    veiculo_placa: transpPlaca,
    veiculo_uf: transpUf,
    volumes_quantidade: volQtd,
    volumes_especie: 'PALLETS / VOLUMES',
    peso_bruto: pesoB,
    peso_liquido: pesoB,
    informacoes_complementares: document.getElementById('nf-obs-complementares')?.value.trim() || 'DOCUMENTO FISCAL EMITIDO ELETRONICAMENTE CONFORME AJUSTE SINIEF. TRIBUTOS TOTAIS APROXIMADOS CONFORME LEI 12.741/2012.',
    itens: [...draftItens],
    duplicatas: duplicatas
  };

  const novaNota = window.store.emitirNotaFiscal(notaPayload, darBaixaEstoque);

  if (window.showToast) {
    window.showToast(`NF-e nº ${novaNota.numero_nf} emitida com sucesso! Chave de Acesso gerada e autorizada.`, 'success', 4500);
  }

  // Limpa rascunho e redireciona direto para o DANFE oficial
  initDraftDefaults();
  renderDraftItensTable();
  openDanfe(novaNota.id);
}

// Histórico de Notas Fiscais
function renderHistoricoNotas() {
  const container = document.getElementById('historico-notas-tbody');
  if (!container) return;

  const notas = window.store.getNotasFiscais();
  const searchVal = document.getElementById('busca-historico-notas')?.value.toLowerCase().trim() || '';
  const statusVal = document.getElementById('filtro-status-notas')?.value || '';

  const filtradas = notas.filter(n => {
    const matchSearch = !searchVal || 
      n.numero_nf.toLowerCase().includes(searchVal) ||
      (n.destinatario_nome && n.destinatario_nome.toLowerCase().includes(searchVal)) ||
      (n.destinatario_cnpj && n.destinatario_cnpj.includes(searchVal)) ||
      (n.chave_acesso && n.chave_acesso.includes(searchVal));

    const matchStatus = !statusVal || n.status === statusVal;
    return matchSearch && matchStatus;
  });

  const countBadge = document.getElementById('historico-total-count');
  if (countBadge) countBadge.textContent = `${filtradas.length} notas registradas`;

  if (filtradas.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 36px;">
          <i class="fas fa-file-invoice" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.4;"></i>
          Nenhuma nota fiscal encontrada para os filtros informados.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtradas.map(n => {
    const isAutorizada = n.status === 'AUTORIZADA';
    const badgeStatus = isAutorizada ? 'badge-success' : 'badge-danger';
    const isSaida = n.tipo_operacao === 'SAIDA';
    const badgeTipo = isSaida ? 'badge-info' : 'badge-warning';

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${n.numero_nf}</div>
          <div style="font-size: 0.725rem; color: var(--text-muted);">Série ${n.serie}</div>
        </td>
        <td>
          <div style="font-weight: 500; font-size: 0.8rem;">${formatDateBR(n.data_emissao)}</div>
          <div style="font-size: 0.68rem; color: var(--text-muted); font-family: monospace;">${n.chave_acesso.slice(0, 12)}...</div>
        </td>
        <td>
          <span class="badge ${badgeTipo}">
            <i class="fas ${isSaida ? 'fa-arrow-up' : 'fa-arrow-down'}" style="font-size: 0.65rem;"></i>
            ${isSaida ? '1 - SAÍDA' : '0 - ENTRADA'}
          </span>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${n.tipo_operacao === 'SAIDA' ? n.destinatario_nome : n.emitente_nome}
          </div>
          <div style="font-size: 0.725rem; color: var(--text-muted); font-family: monospace;">
            ${n.tipo_operacao === 'SAIDA' ? n.destinatario_cnpj : n.emitente_cnpj}
          </div>
        </td>
        <td style="text-align: right; font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">
          ${formatBRL(n.valor_total)}
        </td>
        <td style="text-align: center;">
          <span class="badge ${badgeStatus}">
            <i class="fas ${isAutorizada ? 'fa-circle-check' : 'fa-ban'}"></i> ${n.status}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary" onclick="openDanfe(${n.id})" title="Visualizar e Imprimir DANFE Oficial">
              <i class="fas fa-file-invoice"></i> DANFE
            </button>
            <button class="btn btn-sm btn-secondary" onclick="baixarXmlNfe(${n.id})" title="Download do XML Oficial da NF-e">
              <i class="fas fa-code"></i> XML
            </button>
            ${isAutorizada ? `
              <button class="btn btn-sm btn-danger-outline" onclick="cancelarNfePrompt(${n.id})" title="Cancelar NF-e perante o simulador">
                <i class="fas fa-ban"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Abertura do DANFE Oficial
function openDanfe(notaId) {
  currentNotaDanfeId = Number(notaId);
  renderDanfeDocument(currentNotaDanfeId);
  window.switchTab('fiscal-danfe');
}

function renderDanfeDocument(notaId) {
  const container = document.getElementById('danfe-document-container');
  if (!container) return;

  const notas = window.store.getNotasFiscais();
  const nota = notas.find(n => n.id === notaId) || notas[0];

  if (!nota) {
    container.innerHTML = `<div class="p-8 text-center text-muted">Nenhuma nota fiscal selecionada para visualização.</div>`;
    return;
  }

  currentNotaDanfeId = nota.id;

  const emitente = nota.emitente_nome || 'Pallets Brasil Ind. e Comércio Ltda';
  const emitenteCnpj = nota.emitente_cnpj || '14.892.401/0001-88';
  const emitenteIe = nota.emitente_ie || '114.890.320.119';
  const emitenteEnd = nota.emitente_endereco || 'Rodovia dos Bandeirantes, Km 78 - Campinas/SP';

  const destNome = nota.destinatario_nome || '';
  const destCnpj = nota.destinatario_cnpj || '';
  const destIe = nota.destinatario_ie || 'ISENTO';
  const destEnd = nota.destinatario_endereco || '';

  const chaveFormatada = formatChave44(nota.chave_acesso);

  // Layout Oficial de DANFE A4 em conformidade com o Manual de Integração do Contribuinte
  container.innerHTML = `
    <!-- Top Actions Toolbar (Hidden on Print) -->
    <div class="danfe-toolbar no-print">
      <div class="danfe-toolbar-left">
        <button class="btn btn-secondary btn-sm" onclick="window.switchTab('fiscal-historico')">
          <i class="fas fa-arrow-left"></i> Voltar ao Histórico
        </button>
        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
          Visualizando NF-e <strong>nº ${nota.numero_nf}</strong> (${nota.status})
        </span>
      </div>
      <div class="danfe-toolbar-right">
        <button class="btn btn-outline btn-sm" onclick="copiarChaveAcesso('${nota.chave_acesso}')" title="Copiar chave de 44 dígitos">
          <i class="fas fa-copy"></i> Copiar Chave
        </button>
        <button class="btn btn-secondary btn-sm" onclick="baixarXmlNfe(${nota.id})" title="Download do arquivo XML da NF-e">
          <i class="fas fa-download"></i> Baixar XML
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.print()" title="Imprimir documento em folha A4">
          <i class="fas fa-print"></i> Imprimir DANFE
        </button>
      </div>
    </div>

    <!-- DANFE Paper Document Layout -->
    <div class="danfe-sheet">

      <!-- Canhoto Destacável -->
      <div class="danfe-canhoto">
        <div class="canhoto-decl">
          RECEBEMOS DE <strong>${emitente.toUpperCase()}</strong> OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO.<br>
          EMISSÃO: ${formatDateBR(nota.data_emissao)} • DESTINATÁRIO: ${destNome.toUpperCase()} • VALOR TOTAL: ${formatBRL(nota.valor_total)}
        </div>
        <div class="canhoto-rec">
          <div class="canhoto-subbox" style="width: 140px;">DATA DE RECEBIMENTO</div>
          <div class="canhoto-subbox" style="flex: 1;">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</div>
        </div>
        <div class="canhoto-nf">
          <strong>NF-e</strong>
          <span>Nº ${nota.numero_nf}</span>
          <span>SÉRIE ${nota.serie}</span>
        </div>
      </div>

      <div class="danfe-picote">------------------------------------------------- CORTE NA LINHA PONTILHADA -------------------------------------------------</div>

      <!-- Cabeçalho Principal do DANFE -->
      <div class="danfe-grid-header">
        <div class="danfe-box danfe-emitente">
          <div class="emitente-brand">
            <div class="emit-logo-ico"><i class="fas fa-cubes"></i></div>
            <div class="emit-text">
              <h3>${emitente}</h3>
              <p>${emitenteEnd}</p>
              <p>FONE: (19) 3450-8800 • CEP: 13054-700</p>
            </div>
          </div>
        </div>

        <div class="danfe-box danfe-ident">
          <h2>DANFE</h2>
          <p>Documento Auxiliar da<br>Nota Fiscal Eletrônica</p>
          <div class="danfe-tipo-op">
            <div>0 - ENTRADA</div>
            <div class="tipo-op-badge">${nota.tipo_operacao === 'ENTRADA' ? '0' : '1'}</div>
            <div>1 - SAÍDA</div>
          </div>
          <div class="danfe-num-serie">
            <strong>Nº ${nota.numero_nf}</strong>
            <span>SÉRIE ${nota.serie} • FOLHA 1/1</span>
          </div>
        </div>

        <div class="danfe-box danfe-barcode-box">
          <!-- Simulação Gráfica Autêntica de Código de Barras Code 128 -->
          <div class="barcode-svg-wrap">
            <svg class="barcode-svg" viewBox="0 0 320 54" preserveAspectRatio="none">
              ${generateBarcodePattern()}
            </svg>
          </div>
          <div class="chave-label">CHAVE DE ACESSO</div>
          <div class="chave-acesso">${chaveFormatada}</div>
          <div class="chave-info">Consulta de autenticidade no portal nacional da NF-e<br><strong>www.nfe.fazenda.gov.br/portal</strong> ou no site da SEFAZ autorizadora.</div>
        </div>
      </div>

      <!-- Protocolo e Dados Cadastrais -->
      <div class="danfe-row-quad">
        <div class="danfe-box" style="flex: 2;">
          <label>NATUREZA DA OPERAÇÃO</label>
          <div>${nota.natureza_operacao}</div>
        </div>
        <div class="danfe-box" style="flex: 1.5;">
          <label>PROTOCOLO DE AUTORIZAÇÃO DE USO</label>
          <div style="font-weight: 700; color: #047857;">${nota.protocolo_autorizacao}</div>
        </div>
      </div>

      <div class="danfe-row-quad">
        <div class="danfe-box">
          <label>INSCRIÇÃO ESTADUAL</label>
          <div>${emitenteIe}</div>
        </div>
        <div class="danfe-box">
          <label>INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</label>
          <div>-</div>
        </div>
        <div class="danfe-box">
          <label>CNPJ DO EMITENTE</label>
          <div>${emitenteCnpj}</div>
        </div>
      </div>

      <!-- Destinatário / Remetente -->
      <div class="danfe-section-title">DESTINATÁRIO / REMETENTE</div>
      <div class="danfe-row-quad">
        <div class="danfe-box" style="flex: 2.5;">
          <label>NOME / RAZÃO SOCIAL</label>
          <div style="font-weight: 700;">${destNome}</div>
        </div>
        <div class="danfe-box" style="flex: 1.5;">
          <label>CNPJ / CPF</label>
          <div>${destCnpj}</div>
        </div>
        <div class="danfe-box" style="width: 140px;">
          <label>DATA DA EMISSÃO</label>
          <div>${nota.data_emissao ? nota.data_emissao.split('T')[0] : '-'}</div>
        </div>
      </div>

      <div class="danfe-row-quad">
        <div class="danfe-box" style="flex: 2;">
          <label>ENDEREÇO</label>
          <div>${destEnd}</div>
        </div>
        <div class="danfe-box" style="flex: 1;">
          <label>MUNICÍPIO / UF</label>
          <div>${destEnd.includes('-') ? destEnd.split('-').pop() : 'SP'}</div>
        </div>
        <div class="danfe-box" style="width: 140px;">
          <label>DATA SAÍDA / ENTRADA</label>
          <div>${nota.data_saida_entrada ? nota.data_saida_entrada.split('T')[0] : '-'}</div>
        </div>
      </div>

      <!-- Faturas / Duplicatas -->
      <div class="danfe-section-title">FATURA / DUPLICATAS</div>
      <div class="danfe-duplicatas-row">
        ${(nota.duplicatas || []).map(d => `
          <div class="dup-item-card">
            <span>Nº ${d.numero}</span>
            <span>VENC: <strong>${d.vencimento}</strong></span>
            <span>VALOR: <strong>${formatBRL(d.valor)}</strong></span>
          </div>
        `).join('')}
      </div>

      <!-- Cálculo do Imposto -->
      <div class="danfe-section-title">CÁLCULO DO IMPOSTO</div>
      <div class="danfe-row-quad">
        <div class="danfe-box"><label>BASE DE CÁLCULO DO ICMS</label><div class="val">${formatBRL(nota.base_calculo_icms)}</div></div>
        <div class="danfe-box"><label>VALOR DO ICMS</label><div class="val">${formatBRL(nota.valor_icms)}</div></div>
        <div class="danfe-box"><label>BASE DE CÁLCULO ICMS ST</label><div class="val">${formatBRL(nota.base_calculo_icms_st)}</div></div>
        <div class="danfe-box"><label>VALOR DO ICMS ST</label><div class="val">${formatBRL(nota.valor_icms_st)}</div></div>
        <div class="danfe-box"><label>VALOR TOTAL DOS PRODUTOS</label><div class="val" style="font-weight: 700;">${formatBRL(nota.valor_produtos)}</div></div>
      </div>

      <div class="danfe-row-quad">
        <div class="danfe-box"><label>VALOR DO FRETE</label><div class="val">${formatBRL(nota.valor_frete)}</div></div>
        <div class="danfe-box"><label>VALOR DO SEGURO</label><div class="val">${formatBRL(nota.valor_seguro)}</div></div>
        <div class="danfe-box"><label>DESCONTO</label><div class="val">${formatBRL(nota.valor_desconto)}</div></div>
        <div class="danfe-box"><label>OUTRAS DESPESAS</label><div class="val">${formatBRL(nota.outras_despesas)}</div></div>
        <div class="danfe-box"><label>VALOR DO IPI</label><div class="val">${formatBRL(nota.valor_ipi)}</div></div>
        <div class="danfe-box val-highlight"><label>VALOR TOTAL DA NOTA</label><div class="val font-bold">${formatBRL(nota.valor_total)}</div></div>
      </div>

      <!-- Transportador / Volumes -->
      <div class="danfe-section-title">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
      <div class="danfe-row-quad">
        <div class="danfe-box" style="flex: 2;"><label>RAZÃO SOCIAL</label><div>${nota.transportadora_nome || 'O MESMO'}</div></div>
        <div class="danfe-box" style="flex: 1;"><label>FRETE POR CONTA</label><div>${nota.modalidade_frete || '0 - Emitente'}</div></div>
        <div class="danfe-box" style="width: 90px;"><label>PLACA VEÍCULO</label><div>${nota.veiculo_placa || 'BRA2E19'}</div></div>
        <div class="danfe-box" style="width: 50px;"><label>UF</label><div>${nota.veiculo_uf || 'SP'}</div></div>
        <div class="danfe-box" style="flex: 1.2;"><label>CNPJ / CPF</label><div>${nota.transportadora_cnpj || 'ISENTO'}</div></div>
      </div>

      <div class="danfe-row-quad">
        <div class="danfe-box"><label>QUANTIDADE</label><div>${nota.volumes_quantidade || nota.itens?.length || 1}</div></div>
        <div class="danfe-box"><label>ESPÉCIE</label><div>${nota.volumes_especie || 'PALLETS'}</div></div>
        <div class="danfe-box"><label>PESO BRUTO</label><div>${(nota.peso_bruto || 0).toLocaleString('pt-BR')} kg</div></div>
        <div class="danfe-box"><label>PESO LÍQUIDO</label><div>${(nota.peso_liquido || 0).toLocaleString('pt-BR')} kg</div></div>
      </div>

      <!-- Dados dos Produtos e Serviços -->
      <div class="danfe-section-title">DADOS DOS PRODUTOS / SERVIÇOS</div>
      <table class="danfe-itens-table">
        <thead>
          <tr>
            <th>CÓDIGO</th>
            <th style="width: 32%;">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
            <th>NCM/SH</th>
            <th>CST</th>
            <th>CFOP</th>
            <th>UNID</th>
            <th style="text-align: right;">QTD</th>
            <th style="text-align: right;">VLR UNIT</th>
            <th style="text-align: right;">VLR TOTAL</th>
            <th style="text-align: right;">BC ICMS</th>
            <th style="text-align: right;">VLR ICMS</th>
            <th style="text-align: right;">ALÍQ %</th>
          </tr>
        </thead>
        <tbody>
          ${(nota.itens || []).map(it => `
            <tr>
              <td>${it.codigo}</td>
              <td style="font-weight: 600;">${it.descricao}</td>
              <td>${it.ncm}</td>
              <td>${it.cst}</td>
              <td>${it.cfop}</td>
              <td style="text-align: center;">${it.unidade}</td>
              <td style="text-align: right; font-weight: 600;">${Number(it.quantidade).toLocaleString('pt-BR')}</td>
              <td style="text-align: right;">${formatBRL(it.valor_unitario)}</td>
              <td style="text-align: right; font-weight: 700;">${formatBRL(it.valor_total)}</td>
              <td style="text-align: right;">${formatBRL(it.base_calculo_icms)}</td>
              <td style="text-align: right;">${formatBRL(it.valor_icms)}</td>
              <td style="text-align: right;">${it.aliq_icms}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Dados Adicionais -->
      <div class="danfe-section-title">DADOS ADICIONAIS</div>
      <div class="danfe-row-quad" style="margin-bottom: 0;">
        <div class="danfe-box" style="flex: 2.5; min-height: 70px;">
          <label>INFORMAÇÕES COMPLEMENTARES</label>
          <div style="font-size: 0.68rem; line-height: 1.35; color: #1e293b;">
            ${nota.informacoes_complementares}
          </div>
        </div>
        <div class="danfe-box" style="flex: 1; min-height: 70px;">
          <label>RESERVADO AO FISCO</label>
          <div style="font-size: 0.68rem; color: #64748b;">
            EMITIDA EM CONTINGÊNCIA / AUTORIZADA ONLINE.<br>SEFAZ / SP - PROTOCOLO Nº ${nota.protocolo_autorizacao.split(' ')[0]}
          </div>
        </div>
      </div>

    </div>
  `;
}

// Gera padrão visual autêntico de código de barras Code128 em SVG
function generateBarcodePattern() {
  let bars = '';
  let x = 6;
  const widths = [1.2, 2.5, 3.8, 1.8, 4.2, 1.5, 2.8, 3.4, 2.0, 1.3, 4.0, 2.2];
  while (x < 312) {
    const w = widths[Math.floor(Math.random() * widths.length)];
    bars += `<rect x="${x.toFixed(1)}" y="0" width="${w}" height="54" fill="#000000" />`;
    x += w + (Math.random() > 0.4 ? 1.6 : 3.2);
  }
  return bars;
}

// Download do XML Oficial da NF-e
function baixarXmlNfe(notaId) {
  const notas = window.store.getNotasFiscais();
  const nota = notas.find(n => n.id === Number(notaId));
  if (!nota) return;

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe${nota.chave_acesso}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${nota.chave_acesso.slice(35, 43)}</cNF>
        <natOp>${nota.natureza_operacao}</natOp>
        <mod>55</mod>
        <serie>${nota.serie}</serie>
        <nNF>${nota.numero_nf.replace(/\D/g, '')}</nNF>
        <dhEmi>${nota.data_emissao}</dhEmi>
        <tpNF>${nota.tipo_operacao === 'ENTRADA' ? '0' : '1'}</tpNF>
        <idDest>1</idDest>
        <cMunFG>3509502</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${nota.chave_acesso.slice(-1)}</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>PRODEX_ERP_v3.0</verProc>
      </ide>
      <emit>
        <CNPJ>${(nota.emitente_cnpj || '14892401000188').replace(/\D/g, '')}</CNPJ>
        <xNome>${nota.emitente_nome}</xNome>
        <xFant>Pallets Brasil</xFant>
        <IE>${nota.emitente_ie || '114890320119'}</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>${(nota.destinatario_cnpj || '').replace(/\D/g, '')}</CNPJ>
        <xNome>${nota.destinatario_nome}</xNome>
        <IE>${nota.destinatario_ie || 'ISENTO'}</IE>
      </dest>
      ${(nota.itens || []).map((it, idx) => `
      <det nItem="${idx + 1}">
        <prod>
          <cProd>${it.codigo}</cProd>
          <xProd>${it.descricao}</xProd>
          <NCM>${(it.ncm || '').replace(/\D/g, '')}</NCM>
          <CFOP>${(it.cfop || '').replace(/\D/g, '')}</CFOP>
          <uCom>${it.unidade}</uCom>
          <qCom>${Number(it.quantidade).toFixed(4)}</qCom>
          <vUnCom>${Number(it.valor_unitario).toFixed(4)}</vUnCom>
          <vProd>${Number(it.valor_total).toFixed(2)}</vProd>
          <uTrib>${it.unidade}</uTrib>
          <qTrib>${Number(it.quantidade).toFixed(4)}</qTrib>
          <vUnTrib>${Number(it.valor_unitario).toFixed(4)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>${it.cst || '000'}</CST>
              <modBC>3</modBC>
              <vBC>${Number(it.base_calculo_icms).toFixed(2)}</vBC>
              <pICMS>${Number(it.aliq_icms).toFixed(2)}</pICMS>
              <vICMS>${Number(it.valor_icms).toFixed(2)}</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>`).join('')}
      <total>
        <ICMSTot>
          <vBC>${Number(nota.base_calculo_icms).toFixed(2)}</vBC>
          <vICMS>${Number(nota.valor_icms).toFixed(2)}</vICMS>
          <vProd>${Number(nota.valor_produtos).toFixed(2)}</vProd>
          <vNF>${Number(nota.valor_total).toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>SP_NFE_PL_009k</verAplic>
      <chNFe>${nota.chave_acesso}</chNFe>
      <dhRecbto>${nota.data_emissao}</dhRecbto>
      <nProt>${nota.protocolo_autorizacao.split(' ')[0]}</nProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NFe-${nota.chave_acesso}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (window.showToast) window.showToast(`Arquivo XML da NF-e nº ${nota.numero_nf} baixado com sucesso!`, 'success');
}

// Copiar chave de acesso
function copiarChaveAcesso(chave) {
  navigator.clipboard.writeText(chave).then(() => {
    if (window.showToast) window.showToast('Chave de acesso copiada para a área de transferência!', 'success');
  }).catch(() => {
    prompt('Copie a chave de acesso abaixo:', chave);
  });
}

// Cancelamento de NF-e
function cancelarNfePrompt(notaId) {
  const motivo = prompt('Informe a justificativa de cancelamento da NF-e (mínimo 15 caracteres):', 'Erro no preenchimento de dados cadastrais');
  if (motivo && motivo.trim().length >= 10) {
    window.store.cancelarNotaFiscal(notaId, motivo.trim());
    renderHistoricoNotas();
    if (currentNotaDanfeId === Number(notaId)) {
      renderDanfeDocument(notaId);
    }
    if (window.showToast) window.showToast(`NF-e cancelada com sucesso.`, 'warning');
  }
}

// Gestão de Parceiros (Clientes & Fornecedores)
function renderParceirosTable() {
  const container = document.getElementById('parceiros-tbody');
  if (!container) return;

  const parceiros = window.store.getParceiros();
  const searchVal = document.getElementById('busca-parceiros')?.value.toLowerCase().trim() || '';
  const tipoVal = document.getElementById('filtro-tipo-parceiros')?.value || '';

  const filtrados = parceiros.filter(p => {
    const matchSearch = !searchVal || 
      p.razao_social.toLowerCase().includes(searchVal) ||
      (p.nome_fantasia && p.nome_fantasia.toLowerCase().includes(searchVal)) ||
      p.cnpj.includes(searchVal) ||
      p.municipio.toLowerCase().includes(searchVal);

    const matchTipo = !tipoVal || p.tipo === tipoVal;
    return matchSearch && matchTipo;
  });

  const countBadge = document.getElementById('parceiros-total-count');
  if (countBadge) countBadge.textContent = `${filtrados.length} parceiros cadastrados`;

  if (filtrados.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
          Nenhum parceiro fiscal encontrado.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtrados.map(p => {
    let badgeClass = 'badge-primary';
    if (p.tipo === 'FORNECEDOR') badgeClass = 'badge-warning';
    if (p.tipo === 'EMITENTE') badgeClass = 'badge-success';

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${p.razao_social}</div>
          <div style="font-size: 0.725rem; color: var(--text-muted);">${p.nome_fantasia || '-'}</div>
        </td>
        <td>
          <span class="badge ${badgeClass}">${p.tipo}</span>
        </td>
        <td style="font-family: monospace; font-size: 0.85rem;">
          <div>${p.cnpj}</div>
          <div style="font-size: 0.725rem; color: var(--text-muted);">IE: ${p.inscricao_estadual || 'ISENTO'}</div>
        </td>
        <td>
          <div>${p.municipio} - ${p.uf}</div>
          <div style="font-size: 0.725rem; color: var(--text-muted);">${p.logradouro}, ${p.numero}</div>
        </td>
        <td style="font-size: 0.85rem;">
          <div><i class="fas fa-phone" style="font-size: 0.7rem; color: var(--text-muted);"></i> ${p.telefone || '-'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);"><i class="fas fa-envelope" style="font-size: 0.7rem;"></i> ${p.email || '-'}</div>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-sm btn-outline" onclick="openEditarParceiro(${p.id})" title="Editar cadastro fiscal">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-primary" onclick="iniciarNotaParaParceiro(${p.id})" title="Faturar nova nota fiscal para este parceiro">
              <i class="fas fa-file-circle-plus"></i> Faturar
            </button>
            ${p.tipo !== 'EMITENTE' ? `
              <button class="btn btn-sm btn-danger-outline" onclick="excluirParceiroPrompt(${p.id})" title="Excluir parceiro">
                <i class="fas fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openNovoParceiroModal() {
  document.getElementById('form-modal-parceiro')?.reset();
  const idInput = document.getElementById('parceiro-id');
  if (idInput) idInput.value = '';
  const titleEl = document.getElementById('modal-parceiro-title');
  if (titleEl) titleEl.textContent = 'Novo Parceiro Comercial (Cliente / Fornecedor)';
  openModal('modal-fiscal-parceiro');
}

function openEditarParceiro(id) {
  const p = window.store.getParceiroById(id);
  if (!p) return;

  document.getElementById('parceiro-id').value = p.id;
  document.getElementById('parceiro-razao').value = p.razao_social;
  document.getElementById('parceiro-fantasia').value = p.nome_fantasia || '';
  document.getElementById('parceiro-cnpj').value = p.cnpj;
  document.getElementById('parceiro-tipo').value = p.tipo;
  document.getElementById('parceiro-ie').value = p.inscricao_estadual || '';
  document.getElementById('parceiro-logradouro').value = p.logradouro || '';
  document.getElementById('parceiro-numero').value = p.numero || '';
  document.getElementById('parceiro-bairro').value = p.bairro || '';
  document.getElementById('parceiro-municipio').value = p.municipio;
  document.getElementById('parceiro-uf').value = p.uf;
  document.getElementById('parceiro-cep').value = p.cep || '';
  document.getElementById('parceiro-telefone').value = p.telefone || '';
  document.getElementById('parceiro-email').value = p.email || '';

  const titleEl = document.getElementById('modal-parceiro-title');
  if (titleEl) titleEl.textContent = `Editar Parceiro: ${p.razao_social}`;
  openModal('modal-fiscal-parceiro');
}

function salvarParceiroSubmit() {
  const id = document.getElementById('parceiro-id')?.value;
  const payload = {
    id: id ? Number(id) : null,
    razao_social: document.getElementById('parceiro-razao')?.value.trim(),
    nome_fantasia: document.getElementById('parceiro-fantasia')?.value.trim(),
    cnpj: document.getElementById('parceiro-cnpj')?.value.trim(),
    tipo: document.getElementById('parceiro-tipo')?.value || 'CLIENTE',
    inscricao_estadual: document.getElementById('parceiro-ie')?.value.trim() || 'ISENTO',
    logradouro: document.getElementById('parceiro-logradouro')?.value.trim(),
    numero: document.getElementById('parceiro-numero')?.value.trim(),
    bairro: document.getElementById('parceiro-bairro')?.value.trim(),
    municipio: document.getElementById('parceiro-municipio')?.value.trim() || 'São Paulo',
    uf: document.getElementById('parceiro-uf')?.value.trim().toUpperCase() || 'SP',
    cep: document.getElementById('parceiro-cep')?.value.trim(),
    telefone: document.getElementById('parceiro-telefone')?.value.trim(),
    email: document.getElementById('parceiro-email')?.value.trim()
  };

  if (!payload.razao_social || !payload.cnpj) {
    if (window.showToast) window.showToast('Preencha a Razão Social e o CNPJ.', 'warning');
    return;
  }

  window.store.saveParceiro(payload);
  closeModal('modal-fiscal-parceiro');
  renderParceirosTable();
  populateFiscalSelects();
  if (window.showToast) window.showToast(`Parceiro "${payload.razao_social}" salvo com sucesso!`, 'success');
}

function excluirParceiroPrompt(id) {
  const p = window.store.getParceiroById(id);
  if (!p) return;
  if (confirm(`Deseja realmente remover o parceiro fiscal "${p.razao_social}"?`)) {
    window.store.deleteParceiro(id);
    renderParceirosTable();
    populateFiscalSelects();
    if (window.showToast) window.showToast('Parceiro removido com sucesso.', 'info');
  }
}

function iniciarNotaParaParceiro(id) {
  window.switchTab('fiscal-nova-nota');
  const selDest = document.getElementById('nf-destinatario-select');
  if (selDest) {
    selDest.value = String(id);
  }
}

// Expor funções globais para handlers inline HTML
window.initFiscal = initFiscal;
window.openModalAdicionarItem = openModalAdicionarItem;
window.removeDraftItem = removeDraftItem;
window.openDanfe = openDanfe;
window.baixarXmlNfe = baixarXmlNfe;
window.copiarChaveAcesso = copiarChaveAcesso;
window.cancelarNfePrompt = cancelarNfePrompt;
window.openNovoParceiroModal = openNovoParceiroModal;
window.openEditarParceiro = openEditarParceiro;
window.iniciarNotaParaParceiro = iniciarNotaParaParceiro;
window.excluirParceiroPrompt = excluirParceiroPrompt;
