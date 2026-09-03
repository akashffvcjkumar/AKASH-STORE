import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  MapPin, 
  Mail, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  User, 
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

interface HeaderProps {
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
  onSearchChange?: (q: string) => void;
  searchQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSelectCategory, 
  selectedCategory = 'All',
  onSearchChange,
  searchQuery = ''
}) => {
  const { 
    settings, 
    cartCount, 
    setIsCartOpen, 
    wishlist, 
    currentCustomer,
    setIsCustomerAuthModalOpen,
    currentStaff, 
    activeView, 
    setActiveView,
    navigateToAdmin,
    setTrackingModalOpen,
    setAiModalOpen,
    setActiveLegalPage
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = ['All', 'Electronics', 'Gadgets', 'Fashion', 'Beauty', 'Grocery'];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Utility Bar - Explicit requirement: Sherpur, Bogura, Bangladesh & akashchondroroy@protonmail.com */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{settings?.headquarters || 'Sherpur, Bogura, Bangladesh'}</span>
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <a 
              href={`mailto:${settings?.contactEmail || 'akashchondroroy@protonmail.com'}`}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{settings?.contactEmail || 'akashchondroroy@protonmail.com'}</span>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
            <button 
              onClick={() => setTrackingModalOpen(true)}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors py-0.5 px-2 rounded bg-slate-800 hover:bg-slate-700"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Track Order</span>
            </button>

            {/* Customer Account Indicator / Google Sign-in */}
            {currentCustomer ? (
              <button
                onClick={() => setActiveView('customer_login')}
                className="flex items-center gap-1.5 py-0.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors border border-slate-700 cursor-pointer"
                title="Customer Portal (/login)"
              >
                {currentCustomer.avatar ? (
                  <img 
                    src={currentCustomer.avatar} 
                    alt={currentCustomer.name} 
                    className="w-3.5 h-3.5 rounded-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">G</span>
                )}
                <span className="max-w-[90px] truncate">{currentCustomer.name.split(' ')[0]}</span>
                <span className="text-[10px] px-1 rounded bg-emerald-950 text-emerald-400 font-mono font-bold">CUSTOMER</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveView('customer_login')}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors py-0.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-xs cursor-pointer border border-slate-700"
                title="Customer Sign In (/login)"
              >
                <span className="w-3 h-3 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center text-[8px] font-bold">G</span>
                <span>Sign In (/login)</span>
              </button>
            )}

            {/* Authenticated Staff Switcher (only shows if staff session is active) */}
            {currentStaff && (
              <button
                onClick={() => setActiveView(activeView === 'admin' ? 'customer' : 'admin')}
                className={`flex items-center gap-1.5 py-0.5 px-2.5 rounded font-medium text-xs transition-all cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-indigo-900 text-indigo-200 hover:bg-indigo-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>{activeView === 'admin' ? 'Exit Admin' : `Staff: ${currentStaff.role}`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Search Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setActiveView('customer');
                setActiveLegalPage(null);
              }}
              className="text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-emerald-700 transition-colors">
                  A
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    {settings?.storeName || 'AKASH STORE'}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                      BD
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Founder: {settings?.ownerName || 'Akash Chondror Roy'}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search Samsung, Sony headphones, Honey, Cotton shirts..."
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Shopping Assistant Trigger */}
            <button
              onClick={() => setAiModalOpen(true)}
              className="flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors border border-emerald-200"
              title="Ask AI Shopping Assistant"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Wishlist Button */}
            <button 
              onClick={() => {
                // If any items in wishlist, scroll or filter
              }}
              className="relative p-2 text-slate-600 hover:text-rose-600 transition-colors rounded-full hover:bg-slate-100"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Customer Account Button */}
            <button
              onClick={() => setIsCustomerAuthModalOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-semibold border border-slate-200 transition-colors"
              title={currentCustomer ? `Logged in as ${currentCustomer.name}` : "Customer Sign in with Google"}
            >
              {currentCustomer?.avatar ? (
                <img 
                  src={currentCustomer.avatar} 
                  alt={currentCustomer.name} 
                  className="w-5 h-5 rounded-full object-cover border border-slate-300" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <User className="w-4 h-4 text-emerald-600" />
              )}
              <span className="hidden md:inline max-w-[90px] truncate">
                {currentCustomer ? currentCustomer.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs sm:text-sm font-medium shadow-xs transition-colors"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  if (onSelectCategory) onSelectCategory(cat);
                  setActiveView('customer');
                  setActiveLegalPage(null);
                }}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                  selectedCategory === cat 
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 whitespace-nowrap pl-4">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine BD Products
            </span>
            <span>•</span>
            <span>Free Delivery &gt; ৳2,000</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                setActiveView('customer');
                setActiveLegalPage(null);
                setMobileMenuOpen(false);
              }}
              className="text-left font-medium text-slate-700 py-2 border-b border-slate-100"
            >
              Shop All Products
            </button>
            <button 
              onClick={() => {
                setTrackingModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-left font-medium text-slate-700 py-2 border-b border-slate-100 flex items-center justify-between"
            >
              <span>Track My Order</span>
              <Truck className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={() => {
                setActiveLegalPage('about');
                setActiveView('customer');
                setMobileMenuOpen(false);
              }}
              className="text-left font-medium text-slate-700 py-2 border-b border-slate-100"
            >
              About AKASH STORE
            </button>
            <button 
              onClick={() => {
                setActiveLegalPage('contact');
                setActiveView('customer');
                setMobileMenuOpen(false);
              }}
              className="text-left font-medium text-slate-700 py-2 border-b border-slate-100"
            >
              Contact Us (Sherpur, Bogura)
            </button>
            <button 
              onClick={() => {
                setActiveView('admin');
                setMobileMenuOpen(false);
              }}
              className="text-left font-medium text-emerald-700 py-2 flex items-center justify-between"
            >
              <span>Staff / Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
