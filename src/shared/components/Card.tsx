import { HTMLAttributes, ReactNode } from 'react';
import type { PaddingSize } from '../types';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  children: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  clickable?: boolean;
  padding?: PaddingSize;
  bodyStyle?: React.CSSProperties;
}

// Map new padding values to CSS classes
const paddingClassMap: Record<PaddingSize, string> = {
  none: 'card-padding-none',
  xs: 'card-padding-xs',
  sm: 'card-padding-small',
  md: '',
  lg: 'card-padding-large',
};

export const Card = ({
  children,
  title,
  footer,
  variant = 'default',
  clickable = false,
  padding = 'md',
  bodyStyle,
  className = '',
  ...props
}: CardProps) => {
  const variantClass = variant !== 'default' ? `card-${variant}` : '';
  const clickableClass = clickable ? 'card-clickable' : '';
  const paddingClass = paddingClassMap[padding];

  const classes = ['card', variantClass, clickableClass, paddingClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-body" style={bodyStyle}>{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};
