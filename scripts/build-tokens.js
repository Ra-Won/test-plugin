const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'tokens');
const distDir = path.join(__dirname, '..', 'packages', 'tokens', 'dist');

// Helper to format any token name part (replaces spaces and dots with hyphens)
const formatName = (name) => name.toLowerCase().replace(/[\. ]/g, '-');

// ✅ UPDATED: Helper now accepts a boolean to add 'px' units
function jsonToScss(obj, prefix = '', addPxUnit = false) {
  let scssString = '';
  for (const key in obj) {
    const newPrefix = prefix ? `${prefix}-${formatName(key)}` : formatName(key);
    const token = obj[key];

    if (token && typeof token.value !== 'undefined') {
      let scssValue = token.value;
      
      // If the value is an alias, handle it
      if (typeof scssValue === 'string' && scssValue.startsWith('{') && scssValue.endsWith('}')) {
        const ref = scssValue.slice(1, -1).replace(/\./g, '-');
        scssValue = `#{$${ref}}`;
      } 
      // ✅ ADDED: If the flag is true and the value is a number, add 'px'
      else if (addPxUnit && typeof scssValue === 'number') {
        scssValue = `${scssValue}px`;
      }

      scssString += `$${newPrefix}: ${scssValue};\n`;
    } else if (typeof token === 'object' && token !== null) {
      scssString += jsonToScss(token, newPrefix, addPxUnit); // Pass the flag down in recursion
    }
  }
  return scssString;
}

// ✅ NEW: Helper to generate typography classes from a typography JSON object
function generateTypographyScss(typographyObject) {
  const typographyPropertyMap = {
    size: 'font-size',
    weight: 'font-weight',
    lineHeight: 'line-height',
    letterSpacing: 'letter-spacing',
    family: 'font-family',
  };

  let classStyles = '';

  const buildClasses = (obj, path = []) => {
    const isLeaf = Object.values(obj).every(val => typeof val === 'object' && val.value);

    if (isLeaf) {
      classStyles += `.${path.join('-')} {\n`;
      for (const key in obj) {
        const cssProp = typographyPropertyMap[key] || key;
        let scssValue = obj[key].value;
        if (typeof scssValue === 'string' && scssValue.startsWith('{') && scssValue.endsWith('}')) {
          const ref = scssValue.slice(1, -1).replace(/\./g, '-');
          scssValue = `#{$${ref}}`;
        }
        classStyles += `  ${cssProp}: ${scssValue};\n`;
      }
      classStyles += `}\n\n`;
    } else {
      for (const key in obj) {
        buildClasses(obj[key], [...path, key]);
      }
    }
  };

  buildClasses(typographyObject);
  return classStyles;
}

// Main build function
async function buildTokens() {
  const allTokens = {};
  const semanticTokens = {};
  const tokenTypes = ['primitive', 'semantic'];

  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

  for (const type of tokenTypes) {
    const jsonDir = path.join(srcDir, type, 'json');
    const scssDir = path.join(srcDir, type, 'scss');
    if (!fs.existsSync(scssDir)) fs.mkdirSync(scssDir, { recursive: true });

    if (fs.existsSync(jsonDir)) {
      fs.readdirSync(jsonDir).forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(jsonDir, file);
          const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          Object.assign(allTokens, jsonContent);
          if (type === 'semantic') {
            Object.assign(semanticTokens, jsonContent);
          }
          
          if (type === 'semantic' && (file === 'body.json' || file === 'heading.json')) {
            const scssContent = generateTypographyClasses(jsonContent);
            const scssFileName = `_${path.basename(file, '.json')}.scss`;
            fs.writeFileSync(path.join(scssDir, scssFileName), scssContent);
            console.log(`Generated typography class file: ${scssFileName}`);
          } else {
            const prefix = (type === 'primitive') ? '' : type;
            // ✅ UPDATED: Set the flag to true only for the 'unit.json' file
            const shouldAddPx = (type === 'primitive' && file.includes('unit'));
            const scssContent = jsonToScss(jsonContent, prefix, shouldAddPx);
            const scssFileName = `_${path.basename(file, '.json')}.scss`;
            fs.writeFileSync(path.join(scssDir, scssFileName), scssContent);
            console.log(`Generated SCSS partial: ${scssFileName}`);
          }
        }
      });
    }
  }

  // --- 2. Auto-generate the main tokens.scss file ---
  let mainScssContent = `// This file is auto-generated. Do not edit.\n\n`;
  mainScssContent += '// Import all primitive tokens as private variables\n';
  
  const primitiveScssDir = path.join(srcDir, 'primitive', 'scss');
  if (fs.existsSync(primitiveScssDir)) {
    fs.readdirSync(primitiveScssDir).forEach(file => {
      if (file.endsWith('.scss')) {
        mainScssContent += `@use "./primitive/scss/${file}" as *;\n`;
      }
    });
  }

  mainScssContent += `\n:root {\n`;
  const semanticScssDir = path.join(srcDir, 'semantic', 'scss');
  if (fs.existsSync(semanticScssDir)) {
    fs.readdirSync(semanticScssDir).forEach(file => {
      if (file.endsWith('.scss')) {
        const fileBaseName = path.basename(file, '.scss').substring(1); // Get name without '_'
        mainScssContent += `  /* --- ${fileBaseName} --- */\n`;
        const scssContent = fs.readFileSync(path.join(semanticScssDir, file), 'utf-8');
        // Transform $var: val; into --var: val; but only at the start of a line
        const cssContent = scssContent.replace(/^\$([a-zA-Z0-9-]+)/gm, '--$1');
        mainScssContent += `${cssContent}\n`;
      }
    });
  }
  mainScssContent += `}\n`;

  fs.writeFileSync(path.join(srcDir, 'tokens.scss'), mainScssContent);
  console.log('Generated src/tokens.scss');

  // --- 3. Write the final semantic-only tokens.json ---
  fs.writeFileSync(path.join(distDir, 'tokens.json'), JSON.stringify(semanticTokens, null, 2));
  console.log('Generated dist/tokens.json');
}

buildTokens().catch(console.error);
