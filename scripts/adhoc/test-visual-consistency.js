import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test de Consistencia Visual
 * Verifica estilos CSS, tamaños de elementos, y consistencia visual
 */
class VisualConsistencyTest {
  constructor() {
    this.results = {
      css: {},
      cards: {},
      inputs: {},
      buttons: {},
      cierresPage: {},
      ocrPage: {},
      inventoryPage: {},
      totalIssues: 0
    };
  }

  /**
   * Verifica estilos CSS globales
   */
  testCSS() {
    console.log('🔍 Verificando estilos CSS...');
    const cssPath = join(__dirname, 'src/index.css');
    
    if (!existsSync(cssPath)) {
      this.results.css = { success: false, error: 'index.css no encontrado' };
      console.error('❌ index.css no encontrado');
      return false;
    }

    try {
      const content = readFileSync(cssPath, 'utf-8');
      const issues = [];

      // Verificar que no hay borderLeft en cards
      if (content.includes('borderLeft') || content.includes('border-left')) {
        const borderLeftMatches = content.match(/border[-]?left[^:]*:/g);
        if (borderLeftMatches) {
          // Verificar que no están en clases de cards
          const cardClasses = ['card', 'totals-card', 'kpi-card'];
          borderLeftMatches.forEach(match => {
            const context = content.substring(
              Math.max(0, content.indexOf(match) - 100),
              content.indexOf(match) + 100
            );
            const isInCard = cardClasses.some(cls => context.includes(`.${cls}`));
            if (isInCard) {
              issues.push(`Encontrado border-left en clase de card: ${match.trim()}`);
            }
          });
        }
      }

      // Verificar altura de inputs (debe ser ≤40px)
      const inputHeightMatches = content.match(/\.input-field[^}]*height[^:]*:\s*(\d+)px/g);
      if (inputHeightMatches) {
        inputHeightMatches.forEach(match => {
          const heightMatch = match.match(/(\d+)px/);
          if (heightMatch && parseInt(heightMatch[1]) > 40) {
            issues.push(`Altura de input demasiado grande: ${heightMatch[1]}px (debe ser ≤40px)`);
          }
        });
      }

      // Verificar min-height de inputs
      const inputMinHeightMatches = content.match(/\.input-field[^}]*min-height[^:]*:\s*(\d+)px/g);
      if (inputMinHeightMatches) {
        inputMinHeightMatches.forEach(match => {
          const heightMatch = match.match(/(\d+)px/);
          if (heightMatch && parseInt(heightMatch[1]) > 40) {
            issues.push(`Min-height de input demasiado grande: ${heightMatch[1]}px (debe ser ≤40px)`);
          }
        });
      }

