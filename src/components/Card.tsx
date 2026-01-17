import { HTMLAttributes, ReactNode } from 'react';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  children: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  clickable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card = ({
  children,
  title,
  footer,
  variant = 'default',
  clickable = false,
  padding = 'medium',
  className = '',
  ...props
}: CardProps) => {
  const variantClass = variant !== 'default' ? `card-${variant}` : '';
  const clickableClass = clickable ? 'card-clickable' : '';
  const paddingClass = padding !== 'medium' ? `card-padding-${padding}` : '';

  const classes = ['card', variantClass, clickableClass, paddingClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};
