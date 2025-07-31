const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'packages', 'components', 'src');

// ✅ UPDATED: This function is now more robust and handles different prop types.
function generateComponentTsx(data) {
  // Helper to build the props interface string
  const propsInterface = Object.keys(data.props).map(key => {
    const propData = data.props[key];
    let propType;

    switch (propData.type) {
      case 'VARIANT':
        propType = `'${propData.options.join("' | '")}'`;
        break;
      case 'BOOLEAN':
        propType = 'boolean';
        break;
      case 'TEXT':
        propType = 'string';
        break;
      default:
        propType = 'any';
    }
    return `  /** The ${key} prop */\n  ${key}?: ${propType};`;
  }).join('\n');

  // Helper to build the props destructuring with default values
  const propsDestructuring = Object.keys(data.props).map(key => {
    const propData = data.props[key];
    // Use JSON.stringify to correctly format default values (e.g., false vs "false")
    return `  ${key} = ${JSON.stringify(propData.defaultValue)},`;
  }).join('\n');
  
  const slotsDestructuring = Object.keys(data.slots).map(slot => `  ${slot},`).join('\n');
  const dataAttributes = Object.keys(data.props).map(prop => `      data-${prop}={${prop}}`).join('\n');
  const slotsRendering = Object.keys(data.slots).map(slot => `      {${data.slots[slot].condition ? `${data.slots[slot].condition} && ` : ''}${slot}}`).join('\n      ');

  return `import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './${data.name}.module.css';

export interface ${data.name}Props extends ButtonHTMLAttributes<HTMLButtonElement> {
${propsInterface}
${Object.keys(data.slots).map(slot => `
  /** The ${slot} slot */
  ${slot}?: ReactNode;`).join('')}
}

export const ${data.name}: React.FC<${data.name}Props> = ({
${propsDestructuring}
${slotsDestructuring}
  ...props
}) => {
  return (
    <${data.element}
      className={styles.${data.name.toLowerCase()}}
${dataAttributes}
      {...props}
    >
      {/* Render slots conditionally */}
${slotsRendering}
    </${data.element}>
  );
};
`;
}

// Helper to generate the .module.css file content
function generateComponentCss(data) {
  let css = `/* This file is auto-generated. Do not edit. */\n\n`;
  
  css += `.${data.name.toLowerCase()} {\n`;
  for (const prop in data.baseStyle) {
    css += `  ${prop}: ${data.baseStyle[prop]};\n`;
  }
  css += '}\n\n';

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

// ✅ NEW: Helper to generate the .stories.tsx file content
function generateComponentStories(data) {
  const argTypes = Object.keys(data.props).map(key => {
    const propData = data.props[key];
    let control = 'text'; // Default control

    if (propData.type === 'VARIANT' && propData.options) {
      control = `{ type: 'select', options: ${JSON.stringify(propData.options)} }`;
    } else if (propData.type === 'BOOLEAN') {
      control = "'boolean'";
    }

    return `    ${key}: { control: ${control} },`;
  }).join('\n');

  const defaultArgs = Object.keys(data.props).map(key => {
    return `    ${key}: ${JSON.stringify(data.props[key].defaultValue)},`;
  }).join('\n');

  return `import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ${data.name} } from './${data.name}';

const meta: Meta<typeof ${data.name}> = {
  title: 'Components/${data.name}',
  component: ${data.name},
  argTypes: {
${argTypes}
  },
};

export default meta;
type Story = StoryObj<typeof ${data.name}>;

export const Default: Story = {
  args: {
${defaultArgs}
    children: 'Button Text', // Default storybook label
  },
};
`;
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

      const tsxContent = generateComponentTsx(componentData);
      fs.writeFileSync(path.join(componentsDir, folder, `${folder}.tsx`), tsxContent);
      console.log(`  -> Generated ${folder}.tsx`);

      const cssContent = generateComponentCss(componentData);
      fs.writeFileSync(path.join(componentsDir, folder, `${folder}.module.css`), cssContent);
      console.log(`  -> Generated ${folder}.module.css`);

      // ✅ ADDED: Generate and write .stories.tsx file
      const storyContent = generateComponentStories(componentData);
      fs.writeFileSync(path.join(componentsDir, folder, `${folder}.stories.tsx`), storyContent);
      console.log(`  -> Generated ${folder}.stories.tsx`);
    }
  }
}

console.log('Starting component build...');
buildComponents();
console.log('Component build finished!');
