/**
 * AUDITORÍA DE VALIDACIÓN DE FORMULARIOS Y EDGE CASES
 * 
 * Testea formularios con:
 * - Caracteres especiales
 * - Campos nulos
 * - Longitudes máximas
 * - Datos extremos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const report = {
  timestamp: new Date().toISOString(),
  tests: [],
  issues: [],
  warnings: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Casos de prueba extremos
const edgeCases = {
  specialChars: [
    '<script>alert("xss")</script>',
    '"; DROP TABLE users; --',
    '${process.env.SECRET}',
    '&lt;img src=x onerror=alert(1)&gt;',
    '{{7*7}}',
    '../../etc/passwd',
    '\0',
    '\r\n',
    '\t',
    '\\',
    '\'',
    '"',
    '`',
    '${}',
    '{{}}',
    '[]',
    '{}',
    '()',
    '!@#$%^&*()',
    'ñáéíóú',
    '中文',
    'العربية',
    '🚀💻🎉'
  ],
  extremeLengths: {
    short: ['', 'a'],
    long: [
      'a'.repeat(1000),
      'a'.repeat(10000),
      'a'.repeat(100000)
    ],
    numbers: {
      negative: [-1, -100, -999999],
      zero: [0],
      veryLarge: [Number.MAX_SAFE_INTEGER, Number.MAX_VALUE],
      decimal: [0.0000001, 999.999999]
    }
  },
  nullish: [null, undefined, 'null', 'undefined', 'NaN'],
  types: {
    string: [123, true, false, [], {}, () => {}],
    number: ['abc', '123abc', '12.34.56', 'infinity', 'NaN'],
    date: ['invalid-date', '2024-13-45', '32/12/2024', 'not-a-date']
  }
};

// Leer tipos para validar campos
function getFieldTypes() {
  const typesFile = path.join(__dirname, 'src/types/index.ts');
  const content = fs.readFileSync(typesFile, 'utf8');
  
  const fields = {};
  
  // Extraer campos de Product
  const productMatch = content.match(/interface Product[^{]*\{([^}]+)\}/s);
  if (productMatch) {
    fields.Product = {};
    productMatch[1].split('\n').forEach(line => {
      const match = line.match(/(\w+)(\??):\s*(\w+)/);
      if (match) {
        fields.Product[match[1]] = {
          type: match[3],
          optional: match[2] === '?'
        };
      }
    });
  }
  
  return fields;
}

// Analizar formularios en páginas
function analyzeForms() {
  console.log('\n📝 ANALIZANDO FORMULARIOS...\n');
  
  const pagesDir = path.join(__dirname, 'src/pages');
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  
  const fieldTypes = getFieldTypes();
  
  pages.forEach(pageFile => {
    const content = fs.readFileSync(path.join(pagesDir, pageFile), 'utf8');
    
    // Detectar formularios
    if (content.includes('<form') || content.includes('onSubmit')) {
      console.log(`\n📄 Analizando: ${pageFile}`);
      
      // Extraer campos de input
      const inputMatches = content.matchAll(/<Input[^>]*label=["']([^"']+)["'][^>]*type=["']([^"']+)["'][^>]*/g);
      const inputs = Array.from(inputMatches).map(m => ({
        label: m[1],
        type: m[2],
        required: content.includes('required') && 
                 content.substring(0, content.indexOf(m[0])).includes('required')
      }));
      
      // Extraer selects
      const selectMatches = content.matchAll(/<Select[^>]*label=["']([^"']+)["'][^>]*/g);
      const selects = Array.from(selectMatches).map(m => ({
        label: m[1],
        type: 'select'
      }));
      
      // Analizar cada campo
      [...inputs, ...selects].forEach(field => {
        analyzeField(pageFile, field, fieldTypes);
      });
    }
  });
}

