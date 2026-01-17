import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test de Integridad de Datos
 * Verifica que solo se muestran datos de Firebase (con _synced === true o IDs de Firebase)
 */
class DataIntegrityTest {
  constructor() {
    this.results = {
      hooks: {},
      ocrPage: {},
      totalIssues: 0
    };
  }

  /**
   * Verifica que un hook filtra correctamente los datos de Firebase
   */
  verifyHookFilter(hookPath, hookName) {
    const fullPath = join(__dirname, hookPath);
    if (!existsSync(fullPath)) {
      return {
        success: false,
        error: 'Archivo no encontrado'
      };
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const issues = [];

      // Verificar que existe el filtro de Firebase
      const hasFirebaseFilter = 
        content.includes('_synced === true') || 
        content.includes('_synced===true') ||
        (content.includes('_synced') && content.includes('typeof') && content.includes('string') && content.includes('length > 10'));

      if (!hasFirebaseFilter) {
        issues.push('No se encontró filtro de Firebase (_synced o ID string > 10 caracteres)');
      }

      // Verificar que no se están usando datos sin filtrar
      const unfilteredPatterns = [
        /providerService\.getAll\(\)/g,
        /db\.facturas\s*(?!\.filter)/g,
        /db\.cierres\s*(?!\.filter)/g,
        /db\.productos\s*(?!\.filter)/g,
        /db\.inventarios\s*(?!\.filter)/g
      ];

      unfilteredPatterns.forEach((pattern, idx) => {
        const matches = content.match(pattern);
        if (matches) {
          // Verificar que después hay un .filter
          const lines = content.split('\n');
          matches.forEach(match => {
            const matchIndex = content.indexOf(match);
            const lineNumber = content.substring(0, matchIndex).split('\n').length;
            const nextLines = lines.slice(lineNumber - 1, lineNumber + 3).join('\n');
            if (!nextLines.includes('.filter') && !nextLines.includes('firebase')) {
              issues.push(`Posible uso sin filtrar en línea ${lineNumber}: ${match.substring(0, 50)}`);
            }
          });
        }
      });

      // Verificar que se espera la sincronización de Firebase
      const hasFirebaseWait = 
        content.includes('setTimeout') || 
        content.includes('await') ||
        content.includes('syncFromCloud');

      if (!hasFirebaseWait && hasFirebaseFilter) {
        issues.push('Filtro de Firebase presente pero no se espera sincronización');
      }

      return {
        success: issues.length === 0,
        issues,
        hasFirebaseFilter,
        hasFirebaseWait
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al leer archivo: ${error.message}`
      };
    }
  }

  /**
   * Verifica useProviders
   */
  testUseProviders() {
    console.log('🔍 Verificando useProviders...');
    const result = this.verifyHookFilter('src/hooks/useProviders.ts', 'useProviders');
    this.results.hooks.useProviders = result;
    
    if (result.success) {
      console.log('✅ useProviders filtra correctamente datos de Firebase');
    } else {
      console.error('❌ useProviders tiene problemas:', result.issues || result.error);
    }
    
    return result.success;
  }

  /**
   * Verifica useInvoices
   */
  testUseInvoices() {
    console.log('🔍 Verificando useInvoices...');
    const result = this.verifyHookFilter('src/hooks/useInvoices.ts', 'useInvoices');
    this.results.hooks.useInvoices = result;
    
    if (result.success) {
      console.log('✅ useInvoices filtra correctamente datos de Firebase');
    } else {
      console.error('❌ useInvoices tiene problemas:', result.issues || result.error);
    }
    
    return result.success;
  }

  /**
   * Verifica useFinance
   */
  testUseFinance() {
    console.log('🔍 Verificando useFinance...');
    const result = this.verifyHookFilter('src/hooks/useFinance.ts', 'useFinance');
    this.results.hooks.useFinance = result;
    
    if (result.success) {
      console.log('✅ useFinance filtra correctamente datos de Firebase');
    } else {
      console.error('❌ useFinance tiene problemas:', result.issues || result.error);
    }
    
    return result.success;
  }

  /**
   * Verifica useInventory
   */
  testUseInventory() {
    console.log('🔍 Verificando useInventory...');
    const result = this.verifyHookFilter('src/hooks/useInventory.ts', 'useInventory');
    this.results.hooks.useInventory = result;
    
    if (result.success) {
      console.log('✅ useInventory filtra correctamente datos de Firebase');
    } else {
      console.error('❌ useInventory tiene problemas:', result.issues || result.error);
    }
    
    return result.success;
  }

  /**
   * Verifica OCRPage
   */
  testOCRPage() {
    console.log('🔍 Verificando OCRPage...');
    const fullPath = join(__dirname, 'src/pages/OCRPage.tsx');
    
    if (!existsSync(fullPath)) {
      this.results.ocrPage = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ OCRPage.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const issues = [];

      // Verificar que loadDocuments filtra por Firebase
      const hasLoadDocumentsFilter = 
        content.includes('loadDocuments') && 
        (content.includes('_synced === true') || 
         (content.includes('_synced') && content.includes('typeof') && content.includes('string') && content.includes('length > 10')));

      if (!hasLoadDocumentsFilter) {
        issues.push('loadDocuments no filtra por Firebase');
      }

      // Verificar que se filtran facturas, albaranes y cierres
      const filtersFacturas = content.includes('db.facturas') && content.includes('.filter');
      const filtersAlbaranes = content.includes('db.albaranes') && content.includes('.filter');
      const filtersCierres = content.includes('db.cierres') && content.includes('.filter');

      if (!filtersFacturas) {
        issues.push('No se filtra db.facturas en loadDocuments');
      }
      if (!filtersAlbaranes) {
        issues.push('No se filtra db.albaranes en loadDocuments');
      }
      if (!filtersCierres) {
        issues.push('No se filtra db.cierres en loadDocuments');
      }

      this.results.ocrPage = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ OCRPage filtra correctamente datos de Firebase');
      } else {
        console.error('❌ OCRPage tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.ocrPage = { success: false, error: error.message };
      console.error('❌ Error verificando OCRPage:', error.message);
      return false;
    }
  }

  /**
   * Ejecuta todos los tests
   */
  async run() {
    console.log('\n═══════════════════════════════════════');
    console.log('TEST: Integridad de Datos (Firebase Only)');
    console.log('═══════════════════════════════════════\n');

    const providersOk = this.testUseProviders();
    const invoicesOk = this.testUseInvoices();
    const financeOk = this.testUseFinance();
    const inventoryOk = this.testUseInventory();
    const ocrOk = this.testOCRPage();

    // Contar issues totales
    this.results.totalIssues = 
      (providersOk ? 0 : 1) +
      (invoicesOk ? 0 : 1) +
      (financeOk ? 0 : 1) +
      (inventoryOk ? 0 : 1) +
      (ocrOk ? 0 : 1) +
      Object.values(this.results.hooks).reduce((sum, r) => sum + (r.issues?.length || 0), 0) +
      (this.results.ocrPage.issues?.length || 0);

    return {
      success: providersOk && invoicesOk && financeOk && inventoryOk && ocrOk,
      results: this.results
    };
  }

  /**
   * Genera reporte en formato texto
   */
  getReport() {
    const lines = [];
    lines.push('═══════════════════════════════════════');
    lines.push('REPORTE: Integridad de Datos');
    lines.push('═══════════════════════════════════════\n');

    Object.entries(this.results.hooks).forEach(([hookName, result]) => {
      lines.push(`${hookName}: ${result.success ? '✅' : '❌'}`);
      if (result.issues && result.issues.length > 0) {
        result.issues.forEach(issue => lines.push(`  - ${issue}`));
      }
      if (result.error) {
        lines.push(`  - Error: ${result.error}`);
      }
      lines.push('');
    });

    lines.push(`OCRPage: ${this.results.ocrPage.success ? '✅' : '❌'}`);
    if (this.results.ocrPage.issues && this.results.ocrPage.issues.length > 0) {
      this.results.ocrPage.issues.forEach(issue => lines.push(`  - ${issue}`));
    }
    if (this.results.ocrPage.error) {
      lines.push(`  - Error: ${this.results.ocrPage.error}`);
    }
    lines.push('');

    lines.push(`Total de problemas encontrados: ${this.results.totalIssues}`);

    return lines.join('\n');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new DataIntegrityTest();
  test.run().then(result => {
    console.log('\n' + test.getReport());
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando test:', error);
    process.exit(1);
  });
}

export default DataIntegrityTest;

