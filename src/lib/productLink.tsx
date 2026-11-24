import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cls } from './format';
import type { Product } from '../types';

/** URL that would be used with a live affiliate / partner feed. */
export function productPartnerUrl(product: Product, size?: string): string {
  if (size) {
    const sep = product.source.url.includes('?') ? '&' : '?';
    return `${product.source.url}${sep}size=${encodeURIComponent(size)}`;
  }
  return product.source.url;
}

/** In-app demo page that stands in for leaving to the retailer. */
export function productRetailerPath(product: Product, size?: string): string {
  const q = size ? `?size=${encodeURIComponent(size)}` : '';
  return `/retailer/${product.id}${q}`;
}

type BuyLinkProps = Omit<LinkProps, 'to'> & {
  product: Product;
  size?: string;
  disabled?: boolean;
  children?: ReactNode;
};

export function RetailerBuyLink({ product, size, disabled, className, children, ...rest }: BuyLinkProps) {
  if (disabled || !size) {
    return (
      <span className={cls('btn btn-primary', className, 'is-disabled')} aria-disabled>
        {children ?? 'out of stock'}
      </span>
    );
  }

  const shop = product.source.shop.replace(/^www\./, '');
  return (
    <Link
      to={productRetailerPath(product, size)}
      className={cls('btn', 'btn-primary', className)}
      {...rest}
    >
      {children ?? (
        <>
          buy at {shop} · {size}
        </>
      )}
    </Link>
  );
}