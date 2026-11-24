import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { cls, formatPrice, uid } from '../lib/format';
import { matchNeed } from '../lib/needs';
import { cartLines, SHIPPING, shippingCost, subtotalOf } from '../lib/pricing';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';
import type { Address, Order, PaymentMethod, ShippingMethod } from '../types';

const STEPS = ['address', 'shipping', 'payment', 'review'] as const;

const PAYMENT: Record<PaymentMethod, string> = {
  card: 'credit card',
  paypal: 'PayPal',
  invoice: 'invoice',
};

const EMPTY_ADDRESS: Address = { name: '', email: '', street: '', zip: '', city: '', country: 'Germany' };

interface Card {
  number: string;
  expiry: string;
  cvc: string;
}

function validateCard(card: Card): string | null {
  if (card.number.replace(/\s/g, '').length < 16) return 'incomplete card number';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'expiry as MM/YY';
  if (!/^\d{3,4}$/.test(card.cvc)) return 'invalid CVC';
  return null;
}

export function Checkout() {
  const { state, dispatch } = useStore();
  const { byId } = useProducts();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address>({
    ...EMPTY_ADDRESS,
    name: state.profile.name === 'guest' ? '' : state.profile.name,
  });
  const [shipping, setShipping] = useState<ShippingMethod>('standard');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [card, setCard] = useState<Card>({ number: '', expiry: '', cvc: '' });
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ order: Order; fulfilled: number } | null>(null);

  const lines = cartLines(state.cart, byId);
  const subtotal = subtotalOf(lines);
  const shippingPrice = shippingCost(subtotal, shipping);
  const total = subtotal + shippingPrice;

  if (placed) {
    return (
      <div className="page narrow">
        <div className="panel confirm">
          <div className="prompt-line">
            <span className="prompt">&gt;</span> order {placed.order.id} confirmed<span className="cursor">_</span>
          </div>
          <h1>thanks{address.name ? `, ${address.name.split(' ')[0]}` : ''}.</h1>
          <p>
            Received {placed.order.lines.reduce((n, l) => n + l.qty, 0)} items for {formatPrice(placed.order.total)}.
            Delivery: {SHIPPING[placed.order.shipping].eta}.
          </p>
          {placed.fulfilled > 0 && (
            <p className="muted">{placed.fulfilled} shopping list item(s) marked done.</p>
          )}
          <p className="muted small">Demo — nothing was paid or shipped.</p>
          <Link to="/" className="btn btn-primary">
            continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="page empty">
        <p>Your cart is empty.</p>
        <Link to="/" className="btn">
          back to shop
        </Link>
      </div>
    );
  }

  const next = (e?: FormEvent) => {
    e?.preventDefault();
    if (step === 2 && payment === 'card') {
      const problem = validateCard(card);
      if (problem) return setError(problem);
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const placeOrder = () => {
    const fulfilledNeedIds = state.needs
      .filter((n) => matchNeed(n, state.wishlist, byId).status === 'wishlisted')
      .map((n) => n.id);
    const order: Order = {
      id: `FF-${uid().toUpperCase()}`,
      createdAt: Date.now(),
      lines: lines.map(({ product, size, qty }) => ({
        productId: product.id,
        size,
        qty,
        name: product.name,
        brand: product.brand,
        price: product.price,
      })),
      address,
      shipping,
      payment,
      total,
    };
    dispatch({ type: 'order/place', order, fulfilledNeedIds });
    setPlaced({ order, fulfilled: fulfilledNeedIds.length });
    window.scrollTo(0, 0);
  };

  const field = (key: keyof Address, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="field">
      <span>{label}</span>
      <input required value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="page">
      <h1>checkout</h1>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s} className={cls(i === step && 'on', i < step && 'done')}>
            <button disabled={i > step} onClick={() => setStep(i)}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="split">
        <div>
          {step === 0 && (
            <form className="form" onSubmit={next}>
              {field('name', 'full name', { autoComplete: 'name' })}
              {field('email', 'e-mail', { type: 'email', autoComplete: 'email' })}
              {field('street', 'street and number', { autoComplete: 'street-address' })}
              <div className="form-row">
                {field('zip', 'postal code', { autoComplete: 'postal-code', pattern: '\\d{4,5}', title: '4–5 digits' })}
                {field('city', 'city', { autoComplete: 'address-level2' })}
              </div>
              {field('country', 'country', { autoComplete: 'country-name' })}
              <button className="btn btn-primary">continue to shipping</button>
            </form>
          )}

          {step === 1 && (
            <form className="form" onSubmit={next}>
              {(Object.keys(SHIPPING) as ShippingMethod[]).map((m) => (
                <label key={m} className={cls('option', shipping === m && 'on')}>
                  <input type="radio" name="shipping" checked={shipping === m} onChange={() => setShipping(m)} />
                  <span className="grow">
                    {SHIPPING[m].label} <span className="muted">· {SHIPPING[m].eta}</span>
                  </span>
                  <span>{shippingCost(subtotal, m) === 0 ? 'free' : formatPrice(shippingCost(subtotal, m))}</span>
                </label>
              ))}
              <button className="btn btn-primary">continue to payment</button>
            </form>
          )}

          {step === 2 && (
            <form className="form" onSubmit={next}>
              {(Object.keys(PAYMENT) as PaymentMethod[]).map((m) => (
                <label key={m} className={cls('option', payment === m && 'on')}>
                  <input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} />
                  <span className="grow">{PAYMENT[m]}</span>
                </label>
              ))}
              {payment === 'card' && (
                <div className="card-fields">
                  <label className="field">
                    <span>card number</span>
                    <input
                      value={card.number}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setCard({ ...card, number: digits.replace(/(\d{4})(?=\d)/g, '$1 ') });
                      }}
                    />
                  </label>
                  <div className="form-row">
                    <label className="field">
                      <span>expiry</span>
                      <input
                        value={card.expiry}
                        placeholder="MM/JJ"
                        autoComplete="cc-exp"
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setCard({ ...card, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
                        }}
                      />
                    </label>
                    <label className="field">
                      <span>cvc</span>
                      <input
                        value={card.cvc}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      />
                    </label>
                  </div>
                </div>
              )}
              {payment === 'paypal' && <p className="muted small">You would be redirected to PayPal after review (demo).</p>}
              {payment === 'invoice' && <p className="muted small">Payable within 14 days of receipt (demo).</p>}
              {error && <p className="error">! {error}</p>}
              <button className="btn btn-primary">continue to review</button>
            </form>
          )}

          {step === 3 && (
            <div className="form">
              <div className="review">
                <div>
                  <div className="label">delivery address</div>
                  <p>
                    {address.name}
                    <br />
                    {address.street}
                    <br />
                    {address.zip} {address.city}
                    <br />
                    {address.country}
                  </p>
                  <button className="link-btn" onClick={() => setStep(0)}>
                    change
                  </button>
                </div>
                <div>
                  <div className="label">shipping</div>
                  <p>
                    {SHIPPING[shipping].label} · {SHIPPING[shipping].eta}
                  </p>
                  <button className="link-btn" onClick={() => setStep(1)}>
                    change
                  </button>
                </div>
                <div>
                  <div className="label">payment</div>
                  <p>
                    {PAYMENT[payment]}
                    {payment === 'card' && ` · •••• ${card.number.slice(-4)}`}
                  </p>
                  <button className="link-btn" onClick={() => setStep(2)}>
                    change
                  </button>
                </div>
              </div>
              <button className="btn btn-primary" onClick={placeOrder}>
                place order · {formatPrice(total)}
              </button>
            </div>
          )}
        </div>

        <aside className="panel">
          <h3>your order</h3>
          <ul className="plain summary-lines">
            {lines.map(({ product, size, qty }) => (
              <li key={`${product.id}-${size}`} className="row-between">
                <span>
                  {qty}× {product.name} <span className="muted">· {size}</span>
                </span>
                <span>{formatPrice(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <dt>subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
            <dt>shipping</dt>
            <dd>{shippingPrice === 0 ? 'free' : formatPrice(shippingPrice)}</dd>
            <dt className="total">total</dt>
            <dd className="total">{formatPrice(total)}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}
