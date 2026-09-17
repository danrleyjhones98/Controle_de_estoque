/**
 * movements.js - Stock In/Out/Adjustment Audit Trail
 */

function initMovements() {
  renderMovementsTable();
  setupMovementListeners();
}

function renderMovementsTable() {
  const container = document.getElementById('movements-table-body');
  if (!container) return;

  const typeFilter = document.getElementById('filter-movement-type')?.value || '';
  const searchFilter = (document.getElementById('search-movements')?.value || '').toLowerCase();

  let movements = window.store.getMovements();
  const products = window.store.getProducts();

  if (typeFilter) {
    movements = movements.filter(m => m.type === typeFilter);
  }

  if (searchFilter) {
    movements = movements.filter(m => {
      const prod = products.find(p => p.id === m.productId);
      const prodName = prod ? prod.name.toLowerCase() : '';
      const prodCode = prod ? prod.code.toLowerCase() : '';
      return (
        m.reason.toLowerCase().includes(searchFilter) ||
        m.responsible.toLowerCase().includes(searchFilter) ||
        prodName.includes(searchFilter) ||
        prodCode.includes(searchFilter)
      );
    });
  }

  const countBadge = document.getElementById('movements-count-badge');
  if (countBadge) countBadge.textContent = `${movements.length} registros`;

  if (movements.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
          Nenhuma movimentação encontrada com os filtros aplicados.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = movements.map(m => {
    const prod = products.find(p => p.id === m.productId);
    const prodName = prod ? prod.name : 'Produto Desconhecido';
    const prodCode = prod ? prod.code : '-';
    const unit = prod ? prod.unit : 'un';

    let badgeClass = 'badge-success';
    let typeIcon = 'fa-arrow-down';
    let qtySign = '+';
    let qtyColor = 'var(--color-success)';

    if (m.type === 'SAIDA') {
      badgeClass = 'badge-danger';
      typeIcon = 'fa-arrow-up';
      qtySign = '-';
      qtyColor = 'var(--color-danger)';
    } else if (m.type === 'AJUSTE') {
      badgeClass = 'badge-warning';
      typeIcon = 'fa-sliders-h';
      qtySign = m.quantity >= 0 ? '+' : '';
      qtyColor = 'var(--color-warning)';
    }

    const dateObj = new Date(m.date);
    const dateFormatted = isNaN(dateObj.getTime()) ? m.date : dateObj.toLocaleString('pt-BR');
    const totalVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(m.totalPrice) || 0);

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 0.8rem; color: var(--text-secondary);">${dateFormatted}</td>
        <td>
          <span class="badge ${badgeClass}">
            <i class="fas ${typeIcon}" style="font-size: 0.7rem;"></i> ${m.type}
          </span>
        </td>
        <td>
          <div class="cell-product">
            <span class="cell-product-name">${prodName}</span>
            <span class="cell-product-code">${prodCode}</span>
          </div>
        </td>
        <td>
          <strong style="color: ${qtyColor}; font-size: 0.95rem;">
            ${qtySign}${Math.abs(m.quantity)} ${unit}
          </strong>
        </td>
        <td><strong>${totalVal}</strong></td>
        <td><span style="font-weight: 500;">${m.responsible || 'Sistema'}</span></td>
        <td><span style="color: var(--text-secondary); font-size: 0.825rem;">${m.reason || '-'}</span></td>
      </tr>
    `;
  }).join('');
}

function setupMovementListeners() {
  const typeFilter = document.getElementById('filter-movement-type');
  const searchFilter = document.getElementById('search-movements');

  if (typeFilter) typeFilter.addEventListener('change', renderMovementsTable);
  if (searchFilter) searchFilter.addEventListener('input', renderMovementsTable);

  const form = document.getElementById('form-manual-movement');
  if (form) form.addEventListener('submit', handleManualMovementSubmit);
}

function openNewMovementModal() {
  const products = window.store.getProducts();
  const select = document.getElementById('mov-product-select');
  if (select) {
    select.innerHTML = '<option value="">Selecione o Produto...</option>';
    products.forEach(p => {
      select.innerHTML += `<option value="${p.id}">${p.name} [Saldo: ${p.stock} ${p.unit}]</option>`;
    });
  }

  const form = document.getElementById('form-manual-movement');
  if (form) form.reset();

  window.openModal('modal-manual-movement');
}

function handleManualMovementSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById('mov-product-select').value;
  const type = document.getElementById('mov-type-select').value;
  const qty = parseFloat(document.getElementById('mov-qty').value);
  const responsible = document.getElementById('mov-responsible').value.trim() || 'Almoxarifado';
  const reason = document.getElementById('mov-reason').value.trim();

  if (!productId) {
    alert('Selecione um produto.');
    return;
  }
  if (isNaN(qty) || qty <= 0) {
    alert('Informe uma quantidade válida.');
    return;
  }

  let delta = qty;
  if (type === 'SAIDA') {
    delta = -qty;
  }

  window.store.adjustStock(productId, delta, type, reason, responsible);
  window.showToast(`Movimentação de ${type} lançada com sucesso!`, 'success');
  window.closeModal('modal-manual-movement');
  renderMovementsTable();
}

// Global exports
window.openNewMovementModal = openNewMovementModal;
