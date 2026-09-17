/**
 * dashboard.js - Dashboard KPIs, Charts, and Analytics
 */

let charts = {};

function initDashboard() {
  updateDashboardKPIs();
  renderDashboardCharts();
  renderCriticalAlerts();
  renderTopEmployees();
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function updateDashboardKPIs() {
  const products = window.store.getProducts();
  const employees = window.store.getEmployees();
  const production = window.store.getProductionRecords();
  const movements = window.store.getMovements();

  // 1. Estoque Total em Valor
  const totalCost = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const totalSale = products.reduce((acc, p) => acc + (p.stock * p.salePrice), 0);
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);

  // 2. Alertas de Estoque Crítico
  const criticalProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // 3. Produção do Dia
  const todayStr = new Date().toISOString().split('T')[0];
  const todayProduction = production.filter(r => r.date === todayStr);
  const todayTotalProduced = todayProduction.reduce((acc, r) => acc + r.quantityProduced, 0);
  const todayDefects = todayProduction.reduce((acc, r) => acc + (r.defectsCount || 0), 0);

  // Metas diárias dos funcionários ativos
  const activeEmployees = employees.filter(e => e.status === 'Ativo');
  const totalDailyTarget = activeEmployees.reduce((acc, e) => acc + (e.dailyTarget || 0), 0);
  const targetPercent = totalDailyTarget > 0 ? Math.round((todayTotalProduced / totalDailyTarget) * 100) : 0;

  // Taxa de Qualidade Geral
  const totalAllProduced = production.reduce((acc, r) => acc + r.quantityProduced, 0);
  const totalAllDefects = production.reduce((acc, r) => acc + (r.defectsCount || 0), 0);
  const qualityRate = totalAllProduced > 0 
    ? (((totalAllProduced - totalAllDefects) / totalAllProduced) * 100).toFixed(1)
    : 100;

  // Update DOM elements
  const elTotalStockVal = document.getElementById('kpi-stock-value');
  const elTotalStockUnits = document.getElementById('kpi-stock-units');
  const elCriticalCount = document.getElementById('kpi-critical-count');
  const elTodayProduced = document.getElementById('kpi-today-produced');
  const elTodayTargetPct = document.getElementById('kpi-target-pct');
  const elQualityRate = document.getElementById('kpi-quality-rate');
  const elCriticalBadge = document.getElementById('nav-critical-badge');

  if (elTotalStockVal) elTotalStockVal.textContent = formatCurrency(totalCost);
  if (elTotalStockUnits) elTotalStockUnits.textContent = `${totalUnits.toLocaleString('pt-BR')} itens em estoque`;
  if (elCriticalCount) elCriticalCount.textContent = criticalProducts.length;
  if (elTodayProduced) elTodayProduced.textContent = `${todayTotalProduced} un`;
  if (elTodayTargetPct) {
    elTodayTargetPct.textContent = `${targetPercent}% da meta (${todayTotalProduced}/${totalDailyTarget})`;
    elTodayTargetPct.className = `trend-badge ${targetPercent >= 100 ? 'trend-up' : (targetPercent >= 70 ? 'trend-neutral' : 'trend-down')}`;
  }
  if (elQualityRate) elQualityRate.textContent = `${qualityRate}%`;
  if (elCriticalBadge) {
    elCriticalBadge.textContent = criticalProducts.length;
    elCriticalBadge.style.display = criticalProducts.length > 0 ? 'inline-block' : 'none';
  }
}

function renderDashboardCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  const production = window.store.getProductionRecords();
  const employees = window.store.getEmployees();
  const products = window.store.getProducts();
  const movements = window.store.getMovements();

  // --- Chart 1: Produção Diária (Últimos 7 dias) ---
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const productionByDay = last7Days.map(dateStr => {
    const dayRecords = production.filter(r => r.date === dateStr);
    return dayRecords.reduce((acc, r) => acc + r.quantityProduced, 0);
  });

  const dayLabels = last7Days.map(dateStr => {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const ctxLine = document.getElementById('chart-production-trend');
  if (ctxLine) {
    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Unidades Produzidas',
          data: productionByDay,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
        }
      }
    });
  }

  // --- Chart 2: Produção por Funcionário vs Meta ---
  const todayStr = new Date().toISOString().split('T')[0];
  const activeEmps = employees.filter(e => e.status === 'Ativo').slice(0, 6);
  const empNames = activeEmps.map(e => e.name.split(' ')[0]);
  const empProduced = activeEmps.map(e => {
    const recs = production.filter(r => r.employeeId === e.id && r.date === todayStr);
    return recs.reduce((acc, r) => acc + r.quantityProduced, 0);
  });
  const empTargets = activeEmps.map(e => e.dailyTarget);

  const ctxBar = document.getElementById('chart-employee-prod');
  if (ctxBar) {
    if (charts.employees) charts.employees.destroy();
    charts.employees = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: empNames,
        datasets: [
          {
            label: 'Produzido Hoje',
            data: empProduced,
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'Meta Diária',
            data: empTargets,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 10
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
        }
      }
    });
  }

  // --- Chart 3: Estoque por Categoria (Doughnut) ---
  const categoryMap = {};
  products.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + p.stock;
  });
  const catLabels = Object.keys(categoryMap);
  const catData = Object.values(categoryMap);

  const ctxPie = document.getElementById('chart-stock-categories');
  if (ctxPie) {
    if (charts.categories) charts.categories.destroy();
    charts.categories = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: [
            '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textColor, boxWidth: 12, font: { size: 11 } }
          }
        },
        cutout: '70%'
      }
    });
  }

  // --- Chart 4: Movimentações Entrada vs Saída ---
  const totalEntradas = movements.filter(m => m.type === 'ENTRADA').reduce((a, m) => a + m.quantity, 0);
  const totalSaidas = movements.filter(m => m.type === 'SAIDA').reduce((a, m) => a + m.quantity, 0);

  const ctxMov = document.getElementById('chart-movements-balance');
  if (ctxMov) {
    if (charts.movements) charts.movements.destroy();
    charts.movements = new Chart(ctxMov, {
      type: 'bar',
      data: {
        labels: ['Entradas Registradas', 'Saídas Registradas'],
        datasets: [{
          data: [totalEntradas, totalSaidas],
          backgroundColor: ['#10b981', '#f43f5e'],
          borderRadius: 8,
          barThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1'
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
        }
      }
    });
  }
}

function renderCriticalAlerts() {
  const container = document.getElementById('dashboard-critical-table');
  if (!container) return;

  const products = window.store.getProducts();
  const critical = products.filter(p => p.stock <= p.minStock);

  if (critical.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--color-success); padding: 24px;">
          ✓ Todos os produtos estão com níveis normais de estoque.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = critical.map(p => {
    const isZero = p.stock === 0;
    const badgeClass = isZero ? 'badge-danger' : 'badge-warning';
    const badgeText = isZero ? 'ESGOTADO' : 'ESTOQUE BAIXO';

    return `
      <tr>
        <td>
          <div class="cell-product">
            <span class="cell-product-name">${p.name}</span>
            <span class="cell-product-code">${p.code} • ${p.category}</span>
          </div>
        </td>
        <td><strong>${p.stock}</strong> ${p.unit}</td>
        <td>${p.minStock} ${p.unit}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="quickStockEntry('${p.id}')">
            + Entrada Rápida
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTopEmployees() {
  const container = document.getElementById('dashboard-top-producers');
  if (!container) return;

  const employees = window.store.getEmployees();
  const production = window.store.getProductionRecords();
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's production per employee
  const empStats = employees.map(emp => {
    const records = production.filter(r => r.employeeId === emp.id && r.date === todayStr);
    const totalProduced = records.reduce((acc, r) => acc + r.quantityProduced, 0);
    const defects = records.reduce((acc, r) => acc + (r.defectsCount || 0), 0);
    const targetPct = emp.dailyTarget > 0 ? Math.round((totalProduced / emp.dailyTarget) * 100) : 0;
    return {
      ...emp,
      totalProduced,
      defects,
      targetPct
    };
  }).sort((a, b) => b.totalProduced - a.totalProduced);

  container.innerHTML = empStats.slice(0, 5).map((emp, index) => {
    const initials = emp.name.split(' ').map(n => n[0]).slice(0, 2).join('');
    let rankColor = 'var(--text-muted)';
    if (index === 0) rankColor = '#fbbf24'; // Gold
    if (index === 1) rankColor = '#94a3b8'; // Silver
    if (index === 2) rankColor = '#b45309'; // Bronze

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-subtle);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-weight: 800; font-size: 1.1rem; width: 20px; color: ${rankColor};">#${index + 1}</span>
          <div class="emp-avatar" style="width: 36px; height: 36px; font-size: 0.85rem;">${initials}</div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${emp.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${emp.role} (${emp.shift})</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: var(--color-primary); font-size: 1rem;">${emp.totalProduced} un</div>
          <div style="font-size: 0.75rem; color: ${emp.targetPct >= 100 ? 'var(--color-success)' : 'var(--text-muted)'}; font-weight: 600;">
            ${emp.targetPct}% da meta
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Global functions for quick actions
window.quickStockEntry = function(productId) {
  const prod = window.store.getProductById(productId);
  if (!prod) return;
  const qty = prompt(`Informe a quantidade de entrada para "${prod.name}":`, '10');
  if (qty && !isNaN(qty) && Number(qty) > 0) {
    window.store.adjustStock(productId, Number(qty), 'ENTRADA', 'Entrada rápida via alerta de estoque', 'Supervisor');
    if (window.showToast) window.showToast(`Entrada de ${qty} ${prod.unit} registrada com sucesso!`, 'success');
  }
};
