import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Product, CartItem, StoreSettings, Order } from '../types';
import { api } from '../services/api';
import { INITIAL_CATEGORIES, INITIAL_SETTINGS } from '../data/seedData';

export type ModalType =
  | 'cart'
  | 'checkout'
  | 'product_detail'
  | 'restock_modal'
  | 'admin_login'
  | 'order_success'
  | null;

interface ShopContextType {
  products: Product[];
  categories: string[];
  settings: StoreSettings;
  isLoading: boolean;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number, presentation?: string) => { success: boolean; message?: string };
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedAvailability: string;
  setSelectedAvailability: (av: string) => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  activeModal: ModalType;
  openModal: (modal: ModalType, product?: Product) => void;
  closeModal: () => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  lastCreatedOrder: { order: Order; whatsappUrl: string; whatsappMessage: string } | null;
  setLastCreatedOrder: (data: { order: Order; whatsappUrl: string; whatsappMessage: string } | null) => void;
  isAdmin: boolean;
  adminUser: string | null;
  loginAdmin: (user: string, pass: string) => Promise<void>;
  logoutAdmin: () => void;
  currentView: 'catalog' | 'admin';
  setCurrentView: (view: 'catalog' | 'admin') => void;
  refreshCatalog: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'dsantos_cart_v1';

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('todos');
  const [selectedSort, setSelectedSort] = useState<string>('destacados');
  const [selectedBrand, setSelectedBrand] = useState<string>('todas');

  // Modal & Navigation states
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<{ order: Order; whatsappUrl: string; whatsappMessage: string } | null>(null);
  const [currentView, setCurrentView] = useState<'catalog' | 'admin'>('catalog');

  // Admin auth
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<string | null>(null);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Load initial settings and products
  const refreshCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts();
      setProducts(res.products);
    } catch (err) {
      console.error('Error refreshing products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings) setSettings(res.settings);
      if (res.categories && res.categories.length > 0) setCategories(res.categories);
    } catch (err) {
      console.error('Error refreshing settings:', err);
    }
  };

  useEffect(() => {
    refreshSettings();
    refreshCatalog();

    // Check existing admin token
    api.adminVerify().then(res => {
      if (res.valid) {
        setIsAdmin(true);
        setAdminUser(res.username || 'Alba');
      }
    });

    // Check URL query parameters (e.g. /#admin or ?view=admin)
    const checkHash = () => {
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        setCurrentView('admin');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, presentation?: string) => {
    if (product.status === 'inactivo' || product.stock === 0 || product.status === 'agotado') {
      return { success: false, message: 'Este producto está agotado actualmente.' };
    }

    let message = '';
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = currentQty + quantity;
        if (newQty > product.stock) {
          message = `Existencias máximas alcanzadas (${product.stock} disponibles).`;
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: product.stock,
            selectedPresentation: presentation || updated[existingIndex].selectedPresentation,
          };
          return updated;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          selectedPresentation: presentation || updated[existingIndex].selectedPresentation,
        };
        return updated;
      } else {
        const initialQty = Math.min(quantity, product.stock);
        return [
          ...prev,
          {
            product,
            quantity: initialQty,
            selectedPresentation: presentation || product.presentation,
          },
        ];
      }
    });

    api.trackEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      metadata: { quantity, price: product.price },
    });

    return { success: true, message };
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => {
      if (quantity <= 0) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock;
          return {
            ...item,
            quantity: Math.min(quantity, maxStock),
          };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const openModal = (modal: ModalType, product?: Product) => {
    if (product) setSelectedProduct(product);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const loginAdmin = async (user: string, pass: string) => {
    const res = await api.adminLogin(user, pass);
    setIsAdmin(true);
    setAdminUser(res.username);
    setCurrentView('admin');
    closeModal();
  };

  const logoutAdmin = () => {
    api.setAdminToken(null);
    setIsAdmin(false);
    setAdminUser(null);
    setCurrentView('catalog');
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        settings,
        isLoading,
        cart,
        cartCount,
        cartTotal,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedAvailability,
        setSelectedAvailability,
        selectedSort,
        setSelectedSort,
        selectedBrand,
        setSelectedBrand,
        activeModal,
        openModal,
        closeModal,
        selectedProduct,
        setSelectedProduct,
        lastCreatedOrder,
        setLastCreatedOrder,
        isAdmin,
        adminUser,
        loginAdmin,
        logoutAdmin,
        currentView,
        setCurrentView,
        refreshCatalog,
        refreshSettings,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};
