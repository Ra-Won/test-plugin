import React from 'react';
import PropTypes from 'prop-types';
import styles from './Badge.module.css';

export interface BadgeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon3260 prop */
  icon3260?: boolean;
  /** The type prop */
  type?: 'Regular' | 'Solid' | 'Outlined';
  /** The state prop */
  state?: 'Active' | 'Neutral' | 'Negative' | 'Positive';

  /** The iconcontainer slot */
  iconcontainer?: ReactNode;
  /** The actionrequired slot */
  actionrequired?: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  icon3260 = true,
  type = "Solid",
  state = "Neutral",
  iconcontainer,
  actionrequired,
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
      {iconcontainer}
            {actionrequired}
    </button>
  );
};
