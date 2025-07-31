import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The visual state of the button */
  state?: 'default' | 'hovered' | 'disabled';
  /** Whether the button should display an icon */
  hasIcon?: boolean;
  /** The size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** The content of the button label */
  children: ReactNode;
  /** The icon element to display when hasIcon is true */
  icon?: ReactNode;
}

/**
 * The primary button component for user actions.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  icon,
  state = 'default',
  hasIcon = false,
  size = 'md', // ✅ Default size is 'md'
  ...props
}) => {
  return (
    <button
      className={styles.button}
      data-state={state}
      data-has-icon={hasIcon}
      data-size={size} // ✅ Apply the size as a data attribute
      disabled={state === 'disabled'}
      {...props}
    >
      <span>{children}</span>
      {hasIcon && icon}
    </button>
  );
};
