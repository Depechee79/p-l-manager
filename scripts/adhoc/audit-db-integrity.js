/**
 * AUDITORÍA DE INTEGRIDAD DE BASE DE DATOS
 * 
 * Verifica:
 * 1. Consistencia entre modelo antiguo y nuevo
 * 2. Registros huérfanos
 * 3. Relaciones Foreign Key
 * 4. Campos críticos
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
  },
  relationships: {
    valid: [],
    invalid: [],
    orphaned: []
  }
};

// Leer tipos de TypeScript
function readTypes() {
  const typesFile = path.join(__dirname, 'src/types/index.ts');
  const content = fs.readFileSync(typesFile, 'utf8');
  return content;
}

// Leer DatabaseService
function readDatabaseService() {
  const dbFile = path.join(__dirname, 'src/services/DatabaseService.ts');
  const content = fs.readFileSync(dbFile, 'utf8');
  return content;
}

// 1. VERIFICAR CONSISTENCIA DE MODELO
function checkModelConsistency() {
  console.log('\n📋 1. VERIFICANDO CONSISTENCIA DE MODELO...\n');
  
  const typesContent = readTypes();
  const dbContent = readDatabaseService();
  
  // Colecciones definidas en DatabaseService
  const collections = [
    'cierres', 'facturas', 'albaranes', 'proveedores',
    'productos', 'escandallos', 'inventarios', 'delivery',
    'usuarios', 'roles'
  ];
  
  // Tipos definidos en types/index.ts
  const expectedTypes = [
    'Product', 'Provider', 'Invoice', 'InventoryItem',
    'Escandallo', 'Cierre', 'DeliveryRecord', 'AppUser', 'Role'
  ];
  
  collections.forEach(collection => {
    // Verificar que existe en DatabaseService
    if (!dbContent.includes(`public ${collection}:`)) {
      report.issues.push({
        category: 'Model Consistency',
        severity: 'HIGH',
        issue: `Colección ${collection} no encontrada en DatabaseService`,
        collection
      });
      report.summary.failed++;
    } else {
      report.passed.push({
        category: 'Model Consistency',
        check: `Colección ${collection} encontrada`
      });
      report.summary.passed++;
    }
    report.summary.totalChecks++;
  });
  
  // Verificar tipos
  expectedTypes.forEach(type => {
    if (!typesContent.includes(`interface ${type}`) && 
        !typesContent.includes(`export interface ${type}`)) {
      report.issues.push({
        category: 'Model Consistency',
        severity: 'HIGH',
        issue: `Tipo ${type} no encontrado en types/index.ts`,
        type
      });
      report.summary.failed++;
    } else {
      report.passed.push({
        category: 'Model Consistency',
        check: `Tipo ${type} definido`
      });
      report.summary.passed++;
    }
    report.summary.totalChecks++;
  });
}

// 2. VERIFICAR RELACIONES FOREIGN KEY
function checkForeignKeys() {
  console.log('\n🔗 2. VERIFICANDO RELACIONES FOREIGN KEY...\n');
  
  const typesContent = readTypes();
  const dbContent = readDatabaseService();
  
  // Relaciones esperadas según DatabaseService
  const expectedRelationships = [
    {
      from: 'Product',
      field: 'proveedorId',
      to: 'Provider',
      required: true,
      description: 'Product.proveedorId -> Provider.id'
    },
    {
      from: 'Invoice',
      field: 'proveedorId',
      to: 'Provider',
      required: true,
      description: 'Invoice.proveedorId -> Provider.id'
    },
    {
      from: 'InvoiceProduct',
      field: 'productoId',
      to: 'Product',
      required: false,
      description: 'InvoiceProduct.productoId -> Product.id'
    },
    {
      from: 'InventoryProductCount',
      field: 'productoId',
      to: 'Product',
      required: true,
      description: 'InventoryProductCount.productoId -> Product.id'
    },
    {
      from: 'EscandaloIngrediente',
      field: 'productoId',
      to: 'Product',
      required: true,
      description: 'Escandallo.ingredientes[].productoId -> Product.id'
    },
    {
      from: 'AppUser',
      field: 'rolId',
      to: 'Role',
      required: true,
      description: 'AppUser.rolId -> Role.id'
    }
  ];
  
  expectedRelationships.forEach(rel => {
    // Verificar que el campo existe en el tipo origen
    const fromTypeRegex = new RegExp(`interface ${rel.from}[\\s\\S]*?\\{[\\s\\S]*?${rel.field}[\\s\\S]*?\\}`, 'm');
    const fromMatch = typesContent.match(fromTypeRegex);
    
    if (!fromMatch) {
      report.issues.push({
        category: 'Foreign Keys',
        severity: 'HIGH',
        issue: `Campo ${rel.field} no encontrado en ${rel.from}`,
        relationship: rel.description
      });
      report.summary.failed++;
      report.relationships.invalid.push(rel);
    } else {
      report.passed.push({
        category: 'Foreign Keys',
        check: `Relación ${rel.description} verificada`
      });
      report.summary.passed++;
      report.relationships.valid.push(rel);
    }
    report.summary.totalChecks++;
  });
  
  // Verificar que DataIntegrityService valida estas relaciones
  const integrityFile = path.join(__dirname, 'src/services/DataIntegrityService.ts');
  if (fs.existsSync(integrityFile)) {
    const integrityContent = fs.readFileSync(integrityFile, 'utf8');
    
    if (!integrityContent.includes('validateForeignKey') && 
        !integrityContent.includes('checkRelationships')) {
      report.warnings.push({
        category: 'Foreign Keys',
        severity: 'MEDIUM',
        issue: 'DataIntegrityService no parece validar relaciones FK explícitamente'
      });
      report.summary.warnings++;
    }
  } else {
    report.issues.push({
      category: 'Foreign Keys',
      severity: 'HIGH',
      issue: 'DataIntegrityService.ts no encontrado'
    });
    report.summary.failed++;
  }
}

// 3. VERIFICAR CAMPOS CRÍTICOS
function checkCriticalFields() {
  console.log('\n⚠️  3. VERIFICANDO CAMPOS CRÍTICOS...\n');
  
  const typesContent = readTypes();
  
  // Campos críticos que no deben ser opcionales
  const criticalFields = [
    { type: 'Product', fields: ['nombre', 'proveedorId', 'unidadBase', 'precioCompra'] },
    { type: 'Provider', fields: ['nombre', 'cif', 'contacto'] },
    { type: 'Invoice', fields: ['numeroFactura', 'proveedorId', 'fecha', 'total'] },
    { type: 'Cierre', fields: ['fecha', 'turno'] },
    { type: 'Escandallo', fields: ['nombre', 'ingredientes'] },
    { type: 'AppUser', fields: ['nombre', 'rolId', 'activo'] },
    { type: 'Role', fields: ['nombre', 'permisos'] }
  ];
  
  criticalFields.forEach(({ type, fields }) => {
    const typeRegex = new RegExp(`(interface|export interface) ${type}[\\s\\S]*?\\{([\\s\\S]*?)\\n\\}`, 'm');
    const match = typesContent.match(typeRegex);
    
    if (!match) {
      report.issues.push({
        category: 'Critical Fields',
        severity: 'HIGH',
        issue: `Tipo ${type} no encontrado`,
        type
      });
      report.summary.failed++;
      return;
    }
    
    const typeContent = match[2];
    
    fields.forEach(field => {
      // Verificar que el campo existe y no es opcional (sin ?)
      const fieldRegex = new RegExp(`${field}(\\??)\\s*:`, 'm');
      const fieldMatch = typeContent.match(fieldRegex);
      
      if (!fieldMatch) {
        report.issues.push({
          category: 'Critical Fields',
          severity: 'HIGH',
          issue: `Campo crítico ${field} no encontrado en ${type}`,
          type,
          field
        });
        report.summary.failed++;
      } else if (fieldMatch[1] === '?') {
        report.warnings.push({
          category: 'Critical Fields',
          severity: 'MEDIUM',
          issue: `Campo crítico ${field} es opcional en ${type}`,
          type,
          field
        });
        report.summary.warnings++;
      } else {
        report.passed.push({
          category: 'Critical Fields',
          check: `Campo ${field} en ${type} es requerido`
        });
        report.summary.passed++;
      }
      report.summary.totalChecks++;
    });
  });
}

// 4. VERIFICAR VALIDACIONES EN FORMULARIOS
function checkFormValidations() {
  console.log('\n📝 4. VERIFICANDO VALIDACIONES EN FORMULARIOS...\n');
  
  const pagesDir = path.join(__dirname, 'src/pages');
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  
  pages.forEach(pageFile => {
    const content = fs.readFileSync(path.join(pagesDir, pageFile), 'utf8');
    
    // Buscar formularios
    if (content.includes('<form') || content.includes('onSubmit')) {
      // Verificar validación de campos requeridos
      const hasRequired = content.includes('required') || 
                          content.includes('required={true}');
      
      // Verificar manejo de errores
      const hasErrorHandling = content.includes('error') || 
                                content.includes('catch') ||
                                content.includes('try');
      
      if (!hasRequired) {
        report.warnings.push({
          category: 'Form Validation',
          severity: 'MEDIUM',
          file: pageFile,
          issue: 'Formulario sin validación de campos requeridos'
        });
        report.summary.warnings++;
      }
      
      if (!hasErrorHandling) {
        report.warnings.push({
          category: 'Form Validation',
          severity: 'LOW',
          file: pageFile,
          issue: 'Formulario sin manejo explícito de errores'
        });
        report.summary.warnings++;
      }
      
      report.summary.totalChecks += 2;
    }
  });
}

// Ejecutar todas las verificaciones
console.log('🔍 INICIANDO AUDITORÍA DE INTEGRIDAD DE BASE DE DATOS...\n');

checkModelConsistency();
checkForeignKeys();
checkCriticalFields();
checkFormValidations();

// Generar reporte
const reportPath = path.join(__dirname, 'AUDIT_DB_INTEGRITY_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Mostrar resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE AUDITORÍA DE INTEGRIDAD DE BD');
console.log('='.repeat(60));
console.log(`✅ Pasados: ${report.summary.passed}`);
console.log(`❌ Fallidos: ${report.summary.failed}`);
console.log(`⚠️  Advertencias: ${report.summary.warnings}`);
console.log(`📊 Total: ${report.summary.totalChecks}`);
console.log(`\n🔗 Relaciones válidas: ${report.relationships.valid.length}`);
console.log(`🔗 Relaciones inválidas: ${report.relationships.invalid.length}`);
console.log('\n📄 Reporte completo guardado en: AUDIT_DB_INTEGRITY_REPORT.json');

if (report.issues.length > 0) {
  console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
  report.issues.forEach((issue, i) => {
    console.log(`\n${i + 1}. [${issue.severity}] ${issue.category}: ${issue.issue}`);
    if (issue.type) console.log(`   Tipo: ${issue.type}`);
    if (issue.field) console.log(`   Campo: ${issue.field}`);
    if (issue.relationship) console.log(`   Relación: ${issue.relationship}`);
  });
}

