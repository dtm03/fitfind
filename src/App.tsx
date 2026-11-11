import { useEffect } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { ProductPage } from './pages/ProductPage';
import { Profile } from './pages/Profile';
import { Shop } from './pages/Shop';
import { Wishlist } from './pages/Wishlist';
import { useProducts } from './store/products';

function ProductRoute() {
  const { id } = useParams();
  return <ProductPage key={id} />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const { loading } = useProducts();

  if (loading) {
    return (
      <div className="page">
        <span className="prompt">&gt;</span> lade katalog<span className="cursor">_</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Shop />} />
      <Route path="/product/:id" element={<ProductRoute />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/profile" element={<Profile />} />
      <Route
        path="*"
        element={
          <div className="page empty">
            <p>404 – seite nicht gefunden.</p>
            <Link to="/" className="btn">
              zum shop
            </Link>
          </div>
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <AppRoutes />
      </main>
      <footer className="footer muted small">
        fitfind · prototyp mit beispieldaten · <span className="cursor">_</span>
      </footer>
    </>
  );
}
