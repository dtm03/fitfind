import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { cls, formatPrice, uid } from '../lib/format';
import { matchNeed } from '../lib/needs';
import { cartLines, SHIPPING, shippingCost, subtotalOf } from '../lib/pricing';
import { useProducts } from '../store/products';
import { useStore } from '../store/store';
import type { Address, Order, PaymentMethod, ShippingMethod } from '../types';

const STEPS = ['adresse', 'versand', 'zahlung', 'prüfen'] as const;

const PAYMENT: Record<PaymentMethod, string> = {
  card: 'kreditkarte',
  paypal: 'paypal',
  invoice: 'rechnung',
};

const EMPTY_ADDRESS: Address = { name: '', email: '', street: '', zip: '', city: '', country: 'deutschland' };

interface Card {
  number: string;
  expiry: string;
  cvc: string;
}

function validateCard(card: Card): string | null {
  if (card.number.replace(/\s/g, '').length < 16) return 'kartennummer unvollständig';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'ablaufdatum als MM/JJ';
  if (!/^\d{3,4}$/.test(card.cvc)) return 'cvc ungültig';
  return null;
}

export function Checkout() {
  const { state, dispatch } = useStore();
  const { byId } = useProducts();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address>({ ...EMPTY_ADDRESS, name: state.profile.name === 'gast' ? '' : state.profile.name });
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
            <span className="prompt">&gt;</span> bestellung {placed.order.id} bestätigt<span className="cursor">_</span>
          </div>
          <h1>danke{address.name ? `, ${address.name.split(' ')[0]}` : ''}.</h1>
          <p>
            wir haben {placed.order.lines.reduce((n, l) => n + l.qty, 0)} artikel für {formatPrice(placed.order.total)}{' '}
            erhalten. lieferung: {SHIPPING[placed.order.shipping].eta}.
          </p>
          {placed.fulfilled > 0 && (
            <p className="muted">{placed.fulfilled} punkt(e) deiner einkaufsliste wurden als erledigt markiert.</p>
          )}
          <p className="muted small">demo – es wurde nichts bezahlt oder versendet.</p>
          <Link to="/" className="btn btn-primary">
            weiter shoppen
          </Link>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="page empty">
        <p>dein warenkorb ist leer.</p>
        <Link to="/" className="btn">
          zum shop
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
      .filter((n) => matchNeed(n, state.cart, [], byId).status === 'in-cart')
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
      <h1>kasse</h1>
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
              {field('name', 'vor- und nachname', { autoComplete: 'name' })}
              {field('email', 'e-mail', { type: 'email', autoComplete: 'email' })}
              {field('street', 'straße und hausnummer', { autoComplete: 'street-address' })}
              <div className="form-row">
                {field('zip', 'plz', { autoComplete: 'postal-code', pattern: '\\d{4,5}', title: '4–5 ziffern' })}
                {field('city', 'stadt', { autoComplete: 'address-level2' })}
              </div>
              {field('country', 'land', { autoComplete: 'country-name' })}
              <button className="btn btn-primary">weiter zum versand</button>
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
                  <span>{shippingCost(subtotal, m) === 0 ? 'kostenlos' : formatPrice(shippingCost(subtotal, m))}</span>
                </label>
              ))}
              <button className="btn btn-primary">weiter zur zahlung</button>
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
                    <span>kartennummer</span>
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
                      <span>gültig bis</span>
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
              {payment === 'paypal' && <p className="muted small">du wirst nach dem prüfen zu paypal weitergeleitet (demo).</p>}
              {payment === 'invoice' && <p className="muted small">zahlbar innerhalb von 14 tagen nach erhalt.</p>}
              {error && <p className="error">! {error}</p>}
              <button className="btn btn-primary">weiter zum prüfen</button>
            </form>
          )}

          {step === 3 && (
            <div className="form">
              <div className="review">
                <div>
                  <div className="label">lieferadresse</div>
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
                    ändern
                  </button>
                </div>
                <div>
                  <div className="label">versand</div>
                  <p>
                    {SHIPPING[shipping].label} · {SHIPPING[shipping].eta}
                  </p>
                  <button className="link-btn" onClick={() => setStep(1)}>
                    ändern
                  </button>
                </div>
                <div>
                  <div className="label">zahlung</div>
                  <p>
                    {PAYMENT[payment]}
                    {payment === 'card' && ` · •••• ${card.number.slice(-4)}`}
                  </p>
                  <button className="link-btn" onClick={() => setStep(2)}>
                    ändern
                  </button>
                </div>
              </div>
              <button className="btn btn-primary" onClick={placeOrder}>
                zahlungspflichtig bestellen · {formatPrice(total)}
              </button>
            </div>
          )}
        </div>

        <aside className="panel">
          <h3>deine bestellung</h3>
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
            <dt>zwischensumme</dt>
            <dd>{formatPrice(subtotal)}</dd>
            <dt>versand</dt>
            <dd>{shippingPrice === 0 ? 'kostenlos' : formatPrice(shippingPrice)}</dd>
            <dt className="total">gesamt</dt>
            <dd className="total">{formatPrice(total)}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}
