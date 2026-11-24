import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { ProductPage } from './pages/ProductPage';
import { RetailerPage } from './pages/RetailerPage';
import { Shop } from './pages/Shop';
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
        <span className="prompt">&gt;</span> loading catalogue<span className="cursor">_</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Shop />} />
      <Route path="/product/:id" element={<ProductRoute />} />
      <Route path="/retailer/:id" element={<RetailerPage />} />
      <Route path="/wishlist" element={<Navigate to="/" replace />} />
      <Route
        path="*"
        element={
          <div className="page empty">
            <p>404 — page not found.</p>
            <Link to="/" className="btn">
              back to shop
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
        fitfind · prototype with sample data · <span className="cursor">_</span>
      </footer>
    </>
  );
}