function analyzeField(pageFile, field, fieldTypes) {
  const testCases = [];
  
  // Test 1: Caracteres especiales (para campos de texto)
  if (field.type === 'text' || field.type === 'email') {
    edgeCases.specialChars.forEach(char => {
      testCases.push({
        field: field.label,
        test: 'Special Characters',
        value: char,
        expected: 'Should sanitize or reject',
        risk: 'HIGH'
      });
    });
  }
  
  // Test 2: Longitudes extremas
  if (field.type === 'text') {
    edgeCases.extremeLengths.long.forEach(longValue => {
      testCases.push({
        field: field.label,
        test: 'Extreme Length',
        value: `${longValue.length} chars`,
        expected: 'Should enforce max length',
        risk: 'MEDIUM'
      });
    });
  }
  
  // Test 3: Valores nulos/undefined
  if (field.required) {
    edgeCases.nullish.forEach(nullValue => {
      testCases.push({
        field: field.label,
        test: 'Nullish Values',
        value: String(nullValue),
        expected: 'Should reject',
        risk: 'HIGH'
      });
    });
  }
  
  // Test 4: Tipos incorrectos
  if (field.type === 'number') {
    edgeCases.types.number.forEach(wrongType => {
      testCases.push({
        field: field.label,
        test: 'Type Validation',
        value: String(wrongType),
        expected: 'Should reject non-numeric',
        risk: 'MEDIUM'
      });
    });
    
    // Números extremos
    edgeCases.extremeLengths.numbers.veryLarge.forEach(num => {
      testCases.push({
        field: field.label,
        test: 'Extreme Numbers',
        value: String(num),
        expected: 'Should handle or reject',
        risk: 'LOW'
      });
    });
  }
  
  // Verificar si hay validación en el código
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'src/pages', pageFile), 
    'utf8'
  );
  
  const hasValidation = pageContent.includes('validate') ||
                        pageContent.includes('required') ||
                        pageContent.includes('pattern') ||
                        pageContent.includes('minLength') ||
                        pageContent.includes('maxLength');
  
  testCases.forEach(testCase => {
    report.tests.push({
      page: pageFile,
      field: testCase.field,
      test: testCase.test,
      value: testCase.value,
      expected: testCase.expected,
      risk: testCase.risk,
      hasValidation,
      status: hasValidation ? 'PASS' : 'FAIL'
    });
    
    report.summary.totalTests++;
    
    if (!hasValidation && testCase.risk === 'HIGH') {
      report.issues.push({
        category: 'Form Validation',
        severity: 'HIGH',
        page: pageFile,
        field: testCase.field,
        issue: `Campo sin validación para: ${testCase.test}`,
        testCase: testCase.value
      });
      report.summary.failed++;
    } else if (!hasValidation && testCase.risk === 'MEDIUM') {
      report.warnings.push({
        category: 'Form Validation',
        severity: 'MEDIUM',
        page: pageFile,
        field: testCase.field,
        issue: `Validación recomendada para: ${testCase.test}`
      });
      report.summary.warnings++;
    } else {
      report.summary.passed++;
    }
  });
}

// Ejecutar análisis
console.log('🔍 INICIANDO AUDITORÍA DE EDGE CASES EN FORMULARIOS...\n');

analyzeForms();

// Generar reporte
const reportPath = path.join(__dirname, 'AUDIT_FORM_EDGE_CASES_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Mostrar resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE AUDITORÍA DE EDGE CASES');
console.log('='.repeat(60));
console.log(`✅ Pasados: ${report.summary.passed}`);
console.log(`❌ Fallidos: ${report.summary.failed}`);
console.log(`⚠️  Advertencias: ${report.summary.warnings}`);
console.log(`📊 Total Tests: ${report.summary.totalTests}`);
console.log('\n📄 Reporte completo guardado en: AUDIT_FORM_EDGE_CASES_REPORT.json');

if (report.issues.length > 0) {
  console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
  report.issues.slice(0, 10).forEach((issue, i) => {
    console.log(`\n${i + 1}. [${issue.severity}] ${issue.page} - ${issue.field}`);
    console.log(`   ${issue.issue}`);
    if (issue.testCase) console.log(`   Caso: ${issue.testCase}`);
  });
  if (report.issues.length > 10) {
    console.log(`\n... y ${report.issues.length - 10} problemas más`);
  }
}

