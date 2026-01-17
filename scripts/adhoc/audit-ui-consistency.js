/**
 * AUDITORÍA DE CONSISTENCIA DE INTERFAZ
 * 
 * Verifica:
 * 1. Reutilización estricta de componentes
 * 2. Estandarización de patrones UI
 * 3. Consistencia de feedback (micro-interacciones)
 * 4. Coherencia cross-app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const report = {
  timestamp: new Date().toISOString(),
  issues: [],
  warnings: [],
  passed: [],
  summary: {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper para leer archivos
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

// Helper para buscar patrones
function findPatterns(content, patterns) {
  const results = [];
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex);
    if (matches) {
      results.push(...matches);
    }
  });
  return results;
}

// 1. VERIFICAR REUTILIZACIÓN DE COMPONENTES
function checkComponentReuse() {
  console.log('\n📦 1. VERIFICANDO REUTILIZACIÓN DE COMPONENTES...\n');
  
  const componentsDir = path.join(__dirname, 'src/components');
  const pagesDir = path.join(__dirname, 'src/pages');
  
  // Componentes esperados
  const expectedComponents = [
    'DatePicker', 'TimePicker', 'Input', 'Select', 'Button', 
    'Card', 'Table', 'Modal', 'SelectWithAdd'
  ];
  
  // Buscar usos de inputs nativos vs componentes
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  
  pages.forEach(pageFile => {
    const content = readFile(path.join(pagesDir, pageFile));
    if (!content) return;
    
    // Buscar inputs nativos de fecha/hora
    const nativeDateInputs = findPatterns(content, [
      '<input[^>]*type=["\']date["\']',
      '<input[^>]*type=["\']time["\']'
    ]);
    
    if (nativeDateInputs.length > 0) {
      report.issues.push({
        category: 'Component Reuse',
        severity: 'HIGH',
        file: pageFile,
        issue: 'Uso de input nativo de fecha/hora en lugar de DatePicker/TimePicker',
        count: nativeDateInputs.length,
        examples: nativeDateInputs.slice(0, 3)
      });
      report.summary.failed++;
    } else {
      report.passed.push({
        category: 'Component Reuse',
        file: pageFile,
        check: 'No inputs nativos de fecha/hora encontrados'
      });
      report.summary.passed++;
    }
    
    // Buscar selects nativos
    const nativeSelects = findPatterns(content, [
      '<select[^>]*>'
    ]);
    
    if (nativeSelects.length > 0) {
      // Verificar si hay uso de Select component también
      const hasSelectComponent = content.includes('from \'../components\'') && 
                                 content.includes('Select');
      
      if (!hasSelectComponent && nativeSelects.length > 2) {
        report.warnings.push({
          category: 'Component Reuse',
          severity: 'MEDIUM',
          file: pageFile,
          issue: 'Uso de select nativo sin componente Select',
          count: nativeSelects.length
        });
        report.summary.warnings++;
      }
    }
    
    report.summary.totalChecks += 2;
  });
}

// 2. VERIFICAR ESTANDARIZACIÓN DE PATRONES
function checkUIPatterns() {
  console.log('\n🎨 2. VERIFICANDO ESTANDARIZACIÓN DE PATRONES UI...\n');
  
  const pagesDir = path.join(__dirname, 'src/pages');
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  
  const patterns = {
    tableStructure: {
      pattern: /<Table[^>]*>/gi,
      expected: 'Table component',
      issue: 'Tabla sin componente Table'
    },
    buttonVariants: {
      pattern: /variant=["\'](primary|secondary|danger|success|warning|info)["\']/gi,
      expected: 'Button variants',
      issue: 'Botones sin variantes estándar'
    },
    inputSizes: {
      pattern: /style=\{.*height.*(?!40px)/gi,
      issue: 'Inputs con altura diferente a 40px'
    },
    spacing: {
      pattern: /padding:\s*['"]?(\d+)/gi,
      issue: 'Padding hardcodeado en lugar de CSS variables'
    }
  };
  
  pages.forEach(pageFile => {
    const content = readFile(path.join(pagesDir, pageFile));
    if (!content) return;
    
    // Verificar uso de variables CSS
    const hardcodedColors = findPatterns(content, [
      /#[0-9a-fA-F]{3,6}/g,
      /rgb\(/g,
      /rgba\(/g
    ]).filter(c => !c.includes('var(--'));
    
    if (hardcodedColors.length > 0) {
      report.warnings.push({
        category: 'UI Patterns',
        severity: 'MEDIUM',
        file: pageFile,
        issue: 'Colores hardcodeados en lugar de CSS variables',
        count: hardcodedColors.length
      });
      report.summary.warnings++;
    }
    
    // Verificar padding/margin hardcodeados
    const hardcodedSpacing = findPatterns(content, [
      /padding:\s*['"]?\d+px/gi,
      /margin:\s*['"]?\d+px/gi
    ]).filter(s => !s.includes('var(--spacing'));
    
    if (hardcodedSpacing.length > 5) {
      report.warnings.push({
        category: 'UI Patterns',
        severity: 'LOW',
        file: pageFile,
        issue: 'Muchos valores de spacing hardcodeados',
        count: hardcodedSpacing.length
      });
      report.summary.warnings++;
    }
    
    report.summary.totalChecks += 2;
  });
}

// 3. VERIFICAR CONSISTENCIA DE FEEDBACK
function checkFeedbackConsistency() {
  console.log('\n✨ 3. VERIFICANDO CONSISTENCIA DE FEEDBACK...\n');
  
  const pagesDir = path.join(__dirname, 'src/pages');
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  
  pages.forEach(pageFile => {
    const content = readFile(path.join(pagesDir, pageFile));
    if (!content) return;
    
    // Verificar estados de botones
    const hasButtonStates = content.includes('disabled') || 
                            content.includes('loading') ||
                            content.includes('hover');
    
    // Verificar uso de toast para mensajes
    const hasToast = content.includes('showToast') || 
                     content.includes('useToast');
    
    // Verificar manejo de errores
    const hasErrorHandling = content.includes('error') || 
                             content.includes('Error') ||
                             content.includes('catch');
    
    if (!hasToast && content.includes('onSubmit')) {
      report.warnings.push({
        category: 'Feedback',
        severity: 'MEDIUM',
        file: pageFile,
        issue: 'Formulario sin sistema de notificaciones (Toast)'
      });
      report.summary.warnings++;
    }
    
    report.summary.totalChecks++;
  });
}

// 4. VERIFICAR TIPOGRAFÍA Y JERARQUÍA
function checkTypography() {
  console.log('\n📝 4. VERIFICANDO TIPOGRAFÍA Y JERARQUÍA...\n');
  
  const cssFile = readFile(path.join(__dirname, 'src/index.css'));
  if (!cssFile) {
    report.issues.push({
      category: 'Typography',
      severity: 'HIGH',
      issue: 'No se encontró index.css'
    });
    return;
  }
  
  // Verificar variables de tipografía
  const fontVars = [
    '--font-size-xs',
    '--font-size-sm',
    '--font-size-base',
    '--font-size-md',
    '--font-size-lg',
    '--font-size-xl',
    '--font-heading',
    '--font-body'
  ];
  
  fontVars.forEach(varName => {
    if (!cssFile.includes(varName)) {
      report.issues.push({
        category: 'Typography',
        severity: 'MEDIUM',
        issue: `Variable CSS de tipografía faltante: ${varName}`
      });
      report.summary.failed++;
    } else {
      report.passed.push({
        category: 'Typography',
        check: `Variable ${varName} definida`
      });
      report.summary.passed++;
    }
    report.summary.totalChecks++;
  });
}

// Ejecutar todas las verificaciones
console.log('🔍 INICIANDO AUDITORÍA DE CONSISTENCIA DE INTERFAZ...\n');

checkComponentReuse();
checkUIPatterns();
checkFeedbackConsistency();
checkTypography();

// Generar reporte
const reportPath = path.join(__dirname, 'AUDIT_UI_CONSISTENCY_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Mostrar resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE AUDITORÍA DE CONSISTENCIA DE INTERFAZ');
console.log('='.repeat(60));
console.log(`✅ Pasados: ${report.summary.passed}`);
console.log(`❌ Fallidos: ${report.summary.failed}`);
console.log(`⚠️  Advertencias: ${report.summary.warnings}`);
console.log(`📊 Total: ${report.summary.totalChecks}`);
console.log('\n📄 Reporte completo guardado en: AUDIT_UI_CONSISTENCY_REPORT.json');

if (report.issues.length > 0) {
  console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
  report.issues.forEach((issue, i) => {
    console.log(`\n${i + 1}. [${issue.severity}] ${issue.category}: ${issue.issue}`);
    if (issue.file) console.log(`   Archivo: ${issue.file}`);
    if (issue.count) console.log(`   Cantidad: ${issue.count}`);
  });
}

if (report.warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:');
  report.warnings.slice(0, 5).forEach((warn, i) => {
    console.log(`\n${i + 1}. [${warn.severity}] ${warn.category}: ${warn.issue}`);
    if (warn.file) console.log(`   Archivo: ${warn.file}`);
  });
  if (report.warnings.length > 5) {
    console.log(`\n... y ${report.warnings.length - 5} advertencias más`);
  }
}

