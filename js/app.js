/**
 * app.js - Main Application Orchestrator & UI Controller
 */

// Tab Routing
function switchTab(tabId) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Page titles
  const titles = {
    'dashboard': { title: 'Dashboard & Indicadores', sub: 'Visão geral do estoque de madeiras, pregos, pallets acabados e produtividade fabril' },
    'products': { title: 'Controle de Estoque & Produtos', sub: 'Madeiras, tábuas, tocos, pregos espiralados, pallets acabados e peças' },
    'employees': { title: 'Equipe de Produção', sub: 'Montadores pneumáticos, operadores de serra múltipla, estufa HT e expedição' },
    'production': { title: 'Apontamentos Diários de Pallets', sub: 'Lançamento de pallets montados, desdobro de madeira, refugo e metas' },
    'movements': { title: 'Movimentações de Estoque', sub: 'Entradas de cargas de madeira, expedição de carretas de pallets e inventário' },
    'reports': { title: 'Relatórios & Configurações', sub: 'Exportação de planilhas de pallets, auditoria física e backup do sistema' }
  };

  const current = titles[tabId] || titles['dashboard'];
  const titleEl = document.getElementById('page-title');
  const subEl = document.getElementById('page-subtitle');
  if (titleEl) titleEl.textContent = current.title;
  if (subEl) subEl.textContent = current.sub;

  // Refresh tab-specific views
  if (tabId === 'dashboard') {
    initDashboard();
  } else if (tabId === 'products') {
    renderProductsTable();
  } else if (tabId === 'employees') {
    renderEmployees();
  } else if (tabId === 'production') {
    renderProductionTable();
    populateProductionSelects();
  } else if (tabId === 'movements') {
    renderMovementsTable();
  }

  // Close sidebar on mobile
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && window.innerWidth < 1024) {
    sidebar.classList.remove('open');
  }
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 150);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
  }
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-info-circle';
  let title = 'Notificação';
  if (type === 'success') { icon = 'fa-check-circle'; title = 'Sucesso!'; }
  if (type === 'warning') { icon = 'fa-exclamation-triangle'; title = 'Atenção'; }
  if (type === 'danger') { icon = 'fa-times-circle'; title = 'Erro'; }

  toast.innerHTML = `
    <i class="fas ${icon}" style="color: var(--color-${type}); font-size: 1.25rem; margin-top: 2px;"></i>
    <div class="toast-content" style="flex: 1;">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// Theme Toggle
function setupTheme() {
  const savedTheme = localStorage.getItem('app_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('app_theme', next);
      updateThemeIcon(next);
      // Re-render charts with new theme colors
      renderDashboardCharts();
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }
}

// Global Event Listeners
function setupGlobalEvents() {
  // Navigation tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Mobile menu toggle
  const menuBtn = document.getElementById('btn-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Backdrop click to close modals
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Escape key to close open modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
        modal.classList.remove('open');
      });
    }
  });

  // Store reactivity: whenever store updates, re-render active view and KPI badges
  window.store.subscribe((key) => {
    updateDashboardKPIs();
  });
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupGlobalEvents();

  // Initialize modules
  initDashboard();
  initProducts();
  initProduction();
  initMovements();

  // Default to Dashboard
  switchTab('dashboard');

  console.log('✨ Sistema de Controle de Estoque e Produção carregado com sucesso!');
});

// Expose globals
window.switchTab = switchTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
