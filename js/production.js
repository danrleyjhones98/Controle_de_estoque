/**
 * production.js - Employees Management & Daily Production Tracking
 */

let currentEditingEmployeeId = null;
let currentEditingProductionId = null;

function initProduction() {
  renderEmployeesGrid();
  renderProductionTable();
  setupProductionListeners();
}

function renderEmployeesGrid() {
  const container = document.getElementById('employees-grid-container');
  if (!container) return;

  const searchQuery = (document.getElementById('search-employees')?.value || '').toLowerCase();
  const shiftFilter = document.getElementById('filter-employee-shift')?.value || '';
  const statusFilter = document.getElementById('filter-employee-status')?.value || '';

  let employees = window.store.getEmployees();
  const production = window.store.getProductionRecords();
  const todayStr = new Date().toISOString().split('T')[0];

  if (searchQuery) {
    employees = employees.filter(e => 
      e.name.toLowerCase().includes(searchQuery) ||
      e.badge.toLowerCase().includes(searchQuery) ||
      e.role.toLowerCase().includes(searchQuery) ||
      (e.department && e.department.toLowerCase().includes(searchQuery))
    );
  }

  if (shiftFilter) {
    employees = employees.filter(e => e.shift === shiftFilter);
  }

  if (statusFilter) {
    employees = employees.filter(e => e.status === statusFilter);
  }

  const countBadge = document.getElementById('employees-count-badge');
  if (countBadge) countBadge.textContent = `${employees.length} colaboradores`;

  if (employees.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px; background: var(--bg-card); border-radius: var(--radius-lg);">
        Nenhum colaborador encontrado com os filtros informados.
      </div>
    `;
    return;
  }

  container.innerHTML = employees.map(emp => {
    const initials = emp.name.split(' ').map(n => n[0]).slice(0, 2).join('');
    
    // Calculate today's production for this employee
    const todayRecords = production.filter(r => r.employeeId === emp.id && r.date === todayStr);
    const producedToday = todayRecords.reduce((acc, r) => acc + r.quantityProduced, 0);
    const defectsToday = todayRecords.reduce((acc, r) => acc + (r.defectsCount || 0), 0);

    // Efficiency
    const target = emp.dailyTarget || 1;
    const percent = Math.min(150, Math.round((producedToday / target) * 100));

    let progressColorClass = 'fill-red';
    if (percent >= 100) progressColorClass = 'fill-green';
    else if (percent >= 70) progressColorClass = 'fill-amber';

    const statusBadgeClass = emp.status === 'Ativo' ? 'badge-success' : 'badge-secondary';

    return `
      <div class="employee-card">
        <div class="emp-header">
          <div class="emp-avatar">${initials}</div>
          <div class="emp-info">
            <h4>${emp.name}</h4>
            <p>${emp.role} • <strong>${emp.badge}</strong></p>
          </div>
          <span class="badge ${statusBadgeClass}" style="margin-left: auto;">${emp.status}</span>
        </div>

        <div class="emp-stats-row">
          <div class="emp-stat-item">
            <span>Turno</span>
            <span>${emp.shift}</span>
          </div>
          <div class="emp-stat-item">
            <span>Meta Diária</span>
            <span>${emp.dailyTarget} un</span>
          </div>
          <div class="emp-stat-item">
            <span>Produzido Hoje</span>
            <span style="color: var(--color-primary);">${producedToday} un</span>
          </div>
          <div class="emp-stat-item">
            <span>Refugos / Perdas</span>
            <span style="color: ${defectsToday > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">${defectsToday} un</span>
          </div>
        </div>

        <div class="emp-progress-box">
          <div class="emp-progress-label">
            <span style="color: var(--text-secondary); font-weight: 600;">Progresso da Meta Hoje</span>
            <strong style="color: var(--text-primary);">${percent}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${progressColorClass}" style="width: ${Math.min(100, percent)}%;"></div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
          <button class="btn btn-sm btn-primary" style="flex: 1;" onclick="openQuickProductionModal('${emp.id}')">
            <i class="fas fa-plus"></i> Apontar Produção
          </button>
          <button class="btn-table-action" title="Editar Colaborador" onclick="openEditEmployeeModal('${emp.id}')">
            <i class="fas fa-user-edit"></i>
          </button>
          <button class="btn-table-action delete" title="Excluir" onclick="confirmDeleteEmployee('${emp.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderProductionTable() {
  const container = document.getElementById('production-table-body');
  if (!container) return;

  const filterDate = document.getElementById('filter-production-date')?.value || '';
  const filterEmp = document.getElementById('filter-production-employee')?.value || '';
  const filterProd = document.getElementById('filter-production-product')?.value || '';

  let records = window.store.getProductionRecords();
  const employees = window.store.getEmployees();
  const products = window.store.getProducts();

  if (filterDate) {
    records = records.filter(r => r.date === filterDate);
  }
  if (filterEmp) {
    records = records.filter(r => r.employeeId === filterEmp);
  }
  if (filterProd) {
    records = records.filter(r => r.productId === filterProd);
  }

  const countBadge = document.getElementById('production-records-count');
  if (countBadge) countBadge.textContent = `${records.length} apontamentos`;

  if (records.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px;">
          Nenhum apontamento de produção encontrado para este período ou filtro.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = records.map(rec => {
    const emp = employees.find(e => e.id === rec.employeeId);
    const prod = products.find(p => p.id === rec.productId);

    const empName = emp ? emp.name : 'Não identificado';
    const prodName = prod ? prod.name : 'Não especificado';
    const prodUnit = prod ? prod.unit : 'un';

    // Efficiency vs individual target
    const target = emp ? emp.dailyTarget : 0;
    const effPct = target > 0 ? Math.round((rec.quantityProduced / target) * 100) : 100;
    const effBadgeClass = effPct >= 100 ? 'badge-success' : (effPct >= 70 ? 'badge-warning' : 'badge-danger');

    // Quality Rate
    const totalPieces = rec.quantityProduced + (rec.defectsCount || 0);
    const qualityPct = totalPieces > 0 ? (((rec.quantityProduced) / totalPieces) * 100).toFixed(0) : 100;

    const dateFormatted = rec.date ? rec.date.split('-').reverse().join('/') : '';

    return `
      <tr>
        <td><strong>${dateFormatted}</strong></td>
        <td>
          <div style="font-weight: 600;">${empName}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${emp ? emp.role : ''}</span>
        </td>
        <td>
          <div style="font-weight: 500;">${prodName}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${prod ? prod.code : ''}</span>
        </td>
        <td><strong style="color: var(--color-primary); font-size: 1rem;">${rec.quantityProduced}</strong> ${prodUnit}</td>
        <td>
          <span style="color: ${rec.defectsCount > 0 ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight: 600;">
            ${rec.defectsCount || 0} un
          </span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">(${qualityPct}% aprovado)</span>
        </td>
        <td>${rec.hoursWorked || 8}h</td>
        <td><span class="badge ${effBadgeClass}">${effPct}% meta</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-table-action" title="Editar Apontamento" onclick="openEditProductionModal('${rec.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-table-action delete" title="Excluir" onclick="confirmDeleteProduction('${rec.id}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupProductionListeners() {
  const searchEmp = document.getElementById('search-employees');
  const shiftEmp = document.getElementById('filter-employee-shift');
  const statusEmp = document.getElementById('filter-employee-status');

  if (searchEmp) searchEmp.addEventListener('input', renderEmployeesGrid);
  if (shiftEmp) shiftEmp.addEventListener('change', renderEmployeesGrid);
  if (statusEmp) statusEmp.addEventListener('change', renderEmployeesGrid);

  const filterProdDate = document.getElementById('filter-production-date');
  const filterProdEmp = document.getElementById('filter-production-employee');
  const filterProdItem = document.getElementById('filter-production-product');

  if (filterProdDate) filterProdDate.addEventListener('change', renderProductionTable);
  if (filterProdEmp) filterProdEmp.addEventListener('change', renderProductionTable);
  if (filterProdItem) filterProdItem.addEventListener('change', renderProductionTable);

  // Forms
  const empForm = document.getElementById('form-employee');
  if (empForm) empForm.addEventListener('submit', handleEmployeeFormSubmit);

  const prodForm = document.getElementById('form-production-entry');
  if (prodForm) prodForm.addEventListener('submit', handleProductionFormSubmit);
}

// Populate dropdown selects for employee and product
function populateProductionSelects() {
  const employees = window.store.getEmployees();
  const products = window.store.getProducts();

  const empSelects = [
    document.getElementById('entry-employee-select'),
    document.getElementById('filter-production-employee')
  ];

  empSelects.forEach(select => {
    if (!select) return;
    const isFilter = select.id.includes('filter');
    select.innerHTML = isFilter ? '<option value="">Todos os Funcionários</option>' : '<option value="">Selecione o Colaborador...</option>';
    employees.forEach(e => {
      select.innerHTML += `<option value="${e.id}">${e.name} (${e.role})</option>`;
    });
  });

  const prodSelects = [
    document.getElementById('entry-product-select'),
    document.getElementById('filter-production-product')
  ];

  prodSelects.forEach(select => {
    if (!select) return;
    const isFilter = select.id.includes('filter');
    select.innerHTML = isFilter ? '<option value="">Todos os Produtos</option>' : '<option value="">Selecione o Produto...</option>';
    products.forEach(p => {
      select.innerHTML += `<option value="${p.id}">${p.name} [${p.code}] (${p.unit})</option>`;
    });
  });
}

// Modal Handlers for Employee
function openNewEmployeeModal() {
  currentEditingEmployeeId = null;
  const form = document.getElementById('form-employee');
  if (form) form.reset();

  document.getElementById('modal-employee-title').textContent = 'Cadastrar Colaborador da Produção';
  document.getElementById('emp-badge').value = `OP-${Math.floor(100 + Math.random() * 900)}`;
  document.getElementById('emp-admission').value = new Date().toISOString().split('T')[0];

  window.openModal('modal-employee');
}

function openEditEmployeeModal(id) {
  currentEditingEmployeeId = id;
  const emp = window.store.getEmployeeById(id);
  if (!emp) return;

  document.getElementById('modal-employee-title').textContent = `Editar Colaborador: ${emp.name}`;
  document.getElementById('emp-name').value = emp.name || '';
  document.getElementById('emp-badge').value = emp.badge || '';
  document.getElementById('emp-role').value = emp.role || '';
  document.getElementById('emp-dept').value = emp.department || '';
  document.getElementById('emp-shift').value = emp.shift || 'Manhã';
  document.getElementById('emp-target').value = emp.dailyTarget || 20;
  document.getElementById('emp-status').value = emp.status || 'Ativo';
  document.getElementById('emp-phone').value = emp.phone || '';
  document.getElementById('emp-admission').value = emp.admissionDate || '';

  window.openModal('modal-employee');
}

function handleEmployeeFormSubmit(e) {
  e.preventDefault();

  const empData = {
    name: document.getElementById('emp-name').value.trim(),
    badge: document.getElementById('emp-badge').value.trim(),
    role: document.getElementById('emp-role').value.trim(),
    department: document.getElementById('emp-dept').value.trim(),
    shift: document.getElementById('emp-shift').value,
    dailyTarget: document.getElementById('emp-target').value,
    status: document.getElementById('emp-status').value,
    phone: document.getElementById('emp-phone').value.trim(),
    admissionDate: document.getElementById('emp-admission').value
  };

  if (!empData.name) {
    alert('Por favor informe o nome do colaborador.');
    return;
  }

  if (currentEditingEmployeeId) {
    window.store.updateEmployee(currentEditingEmployeeId, empData);
    window.showToast('Dados do colaborador atualizados!', 'success');
  } else {
    window.store.addEmployee(empData);
    window.showToast('Novo colaborador cadastrado!', 'success');
  }

  window.closeModal('modal-employee');
  renderEmployeesGrid();
  populateProductionSelects();
}

function confirmDeleteEmployee(id) {
  const emp = window.store.getEmployeeById(id);
  if (!emp) return;

  if (confirm(`Deseja realmente remover o colaborador "${emp.name}"? Seus registros históricos permanecerão salvos.`)) {
    window.store.deleteEmployee(id);
    window.showToast('Colaborador removido.', 'info');
    renderEmployeesGrid();
    populateProductionSelects();
  }
}

// Production Entry Handlers
function openNewProductionModal() {
  currentEditingProductionId = null;
  populateProductionSelects();

  const form = document.getElementById('form-production-entry');
  if (form) form.reset();

  document.getElementById('modal-production-title').textContent = 'Novo Apontamento de Produção';
  document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('entry-hours').value = '8';

  window.openModal('modal-production-entry');
}

function openQuickProductionModal(employeeId) {
  openNewProductionModal();
  const select = document.getElementById('entry-employee-select');
  if (select) select.value = employeeId;
}

function openEditProductionModal(id) {
  currentEditingProductionId = id;
  populateProductionSelects();

  const rec = window.store.getProductionRecordById(id);
  if (!rec) return;

  document.getElementById('modal-production-title').textContent = 'Editar Apontamento de Produção';
  document.getElementById('entry-date').value = rec.date || '';
  document.getElementById('entry-employee-select').value = rec.employeeId || '';
  document.getElementById('entry-product-select').value = rec.productId || '';
  document.getElementById('entry-qty').value = rec.quantityProduced || 0;
  document.getElementById('entry-defects').value = rec.defectsCount || 0;
  document.getElementById('entry-hours').value = rec.hoursWorked || 8;
  document.getElementById('entry-notes').value = rec.notes || '';

  // Disable auto-stock-check on edit to avoid double-entry
  const chkStock = document.getElementById('entry-update-stock');
  if (chkStock) {
    chkStock.checked = false;
    chkStock.disabled = true;
  }

  window.openModal('modal-production-entry');
}

function handleProductionFormSubmit(e) {
  e.preventDefault();

  const employeeId = document.getElementById('entry-employee-select').value;
  const productId = document.getElementById('entry-product-select').value;
  const date = document.getElementById('entry-date').value;
  const qty = parseInt(document.getElementById('entry-qty').value, 10);
  const defects = parseInt(document.getElementById('entry-defects').value, 10) || 0;
  const hours = parseFloat(document.getElementById('entry-hours').value) || 8;
  const notes = document.getElementById('entry-notes').value.trim();
  const updateStock = document.getElementById('entry-update-stock')?.checked || false;

  if (!employeeId || !productId) {
    alert('Por favor selecione o colaborador e o produto fabricado.');
    return;
  }
  if (isNaN(qty) || qty <= 0) {
    alert('Informe uma quantidade produzida válida.');
    return;
  }

  const recData = {
    employeeId,
    productId,
    date,
    quantityProduced: qty,
    defectsCount: defects,
    hoursWorked: hours,
    notes,
    updateStock
  };

  if (currentEditingProductionId) {
    window.store.updateProductionRecord(currentEditingProductionId, recData);
    window.showToast('Apontamento de produção atualizado!', 'success');
  } else {
    window.store.addProductionRecord(recData);
    window.showToast(`Lançamento de ${qty} unidades registrado com sucesso!`, 'success');
  }

  window.closeModal('modal-production-entry');
  renderProductionTable();
  renderEmployeesGrid();
}

function confirmDeleteProduction(id) {
  if (confirm('Deseja excluir este apontamento de produção?')) {
    window.store.deleteProductionRecord(id);
    window.showToast('Apontamento removido.', 'info');
    renderProductionTable();
    renderEmployeesGrid();
  }
}

// Global exports
window.openNewEmployeeModal = openNewEmployeeModal;
window.openEditEmployeeModal = openEditEmployeeModal;
window.confirmDeleteEmployee = confirmDeleteEmployee;
window.openNewProductionModal = openNewProductionModal;
window.openQuickProductionModal = openQuickProductionModal;
window.openEditProductionModal = openEditProductionModal;
window.confirmDeleteProduction = confirmDeleteProduction;
window.populateProductionSelects = populateProductionSelects;
