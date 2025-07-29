const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'tokens', 'src');
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

// Helper to generate public CSS variables from a semantic JSON object
function generatePublicCssVars(obj, prefix = '') {
  let cssString = '';
  for (const key in obj) {
    const newPrefix = prefix ? `${prefix}-${key}` : key;
    const token = obj[key];

    if (token && typeof token.value !== 'undefined') {
      cssString += `  --${newPrefix}: $${newPrefix};\n`; // e.g., --color-text-body: $semantic-color-text-body;
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
  const tokenTypes = ['primitive', 'semantic'];

  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

  // --- 1. Generate SCSS partials from JSON source files ---
  for (const type of tokenTypes) {
    const jsonDir = path.join(srcDir, type, 'json');
    const scssDir = path.join(srcDir, type, 'scss');
    if (!fs.existsSync(scssDir)) fs.mkdirSync(scssDir, { recursive: true });

    if (fs.existsSync(jsonDir)) {
      const files = fs.readdirSync(jsonDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(jsonDir, file);
          const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          Object.assign(allTokens, jsonContent);
          if (type === 'semantic') {
            Object.assign(semanticTokens, jsonContent);
          }

          const scssContent = jsonToScss(jsonContent);
          const scssFileName = `_${path.basename(file, '.json')}.scss`;
          fs.writeFileSync(path.join(scssDir, scssFileName), scssContent);
          console.log(`Generated ${scssFileName}`);
        }
      }
    }
  }

  // --- 2. ✅ Auto-generate the main tokens.scss file ---
  let mainScssContent = `// This file is auto-generated. Do not edit.\n\n`;
  const scssPartials = ['primitive/scss', 'semantic/scss'];

  scssPartials.forEach(dir => {
    const fullDir = path.join(srcDir, dir);
    if (fs.existsSync(fullDir)) {
      fs.readdirSync(fullDir).forEach(file => {
        if (file.endsWith('.scss')) {
          mainScssContent += `@import "${dir}/${file}";\n`;
        }
      });
    }
  });
  
  mainScssContent += `\n:root {\n`;
  mainScssContent += generatePublicCssVars(semanticTokens);
  mainScssContent += `}\n`;

  fs.writeFileSync(path.join(srcDir, 'tokens.scss'), mainScssContent);
  console.log('Generated src/tokens.scss');

  // --- 3. Write the final combined tokens.json ---
  fs.writeFileSync(path.join(distDir, 'tokens.json'), JSON.stringify(allTokens, null, 2));
  console.log('Generated dist/tokens.json');
}

buildTokens().catch(console.error);
