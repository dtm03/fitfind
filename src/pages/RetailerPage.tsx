import { Link, useParams, useSearchParams } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { productPartnerUrl } from "../lib/productLink";
import { useProducts } from "../store/products";

/** Demo stand-in for an outbound affiliate / partner product page. */
export function RetailerPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const size = search.get("size") ?? undefined;
  const { byId, loading } = useProducts();
  const product = id ? byId.get(id) : undefined;

  if (loading) return <div className="page muted">loading…</div>;
  if (!product) {
    return (
      <div className="page empty">
        <p>product not found.</p>
        <Link to="/" className="btn">
          back to shop
        </Link>
      </div>
    );
  }

  const partnerUrl = productPartnerUrl(product, size);

  return (
    <div className="page retailer-stub">
      <p className="muted small">affiliate redirect (demo)</p>
      <h1>{product.name}</h1>
      <p className="retailer-stub-lead">
        This could be the retailer&apos;s product page. fitfind does not sell
        clothes here — you&apos;d continue on the partner site.
      </p>
      <dl className="specs retailer-stub-specs">
        <dt>partner</dt>
        <dd>{product.source.shop}</dd>
        <dt>price (listing)</dt>
        <dd>{formatPrice(product.price)}</dd>
        {size && (
          <>
            <dt>size</dt>
            <dd>{size}</dd>
          </>
        )}
        <dt>production URL</dt>
        <dd className="mono wrap">{partnerUrl}</dd>
      </dl>
      <div className="retailer-stub-actions">
        <Link to={`/product/${product.id}`} className="btn btn-primary">
          back to product
        </Link>
        <Link to="/" className="btn">
          back to shop
        </Link>
      </div>
    </div>
  );
}
