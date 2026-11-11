import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../data/categories';
import { bestFit } from '../lib/fit';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';

export function Wishlist() {
  const { state, dispatch } = useStore();
  const { byId } = useProducts();
  const products = state.wishlist.flatMap((id) => byId.get(id) ?? []);

  return (
    <div className="page">
      <h1>merkliste</h1>
      {products.length === 0 ? (
        <div className="empty">
          <p>noch nichts gemerkt. tipp auf ♡ bei einem produkt.</p>
          <Link to="/" className="btn">
            zum shop
          </Link>
        </div>
      ) : (
        <div className="grid">
          {products.map((product) => {
            const fit = bestFit(product, state.profile);
            const preferred = state.profile.preferredSizes[CATEGORIES[product.category].group];
            const size =
              fit?.size ??
              product.variants.find((v) => v.inStock && v.size === preferred)?.size ??
              product.variants.find((v) => v.inStock)?.size;
            const inCart = state.cart.some((i) => i.productId === product.id);
            return (
              <div key={product.id} className="stack-sm">
                <ProductCard product={product} fit={fit} />
                <button
                  className="btn btn-block"
                  disabled={!size}
                  onClick={() => size && dispatch({ type: 'cart/add', productId: product.id, size })}
                >
                  {size ? `${inCart ? '+1 ' : ''}in den warenkorb · ${size}` : 'ausverkauft'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
