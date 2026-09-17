/**
 * products.js - Product Catalog & Inventory Management
 */

let currentEditingProductId = null;
let currentAdjustProductId = null;

function initProducts() {
  renderProductsTable();
  setupProductListeners();
}

function renderProductsTable() {
  const container = document.getElementById('products-table-body');
  if (!container) return;

  const searchQuery = (document.getElementById('search-products')?.value || '').toLowerCase();
  const categoryFilter = document.getElementById('filter-product-category')?.value || '';
  const statusFilter = document.getElementById('filter-product-status')?.value || '';

  let products = window.store.getProducts();

  // Apply search
  if (searchQuery) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery) ||
      p.code.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery) ||
      (p.location && p.location.toLowerCase().includes(searchQuery))
    );
  }

  // Apply category filter
  if (categoryFilter) {
    products = products.filter(p => p.category === categoryFilter);
  }

  // Apply status filter
  if (statusFilter === 'critical') {
    products = products.filter(p => p.stock <= p.minStock);
  } else if (statusFilter === 'normal') {
    products = products.filter(p => p.stock > p.minStock);
  } else if (statusFilter === 'empty') {
    products = products.filter(p => p.stock === 0);
  }

  const countEl = document.getElementById('products-count-badge');
  if (countEl) countEl.textContent = `${products.length} itens encontrados`;

  if (products.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 32px;">
          Nenhum produto encontrado com os filtros selecionados.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const isCritical = p.stock <= p.minStock;
    const isZero = p.stock === 0;
    let badgeHtml = '<span class="badge badge-success">NORMAL</span>';
    if (isZero) {
      badgeHtml = '<span class="badge badge-danger">ESGOTADO</span>';
    } else if (isCritical) {
      badgeHtml = '<span class="badge badge-warning">BAIXO</span>';
    }

    const costFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.costPrice || 0);
    const saleFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.salePrice || 0);
    const totalVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((p.stock * p.costPrice) || 0);

    return `
      <tr>
        <td><strong style="font-family: monospace; color: var(--color-primary);">${p.code}</strong></td>
        <td>
          <div class="cell-product">
            <span class="cell-product-name">${p.name}</span>
            <span class="cell-product-code">${p.location || 'Sem localização'}</span>
          </div>
        </td>
        <td><span class="badge badge-secondary">${p.category}</span></td>
        <td><strong>${p.stock}</strong> <span style="color: var(--text-muted); font-size: 0.8rem;">${p.unit}</span></td>
        <td>${p.minStock} <span style="color: var(--text-muted); font-size: 0.8rem;">${p.unit}</span></td>
        <td>${costFormatted}</td>
        <td>${saleFormatted}</td>
        <td><strong>${totalVal}</strong></td>
        <td>${badgeHtml}</td>
        <td>
          <div class="table-actions">
            <button class="btn-table-action" title="Movimentar Estoque" onclick="openAdjustModal('${p.id}')">
              <i class="fas fa-exchange-alt"></i>
            </button>
            <button class="btn-table-action" title="Editar Produto" onclick="openEditProductModal('${p.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-table-action delete" title="Excluir Produto" onclick="confirmDeleteProduct('${p.id}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupProductListeners() {
  const searchInput = document.getElementById('search-products');
  const catFilter = document.getElementById('filter-product-category');
  const statusFilter = document.getElementById('filter-product-status');

  if (searchInput) searchInput.addEventListener('input', renderProductsTable);
  if (catFilter) catFilter.addEventListener('change', renderProductsTable);
  if (statusFilter) statusFilter.addEventListener('change', renderProductsTable);

  // Form submit for New/Edit Product
  const form = document.getElementById('form-product');
  if (form) {
    form.addEventListener('submit', handleProductFormSubmit);
  }

  // Form submit for Quick Adjust
  const adjustForm = document.getElementById('form-stock-adjust');
  if (adjustForm) {
    adjustForm.addEventListener('submit', handleStockAdjustSubmit);
  }
}

function openNewProductModal() {
  currentEditingProductId = null;
  const form = document.getElementById('form-product');
  if (form) form.reset();

  const title = document.getElementById('modal-product-title');
  if (title) title.textContent = 'Cadastrar Novo Produto';

  const codeInput = document.getElementById('prod-code');
  if (codeInput) codeInput.value = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;

  window.openModal('modal-product');
}

function openEditProductModal(id) {
  currentEditingProductId = id;
  const prod = window.store.getProductById(id);
  if (!prod) return;

  const title = document.getElementById('modal-product-title');
  if (title) title.textContent = `Editar Produto: ${prod.name}`;

  document.getElementById('prod-code').value = prod.code || '';
  document.getElementById('prod-name').value = prod.name || '';
  document.getElementById('prod-category').value = prod.category || 'Matéria-Prima';
  document.getElementById('prod-unit').value = prod.unit || 'un';
  document.getElementById('prod-cost').value = prod.costPrice || 0;
  document.getElementById('prod-sale').value = prod.salePrice || 0;
  document.getElementById('prod-stock').value = prod.stock || 0;
  document.getElementById('prod-min-stock').value = prod.minStock || 0;
  document.getElementById('prod-max-stock').value = prod.maxStock || 100;
  document.getElementById('prod-location').value = prod.location || '';
  document.getElementById('prod-notes').value = prod.notes || '';

  window.openModal('modal-product');
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const productData = {
    code: document.getElementById('prod-code').value.trim(),
    name: document.getElementById('prod-name').value.trim(),
    category: document.getElementById('prod-category').value,
    unit: document.getElementById('prod-unit').value,
    costPrice: document.getElementById('prod-cost').value,
    salePrice: document.getElementById('prod-sale').value,
    stock: document.getElementById('prod-stock').value,
    minStock: document.getElementById('prod-min-stock').value,
    maxStock: document.getElementById('prod-max-stock').value,
    location: document.getElementById('prod-location').value.trim(),
    notes: document.getElementById('prod-notes').value.trim()
  };

  if (!productData.name) {
    alert('Por favor, informe o nome do produto.');
    return;
  }

  if (currentEditingProductId) {
    window.store.updateProduct(currentEditingProductId, productData);
    window.showToast('Produto atualizado com sucesso!', 'success');
  } else {
    window.store.addProduct(productData);
    window.showToast('Novo produto cadastrado com sucesso!', 'success');
  }

  window.closeModal('modal-product');
  renderProductsTable();
}

function confirmDeleteProduct(id) {
  const prod = window.store.getProductById(id);
  if (!prod) return;

  if (confirm(`Tem certeza que deseja excluir o produto "${prod.name}"? Esta ação removerá o item do inventário.`)) {
    window.store.deleteProduct(id);
    window.showToast('Produto excluído com sucesso.', 'info');
    renderProductsTable();
  }
}

// Adjust modal
function openAdjustModal(productId) {
  currentAdjustProductId = productId;
  const prod = window.store.getProductById(productId);
  if (!prod) return;

  document.getElementById('adjust-prod-name').textContent = `${prod.name} (${prod.code})`;
  document.getElementById('adjust-prod-current-stock').textContent = `${prod.stock} ${prod.unit}`;
  document.getElementById('adjust-qty').value = '';
  document.getElementById('adjust-reason').value = '';
  document.getElementById('adjust-responsible').value = '';

  window.openModal('modal-adjust-stock');
}

function handleStockAdjustSubmit(e) {
  e.preventDefault();
  if (!currentAdjustProductId) return;

  const prod = window.store.getProductById(currentAdjustProductId);
  if (!prod) return;

  const type = document.getElementById('adjust-type').value; // ENTRADA, SAIDA, AJUSTE
  const qty = parseFloat(document.getElementById('adjust-qty').value);
  const reason = document.getElementById('adjust-reason').value.trim();
  const responsible = document.getElementById('adjust-responsible').value.trim() || 'Operador';

  if (isNaN(qty) || qty <= 0) {
    alert('Por favor informe uma quantidade válida.');
    return;
  }

  let delta = qty;
  if (type === 'SAIDA') {
    if (qty > prod.stock) {
      if (!confirm(`A quantidade de saída (${qty}) é maior que o saldo atual (${prod.stock}). O saldo ficará zerado. Deseja continuar?`)) {
        return;
      }
    }
    delta = -qty;
  } else if (type === 'AJUSTE') {
    // Nova contagem física
    delta = qty - prod.stock;
  }

  window.store.adjustStock(prod.id, delta, type, reason, responsible);
  window.showToast(`Movimentação de ${type} registrada para "${prod.name}"!`, 'success');
  window.closeModal('modal-adjust-stock');
  renderProductsTable();
}

// Expose globals
window.openNewProductModal = openNewProductModal;
window.openEditProductModal = openEditProductModal;
window.confirmDeleteProduct = confirmDeleteProduct;
window.openAdjustModal = openAdjustModal;
