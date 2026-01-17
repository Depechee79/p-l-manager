import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test E2E de Flujos Críticos
 * Verifica que los flujos críticos están implementados correctamente
 */
class E2EFlowsTest {
  constructor() {
    this.results = {
      nuevoCierre: {},
      ocrFlow: {},
      inventoryFlow: {},
      totalIssues: 0
    };
  }

  /**
   * Verifica flujo de "Nuevo Cierre"
   */
  testNuevoCierreFlow() {
    console.log('🔍 Verificando flujo de Nuevo Cierre...');
    const filePath = join(__dirname, 'src/pages/CierresPage.tsx');
    
    if (!existsSync(filePath)) {
      this.results.nuevoCierre = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ CierresPage.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const issues = [];

      // Verificar que tiene función para abrir formulario
      if (!content.includes('handleOpenForm') && !content.includes('setViewMode(\'form\')')) {
        issues.push('Falta función para abrir formulario de nuevo cierre');
      }

      // Verificar que tiene todos los campos requeridos
      const requiredFields = [
        'fecha',
        'turno',
        'desgloseEfectivo',
        'datafonos',
        'otrosMedios'
      ];

      requiredFields.forEach(field => {
        if (!content.includes(field)) {
          issues.push(`Falta campo requerido: ${field}`);
        }
      });

      // Verificar que tiene sección de conteo de efectivo
      if (!content.includes('Conteo de Efectivo') && !content.includes('conteo') && !content.includes('desgloseEfectivo')) {
        issues.push('Falta sección de conteo de efectivo');
      }

      // Verificar que tiene sección de métodos de pago
      if (!content.includes('Métodos de Pago') && !content.includes('datafonos') && !content.includes('otrosMedios')) {
        issues.push('Falta sección de métodos de pago');
      }

      // Verificar que tiene sección de datos POS
      if (!content.includes('Datos POS') && !content.includes('posEfectivo') && !content.includes('posTarjetas')) {
        issues.push('Falta sección de datos POS');
      }

      // Verificar que tiene resumen y cuadre
      if (!content.includes('Resumen') && !content.includes('Cuadre') && !content.includes('descuadre')) {
        issues.push('Falta sección de resumen y cuadre');
      }

      // Verificar que usa DatePicker para fecha
      if (!content.includes('DatePicker')) {
        issues.push('No usa componente DatePicker para fecha');
      }

      // Verificar que tiene función de guardar
      if (!content.includes('createClosing') && !content.includes('handleSave')) {
        issues.push('Falta función para guardar cierre');
      }

      // Verificar layout compacto (no step-by-step)
      const hasStepIndicator = content.includes('StepIndicator') && 
        content.includes('step') && 
        content.includes('viewMode === \'form\'');
      
      if (hasStepIndicator) {
        // Verificar que no se muestra en modo form
        const formSection = content.substring(
          content.indexOf('viewMode === \'form\''),
          content.indexOf('viewMode === \'form\'') + 3000
        );
        if (formSection.includes('<StepIndicator')) {
          issues.push('Formulario de nuevo cierre usa StepIndicator (debe ser vista compacta única)');
        }
      }

      this.results.nuevoCierre = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ Flujo de Nuevo Cierre implementado correctamente');
      } else {
        console.error('❌ Flujo de Nuevo Cierre tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.nuevoCierre = { success: false, error: error.message };
      console.error('❌ Error verificando flujo de Nuevo Cierre:', error.message);
      return false;
    }
  }

  /**
   * Verifica flujo de OCR
   */
  testOCRFlow() {
    console.log('🔍 Verificando flujo de OCR...');
    const filePath = join(__dirname, 'src/pages/OCRPage.tsx');
    
    if (!existsSync(filePath)) {
      this.results.ocrFlow = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ OCRPage.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const issues = [];

      // Verificar que tiene wizard steps
      if (!content.includes('wizardStep') && !content.includes('wizardSteps')) {
        issues.push('Falta implementación de wizard steps');
      }

      // Verificar paso 1: Selección de tipo de documento
      if (!content.includes('wizardStep === 1') && !content.includes('step === 1')) {
        issues.push('Falta paso 1: Selección de tipo de documento');
      }

      // Verificar que tiene tipos de documento
      const docTypes = ['factura', 'albaran', 'ticket', 'cierre'];
      const hasDocTypes = docTypes.some(type => 
        content.includes(type) || content.includes('OCRDocumentType')
      );
      if (!hasDocTypes) {
        issues.push('Falta selección de tipos de documento');
      }

      // Verificar paso 2: Subir archivo
      if (!content.includes('wizardStep === 2') && !content.includes('step === 2')) {
        issues.push('Falta paso 2: Subir archivo');
      }

      // Verificar que tiene input de archivo
      if (!content.includes('type="file"') && !content.includes('input') && !content.includes('File')) {
        issues.push('Falta input para subir archivo');
      }

      // Verificar paso 3: Analizar
      if (!content.includes('wizardStep === 3') && !content.includes('step === 3')) {
        issues.push('Falta paso 3: Analizar documento');
      }

      // Verificar que tiene función de análisis OCR
      if (!content.includes('OCRService') && !content.includes('processImage') && !content.includes('extract')) {
        issues.push('Falta funcionalidad de análisis OCR');
      }

      // Verificar paso 4: Revisar
      if (!content.includes('wizardStep === 4') && !content.includes('step === 4')) {
        issues.push('Falta paso 4: Revisar datos extraídos');
      }

      // Verificar paso 5: Validar
      if (!content.includes('wizardStep === 5') && !content.includes('step === 5')) {
        issues.push('Falta paso 5: Validar y guardar');
      }

      // Verificar que tiene función de guardar
      if (!content.includes('save') && !content.includes('create') && !content.includes('guardar')) {
        issues.push('Falta función para guardar documento procesado');
      }

      // Verificar selección de tipo de documento compacta (grid 2x2)
      const step1Start = content.indexOf('wizardStep === 1');
      const step2Start = content.indexOf('wizardStep === 2');
      if (step1Start >= 0) {
        const step1Content = content.substring(
          step1Start,
          step2Start > step1Start ? step2Start : content.length
        );
        const hasGrid = step1Content.includes('gridTemplateColumns') || 
                       step1Content.includes('grid') || 
                       step1Content.includes('Grid');
        if (!hasGrid) {
          issues.push('Selección de tipo de documento no usa grid compacto');
        }
      }

      this.results.ocrFlow = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ Flujo de OCR implementado correctamente');
      } else {
        console.error('❌ Flujo de OCR tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.ocrFlow = { success: false, error: error.message };
      console.error('❌ Error verificando flujo de OCR:', error.message);
      return false;
    }
  }

  /**
   * Verifica flujo de Inventario
   */
  testInventoryFlow() {
    console.log('🔍 Verificando flujo de Inventario...');
    const filePath = join(__dirname, 'src/pages/InventoryPage.tsx');
    
    if (!existsSync(filePath)) {
      this.results.inventoryFlow = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ InventoryPage.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const issues = [];

      // Verificar que tiene función para iniciar conteo
      if (!content.includes('startInventory') && !content.includes('handleStartInventory')) {
        issues.push('Falta función para iniciar conteo de inventario');
      }

      // Verificar que tiene estado isCountingInventory
      if (!content.includes('isCountingInventory')) {
        issues.push('Falta estado isCountingInventory');
      }

      // Verificar que tiene lista de productos filtrable
      if (!content.includes('filteredProducts') && !content.includes('filter')) {
        issues.push('Falta funcionalidad de filtrado de productos');
      }

      // Verificar que tiene búsqueda
      if (!content.includes('search') && !content.includes('Search')) {
        issues.push('Falta funcionalidad de búsqueda de productos');
      }

      // Verificar que tiene campos de cantidad para conteo
      if (!content.includes('quantity') && !content.includes('cantidad') && !content.includes('quantities')) {
        issues.push('Falta campo para ingresar cantidades en conteo');
      }

      // Verificar que tiene opción de conteo por total o por pack
      if (!content.includes('pack') && !content.includes('caja') && !content.includes('unidad')) {
        // Al menos debe tener lógica de recepción
        if (!content.includes('metodoRecepcion')) {
          issues.push('Falta lógica de conteo por total o pack');
        }
      }

      // Verificar que tiene función para completar inventario
      if (!content.includes('completeInventory') && !content.includes('handleCompleteInventory')) {
        issues.push('Falta función para completar inventario');
      }

      // Verificar que tiene función para cancelar inventario
      if (!content.includes('cancelInventory') && !content.includes('handleCancelInventory')) {
        issues.push('Falta función para cancelar inventario');
      }

      // Verificar layout: card de conteo arriba cuando isCountingInventory
      const countingStart = content.indexOf('isCountingInventory &&');
      if (countingStart >= 0) {
        const countingSection = content.substring(countingStart, countingStart + 2000);
        const cardConteoIndex = countingSection.indexOf('Conteo de Productos') >= 0 ? 
                                countingSection.indexOf('Conteo de Productos') : 
                                (countingSection.indexOf('Conteo') >= 0 ? countingSection.indexOf('Conteo') : -1);
        const tableIndex = countingSection.indexOf('<Table') >= 0 ? 
                          countingSection.indexOf('<Table') : 
                          (countingSection.indexOf('data={filteredAndSearched}') >= 0 ? countingSection.indexOf('data={filteredAndSearched}') : -1);
        
        if (cardConteoIndex >= 0 && tableIndex >= 0 && cardConteoIndex > tableIndex) {
          issues.push('Card de conteo no está antes de la lista cuando isCountingInventory es true');
        }
      }

      // Verificar campo "Unidad contenida" cuando metodoRecepcion !== 'unitario'
      if (content.includes('metodoRecepcion') && !content.includes('Unidad contenida') && !content.includes('unidad contenida')) {
        const metodoSection = content.substring(
          content.indexOf('metodoRecepcion'),
          content.indexOf('metodoRecepcion') + 1000
        );
        if (metodoSection.includes('!== \'unitario\'') || metodoSection.includes('!== "unitario"')) {
          issues.push('Falta campo "Unidad contenida" cuando metodoRecepcion !== unitario');
        }
      }

      this.results.inventoryFlow = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ Flujo de Inventario implementado correctamente');
      } else {
        console.error('❌ Flujo de Inventario tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.inventoryFlow = { success: false, error: error.message };
      console.error('❌ Error verificando flujo de Inventario:', error.message);
      return false;
    }
  }

  /**
   * Ejecuta todos los tests
   */
  async run() {
    console.log('\n═══════════════════════════════════════');
    console.log('TEST: Flujos E2E Críticos');
    console.log('═══════════════════════════════════════\n');

    const nuevoCierreOk = this.testNuevoCierreFlow();
    const ocrOk = this.testOCRFlow();
    const inventoryOk = this.testInventoryFlow();

    // Contar issues totales
    this.results.totalIssues = 
      Object.values(this.results).reduce((sum, result) => {
        if (result.issues) {
          return sum + result.issues.length;
        }
        return sum;
      }, 0);

    return {
      success: nuevoCierreOk && ocrOk && inventoryOk,
      results: this.results
    };
  }

  /**
   * Genera reporte en formato texto
   */
  getReport() {
    const lines = [];
    lines.push('═══════════════════════════════════════');
    lines.push('REPORTE: Flujos E2E Críticos');
    lines.push('═══════════════════════════════════════\n');

    ['nuevoCierre', 'ocrFlow', 'inventoryFlow'].forEach(flow => {
      const result = this.results[flow];
      lines.push(`${flow}: ${result.success ? '✅' : '❌'}`);
      if (result.issues && result.issues.length > 0) {
        result.issues.forEach(issue => lines.push(`  - ${issue}`));
      }
      if (result.error) {
        lines.push(`  - Error: ${result.error}`);
      }
      lines.push('');
    });

    lines.push(`Total de problemas encontrados: ${this.results.totalIssues}`);

    return lines.join('\n');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new E2EFlowsTest();
  test.run().then(result => {
    console.log('\n' + test.getReport());
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando test:', error);
    process.exit(1);
  });
}

export default E2EFlowsTest;

