import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  argTypes: {
    icon3260: { control: 'boolean' },
    type: { control: { type: 'select', options: ["Regular","Solid","Outlined"] } },
    state: { control: { type: 'select', options: ["Active","Neutral","Negative","Positive"] } },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    icon3260: true,
    type: "Solid",
    state: "Neutral",
  },
};
