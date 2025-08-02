import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import '../../../tokens/dist/tokens.css';
import styles from './badge.module.css';

export interface BadgeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon3260 prop */
  icon3260?: boolean;
  /** The type prop */
  type?: 'Regular' | 'Solid' | 'Outlined';
  /** The state prop */
  state?: 'Active' | 'Neutral' | 'Negative' | 'Positive';

}

export const Badge: React.FC<badgeProps> = ({
  icon3260 = true,
  type = "Solid",
  state = "Neutral",

  ...props
}) => {
  return (
    <button
      className={styles.badge}
      data-icon3260={icon3260}
      data-type={type}
      data-state={state}
      {...props}
    >
      {/* Render slots conditionally */}

    </button>
  );
};