      // Verificar padding de botones (debe ser compacto)
      const buttonPaddingMatches = content.match(/\.btn[^}]*padding[^:]*:\s*(\d+)px\s+(\d+)px/g);
      if (buttonPaddingMatches) {
        buttonPaddingMatches.forEach(match => {
          const paddingMatch = match.match(/(\d+)px\s+(\d+)px/);
          if (paddingMatch) {
            const vertical = parseInt(paddingMatch[1]);
            const horizontal = parseInt(paddingMatch[2]);
            if (vertical > 12 || horizontal > 20) {
              issues.push(`Padding de botón demasiado grande: ${vertical}px ${horizontal}px`);
            }
          }
        });
      }

      // Verificar que los modales tienen estilos modernos
      const hasModalBackdrop = content.includes('backdrop-filter') || content.includes('backdrop-blur');
      const hasModalAnimation = content.includes('@keyframes') && 
        (content.includes('modal') || content.includes('fade'));
      const hasModalShadow = content.includes('.modal') && content.includes('box-shadow');

      if (!hasModalBackdrop) {
        issues.push('Falta backdrop-filter/blur en estilos de modal');
      }
      if (!hasModalAnimation) {
        issues.push('Falta animación en estilos de modal');
      }

      // Verificar padding de cards (debe ser compacto)
      const cardPaddingMatches = content.match(/\.card[^}]*padding[^:]*:\s*(\d+)px/g);
      if (cardPaddingMatches) {
        cardPaddingMatches.forEach(match => {
          const paddingMatch = match.match(/(\d+)px/);
          if (paddingMatch && parseInt(paddingMatch[1]) > 24) {
            issues.push(`Padding de card demasiado grande: ${paddingMatch[1]}px`);
          }
        });
      }

      this.results.css = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ Estilos CSS verificados correctamente');
      } else {
        console.error('❌ Estilos CSS tienen problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.css = { success: false, error: error.message };
      console.error('❌ Error verificando CSS:', error.message);
      return false;
    }
  }

  /**
   * Verifica que no hay borderLeft en archivos de páginas
   */
  testCardsNoBorderLeft() {
    console.log('🔍 Verificando que cards no tienen borderLeft...');
    const pagesDir = join(__dirname, 'src/pages');
    const issues = [];

    if (!existsSync(pagesDir)) {
      this.results.cards = { success: false, error: 'Directorio pages no encontrado' };
      return false;
    }

    try {
      const files = readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
      
      files.forEach(file => {
        const filePath = join(pagesDir, file);
        const content = readFileSync(filePath, 'utf-8');
        
        // Buscar borderLeft en estilos inline
        if (content.includes('borderLeft') || content.includes('border-left')) {
          const matches = content.match(/border[-]?left[^:]*:\s*[^,}]+/g);
          if (matches) {
            matches.forEach(match => {
              // Verificar contexto (si está en un Card o div con clase card)
              const context = content.substring(
                Math.max(0, content.indexOf(match) - 200),
                content.indexOf(match) + 200
              );
              if (context.includes('Card') || context.includes('card') || context.includes('className="card"')) {
                issues.push(`${file}: Encontrado border-left en card: ${match.trim()}`);
              }
            });
          }
        }
      });

      this.results.cards = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ No se encontraron borderLeft en cards');
      } else {
        console.error('❌ Se encontraron borderLeft en cards:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.cards = { success: false, error: error.message };
      console.error('❌ Error verificando cards:', error.message);
      return false;
    }
  }

  /**
   * Verifica CierresPage - diseño compacto y proporciones
   */
  testCierresPage() {
    console.log('🔍 Verificando CierresPage...');
    const filePath = join(__dirname, 'src/pages/CierresPage.tsx');
    
    if (!existsSync(filePath)) {
      this.results.cierresPage = { success: false, error: 'Archivo no encontrado' };
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const issues = [];

      // Verificar que tiene vista compacta (no step-by-step)
      const hasStepIndicator = content.includes('StepIndicator') && content.includes('step');
      if (hasStepIndicator && content.includes('viewMode === \'form\'')) {
        // Verificar que no se usa en modo compacto
        const formSection = content.substring(
          content.indexOf('viewMode === \'form\''),
          content.indexOf('viewMode === \'form\'') + 2000
        );
        if (formSection.includes('StepIndicator')) {
          issues.push('CierresPage usa StepIndicator en modo form (debe ser vista compacta única)');
        }
      }

      // Verificar layout de campos de moneda (label izquierda, input derecha)
      const hasCashGrid = content.includes('cash-grid') || content.includes('cash-item');
      if (!hasCashGrid) {
        issues.push('No se encontró layout cash-grid o cash-item para campos de moneda');
      }

      // Verificar que los inputs de moneda tienen label a la izquierda
      const hasCashItemLabel = content.includes('cash-item-label') || 
        (content.includes('label') && content.includes('cash'));
      if (!hasCashItemLabel) {
        issues.push('No se encontró estructura label-izquierda/input-derecha para campos de moneda');
      }

      // Verificar que no hay inputs desproporcionados (buscar estilos inline con width > 80%)
      const widthMatches = content.match(/width['":\s]*(\d+)%/g);
      if (widthMatches) {
        widthMatches.forEach(match => {
          const widthMatch = match.match(/(\d+)%/);
          if (widthMatch && parseInt(widthMatch[1]) > 80) {
            const context = content.substring(
              Math.max(0, content.indexOf(match) - 100),
              content.indexOf(match) + 100
            );
            if (context.includes('input') || context.includes('Input')) {
              issues.push(`Input con ancho demasiado grande: ${widthMatch[1]}%`);
            }
          }
        });
      }

      this.results.cierresPage = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ CierresPage tiene diseño compacto correcto');
      } else {
        console.error('❌ CierresPage tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.cierresPage = { success: false, error: error.message };
      console.error('❌ Error verificando CierresPage:', error.message);
      return false;
    }
  }

  /**
   * Verifica OCRPage - selección de tipo de documento compacta
   */
  testOCRPage() {
    console.log('🔍 Verificando OCRPage...');
    const filePath = join(__dirname, 'src/pages/OCRPage.tsx');
    
    if (!existsSync(filePath)) {
      this.results.ocrPage = { success: false, error: 'Archivo no encontrado' };
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const issues = [];

      // Verificar que la selección de tipo de documento es compacta (grid 2x2)
      const hasGrid = content.includes('grid') || content.includes('Grid');
      const has2x2 = content.includes('repeat(2') || content.includes('grid-template-columns');
      
      if (!hasGrid && !has2x2) {
        issues.push('Selección de tipo de documento no usa grid 2x2 compacto');
      }

      // Verificar que no hay flechas laterales (ArrowLeft/ArrowRight en el paso 1)
      const step1Content = content.substring(
        content.indexOf('wizardStep === 1') || 0,
        (content.indexOf('wizardStep === 2') || content.length) - 100
      );
      if (step1Content.includes('ArrowLeft') || step1Content.includes('ArrowRight')) {
        issues.push('Selección de tipo de documento tiene flechas laterales (no debería)');
      }

      // Verificar que los iconos son pequeños
      const iconSizeMatches = step1Content.match(/size[={]\s*(\d+)/g);
      if (iconSizeMatches) {
        iconSizeMatches.forEach(match => {
          const sizeMatch = match.match(/(\d+)/);
          if (sizeMatch && parseInt(sizeMatch[1]) > 48) {
            issues.push(`Icono demasiado grande en selección de documento: ${sizeMatch[1]}px`);
          }
        });
      }

      this.results.ocrPage = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ OCRPage tiene selección de documento compacta');
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
   * Verifica InventoryPage - card de conteo arriba
   */
  testInventoryPage() {
    console.log('🔍 Verificando InventoryPage...');
    const filePath = join(__dirname, 'src/pages/InventoryPage.tsx');
    
    if (!existsSync(filePath)) {
      this.results.inventoryPage = { success: false, error: 'Archivo no encontrado' };
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const issues = [];

      // Verificar que cuando isCountingInventory es true, el card de conteo está antes de la lista
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
          issues.push('Card de conteo no está antes de la lista de productos cuando isCountingInventory es true');
        }
      }

      // Verificar que hay campo "Unidad contenida" cuando metodoRecepcion !== 'unitario'
      if (!content.includes('Unidad contenida') && !content.includes('unidad contenida')) {
        // Verificar si al menos hay lógica condicional para mostrar unidad
        if (content.includes('metodoRecepcion') && !content.includes('metodoRecepcion === \'unitario\'')) {
          issues.push('Falta campo "Unidad contenida" cuando metodoRecepcion !== unitario');
        }
      }

      this.results.inventoryPage = {
        success: issues.length === 0,
        issues
      };

      if (issues.length === 0) {
        console.log('✅ InventoryPage tiene layout correcto');
      } else {
        console.error('❌ InventoryPage tiene problemas:', issues);
      }

      return issues.length === 0;
    } catch (error) {
      this.results.inventoryPage = { success: false, error: error.message };
      console.error('❌ Error verificando InventoryPage:', error.message);
      return false;
    }
  }

  /**
   * Ejecuta todos los tests
   */
  async run() {
    console.log('\n═══════════════════════════════════════');
    console.log('TEST: Consistencia Visual');
    console.log('═══════════════════════════════════════\n');

    const cssOk = this.testCSS();
    const cardsOk = this.testCardsNoBorderLeft();
    const cierresOk = this.testCierresPage();
    const ocrOk = this.testOCRPage();
    const inventoryOk = this.testInventoryPage();

    // Contar issues totales
    this.results.totalIssues = 
      Object.values(this.results).reduce((sum, result) => {
        if (result.issues) {
          return sum + result.issues.length;
        }
        return sum;
      }, 0);

    return {
      success: cssOk && cardsOk && cierresOk && ocrOk && inventoryOk,
      results: this.results
    };
  }

  /**
   * Genera reporte en formato texto
   */
  getReport() {
    const lines = [];
    lines.push('═══════════════════════════════════════');
    lines.push('REPORTE: Consistencia Visual');
    lines.push('═══════════════════════════════════════\n');

    ['css', 'cards', 'cierresPage', 'ocrPage', 'inventoryPage'].forEach(section => {
      const result = this.results[section];
      lines.push(`${section}: ${result.success ? '✅' : '❌'}`);
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
  const test = new VisualConsistencyTest();
  test.run().then(result => {
    console.log('\n' + test.getReport());
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando test:', error);
    process.exit(1);
  });
}

export default VisualConsistencyTest;

