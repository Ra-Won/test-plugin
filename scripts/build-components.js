const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'packages', 'components', 'src');

// Helper to generate the .tsx file content
function generateComponentTsx(data) {
  return `import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './${data.name}.module.css';

export interface ${data.name}Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  ${Object.keys(data.props).map(prop => `
  /** The ${prop} prop */
  ${prop}?: '${data.props[prop].options.join("' | '")}';`).join('')}

  ${Object.keys(data.slots).map(slot => `
  /** The ${slot} slot */
  ${slot}?: ReactNode;`).join('')}
}

export const ${data.name}: React.FC<${data.name}Props> = ({
${Object.keys(data.props).map(prop => `  ${prop} = '${data.props[prop].defaultValue}',`).join('\n')}
${Object.keys(data.slots).map(slot => `  ${slot},`).join('\n')}
  ...props
}) => {
  return (
    <${data.element}
      className={styles.button}
      ${Object.keys(data.props).map(prop => `data-${prop}={${prop}}`).join('\n      ')}
      {...props}
    >
      {/* Render slots conditionally */}
      ${Object.keys(data.slots).map(slot => `{${data.slots[slot].condition ? `${data.slots[slot].condition} && ` : ''}${slot}}`).join('\n      ')}
    </${data.element}>
  );
};
`;
}

// Helper to generate the .module.css file content
function generateComponentCss(data) {
  let css = `/* This file is auto-generated. Do not edit. */\n\n`;
  
  // Base Style
  css += `.${data.name.toLowerCase()} {\n`;
  for (const prop in data.baseStyle) {
    css += `  ${prop}: ${data.baseStyle[prop]};\n`;
  }
  css += '}\n\n';

  // Variants
  for (const variantProp in data.variants) {
    for (const variantValue in data.variants[variantProp]) {
      css += `.${data.name.toLowerCase()}[data-${variantProp}='${variantValue}'] {\n`;
      const styles = data.variants[variantProp][variantValue];
      for (const styleProp in styles) {
        css += `  ${styleProp}: ${styles[styleProp]};\n`;
      }
      css += '}\n\n';
    }
  }
  return css;
}


// Main function
function buildComponents() {
  const componentFolders = fs.readdirSync(componentsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of componentFolders) {
    const jsonPath = path.join(componentsDir, folder, `${folder}.json`);
    if (fs.existsSync(jsonPath)) {
      console.log(`Processing ${folder}...`);
      const componentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      // Generate and write .tsx file
      const tsxContent = generateComponentTsx(componentData);
      fs.writeFileSync(path.join(componentsDir, folder, `${folder}.tsx`), tsxContent);
      console.log(`  -> Generated ${folder}.tsx`);

      // Generate and write .module.css file
      const cssContent = generateComponentCss(componentData);
      fs.writeFileSync(path.join(componentsDir, folder, `${folder}.module.css`), cssContent);
      console.log(`  -> Generated ${folder}.module.css`);
    }
  }
}

console.log('Starting component build...');
buildComponents();
console.log('Component build finished!');
