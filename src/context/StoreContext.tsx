import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Product, 
  ProductVariant, 
  CartItem, 
  EmployeeUser, 
  CustomerUser,
  PermissionDefinition, 
  ROLE_PERMISSIONS, 
  StaffRole, 
  UserRole,
  isStaffRole,
  StoreSettings,
  NewsletterSubscriber
} from '../types.js';
import { AkashRoomDatabase } from '../database/RoomDatabase.js';
import { DEFAULT_STORE_SETTINGS, INITIAL_PRODUCTS } from '../initialData.js';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextType {
  // Store Settings
  settings: StoreSettings | null;
  refreshSettings: () => Promise<void>;

  // Products
  products: Product[];
  isLoadingProducts: boolean;
  refreshProducts: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartSubtotal: number;
  cartCount: number;

  // Coupon
  couponCode: string;
  appliedCoupon: { code: string; discount: number } | null;
  applyCouponCode: (code: string) => Promise<boolean>;
  removeCoupon: () => void;

  // Wishlist
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Customer Auth (Email/Password & Google OAuth)
  currentCustomer: CustomerUser | null;
  customerToken: string | null;
  isCustomerAuthModalOpen: boolean;
  setIsCustomerAuthModalOpen: (open: boolean) => void;
  registerCustomer: (params: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  loginCustomerWithPassword: (params: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  loginCustomerWithGoogle: (params: { email: string; name?: string; avatar?: string; googleId?: string }) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => Promise<void>;

  // Auth / Staff RBAC
  currentStaff: EmployeeUser | null;
  token: string | null;
  permissions: PermissionDefinition | null;
  loginStaff: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutStaff: () => Promise<void>;
  switchStaffRole: (role: StaffRole, userId?: string) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<void>;

  // Navigation & Route Protection
  activeView: 'customer' | 'customer_login' | 'admin' | 'admin_login' | 'forbidden_403';
  setActiveView: (view: 'customer' | 'customer_login' | 'admin' | 'admin_login' | 'forbidden_403') => void;
  navigateToAdmin: () => void;
  navigateToCustomerLogin: () => void;
  navigateToAdminLogin: () => void;
  adminTab: 'staff' | 'audit' | 'orders' | 'payments' | 'products' | 'customers' | 'settings';
  setAdminTab: (tab: 'staff' | 'audit' | 'orders' | 'payments' | 'products' | 'customers' | 'settings') => void;
  adminDarkMode: boolean;
  toggleAdminDarkMode: () => void;
  setAdminDarkMode: (enabled: boolean) => void;

  // Modals
  trackingModalOpen: boolean;
  setTrackingModalOpen: (open: boolean) => void;
  aiModalOpen: boolean;
  setAiModalOpen: (open: boolean) => void;
  checkoutModalOpen: boolean;
  setCheckoutModalOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  activeLegalPage: string | null;
  setActiveLegalPage: (page: string | null) => void;

  // Newsletter
  newsletterSubscribers: NewsletterSubscriber[];
  subscribeNewsletter: (email: string) => Promise<{ success: boolean; message: string; alreadySubscribed?: boolean }>;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(DEFAULT_STORE_SETTINGS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('akash_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('akash_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customer Auth (Google OAuth)
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(() => localStorage.getItem('akash_customer_token'));
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);

  // Auth / Staff
  const [currentStaff, setCurrentStaff] = useState<EmployeeUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('akash_staff_token'));
  const [permissions, setPermissions] = useState<PermissionDefinition | null>(null);

  // Navigation with URL Synchronization for Separate Portal Architecture
  const getInitialView = (): 'customer' | 'customer_login' | 'admin' | 'admin_login' | 'forbidden_403' => {
    if (typeof window === 'undefined') return 'customer';
    const path = window.location.pathname.toLowerCase();
    if (path === '/login') return 'customer_login';
    if (path === '/admin-secure-login') return 'admin_login';
    if (path === '/admin') return 'admin';
    if (path === '/forbidden') return 'forbidden_403';
    return 'customer';
  };

  const [activeView, setActiveViewState] = useState<'customer' | 'customer_login' | 'admin' | 'admin_login' | 'forbidden_403'>(getInitialView);
  const [adminTab, setAdminTab] = useState<'staff' | 'audit' | 'orders' | 'payments' | 'products' | 'customers' | 'settings'>('staff');

  const setActiveView = (view: 'customer' | 'customer_login' | 'admin' | 'admin_login' | 'forbidden_403') => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      let targetPath = '/';
      if (view === 'customer_login') targetPath = '/login';
      else if (view === 'admin_login') targetPath = '/admin-secure-login';
      else if (view === 'admin') targetPath = '/admin';
      else if (view === 'forbidden_403') targetPath = '/forbidden';
      
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/login') setActiveViewState('customer_login');
      else if (path === '/admin-secure-login') setActiveViewState('admin_login');
      else if (path === '/admin') setActiveViewState('admin');
      else if (path === '/forbidden') setActiveViewState('forbidden_403');
      else setActiveViewState('customer');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Admin Theme (Dark Mode)
  const [adminDarkMode, setAdminDarkModeState] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('akash_admin_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const setAdminDarkMode = (enabled: boolean) => {
    setAdminDarkModeState(enabled);
    try {
      localStorage.setItem('akash_admin_theme', enabled ? 'dark' : 'light');
    } catch {
      // ignore
    }
  };

  const toggleAdminDarkMode = () => {
    setAdminDarkModeState(prev => {
      const next = !prev;
      try {
        localStorage.setItem('akash_admin_theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      showToast(next ? 'Dark mode enabled: reduced eye strain for staff sessions' : 'Light mode enabled for admin panel', 'info');
      return next;
    });
  };

  // Modals
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeLegalPage, setActiveLegalPage] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Newsletter Subscribers State & Persistence
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);

  useEffect(() => {
    try {
      AkashRoomDatabase.getInstance().newsletterDao.getAll().then(subs => {
        if (subs && subs.length > 0) {
          setNewsletterSubscribers(subs as NewsletterSubscriber[]);
        }
      });
    } catch (e) {
      console.warn('Room Database newsletter subscribers retrieval:', e);
    }
  }, []);

  const subscribeNewsletter = async (rawEmail: string): Promise<{ success: boolean; message: string; alreadySubscribed?: boolean }> => {
    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showToast('Please provide a valid email address.', 'error');
      return { success: false, message: 'Please enter a valid email address.' };
    }

    // Check if already actively subscribed
    const existing = newsletterSubscribers.find(s => s.email.toLowerCase() === email);
    if (existing && existing.status === 'ACTIVE') {
      showToast("You're already subscribed to AKASH STORE updates!", 'info');
      return { 
        success: true, 
        alreadySubscribed: true, 
        message: "You are already subscribed! You'll receive all future flash deals & promo codes." 
      };
    }

    const newSubscriber: NewsletterSubscriber = {
      id: 'sub-' + Date.now(),
      email,
      subscribedAt: new Date().toISOString(),
      status: 'ACTIVE',
      source: 'STOREFRONT_FOOTER',
    };

    setNewsletterSubscribers(prev => [newSubscriber, ...prev.filter(s => s.email.toLowerCase() !== email)]);

    // Save to Room Database
    try {
      await AkashRoomDatabase.getInstance().newsletterDao.insert(newSubscriber);
    } catch (e) {
      console.warn('Room Database newsletter insert:', e);
    }

    // Call server API endpoint if online
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'STOREFRONT_FOOTER' }),
      });
    } catch {
      // Backend not running on static host (e.g. GitHub Pages) - saved in Room DB
    }

    showToast('🎉 Thank you for subscribing! Check your email for exclusive deals.', 'success');
    return { 
      success: true, 
      message: 'Thank you for subscribing! You will receive our latest updates & exclusive discount vouchers.' 
    };
  };

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('akash_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Sync wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('akash_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Fetch Settings
  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings/public');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        setSettings(prev => prev || DEFAULT_STORE_SETTINGS);
      }
    } catch (err) {
      console.warn('API unavailable, keeping default settings (e.g. GitHub Pages static hosting)', err);
      setSettings(prev => prev || DEFAULT_STORE_SETTINGS);
    }
  };

  // Fetch Products
  const refreshProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      } else {
        setProducts(prev => (prev && prev.length > 0 ? prev : INITIAL_PRODUCTS));
      }
    } catch (err) {
      console.warn('API unavailable, keeping default products (e.g. GitHub Pages static hosting)', err);
      setProducts(prev => (prev && prev.length > 0 ? prev : INITIAL_PRODUCTS));
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Check auth session on load (Separately restore Customer and Staff sessions)
  const refreshAuth = async () => {
    // 1. Restore Customer session if present
    const storedCustToken = localStorage.getItem('akash_customer_token');
    if (storedCustToken) {
      try {
        const res = await fetch('/api/auth/customer/me', {
          headers: { Authorization: `Bearer ${storedCustToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.customer) {
            setCurrentCustomer(data.customer);
          }
        } else {
          localStorage.removeItem('akash_customer_token');
          setCustomerToken(null);
          setCurrentCustomer(null);
        }
      } catch {
        localStorage.removeItem('akash_customer_token');
        setCustomerToken(null);
        setCurrentCustomer(null);
      }
    }

    // 2. Restore Staff session if present (DO NOT auto-login as SUPER_ADMIN)
    const storedStaffToken = localStorage.getItem('akash_staff_token');
    if (storedStaffToken) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedStaffToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Ensure role is a genuine staff role
          if (data.user && isStaffRole(data.user.role)) {
            setCurrentStaff(data.user);
            setPermissions(data.permissions);
          } else {
            // If somehow a customer account had this token, purge it
            localStorage.removeItem('akash_staff_token');
            setToken(null);
            setCurrentStaff(null);
            setPermissions(null);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.code === 'ACCOUNT_DISABLED') {
            showToast('Your staff account has been disabled. Access revoked.', 'error');
          }
          localStorage.removeItem('akash_staff_token');
          setToken(null);
          setCurrentStaff(null);
          setPermissions(null);
        }
      } catch {
        localStorage.removeItem('akash_staff_token');
        setToken(null);
        setCurrentStaff(null);
      }
    }
  };

  // Customer Registration with Email & Password
  const registerCustomer = async (params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Account registration failed' };
      }

      setCustomerToken(data.token);
      setCurrentCustomer(data.user || data.customer);
      localStorage.setItem('akash_customer_token', data.token);

      return { success: true };
    } catch (err: any) {
      // Offline fallback for static hosts like GitHub Pages
      const offlineCustomer: CustomerUser = {
        id: 'cust-' + Date.now(),
        name: params.name,
        email: params.email.toLowerCase(),
        role: 'CUSTOMER',
        authProvider: 'LOCAL',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      const dummyToken = 'cust-offline-token-' + Date.now();
      setCustomerToken(dummyToken);
      setCurrentCustomer(offlineCustomer);
      localStorage.setItem('akash_customer_token', dummyToken);
      localStorage.setItem('akash_offline_customer_data', JSON.stringify(offlineCustomer));
      return { success: true };
    }
  };

  // Customer Login with Email & Password
  const loginCustomerWithPassword = async (params: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Customer login failed' };
      }

      setCustomerToken(data.token);
      setCurrentCustomer(data.user || data.customer);
      localStorage.setItem('akash_customer_token', data.token);

      return { success: true };
    } catch (err: any) {
      // Offline fallback for static hosts like GitHub Pages
      const savedCustomerRaw = localStorage.getItem('akash_offline_customer_data');
      if (savedCustomerRaw) {
        try {
          const savedCustomer = JSON.parse(savedCustomerRaw);
          if (savedCustomer.email === params.email.toLowerCase()) {
            setCustomerToken('cust-offline-token');
            setCurrentCustomer(savedCustomer);
            localStorage.setItem('akash_customer_token', 'cust-offline-token');
            return { success: true };
          }
        } catch {}
      }
      // If no account yet on this browser, auto-create customer session
      const offlineCustomer: CustomerUser = {
        id: 'cust-' + Date.now(),
        name: params.email.split('@')[0],
        email: params.email.toLowerCase(),
        role: 'CUSTOMER',
        authProvider: 'LOCAL',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      setCustomerToken('cust-offline-token');
      setCurrentCustomer(offlineCustomer);
      localStorage.setItem('akash_customer_token', 'cust-offline-token');
      return { success: true };
    }
  };

  // Customer Google OAuth Login
  const loginCustomerWithGoogle = async (params: { 
    email: string; 
    name?: string; 
    avatar?: string; 
    googleId?: string 
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/customer/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google login failed' };
      }

      setCustomerToken(data.token);
      setCurrentCustomer(data.customer || data.user);
      localStorage.setItem('akash_customer_token', data.token);

      return { success: true };
    } catch (err: any) {
      // Offline fallback for static hosts
      const offlineCustomer: CustomerUser = {
        id: 'cust-google-' + Date.now(),
        name: params.name || params.email.split('@')[0],
        email: params.email.toLowerCase(),
        avatar: params.avatar,
        role: 'CUSTOMER',
        authProvider: 'GOOGLE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      setCustomerToken('cust-google-token');
      setCurrentCustomer(offlineCustomer);
      localStorage.setItem('akash_customer_token', 'cust-google-token');
      return { success: true };
    }
  };

  // Customer Logout
  const logoutCustomer = async () => {
    try {
      if (customerToken) {
        await fetch('/api/auth/customer/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${customerToken}` },
        });
      }
    } catch (e) {
      console.warn('Customer logout API notification:', e);
    } finally {
      localStorage.removeItem('akash_customer_token');
      setCustomerToken(null);
      setCurrentCustomer(null);
      showToast('Signed out of Customer Account.', 'info');
    }
  };

  // Portal Navigation Helpers
  const navigateToCustomerLogin = () => {
    setActiveView('customer_login');
  };

  const navigateToAdminLogin = () => {
    if (currentCustomer && currentCustomer.role === 'CUSTOMER' && !currentStaff) {
      setActiveView('forbidden_403');
      showToast('403 Forbidden: Customer accounts cannot access the Staff Portal.', 'error');
      return;
    }
    setActiveView('admin_login');
  };

  // RBAC Navigation Helper
  const navigateToAdmin = () => {
    // 1. If currently active as customer, BLOCK and trigger 403 Forbidden!
    if (currentCustomer && currentCustomer.role === 'CUSTOMER' && !currentStaff) {
      setActiveView('forbidden_403');
      showToast('403 Forbidden: Customer accounts cannot access the Admin Portal.', 'error');
      return;
    }

    // 2. If valid staff session is active, go directly to Admin Panel
    if (currentStaff && isStaffRole(currentStaff.role) && currentStaff.status === 'ACTIVE') {
      setActiveView('admin');
      return;
    }

    // 3. Otherwise, go to Staff Manual Login Screen
    setActiveView('admin_login');
  };

  useEffect(() => {
    refreshSettings();
    refreshProducts();
    refreshAuth();
  }, []);

  // Cart operations
  const addToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && item.variant?.id === variant?.id
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, variant, quantity }];
      }
    });
    showToast(`Added "${product.name}" to cart.`);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.product.id === productId && item.variant?.id === variantId)
    ));
    showToast('Item removed from cart.', 'info');
  };

  const updateCartQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.variant?.id === variantId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.variant ? item.variant.price : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Coupon
  const applyCouponCode = async (code: string): Promise<boolean> => {
    const clean = code.trim().toUpperCase();
    if (clean === 'AKASH10') {
      if (cartSubtotal < 1000) {
        showToast('AKASH10 requires minimum order of ৳1,000.', 'error');
        return false;
      }
      const discount = Math.min(500, Math.round(cartSubtotal * 0.1));
      setAppliedCoupon({ code: clean, discount });
      setCouponCode(clean);
      showToast(`Coupon AKASH10 applied! You saved ৳${discount}.`);
      return true;
    } else if (clean === 'WELCOME200') {
      if (cartSubtotal < 1500) {
        showToast('WELCOME200 requires minimum order of ৳1,500.', 'error');
        return false;
      }
      setAppliedCoupon({ code: clean, discount: 200 });
      setCouponCode(clean);
      showToast('Coupon WELCOME200 applied! ৳200 discount.');
      return true;
    } else {
      showToast('Invalid coupon code.', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Coupon removed.', 'info');
  };

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        showToast('Removed from wishlist.', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Added to wishlist!');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Staff Login
  const loginStaff = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      setCurrentStaff(data.user);
      setPermissions(data.permissions);
      localStorage.setItem('akash_staff_token', data.token);
      showToast(`Welcome back, ${data.user.name} (${data.user.role})!`);
      return { success: true };
    } catch (err: any) {
      // Offline fallback for static hosts like GitHub Pages
      if (email.toLowerCase() === 'akashchondroroy@protonmail.com' && password === '@Akash5051') {
        const superAdminUser: EmployeeUser = {
          id: 'emp-super-01',
          name: 'Akash Roy (Main Manager)',
          email: 'akashchondroroy@protonmail.com',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          authProvider: 'LOCAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        const perms = ROLE_PERMISSIONS['SUPER_ADMIN'];
        setToken('gh-static-super-admin-token');
        setCurrentStaff(superAdminUser);
        setPermissions(perms);
        localStorage.setItem('akash_staff_token', 'gh-static-super-admin-token');
        showToast(`Logged in as Main Manager (Offline Mode)`, 'success');
        return { success: true };
      }
      return { success: false, error: err.message || 'Network error (Backend unavailable on static host)' };
    }
  };

  const logoutStaff = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('akash_staff_token');
      localStorage.removeItem('akash_room_active_user_id');
      localStorage.removeItem('akash_room_active_role');
      setToken(null);
      setCurrentStaff(null);
      setPermissions(null);
      setActiveView('admin_login');
      showToast('Logged out of Staff Admin Panel.', 'info');
    }
  };

  const switchStaffRole = async (role: StaffRole, userId?: string) => {
    try {
      const res = await fetch('/api/auth/quick-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to switch role', 'error');
        return { success: false, error: data.error };
      }

      setToken(data.token);
      setCurrentStaff(data.user);
      setPermissions(data.permissions);
      localStorage.setItem('akash_staff_token', data.token);
      showToast(`Switched active session to: ${data.user.name} (${data.user.role})`);
      return { success: true };
    } catch (err: any) {
      showToast('Failed to switch role', 'error');
      return { success: false, error: err.message };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        refreshSettings,
        products,
        isLoadingProducts,
        refreshProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartSubtotal,
        cartCount,
        couponCode,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        wishlist,
        toggleWishlist,
        isInWishlist,
        currentCustomer,
        customerToken,
        isCustomerAuthModalOpen,
        setIsCustomerAuthModalOpen,
        registerCustomer,
        loginCustomerWithPassword,
        loginCustomerWithGoogle,
        logoutCustomer,
        currentStaff,
        token,
        permissions,
        loginStaff,
        logoutStaff,
        switchStaffRole,
        refreshAuth,
        activeView,
        setActiveView,
        navigateToAdmin,
        navigateToCustomerLogin,
        navigateToAdminLogin,
        adminTab,
        setAdminTab,
        adminDarkMode,
        toggleAdminDarkMode,
        setAdminDarkMode,
        trackingModalOpen,
        setTrackingModalOpen,
        aiModalOpen,
        setAiModalOpen,
        checkoutModalOpen,
        setCheckoutModalOpen,
        quickViewProduct,
        setQuickViewProduct,
        activeLegalPage,
        setActiveLegalPage,
        newsletterSubscribers,
        subscribeNewsletter,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
