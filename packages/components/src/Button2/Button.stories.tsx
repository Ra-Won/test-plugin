import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button2 } from './Button2';

// This is the main configuration for your component's stories
const meta: Meta<typeof Button2> = {
  title: 'Components/Button',
  component: Button,
  // This argTypes section creates the interactive controls in Storybook
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'hovered', 'disabled'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    hasIcon: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button2>;

// A simple icon component for the stories
const ArrowIcon = () => <span>›</span>;

// The primary story for the default button state
export const Default: Story = {
  args: {
    state: 'default',
    size: 'md',
    hasIcon: true,
    icon: <ArrowIcon />,
    children: 'Click Me',
  },
};

// A story to demonstrate the hovered state
export const Hovered: Story = {
  args: {
    ...Default.args,
    state: 'hovered',
  },
  // This parameter tells Storybook to simulate a hover state for visual testing
  parameters: { pseudo: { hover: true } },
};

// A story to demonstrate the disabled state
export const Disabled: Story = {
  args: {
    ...Default.args,
    state: 'disabled',
  },
};

// A story to demonstrate the small size
export const Small: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

// A story to demonstrate the large size
export const Large: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
};

// A story to demonstrate the button without an icon
export const WithoutIcon: Story = {
  args: {
    ...Default.args,
    hasIcon: false,
  },
};
