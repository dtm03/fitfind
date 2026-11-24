import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { Product } from '../types';

export function productExternalUrl(product: Product): string {
  return product.source.url;
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  product: Product;
  children: ReactNode;
};

export function ZalandoLink({ product, children, className, ...rest }: AnchorProps) {
  return (
    <a
      href={productExternalUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={`Open ${product.brand} on Zalando`}
      {...rest}
    >
      {children}
    </a>
  );
}