import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'secondary' | 'quiet' };

export function Button({ tone = 'secondary', className = '', ...props }: ButtonProps) {
  return <button className={`button button--${tone} ${className}`.trim()} {...props} />;
}
