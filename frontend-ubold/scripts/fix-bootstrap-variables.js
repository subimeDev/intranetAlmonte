#!/usr/bin/env node

/**
 * Script para corregir el problema de importación de variables-dark en Bootstrap
 * Convierte todos los imports relativos problemáticos en archivos SCSS de Bootstrap a absolutos
 */

const fs = require('fs');
const path = require('path');

// Verificar que el script se está ejecutando desde el directorio correcto
const scriptPath = __filename;
const scriptDir = path.dirname(scriptPath);
const projectRoot = path.join(scriptDir, '..');

// Verificar que node_modules existe (indica que estamos en el directorio correcto)
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('⚠️  node_modules not found, skipping Bootstrap fix (this is normal in some build environments)');
  process.exit(0);
}

/**
 * Convierte imports relativos de Bootstrap a absolutos
 */
function fixBootstrapImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Convertir imports relativos como "vendor/rfs", "mixins/...", "forms/..." a absolutos
  const relativePatterns = [
    { pattern: /@import\s+"vendor\/([^"]+)";/g, replacement: '@import "bootstrap/scss/vendor/$1";' },
    { pattern: /@import\s+"mixins\/([^"]+)";/g, replacement: '@import "bootstrap/scss/mixins/$1";' },
    { pattern: /@import\s+"forms\/([^"]+)";/g, replacement: '@import "bootstrap/scss/forms/$1";' },
    { pattern: /@import\s+"helpers\/([^"]+)";/g, replacement: '@import "bootstrap/scss/helpers/$1";' },
    { pattern: /@import\s+"utilities\/([^"]+)";/g, replacement: '@import "bootstrap/scss/utilities/$1";' },
  ];
  
  relativePatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // Comentar el import de variables-dark específicamente (ya lo importamos manualmente)
  if (content.includes('@import "variables-dark"')) {
    content = content.replace(
      /@import\s+"variables-dark";\s*(\/\/.*)?$/gm,
      '// @import "variables-dark"; // TODO: Comentado por fix-bootstrap-variables.js - importamos manualmente en app.scss'
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const bootstrapScssPath = path.join(
  projectRoot,
  'node_modules',
  'bootstrap',
  'scss'
);

if (!fs.existsSync(bootstrapScssPath)) {
  console.log('⚠️  Bootstrap SCSS directory not found, skipping fix');
  process.exit(0);
}

// Buscar todos los archivos SCSS en el directorio de Bootstrap y corregirlos
function findScssFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findScssFiles(filePath));
    } else if (file.endsWith('.scss')) {
      results.push(filePath);
    }
  });
  
  return results;
}

const scssFiles = findScssFiles(bootstrapScssPath);
let fixedCount = 0;

scssFiles.forEach(filePath => {
  if (fixBootstrapImports(filePath)) {
    fixedCount++;
    const relativePath = path.relative(bootstrapScssPath, filePath);
    console.log(`✅ Fixed ${relativePath}`);
  }
});

if (fixedCount > 0) {
  console.log(`\n✅ Fixed ${fixedCount} Bootstrap SCSS file(s)`);
} else {
  console.log('✅ No Bootstrap SCSS files needed fixing');
}

