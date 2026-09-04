import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext.js';
import { Header } from './components/Header.js';
import { Hero } from './components/Hero.js';
import { ProductCard } from './components/ProductCard.js';
import { ProductModal } from './components/ProductModal.js';
import { CartDrawer } from './components/CartDrawer.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { OrderTrackingModal } from './components/OrderTrackingModal.js';
import { AiAssistantModal } from './components/AiAssistantModal.js';
import { LegalPages } from './components/LegalPages.js';
import { AdminLayout } from './components/admin/AdminLayout.js';
import { AdminLoginScreen } from './components/admin/AdminLoginScreen.js';
import { CustomerLoginScreen } from './components/CustomerLoginScreen.js';
import { Forbidden403Screen } from './components/admin/Forbidden403Screen.js';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard.js';
import { CustomerAuthModal } from './components/CustomerAuthModal.js';
import { NewsletterSection } from './components/NewsletterSection.js';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  RotateCcw, 
  MapPin, 
  Mail, 
  Sparkles, 
  ArrowRight,
  Heart,
  CheckCircle2,
  X,
  Lock
} from 'lucide-react';

const Storefront: React.FC = () => {
  const { 
    products, 
    isLoadingProducts, 
    settings, 
    activeView, 
    setActiveView, 
    quickViewProduct, 
    setQuickViewProduct,
    checkoutModalOpen,
    setCheckoutModalOpen,
    trackingModalOpen,
    setTrackingModalOpen,
    aiModalOpen,
    setAiModalOpen,
    activeLegalPage,
    setActiveLegalPage,
    currentStaff,
    navigateToAdminLogin,
    toasts,
    removeToast
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (activeView === 'forbidden_403') {
    return (
      <Forbidden403Screen 
        attemptedUrl="/admin-secure-login"
        onBackToHome={() => setActiveView('customer')}
      />
    );
  }

  if (activeView === 'customer_login') {
    return (
      <CustomerLoginScreen 
        onSuccessNavigate={() => setActiveView('customer')}
        onCancel={() => setActiveView('customer')}
      />
    );
  }

  if (activeView === 'admin_login') {
    return (
      <AdminLoginScreen 
        onSuccessNavigate={() => setActiveView('admin')}
        onCancel={() => setActiveView('customer')}
      />
    );
  }

  if (activeView === 'admin') {
    return (
      <AdminRouteGuard>
        <AdminLayout />
        {/* Global Toasts */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 ${
                t.type === 'error' ? 'bg-rose-900 text-white border-rose-800' :
                t.type === 'info' ? 'bg-slate-900 text-white border-slate-800' :
                'bg-emerald-950 text-white border-emerald-800'
              }`}
            >
              <span>{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          ))}
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      
      {/* Header */}
      <Header 
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      {/* Main Content: Either Legal/Info Page or Full Storefront */}
      {activeLegalPage ? (
        <main className="flex-1">
          <LegalPages 
            page={activeLegalPage as any} 
            onBack={() => setActiveLegalPage(null)} 
          />
        </main>
      ) : (
        <main className="flex-1">
          
          {/* Hero Section */}
          <Hero 
            onShopNow={() => {
              const el = document.getElementById('catalog-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Trust Guarantees Bar */}
          <section className="bg-white border-y border-slate-200 py-6 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">100% Genuine</h4>
                  <p className="text-[11px] text-slate-500">Official brand warranties</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">bKash Verified</h4>
                  <p className="text-[11px] text-slate-500">{settings?.bkashNumber || '01874839665'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Fast BD Delivery</h4>
                  <p className="text-[11px] text-slate-500">Dhaka ৳60 / Outside ৳120</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">7-Day Returns</h4>
                  <p className="text-[11px] text-slate-500">Hassle-free guarantee</p>
                </div>
              </div>
            </div>
          </section>

          {/* Product Catalog Section */}
          <section id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            
            {/* Catalog Section Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Curated Catalog
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {selectedCategory === 'All' ? 'Featured Products' : `${selectedCategory} Collection`}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Directly dispatched from our central center in Sherpur, Bogura.
                </p>
              </div>

              {/* Active Category Counter */}
              <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> products
              </div>
            </div>

            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
                    <div className="aspect-square bg-slate-100 rounded-lg" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto space-y-3 shadow-2xs">
                <p className="font-bold text-slate-800">No products found</p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search query or selecting another category.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            )}

          </section>

          {/* Special bKash Payment Banner */}
          <section className="bg-gradient-to-r from-pink-950 via-slate-900 to-pink-950 text-white py-10 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400 bg-pink-900/40 px-2.5 py-1 rounded-full border border-pink-700/50">
                  Official bKash Payment Channel
                </span>
                <h3 className="text-2xl font-black">
                  Instant Verification with Official bKash
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Send Money or Pay to our verified merchant number <strong>{settings?.bkashNumber || '01874839665'}</strong>. Your TrxID is safely validated by our management team before packing.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveLegalPage('payments')}
                  className="px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  View Payment Guide
                </button>
                <button
                  onClick={() => setTrackingModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
                >
                  Track Existing Order
                </button>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          
          {/* Newsletter Subscription Section */}
          <NewsletterSection />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand & Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  A
                </div>
                <span className="text-base font-black text-white">{settings?.storeName || 'AKASH STORE'}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Premium retail and e-commerce platform founded by <strong>Akash Chondror Roy</strong>. Delivering genuine quality products across all 8 divisions of Bangladesh.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{settings?.headquarters || 'Sherpur, Bogura, Bangladesh'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{settings?.contactEmail || 'akashchondroroy@protonmail.com'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CreditCard className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>bKash: {settings?.bkashNumber || '01874839665'}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Shop & Explore</h4>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={() => { setSelectedCategory('Electronics'); setActiveLegalPage(null); }} className="hover:text-white">Electronics</button></li>
                <li><button onClick={() => { setSelectedCategory('Gadgets'); setActiveLegalPage(null); }} className="hover:text-white">Gadgets & Audio</button></li>
                <li><button onClick={() => { setSelectedCategory('Fashion'); setActiveLegalPage(null); }} className="hover:text-white">Fashion & Apparel</button></li>
                <li><button onClick={() => { setSelectedCategory('Grocery'); setActiveLegalPage(null); }} className="hover:text-white">Pure Sundarban Honey</button></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div>
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Customer Service</h4>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={() => setTrackingModalOpen(true)} className="hover:text-white">Track Order</button></li>
                <li><button onClick={() => setActiveLegalPage('payments')} className="hover:text-white">bKash Payment Guide</button></li>
                <li><button onClick={() => setActiveLegalPage('shipping')} className="hover:text-white">Shipping & Returns</button></li>
                <li><button onClick={() => setActiveLegalPage('contact')} className="hover:text-white">Contact & Support</button></li>
                <li><button onClick={() => setActiveLegalPage('about')} className="hover:text-white">About Akash Chondror Roy</button></li>
              </ul>
            </div>

            {/* Admin Management Entry */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Staff & Admin Portal</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Separate portal strictly for Super Admins, Admins, and Employees via <code className="text-emerald-400 font-mono text-[10px]">/admin-secure-login</code> with email & password authentication.
              </p>
              <button
                onClick={navigateToAdminLogin}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Staff Portal (/admin-secure-login)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
            <span>© {new Date().getFullYear()} AKASH STORE. All Rights Reserved.</span>
            <span>Headquarters: Sherpur, Bogura, Bangladesh</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Shopping Assistant Button */}
      <button
        onClick={() => setAiModalOpen(true)}
        className="fixed bottom-5 right-5 z-40 p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 border-2 border-emerald-400/30 cursor-pointer"
        title="Ask AKASH STORE AI Assistant"
      >
        <Sparkles className="w-5 h-5 text-amber-300" />
        <span className="text-xs font-bold hidden sm:inline">Ask AI Assistant</span>
      </button>

      {/* Modals */}
      <CartDrawer />
      <CheckoutModal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} />
      <ProductModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      <OrderTrackingModal isOpen={trackingModalOpen} onClose={() => setTrackingModalOpen(false)} />
      <AiAssistantModal />
      <CustomerAuthModal />

      {/* Global Toast Layer */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 ${
              t.type === 'error' ? 'bg-rose-900 text-white border-rose-800' :
              t.type === 'info' ? 'bg-slate-900 text-white border-slate-800' :
              'bg-emerald-950 text-white border-emerald-800'
            }`}
          >
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <Storefront />
    </StoreProvider>
  );
}
