import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test de Componentes UI
 * Verifica DatePicker, TimePicker, SelectWithAdd y Modal
 */
class UIComponentsTest {
  constructor() {
    this.results = {
      datePicker: {},
      timePicker: {},
      selectWithAdd: {},
      modal: {},
      totalIssues: 0
    };
  }

  /**
   * Verifica DatePicker
   */
  testDatePicker() {
    console.log('🔍 Verificando DatePicker...');
    const fullPath = join(__dirname, 'src/components/DatePicker.tsx');
    
    if (!existsSync(fullPath)) {
      this.results.datePicker = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ DatePicker.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const issues = [];

      // Verificar que tiene handleContainerClick
      if (!content.includes('handleContainerClick')) {
        issues.push('Falta handleContainerClick para abrir picker al hacer clic en cualquier parte');
      }

      // Verificar que tiene handleInputClick
      if (!content.includes('handleInputClick')) {
        issues.push('Falta handleInputClick para abrir picker al hacer clic en el input');
      }

      // Verificar que tiene showPicker
      if (!content.includes('showPicker')) {
        issues.push('Falta showPicker() para abrir el picker nativo');
      }

      // Verificar que el contenedor tiene onClick
      if (!content.includes('onClick={handleContainerClick}')) {
        issues.push('El contenedor no tiene onClick para abrir el picker');
      }

      // Verificar estilos CSS
      const hasStyles = 
        content.includes('date-picker-input') &&
        content.includes('::-webkit-calendar-picker-indicator') &&
        content.includes('::-webkit-datetime-edit');

      if (!hasStyles) {
        issues.push('Faltan estilos CSS para el input de fecha');
      }

      // Verificar que tiene readOnly
      if (!content.includes('readOnly')) {
        issues.push('El input no tiene readOnly para forzar uso del picker');
      }

      // Verificar que tiene estilos inline o className
      const hasInputStyles = 
        content.includes('style={{') ||
        content.includes('className=');

      if (!hasInputStyles) {
        issues.push('El input no tiene estilos aplicados');
      }

      // Verificar altura del input (debe ser 40px o menos)
      if (content.includes('height') && !content.match(/height['":\s]*40/)) {
        const heightMatch = content.match(/height['":\s]*(\d+)/);
        if (heightMatch && parseInt(heightMatch[1]) > 40) {
          issues.push(`Altura del input demasiado grande: ${heightMatch[1]}px (debe ser ≤40px)`);
        }
      }

      this.results.datePicker = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ DatePicker implementado correctamente');
      } else {
        console.error('❌ DatePicker tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.datePicker = { success: false, error: error.message };
      console.error('❌ Error verificando DatePicker:', error.message);
      return false;
    }
  }

  /**
   * Verifica TimePicker
   */
  testTimePicker() {
    console.log('🔍 Verificando TimePicker...');
    const fullPath = join(__dirname, 'src/components/TimePicker.tsx');
    
    if (!existsSync(fullPath)) {
      this.results.timePicker = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ TimePicker.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const issues = [];

      // Verificar que tiene handleContainerClick
      if (!content.includes('handleContainerClick')) {
        issues.push('Falta handleContainerClick para abrir picker al hacer clic en cualquier parte');
      }

      // Verificar que tiene showPicker
      if (!content.includes('showPicker')) {
        issues.push('Falta showPicker() para abrir el picker nativo');
      }

      // Verificar estilos CSS
      const hasStyles = 
        content.includes('time-picker-input') &&
        content.includes('::-webkit-calendar-picker-indicator');

      if (!hasStyles) {
        issues.push('Faltan estilos CSS para el input de hora');
      }

      // Verificar que tiene readOnly
      if (!content.includes('readOnly')) {
        issues.push('El input no tiene readOnly para forzar uso del picker');
      }

      // Verificar altura del input (debe ser 40px o menos)
      if (content.includes('height') && !content.match(/height['":\s]*40/)) {
        const heightMatch = content.match(/height['":\s]*(\d+)/);
        if (heightMatch && parseInt(heightMatch[1]) > 40) {
          issues.push(`Altura del input demasiado grande: ${heightMatch[1]}px (debe ser ≤40px)`);
        }
      }

      this.results.timePicker = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ TimePicker implementado correctamente');
      } else {
        console.error('❌ TimePicker tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.timePicker = { success: false, error: error.message };
      console.error('❌ Error verificando TimePicker:', error.message);
      return false;
    }
  }

  /**
   * Verifica SelectWithAdd
   */
  testSelectWithAdd() {
    console.log('🔍 Verificando SelectWithAdd...');
    const fullPath = join(__dirname, 'src/components/SelectWithAdd.tsx');
    
    if (!existsSync(fullPath)) {
      this.results.selectWithAdd = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ SelectWithAdd.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const issues = [];

      // Verificar que tiene funcionalidad de "Añadir nuevo"
      if (!content.includes('__add_new__') && !content.includes('add_new')) {
        issues.push('Falta opción para añadir nuevo item');
      }

      // Verificar que tiene onAddNew o modal para añadir
      if (!content.includes('onAddNew') && !content.includes('showAddModal')) {
        issues.push('Falta funcionalidad para añadir nuevos items');
      }

      // Verificar que usa Modal
      if (!content.includes('Modal')) {
        issues.push('No usa componente Modal para añadir items');
      }

      // Verificar que extiende Select
      if (!content.includes('Select')) {
        issues.push('No extiende o usa el componente Select');
      }

      this.results.selectWithAdd = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ SelectWithAdd implementado correctamente');
      } else {
        console.error('❌ SelectWithAdd tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.selectWithAdd = { success: false, error: error.message };
      console.error('❌ Error verificando SelectWithAdd:', error.message);
      return false;
    }
  }

  /**
   * Verifica Modal
   */
  testModal() {
    console.log('🔍 Verificando Modal...');
    const fullPath = join(__dirname, 'src/components/Modal.tsx');
    const cssPath = join(__dirname, 'src/index.css');
    
    if (!existsSync(fullPath)) {
      this.results.modal = { success: false, error: 'Archivo no encontrado' };
      console.error('❌ Modal.tsx no encontrado');
      return false;
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const cssContent = existsSync(cssPath) ? readFileSync(cssPath, 'utf-8') : '';
      const issues = [];

      // Verificar que tiene modal-overlay
      if (!content.includes('modal-overlay')) {
        issues.push('Falta clase modal-overlay');
      }

      // Verificar que tiene modal-content
      if (!content.includes('modal-content')) {
        issues.push('Falta clase modal-content');
      }

      // Verificar estilos CSS modernos
      if (cssContent) {
        const hasBackdropBlur = cssContent.includes('backdrop-filter') || cssContent.includes('backdrop-blur');
        const hasAnimation = cssContent.includes('@keyframes') || cssContent.includes('animation');
        const hasModernShadow = cssContent.includes('box-shadow') && 
          (cssContent.includes('rgba') || cssContent.includes('shadow'));

        if (!hasBackdropBlur) {
          issues.push('Falta backdrop-filter/blur en estilos del modal');
        }
        if (!hasAnimation) {
          issues.push('Falta animación en estilos del modal');
        }
        if (!hasModernShadow) {
          issues.push('Falta sombra moderna en estilos del modal');
        }
      } else {
        issues.push('No se encontró index.css para verificar estilos');
      }

      // Verificar que tiene closeOnOverlayClick
      if (!content.includes('closeOnOverlayClick')) {
        issues.push('Falta funcionalidad closeOnOverlayClick');
      }

      this.results.modal = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ Modal implementado correctamente');
      } else {
        console.error('❌ Modal tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.modal = { success: false, error: error.message };
      console.error('❌ Error verificando Modal:', error.message);
      return false;
    }
  }

  /**
   * Ejecuta todos los tests
   */
  async run() {
    console.log('\n═══════════════════════════════════════');
    console.log('TEST: Componentes UI');
    console.log('═══════════════════════════════════════\n');

    const datePickerOk = this.testDatePicker();
    const timePickerOk = this.testTimePicker();
    const selectWithAddOk = this.testSelectWithAdd();
    const modalOk = this.testModal();

    // Contar issues totales
    this.results.totalIssues = 
      Object.values(this.results).reduce((sum, result) => {
        if (result.issues) {
          return sum + result.issues.length;
        }
        return sum;
      }, 0);

    return {
      success: datePickerOk && timePickerOk && selectWithAddOk && modalOk,
      results: this.results
    };
  }

  /**
   * Genera reporte en formato texto
   */
  getReport() {
    const lines = [];
    lines.push('═══════════════════════════════════════');
    lines.push('REPORTE: Componentes UI');
    lines.push('═══════════════════════════════════════\n');

    ['datePicker', 'timePicker', 'selectWithAdd', 'modal'].forEach(component => {
      const result = this.results[component];
      lines.push(`${component}: ${result.success ? '✅' : '❌'}`);
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
  const test = new UIComponentsTest();
  test.run().then(result => {
    console.log('\n' + test.getReport());
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando test:', error);
    process.exit(1);
  });
}

export default UIComponentsTest;

