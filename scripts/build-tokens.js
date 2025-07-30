const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'tokens');
const distDir = path.join(__dirname, '..', 'packages', 'tokens', 'dist');

// Helper to convert a JSON token object to a flat string of SCSS variables
function jsonToScss(obj, prefix = '') {
  let scssString = '';
  for (const key in obj) {
    const newPrefix = prefix ? `${prefix}-${key}` : key;
    const token = obj[key];

    if (token && typeof token.value !== 'undefined') {
      let scssValue = token.value;
      if (typeof scssValue === 'string' && scssValue.startsWith('{') && scssValue.endsWith('}')) {
        scssValue = `$${scssValue.slice(1, -1).replace(/\./g, '-')}`;
      }
      scssString += `$${newPrefix}: ${scssValue};\n`;
    } else if (typeof token === 'object' && token !== null) {
      scssString += jsonToScss(token, newPrefix);
    }
  }
  return scssString;
}

// Helper to generate public CSS variables from semantic JSON, resolving aliases to primitive Sass vars
function generatePublicCssVars(obj, prefix = '') {
  let cssString = '';
  for (const key in obj) {
    const newPrefix = prefix ? `${prefix}-${key}` : key;
    const token = obj[key];

    if (token && typeof token.value !== 'undefined') {
      let cssValue = token.value;
      if (typeof cssValue === 'string' && cssValue.startsWith('{') && cssValue.endsWith('}')) {
        // Convert alias {primitive.color.blue.500} to Sass variable $primitive-color-blue-500
        cssValue = `$${cssValue.slice(1, -1).replace(/\./g, '-')}`;
      }
      cssString += `  --${newPrefix}: ${cssValue};\n`;
    } else if (typeof token === 'object' && token !== null) {
      cssString += generatePublicCssVars(token, newPrefix);
    }
  }
  return cssString;
}

// Main build function
async function buildTokens() {
  const allTokens = {};
  const semanticTokens = {};

  // --- 1. Generate ONLY PRIMITIVE SCSS partials from source JSON ---
  const primitiveJsonDir = path.join(srcDir, 'primitive', 'json');
  const primitiveScssDir = path.join(srcDir, 'primitive', 'scss');
  if (!fs.existsSync(primitiveScssDir)) fs.mkdirSync(primitiveScssDir, { recursive: true });

  if (fs.existsSync(primitiveJsonDir)) {
    fs.readdirSync(primitiveJsonDir).forEach(file => {
      if (file.endsWith('.json')) {
        const jsonContent = JSON.parse(fs.readFileSync(path.join(primitiveJsonDir, file), 'utf-8'));
        Object.assign(allTokens, jsonContent);
        const scssContent = jsonToScss(jsonContent);
        const scssFileName = `_${path.basename(file, '.json')}.scss`;
        fs.writeFileSync(path.join(primitiveScssDir, scssFileName), scssContent);
      }
    });
  }

  // --- 2. Read semantic JSON for the next step ---
  const semanticJsonDir = path.join(srcDir, 'semantic', 'json');
  if (fs.existsSync(semanticJsonDir)) {
      fs.readdirSync(semanticJsonDir).forEach(file => {
          if(file.endsWith('.json')) {
              const jsonContent = JSON.parse(fs.readFileSync(path.join(semanticJsonDir, file), 'utf-8'));
              Object.assign(allTokens, jsonContent);
              Object.assign(semanticTokens, jsonContent);
          }
      });
  }

  // --- 3. Auto-generate the main tokens.scss file ---
  let mainScssContent = `// This file is auto-generated. Do not edit.\n\n`;
  mainScssContent += '// Import all primitive tokens as private variables\n';
  fs.readdirSync(primitiveScssDir).forEach(file => {
    if (file.endsWith('.scss')) {
      mainScssContent += `@use "primitive/scss/${file}" as *;\n`;
    }
  });

  mainScssContent += `\n:root {\n`;
  mainScssContent += generatePublicCssVars(semanticTokens); // Directly use semantic JSON here
  mainScssContent += `}\n`;

  fs.writeFileSync(path.join(srcDir, 'tokens.scss'), mainScssContent);
  console.log('Generated src/tokens.scss');

  // --- 4. Write final combined tokens.json ---
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
  fs.writeFileSync(path.join(distDir, 'tokens.json'), JSON.stringify(allTokens, null, 2));
  console.log('Generated dist/tokens.json');
}

buildTokens().catch(console.error);
