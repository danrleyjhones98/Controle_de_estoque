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

  // Page titles and breadcrumb hierarchy
  const moduleConfig = {
    'dashboard': { 
      module: 'Visão Geral & BI', 
      title: 'Dashboard & Indicadores', 
      sub: 'Visão geral do estoque de madeiras, pregos, pallets acabados e produtividade fabril' 
    },
    'products': { 
      module: 'Indústria & Chão de Fábrica', 
      title: 'Controle de Estoque & Produtos', 
      sub: 'Madeiras, barrotes, réguas, tocos, pregos espiralados e pallets acabados' 
    },
    'employees': { 
      module: 'Indústria & Chão de Fábrica', 
      title: 'Equipe de Produção & Colaboradores', 
      sub: 'Montadores pneumáticos, operadores de serra múltipla, operadores de estufa HT e expedição' 
    },
    'production': { 
      module: 'Indústria & Chão de Fábrica', 
      title: 'Apontamentos Diários de Pallets', 
      sub: 'Lançamento de pallets montados, desdobro de madeira, refugo e metas diárias' 
    },
    'movements': { 
      module: 'Indústria & Chão de Fábrica', 
      title: 'Movimentações de Estoque & Almoxarifado', 
      sub: 'Entradas de cargas de madeira, expedição de carretas de pallets e inventário' 
    },
    'fiscal-nova-nota': { 
      module: 'Faturamento & Fiscal (Simulador de Notas)', 
      title: 'Emissão de NF-e (Simulador de Faturamento)', 
      sub: 'Emissão de Nota Fiscal Eletrônica com cálculo de impostos, itens e parcelamento' 
    },
    'fiscal-historico': { 
      module: 'Faturamento & Fiscal (Simulador de Notas)', 
      title: 'Histórico de Notas Fiscais & DANFE', 
      sub: 'Auditoria de notas fiscais autorizadas, download de arquivos XML e consulta' 
    },
    'fiscal-danfe': { 
      module: 'Faturamento & Fiscal (Simulador de Notas)', 
      title: 'Visualizador de DANFE Oficial', 
      sub: 'Documento Auxiliar da Nota Fiscal Eletrônica oficial para impressão e arquivo' 
    },
    'fiscal-parceiros': { 
      module: 'Faturamento & Fiscal (Simulador de Notas)', 
      title: 'Clientes, Fornecedores & Parceiros', 
      sub: 'Gestão de parceiros comerciais, CNPJ, Inscrição Estadual e endereços' 
    },
    'reports': { 
      module: 'Controladoria & Sistema', 
      title: 'Relatórios & Exportação', 
      sub: 'Exportação de relatórios, auditoria física e backup seguro do sistema' 
    }
  };

  const current = moduleConfig[tabId] || moduleConfig['dashboard'];
  const titleEl = document.getElementById('page-title');
  const subEl = document.getElementById('page-subtitle');
  const bcModuleEl = document.getElementById('breadcrumb-module');
  const bcCurrentEl = document.getElementById('breadcrumb-current');

  if (titleEl) titleEl.textContent = current.title;
  if (subEl) subEl.textContent = current.sub;
  if (bcModuleEl) bcModuleEl.textContent = current.module;
  if (bcCurrentEl) bcCurrentEl.textContent = current.title;

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
  } else if (tabId === 'fiscal-nova-nota') {
    populateFiscalSelects();
    renderDraftItensTable();
  } else if (tabId === 'fiscal-historico') {
    renderHistoricoNotas();
  } else if (tabId === 'fiscal-danfe') {
    renderDanfeDocument(currentNotaDanfeId);
  } else if (tabId === 'fiscal-parceiros') {
    renderParceirosTable();
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

// Theme Toggle (Default to clean corporate light theme)
function setupTheme() {
  const savedTheme = localStorage.getItem('app_theme') || 'light';
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

// Sidebar Collapse / Retractable Control
function initSidebar() {
  const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  if (isCollapsed && window.innerWidth >= 1024) {
    document.body.classList.add('sidebar-collapsed');
  }
  updateSidebarCollapseIcon();
}

function toggleSidebar() {
  const isMobile = window.innerWidth < 1024;
  const sidebar = document.querySelector('.sidebar');
  if (isMobile) {
    if (sidebar) sidebar.classList.toggle('open');
  } else {
    document.body.classList.toggle('sidebar-collapsed');
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    localStorage.setItem('sidebar_collapsed', collapsed ? 'true' : 'false');
    updateSidebarCollapseIcon();
    // Dispatch window resize so charts adjust to new width immediately
    window.dispatchEvent(new Event('resize'));
  }
}

function updateSidebarCollapseIcon() {
  const isCollapsed = document.body.classList.contains('sidebar-collapsed');
  const icon = document.getElementById('sidebar-collapse-icon');
  if (icon) {
    icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
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

  // Sidebar toggle buttons (Topbar Hamburger & Sidebar Chevron)
  const menuBtn = document.getElementById('btn-menu-toggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
  }

  const collapseBtn = document.getElementById('btn-sidebar-collapse');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
  }

  // Click brand icon to expand if collapsed
  const brandIcon = document.querySelector('.brand-icon');
  if (brandIcon) {
    brandIcon.addEventListener('click', () => {
      if (document.body.classList.contains('sidebar-collapsed')) {
        toggleSidebar();
      }
    });
  }

  // Close sidebar on mobile when clicking main area
  const mainWrapper = document.querySelector('.main-wrapper');
  if (mainWrapper) {
    mainWrapper.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && sidebar.classList.contains('open') && window.innerWidth < 1024) {
        sidebar.classList.remove('open');
      }
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
  initSidebar();
  setupGlobalEvents();

  // Initialize modules
  initDashboard();
  initProducts();
  initProduction();
  initMovements();
  if (window.initFiscal) window.initFiscal();

  // Default to Dashboard
  switchTab('dashboard');

  console.log('✨ Sistema de Gestão Industrial & Fiscal (ERP Unificado) carregado com sucesso!');
});

// Expose globals
window.switchTab = switchTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.toggleSidebar = toggleSidebar;
