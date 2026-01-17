import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import BuildErrorsTest from './test-build-errors.js';
import DataIntegrityTest from './test-data-integrity.js';
import UIComponentsTest from './test-ui-components.js';
import VisualConsistencyTest from './test-visual-consistency.js';
import E2EFlowsTest from './test-e2e-flows.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Suite de Tests de Regresión
 * Ejecuta todos los tests y genera un reporte consolidado
 */
class RegressionTestSuite {
  constructor() {
    this.results = {
      buildErrors: null,
      dataIntegrity: null,
      uiComponents: null,
      visualConsistency: null,
      e2eFlows: null,
      summary: {
        totalTests: 5,
        passedTests: 0,
        failedTests: 0,
        totalIssues: 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Ejecuta todos los tests
   */
  async run() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     SUITE DE TESTS DE REGRESIÓN - PROBLEMAS REPORTADOS     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Test 1: Errores de Compilación
    console.log('📦 Ejecutando Test 1/5: Errores de Compilación...\n');
    try {
      const buildTest = new BuildErrorsTest();
      this.results.buildErrors = await buildTest.run();
      if (this.results.buildErrors.success) {
        this.results.summary.passedTests++;
      } else {
        this.results.summary.failedTests++;
        this.results.summary.totalIssues += this.results.buildErrors.results.totalErrors || 0;
      }
    } catch (error) {
      console.error('❌ Error ejecutando test de build:', error.message);
      this.results.buildErrors = { success: false, error: error.message };
      this.results.summary.failedTests++;
    }

    console.log('\n' + '─'.repeat(60) + '\n');

    // Test 2: Integridad de Datos
    console.log('📊 Ejecutando Test 2/5: Integridad de Datos...\n');
    try {
      const dataTest = new DataIntegrityTest();
      this.results.dataIntegrity = await dataTest.run();
      if (this.results.dataIntegrity.success) {
        this.results.summary.passedTests++;
      } else {
        this.results.summary.failedTests++;
        this.results.summary.totalIssues += this.results.dataIntegrity.results.totalIssues || 0;
      }
    } catch (error) {
      console.error('❌ Error ejecutando test de integridad:', error.message);
      this.results.dataIntegrity = { success: false, error: error.message };
      this.results.summary.failedTests++;
    }

    console.log('\n' + '─'.repeat(60) + '\n');

    // Test 3: Componentes UI
    console.log('🎨 Ejecutando Test 3/5: Componentes UI...\n');
    try {
      const uiTest = new UIComponentsTest();
      this.results.uiComponents = await uiTest.run();
      if (this.results.uiComponents.success) {
        this.results.summary.passedTests++;
      } else {
        this.results.summary.failedTests++;
        this.results.summary.totalIssues += this.results.uiComponents.results.totalIssues || 0;
      }
    } catch (error) {
      console.error('❌ Error ejecutando test de componentes UI:', error.message);
      this.results.uiComponents = { success: false, error: error.message };
      this.results.summary.failedTests++;
    }

    console.log('\n' + '─'.repeat(60) + '\n');

    // Test 4: Consistencia Visual
    console.log('👁️  Ejecutando Test 4/5: Consistencia Visual...\n');
    try {
      const visualTest = new VisualConsistencyTest();
      this.results.visualConsistency = await visualTest.run();
      if (this.results.visualConsistency.success) {
        this.results.summary.passedTests++;
      } else {
        this.results.summary.failedTests++;
        this.results.summary.totalIssues += this.results.visualConsistency.results.totalIssues || 0;
      }
    } catch (error) {
      console.error('❌ Error ejecutando test de consistencia visual:', error.message);
      this.results.visualConsistency = { success: false, error: error.message };
      this.results.summary.failedTests++;
    }

    console.log('\n' + '─'.repeat(60) + '\n');

    // Test 5: Flujos E2E
    console.log('🔄 Ejecutando Test 5/5: Flujos E2E Críticos...\n');
    try {
      const e2eTest = new E2EFlowsTest();
      this.results.e2eFlows = await e2eTest.run();
      if (this.results.e2eFlows.success) {
        this.results.summary.passedTests++;
      } else {
        this.results.summary.failedTests++;
        this.results.summary.totalIssues += this.results.e2eFlows.results.totalIssues || 0;
      }
    } catch (error) {
      console.error('❌ Error ejecutando test E2E:', error.message);
      this.results.e2eFlows = { success: false, error: error.message };
      this.results.summary.failedTests++;
    }

    // Generar reporte
    this.generateReport();

    return {
      success: this.results.summary.failedTests === 0,
      results: this.results
    };
  }

  /**
   * Genera reporte consolidado en Markdown
   */
  generateReport() {
    const reportPath = join(__dirname, 'REGRESSION_TEST_REPORT.md');
    const lines = [];

    lines.push('# Reporte de Tests de Regresión');
    lines.push('');
    lines.push(`**Fecha:** ${new Date(this.results.summary.timestamp).toLocaleString('es-ES')}`);
    lines.push(`**Total de Tests:** ${this.results.summary.totalTests}`);
    lines.push(`**Tests Exitosos:** ${this.results.summary.passedTests} ✅`);
    lines.push(`**Tests Fallidos:** ${this.results.summary.failedTests} ❌`);
    lines.push(`**Total de Problemas Encontrados:** ${this.results.summary.totalIssues}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Resumen de problemas reportados
    lines.push('## Problemas Reportados - Estado');
    lines.push('');
    
    const problems = [
      {
        id: 1,
        name: 'Errores de Compilación/Carga',
        test: 'buildErrors',
        description: 'La aplicación no carga debido a errores de JSX, imports duplicados, o propiedades incorrectas'
      },
      {
        id: 2,
        name: 'DatePicker/TimePicker',
        test: 'uiComponents',
        description: 'No se abre el picker al hacer clic en cualquier parte del input, falta de estilos'
      },
      {
        id: 3,
        name: 'Elementos UI Desproporcionados',
        test: 'visualConsistency',
        description: 'Inputs, botones y campos de texto demasiado grandes'
      },
      {
        id: 4,
        name: 'Diseño de Cards',
        test: 'visualConsistency',
        description: 'Diseño no gusta, bandas de color (ya eliminadas)'
      },
      {
        id: 5,
        name: 'Función "Nuevo Cierre"',
        test: 'e2eFlows',
        description: 'Formulario demasiado grande, inputs de moneda desproporcionados'
      },
      {
        id: 6,
        name: 'Datos de Ejemplo',
        test: 'dataIntegrity',
        description: 'Se muestran datos que no existen en Firebase'
      },
      {
        id: 7,
        name: 'Inputs de Selección Manual',
        test: 'uiComponents',
        description: 'Inputs permiten entrada manual en lugar de solo selección'
      },
      {
        id: 8,
        name: 'Popups con Diseño Antiguo',
        test: 'uiComponents',
        description: 'Modales no tienen el diseño moderno'
      },
      {
        id: 9,
        name: 'Selección de Tipo de Documento (OCR)',
        test: 'visualConsistency',
        description: 'Diseño demasiado grande, necesita ser más compacto'
      },
      {
        id: 10,
        name: 'Card de Conteo en Inventario',
        test: 'e2eFlows',
        description: 'Card de conteo debe estar arriba, lista de productos debajo'
      },
      {
        id: 11,
        name: 'Indicador de Unidad en Conteo',
        test: 'e2eFlows',
        description: 'En conteo por packs/cajas/mallas, falta indicar qué se cuenta'
      }
    ];

    problems.forEach(problem => {
      const testResult = this.results[problem.test];
      const status = testResult?.success ? '✅ Resuelto' : '❌ Pendiente';
      lines.push(`### ${problem.id}. ${problem.name}`);
      lines.push(`**Estado:** ${status}`);
      lines.push(`**Descripción:** ${problem.description}`);
      lines.push('');
    });

    lines.push('---');
    lines.push('');

    // Detalles por test
    lines.push('## Detalles por Test');
    lines.push('');

    // Build Errors
    if (this.results.buildErrors) {
      lines.push('### 1. Errores de Compilación');
      lines.push(`**Estado:** ${this.results.buildErrors.success ? '✅' : '❌'}`);
      if (this.results.buildErrors.results) {
        lines.push(`- Build exitoso: ${this.results.buildErrors.results.buildSuccess ? '✅' : '❌'}`);
        lines.push(`- Verificación de tipos: ${this.results.buildErrors.results.typeCheckSuccess ? '✅' : '❌'}`);
        if (this.results.buildErrors.results.fileIssues?.length > 0) {
          lines.push(`- Archivos problemáticos: ${this.results.buildErrors.results.fileIssues.length}`);
        }
      }
      lines.push('');
    }

    // Data Integrity
    if (this.results.dataIntegrity) {
      lines.push('### 2. Integridad de Datos');
      lines.push(`**Estado:** ${this.results.dataIntegrity.success ? '✅' : '❌'}`);
      if (this.results.dataIntegrity.results) {
        Object.entries(this.results.dataIntegrity.results.hooks || {}).forEach(([hook, result]) => {
          lines.push(`- ${hook}: ${result.success ? '✅' : '❌'}`);
          if (result.issues?.length > 0) {
            result.issues.forEach(issue => lines.push(`  - ${issue}`));
          }
        });
        if (this.results.dataIntegrity.results.ocrPage) {
          lines.push(`- OCRPage: ${this.results.dataIntegrity.results.ocrPage.success ? '✅' : '❌'}`);
        }
      }
      lines.push('');
    }

    // UI Components
    if (this.results.uiComponents) {
      lines.push('### 3. Componentes UI');
      lines.push(`**Estado:** ${this.results.uiComponents.success ? '✅' : '❌'}`);
      if (this.results.uiComponents.results) {
        ['datePicker', 'timePicker', 'selectWithAdd', 'modal'].forEach(component => {
          const result = this.results.uiComponents.results[component];
          lines.push(`- ${component}: ${result.success ? '✅' : '❌'}`);
          if (result.issues?.length > 0) {
            result.issues.forEach(issue => lines.push(`  - ${issue}`));
          }
        });
      }
      lines.push('');
    }

    // Visual Consistency
    if (this.results.visualConsistency) {
      lines.push('### 4. Consistencia Visual');
      lines.push(`**Estado:** ${this.results.visualConsistency.success ? '✅' : '❌'}`);
      if (this.results.visualConsistency.results) {
        ['css', 'cards', 'cierresPage', 'ocrPage', 'inventoryPage'].forEach(section => {
          const result = this.results.visualConsistency.results[section];
          lines.push(`- ${section}: ${result.success ? '✅' : '❌'}`);
          if (result.issues?.length > 0) {
            result.issues.forEach(issue => lines.push(`  - ${issue}`));
          }
        });
      }
      lines.push('');
    }

    // E2E Flows
    if (this.results.e2eFlows) {
      lines.push('### 5. Flujos E2E Críticos');
      lines.push(`**Estado:** ${this.results.e2eFlows.success ? '✅' : '❌'}`);
      if (this.results.e2eFlows.results) {
        ['nuevoCierre', 'ocrFlow', 'inventoryFlow'].forEach(flow => {
          const result = this.results.e2eFlows.results[flow];
          lines.push(`- ${flow}: ${result.success ? '✅' : '❌'}`);
          if (result.issues?.length > 0) {
            result.issues.forEach(issue => lines.push(`  - ${issue}`));
          }
        });
      }
      lines.push('');
    }

    // Recomendaciones
    lines.push('---');
    lines.push('');
    lines.push('## Recomendaciones');
    lines.push('');

    if (this.results.summary.failedTests > 0) {
      lines.push('1. **Revisar tests fallidos:** Se encontraron problemas que requieren atención inmediata.');
      lines.push('2. **Verificar build:** Asegurar que `npm run build` completa sin errores antes de desplegar.');
      lines.push('3. **Validar datos:** Confirmar que solo se muestran datos de Firebase, no datos de ejemplo.');
      lines.push('4. **Probar en navegador:** Después de corregir, verificar que los cambios se reflejan en la web.');
      lines.push('5. **Ejecutar tests regularmente:** Ejecutar esta suite después de cada cambio importante.');
    } else {
      lines.push('✅ **Todos los tests pasaron correctamente.**');
      lines.push('');
      lines.push('La aplicación está lista para desplegar. Se recomienda:');
      lines.push('1. Verificar manualmente en el navegador que todo funciona como se espera.');
      lines.push('2. Probar los flujos críticos (Nuevo Cierre, OCR, Inventario) en un entorno de prueba.');
      lines.push('3. Ejecutar `npm run build` y verificar que el build de producción funciona correctamente.');
    }

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*Reporte generado automáticamente por la suite de tests de regresión.*');

    const reportContent = lines.join('\n');
    writeFileSync(reportPath, reportContent, 'utf-8');
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN FINAL                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`Tests Exitosos: ${this.results.summary.passedTests}/${this.results.summary.totalTests} ✅`);
    console.log(`Tests Fallidos: ${this.results.summary.failedTests}/${this.results.summary.totalTests} ❌`);
    console.log(`Total de Problemas: ${this.results.summary.totalIssues}`);
    console.log(`\n📄 Reporte completo guardado en: ${reportPath}\n`);
  }
}

// Ejecutar si se llama directamente
const isMainModule = process.argv[1]?.includes('test-regression-suite.js') || 
                     import.meta.url.includes('test-regression-suite.js');

if (isMainModule) {
  const suite = new RegressionTestSuite();
  suite.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando suite de tests:', error);
    process.exit(1);
  });
}

export default RegressionTestSuite;

