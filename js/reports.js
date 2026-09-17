/**
 * reports.js - Data Export (CSV/JSON), Backup, Restore, and Printable Reports
 */

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// Export Products to CSV
function exportProductsCSV() {
  const products = window.store.getProducts();
  const headers = ['Codigo;Nome;Categoria;Unidade;PrecoCusto;PrecoVenda;EstoqueAtual;EstoqueMinimo;Localizacao'];
  const rows = products.map(p => 
    `"${p.code}";"${p.name}";"${p.category}";"${p.unit}";"${p.costPrice}";"${p.salePrice}";"${p.stock}";"${p.minStock}";"${p.location || ''}"`
  );

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `relatorio_estoque_produtos_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  window.showToast('Relatório de Produtos exportado com sucesso!', 'success');
}

// Export Production Records to CSV
function exportProductionCSV() {
  const production = window.store.getProductionRecords();
  const employees = window.store.getEmployees();
  const products = window.store.getProducts();

  const headers = ['Data;Funcionario;Matricula;Produto;CodigoProduto;QtdProduzida;QtdRefugos;HorasTrabalhadas;Turno;Observacoes'];
  const rows = production.map(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    const prod = products.find(p => p.id === r.productId);
    return `"${r.date}";"${emp ? emp.name : ''}";"${emp ? emp.badge : ''}";"${prod ? prod.name : ''}";"${prod ? prod.code : ''}";"${r.quantityProduced}";"${r.defectsCount || 0}";"${r.hoursWorked || 8}";"${r.shift || ''}";"${r.notes || ''}"`;
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `relatorio_producao_diaria_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  window.showToast('Relatório de Produção exportado com sucesso!', 'success');
}

// Export Movements to CSV
function exportMovementsCSV() {
  const movements = window.store.getMovements();
  const products = window.store.getProducts();

  const headers = ['Data;Tipo;Produto;CodigoProduto;Quantidade;ValorUnitario;ValorTotal;Responsavel;Motivo'];
  const rows = movements.map(m => {
    const prod = products.find(p => p.id === m.productId);
    return `"${m.date}";"${m.type}";"${prod ? prod.name : ''}";"${prod ? prod.code : ''}";"${m.quantity}";"${m.unitPrice}";"${m.totalPrice}";"${m.responsible}";"${m.reason}"`;
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `relatorio_movimentacoes_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  window.showToast('Relatório de Movimentações exportado!', 'success');
}

// Backup JSON
function exportFullBackupJSON() {
  const data = window.store.exportAllData();
  const jsonStr = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(jsonStr, `backup_estoque_producao_${dateStr}.json`, 'application/json');
  window.showToast('Backup completo em JSON gerado com sucesso!', 'success');
}

// Restore JSON
function handleBackupRestore(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (confirm('Atenção: A restauração substituirá todos os dados atuais pelo conteúdo do backup. Deseja continuar?')) {
        window.store.importAllData(parsed);
        window.showToast('Backup restaurado com sucesso!', 'success');
        setTimeout(() => location.reload(), 800);
      }
    } catch (err) {
      alert('Erro ao processar o arquivo JSON de backup: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Reset Database to Demo Seed
function handleResetDatabase() {
  if (confirm('Tem certeza de que deseja restaurar os dados demonstrativos de fábrica? Todas as alterações manuais serão resetadas.')) {
    window.store.resetToDefault();
    window.showToast('Dados restaurados para o padrão demonstrativo.', 'info');
    setTimeout(() => location.reload(), 800);
  }
}

// Print Current View
function printReport() {
  window.print();
}

// Expose globals
window.exportProductsCSV = exportProductsCSV;
window.exportProductionCSV = exportProductionCSV;
window.exportMovementsCSV = exportMovementsCSV;
window.exportFullBackupJSON = exportFullBackupJSON;
window.handleBackupRestore = handleBackupRestore;
window.handleResetDatabase = handleResetDatabase;
window.printReport = printReport;
