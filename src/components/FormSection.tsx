import React, { ReactNode } from 'react';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
  style,
}) => {
  return (
    <div className={`form-section ${className}`} style={style}>
      {title && (
        <h3 className="form-section-title">{title}</h3>
      )}
      {description && (
        <p className="form-section-description">{description}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {children}
      </div>
    </div>
  );
};

