import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test de Errores de Compilación
 * Verifica que la aplicación compila sin errores y que no hay problemas de JSX, imports, o tipos
 */
class BuildErrorsTest {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.results = {
      buildSuccess: false,
      typeCheckSuccess: false,
      jsxErrors: [],
      importErrors: [],
      typeErrors: [],
      totalErrors: 0
    };
  }

  /**
   * Ejecuta npm run build y captura errores
   */
  testBuild() {
    console.log('🔨 Verificando compilación (npm run build)...');
    try {
      const output = execSync('npm run build', { 
        encoding: 'utf-8',
        cwd: __dirname,
        stdio: 'pipe'
      });
      this.results.buildSuccess = true;
      console.log('✅ Build completado sin errores');
      return true;
    } catch (error) {
      this.results.buildSuccess = false;
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
      this.results.buildErrors = errorOutput;
      
      // Analizar tipos de errores
      if (errorOutput.includes('JSX') || errorOutput.includes('jsx')) {
        this.results.jsxErrors.push('Error de JSX detectado en build');
      }
      if (errorOutput.includes('import') || errorOutput.includes('Import')) {
        this.results.importErrors.push('Error de importación detectado en build');
      }
      if (errorOutput.includes('Type') || errorOutput.includes('type')) {
        this.results.typeErrors.push('Error de tipo detectado en build');
      }
      
      console.error('❌ Build falló:', errorOutput.substring(0, 500));
      return false;
    }
  }

  /**
   * Verifica tipos TypeScript
   */
  testTypeCheck() {
    console.log('🔍 Verificando tipos TypeScript...');
    try {
      const output = execSync('npx tsc --noEmit', { 
        encoding: 'utf-8',
        cwd: __dirname,
        stdio: 'pipe'
      });
      this.results.typeCheckSuccess = true;
      console.log('✅ Verificación de tipos completada sin errores');
      return true;
    } catch (error) {
      this.results.typeCheckSuccess = false;
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
      this.results.typeCheckErrors = errorOutput;
      
      // Extraer errores específicos
      const errorLines = errorOutput.split('\n').filter(line => 
        line.includes('error TS') || line.includes('error:')
      );
      this.results.typeErrors.push(...errorLines);
      
      console.error('❌ Verificación de tipos falló:', errorOutput.substring(0, 500));
      return false;
    }
  }

  /**
   * Verifica archivos problemáticos reportados
   */
  testProblematicFiles() {
    console.log('📁 Verificando archivos problemáticos reportados...');
    const problematicFiles = [
      'src/pages/CierresPage.tsx',
      'src/pages/EscandallosPage.tsx',
      'src/pages/InventoryPage.tsx'
    ];

    const fileIssues = [];

    problematicFiles.forEach(filePath => {
      const fullPath = join(__dirname, filePath);
      if (!existsSync(fullPath)) {
        fileIssues.push({ file: filePath, issue: 'Archivo no encontrado' });
        return;
      }

      try {
        const content = readFileSync(fullPath, 'utf-8');
        const issues = [];

        // Verificar imports duplicados
        const imports = content.match(/^import\s+.*from\s+['"].*['"];?/gm) || [];
        const importMap = new Map();
        imports.forEach(imp => {
          const key = imp.trim();
          if (importMap.has(key)) {
            issues.push(`Import duplicado: ${key.substring(0, 50)}...`);
          } else {
            importMap.set(key, true);
          }
        });

        // Verificar JSX mal cerrado (búsqueda básica)
        const openTags = (content.match(/<[A-Z][a-zA-Z]*[^>]*>/g) || []).length;
        const closeTags = (content.match(/<\/[A-Z][a-zA-Z]*>/g) || []).length;
        if (Math.abs(openTags - closeTags) > 5) {
          issues.push(`Posible desbalance de tags JSX (${openTags} abiertos, ${closeTags} cerrados)`);
        }

        // Verificar propiedades incorrectas comunes
        if (content.includes('icon=') && !content.includes('Icon')) {
          issues.push('Posible uso incorrecto de prop "icon"');
        }

        if (issues.length > 0) {
          fileIssues.push({ file: filePath, issues });
        }
      } catch (error) {
        fileIssues.push({ file: filePath, issue: `Error al leer archivo: ${error.message}` });
      }
    });

    this.results.fileIssues = fileIssues;
    if (fileIssues.length > 0) {
      console.warn('⚠️  Problemas encontrados en archivos:', fileIssues.length);
      fileIssues.forEach(({ file, issues, issue }) => {
        if (issues) {
          issues.forEach(i => console.warn(`   ${file}: ${i}`));
        } else {
          console.warn(`   ${file}: ${issue}`);
        }
      });
    } else {
      console.log('✅ Archivos problemáticos verificados sin errores obvios');
    }

    return fileIssues.length === 0;
  }

  /**
   * Ejecuta todos los tests
   */
  async run() {
    console.log('\n═══════════════════════════════════════');
    console.log('TEST: Errores de Compilación y Carga');
    console.log('═══════════════════════════════════════\n');

    const buildOk = this.testBuild();
    const typeCheckOk = this.testTypeCheck();
    const filesOk = this.testProblematicFiles();

    this.results.totalErrors = 
      (buildOk ? 0 : 1) + 
      (typeCheckOk ? 0 : 1) + 
      this.results.fileIssues?.length || 0;

    return {
      success: buildOk && typeCheckOk && filesOk,
      results: this.results
    };
  }

  /**
   * Genera reporte en formato texto
   */
  getReport() {
    const lines = [];
    lines.push('═══════════════════════════════════════');
    lines.push('REPORTE: Errores de Compilación');
    lines.push('═══════════════════════════════════════\n');

    lines.push(`Build exitoso: ${this.results.buildSuccess ? '✅' : '❌'}`);
    lines.push(`Verificación de tipos: ${this.results.typeCheckSuccess ? '✅' : '❌'}`);
    lines.push(`Archivos problemáticos: ${this.results.fileIssues?.length || 0} problemas\n`);

    if (!this.results.buildSuccess && this.results.buildErrors) {
      lines.push('Errores de Build:');
      lines.push(this.results.buildErrors.substring(0, 1000));
      lines.push('');
    }

    if (!this.results.typeCheckSuccess && this.results.typeCheckErrors) {
      lines.push('Errores de Tipos:');
      lines.push(this.results.typeCheckErrors.substring(0, 1000));
      lines.push('');
    }

    if (this.results.fileIssues && this.results.fileIssues.length > 0) {
      lines.push('Problemas en Archivos:');
      this.results.fileIssues.forEach(({ file, issues, issue }) => {
        lines.push(`  ${file}:`);
        if (issues) {
          issues.forEach(i => lines.push(`    - ${i}`));
        } else {
          lines.push(`    - ${issue}`);
        }
      });
    }

    return lines.join('\n');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new BuildErrorsTest();
  test.run().then(result => {
    console.log('\n' + test.getReport());
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando test:', error);
    process.exit(1);
  });
}

export default BuildErrorsTest;

