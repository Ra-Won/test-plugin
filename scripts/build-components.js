const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'packages', 'components', 'src');

// ✅ ADDED: Helper to convert any string to camelCase
function camelCase(str) {
  const pascal = (' ' + str).toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function generateComponentTsx(data) {
  const componentClassName = data.name.toLowerCase();

  const propsInterface = Object.keys(data.props).map(key => {
    const propData = data.props[key];
    const cleanKey = camelCase(key); // Sanitize prop name
    let propType;
    switch (propData.type) {
      case 'VARIANT': propType = `'${propData.options.join("' | '")}'`; break;
      case 'BOOLEAN': propType = 'boolean'; break;
      case 'TEXT': propType = 'string'; break;
      default: propType = 'any';
    }
    return `  /** The ${cleanKey} prop */\n  ${cleanKey}?: ${propType};`;
  }).join('\n');

  const propsDestructuring = Object.keys(data.props).map(key => {
    const propData = data.props[key];
    const cleanKey = camelCase(key); // Sanitize prop name
    return `  ${cleanKey} = ${JSON.stringify(propData.defaultValue)},`;
  }).join('\n');
  
  const slotsDestructuring = Object.keys(data.slots).map(slot => `  ${camelCase(slot)},`).join('\n');
  const dataAttributes = Object.keys(data.props).map(prop => `      data-${camelCase(prop)}={${camelCase(prop)}}`).join('\n');
  const slotsRendering = Object.keys(data.slots).map(slot => {
      const cleanSlotName = camelCase(slot);
      const condition = data.slots[slot].condition ? `${camelCase(data.slots[slot].condition)} && ` : '';
      return `      {${condition}${cleanSlotName}}`;
  }).join('\n      ');

  return `import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './${data.name}.module.css';

export interface ${data.name}Props extends ButtonHTMLAttributes<HTMLButtonElement> {
${propsInterface}
${Object.keys(data.slots).map(slot => `
  /** The ${camelCase(slot)} slot */
  ${camelCase(slot)}?: ReactNode;`).join('')}
}

export const ${data.name}: React.FC<${data.name}Props> = ({
${propsDestructuring}
${slotsDestructuring}
  ...props
}) => {
  return (
    <${data.element}
      className={styles.${componentClassName}}
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
  const componentClassName = data.name.toLowerCase();
  
  css += `.${componentClassName} {\n`;
  for (const prop in data.baseStyle) {
    css += `  ${prop}: ${data.baseStyle[prop]};\n`;
  }
  css += '}\n\n';

  for (const variantProp in data.variants) {
    const cleanVariantProp = camelCase(variantProp);
    for (const variantValue in data.variants[variantProp]) {
      css += `.${componentClassName}[data-${cleanVariantProp}='${variantValue}'] {\n`;
      const styles = data.variants[variantProp][variantValue];
      for (const styleProp in styles) {
        css += `  ${styleProp}: ${styles[styleProp]};\n`;
      }
      css += '}\n\n';
    }
  }
  return css;
}

// ✅ UPDATED: This function now adds default args for content slots.
function generateComponentStories(data) {
  const argTypes = Object.keys(data.props).map(key => {
    const propData = data.props[key];
    const cleanKey = camelCase(key);
    let control = 'text';
    if (propData.type === 'VARIANT' && propData.options) {
      control = `{ type: 'select', options: ${JSON.stringify(propData.options)} }`;
    } else if (propData.type === 'BOOLEAN') {
      control = "'boolean'";
    }
    return `    ${cleanKey}: { control: ${control} },`;
  }).join('\n');

  const defaultArgsForProps = Object.keys(data.props).map(key => {
    const cleanKey = camelCase(key);
    return `    ${cleanKey}: ${JSON.stringify(data.props[key].defaultValue)},`;
  }).join('\n');

  // Generate default args for slots to ensure content is visible
  const defaultArgsForSlots = Object.keys(data.slots).map(key => {
    const cleanKey = camelCase(key);
    const slotData = data.slots[key];
    let defaultValue = `'${slotData.defaultValue || cleanKey}'`; // Use default text or the slot name
    if (slotData.type === 'INSTANCE') {
      defaultValue = `<span>${slotData.name || 'Icon'}</span>`; // Render a placeholder for instances
    }
    return `    ${cleanKey}: ${defaultValue},`;
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
${defaultArgsForProps}
${defaultArgsForSlots}
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
      fs.writeFileSync(path.join(componentsDir, folder, `${componentData.name}.tsx`), tsxContent);
      console.log(`  -> Generated ${componentData.name}.tsx`);

      const cssContent = generateComponentCss(componentData);
      fs.writeFileSync(path.join(componentsDir, folder, `${componentData.name}.module.css`), cssContent);
      console.log(`  -> Generated ${componentData.name}.module.css`);

      const storyContent = generateComponentStories(componentData);
      fs.writeFileSync(path.join(componentsDir, folder, `${componentData.name}.stories.tsx`), storyContent);
      console.log(`  -> Generated ${componentData.name}.stories.tsx`);
    }
  }
}

console.log('Starting component build...');
buildComponents();
console.log('Component build finished!');
