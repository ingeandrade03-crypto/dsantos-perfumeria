import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { api } from '../../services/api';
import { CatalogManager } from './CatalogManager';
import { HeroBannerGenerator } from './HeroBannerGenerator';
import {
  Product,
  Order,
  RestockRequest,
  InventoryLog,
  OrderStatus,
  PaymentStatus,
} from '../../types';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Bell,
  Settings,
  TrendingUp,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Truck,
  MessageCircle,
  AlertTriangle,
  RotateCcw,
  Key,
  ShieldCheck,
  ChevronRight,
  Filter,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  RefreshCw,
  Star,
  ExternalLink,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Wand2,
} from 'lucide-react';

// Pre-curated luxury perfume and beauty imagery for instant identification
const PRESET_PRODUCT_IMAGES = [
  {
    label: 'Perfume Dorado Lujo',
    category: 'Fraiche / Original',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Floral Rosa Dama',
    category: 'Dama Floral',
    url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Amaderado Caballero',
    category: 'Caballero',
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Cítrico Unisex',
    category: 'Unisex',
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Ámbar Noir Elegante',
    category: 'Nocturno / Intenso',
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Cosméticos y Maquillaje',
    category: 'Maquillaje',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Labial y Polvos de Belleza',
    category: 'Cosméticos',
    url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Crema y Cuidado Corporal',
    category: 'Cuidado Corporal',
    url: 'https://images.unsplash.com/photo-1608248597359-5484803716a5?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Serum y Cuidado Facial',
    category: 'Cuidado Facial',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Logotipo Oficial D\'Santos',
    category: 'Marca',
    url: '/logo.png',
  },
];

const POPULAR_BRANDS = [
  'Fraiche',
  'Carolina Herrera',
  'Christian Dior',
  'Chanel',
  'Paco Rabanne',
  'Yves Saint Laurent',
  'Lancôme',
  'Giorgio Armani',
  'Bath & Body Works',
  'Victoria\'s Secret',
];

type AdminTab = 'dashboard' | 'catalog' | 'heroBanner' | 'inventory' | 'orders' | 'restock' | 'settings';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    categories,
    settings,
    logoutAdmin,
    loginAdmin,
    isAdmin,
    setCurrentView,
    refreshCatalog,
    refreshSettings,
  } = useShop();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [period, setPeriod] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [topWaitlist, setTopWaitlist] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Admin direct login form state when unauthenticated
  const [loginUsername, setLoginUsername] = useState('alba');
  const [loginPassword, setLoginPassword] = useState('Alba2026*');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);
    try {
      await loginAdmin(loginUsername.trim(), loginPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Error de autenticación. Verifique las credenciales.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Filter states in tabs
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('Todas');

  // Modals inside Admin
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(5);
  const [stockReason, setStockReason] = useState<string>('Entrada de mercancía de proveedor');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Image management state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [activeImageTab, setActiveImageTab] = useState<'upload' | 'gallery' | 'url'>('upload');
  const [previewingProductImage, setPreviewingProductImage] = useState<Product | null>(null);

  // Quick inline stock edit state
  const [quickStockEditId, setQuickStockEditId] = useState<string | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Settings edit state
  const [tempSettings, setTempSettings] = useState(settings);

  // In-app Toast notifications (eliminates window.alert in iframe)
  const [toast, setToast] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ id: Date.now().toString(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 4500);
  };

  // In-app Confirmation Dialog (eliminates window.confirm in iframe)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Load analytics & overview
  const loadDashboardData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [analyticsRes, ordersRes, restockRes, logsRes] = await Promise.all([
        api.adminGetAnalytics(period),
        api.adminGetOrders(),
        api.adminGetRestockRequests(),
        api.adminGetInventoryLogs(),
      ]);
      setAnalyticsData(analyticsRes);
      setOrders(ordersRes?.orders || []);
      setRestockRequests(restockRes?.requests || []);
      setTopWaitlist(restockRes?.topRequested || []);
      setInventoryLogs(logsRes?.logs || []);
    } catch (err: any) {
      console.warn('Advertencia al cargar datos de administración:', err?.message || err);
      if (err?.message?.includes('Sesión no autorizada') || err?.message?.includes('token')) {
        logoutAdmin();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [period, isAdmin]);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Handle Product Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.brand || !editingProduct?.category || editingProduct?.price === undefined) {
      showToast('Por favor complete los campos obligatorios: Nombre, Marca, Categoría y Precio.', 'error');
      return;
    }

    // Default image if missing or empty
    const productImages = editingProduct.images && editingProduct.images.length > 0 && editingProduct.images[0]?.trim()
      ? editingProduct.images
      : ['/logo.png'];

    const numStock = typeof editingProduct.stock === 'number' ? Math.max(0, editingProduct.stock) : 0;
    let computedStatus = editingProduct.status || 'disponible';
    if (numStock === 0) {
      computedStatus = 'agotado';
    } else if (computedStatus === 'agotado' && numStock > 0) {
      computedStatus = 'disponible';
    }

    const payload: Partial<Product> = {
      ...editingProduct,
      images: productImages,
      stock: numStock,
      status: computedStatus,
    };

    try {
      if (editingProduct.id) {
        await api.adminUpdateProduct(editingProduct.id, payload);
        showToast(`Producto "${payload.name}" actualizado con éxito.`, 'success');
      } else {
        await api.adminCreateProduct(payload);
        showToast(`Producto "${payload.name}" dado de alta con éxito en el catálogo.`, 'success');
      }
      setEditingProduct(null);
      await refreshCatalog();
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar producto', 'error');
    }
  };

  // Image Upload Handler (reads file, compresses client-side and uploads to server)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const img = new window.Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1000;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              setImageUploadError('Error al crear lienzo para optimizar la imagen');
              setIsUploadingImage(false);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            try {
              const res = await api.adminUploadImage(compressedBase64, file.name);
              setEditingProduct((prev) =>
                prev ? { ...prev, images: [res.url] } : { images: [res.url] }
              );
              showToast('Fotografía subida y asignada con éxito.', 'success');
            } catch {
              // Fallback directly to base64
              setEditingProduct((prev) =>
                prev ? { ...prev, images: [compressedBase64] } : { images: [compressedBase64] }
              );
              showToast('Fotografía procesada con éxito.', 'success');
            }
          } catch (procErr: any) {
            setImageUploadError('Error al procesar la imagen: ' + procErr.message);
          } finally {
            setIsUploadingImage(false);
          }
        };
        img.onerror = () => {
          setImageUploadError('No se pudo decodificar el archivo de imagen.');
          setIsUploadingImage(false);
        };
        img.src = uploadEvent.target?.result as string;
      };
      reader.onerror = () => {
        setImageUploadError('Error al leer el archivo desde el dispositivo.');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setImageUploadError(err.message || 'Error al subir la imagen');
      setIsUploadingImage(false);
    }
  };

  // Quick stock stepping (+1 or -1) in table
  const handleQuickStockStep = async (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    if (newStock === p.stock) return;
    try {
      await api.adminUpdateProduct(p.id, { stock: newStock });
      await refreshCatalog();
      await loadDashboardData();
      showToast(`Stock de "${p.name}" actualizado a ${newStock} piezas`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar existencia', 'error');
    }
  };

  // Quick direct stock input save
  const handleQuickStockSave = async (p: Product, newStock: number) => {
    const val = Math.max(0, newStock);
    try {
      await api.adminUpdateProduct(p.id, { stock: val });
      setQuickStockEditId(null);
      await refreshCatalog();
      await loadDashboardData();
      showToast(`Existencia guardada: ${val} piezas para "${p.name}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar existencia', 'error');
    }
  };

  // Handle Stock Adjustment with atomic log
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockProduct) return;

    try {
      const res = await api.adminAdjustStock(
        adjustingStockProduct.id,
        stockDelta,
        stockReason,
        stockDelta > 0 ? 'entrada_proveedor' : 'ajuste_inventario'
      );

      // If replenished from 0 to positive and waitlist exists, alert Alba via toast
      if (res.pendingWaitlistsCount > 0) {
        showToast(
          `¡Inventario actualizado! Hay ${res.pendingWaitlistsCount} cliente(s) en espera de este producto. Puedes notificarlos en Avisos de Reposición.`,
          'info'
        );
      } else {
        showToast(res.message || 'Inventario actualizado con éxito', 'success');
      }

      setAdjustingStockProduct(null);
      await refreshCatalog();
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error al ajustar inventario', 'error');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.adminUpdateOrderStatus(orderId, newStatus);
      showToast(`Estado del pedido ${orderId} actualizado a "${newStatus}"`, 'success');
      await loadDashboardData();
      await refreshCatalog();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar el estado del pedido', 'error');
    }
  };

  // Handle Restock Notification Trigger
  const handleNotifyWaitlist = async (productId?: string, requestId?: string) => {
    try {
      const res = await api.adminNotifyRestock({ productId, requestId });
      if (res.results && res.results.length > 0) {
        const prepared = res.results.find((r: any) => r.directLink);
        if (prepared) {
          const link = document.createElement('a');
          link.href = prepared.directLink;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.click();
        }
      }
      showToast(res.message, 'success');
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error al notificar', 'error');
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminUpdateSettings(tempSettings);
      await refreshSettings();
      showToast('Configuración guardada correctamente.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar configuración', 'error');
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    try {
      await api.adminChangePassword(currentPassword, newPassword);
      setPasswordFeedback('¡Contraseña actualizada exitosamente!');
      showToast('¡Contraseña actualizada exitosamente!', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordFeedback(`Error: ${err.message}`);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // Handle CSV Import
  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    try {
      const res = await api.adminImportCsv(csvText);
      showToast(res.message || 'Productos importados con éxito', 'success');
      setShowCsvImport(false);
      setCsvText('');
      await refreshCatalog();
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error al importar CSV', 'error');
    }
  };

  // Export CSV without window.open
  const handleExportCsv = (type: string) => {
    const link = document.createElement('a');
    link.href = `/api/analytics/export?type=${type}`;
    link.download = `dsantos_${type}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Generando y descargando archivo CSV (${type})...`, 'info');
  };

  // Filtered Inventory list
  const filteredInventory = products.filter((p) => {
    if (inventoryCategoryFilter !== 'Todas' && p.category !== inventoryCategoryFilter) return false;
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Orders list
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'todos' && o.status !== orderStatusFilter) return false;
    return true;
  });

  // Guard: If not authenticated, render login access screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center p-4 text-stone-100">
        <div className="w-full max-w-md rounded-3xl bg-[#121212] border border-[#D6A34A]/40 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D6A34A]/5 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="text-center space-y-3 mb-6 relative z-10">
            <div className="w-16 h-16 rounded-full border border-[#D6A34A]/40 bg-black p-2 mx-auto shadow-lg flex items-center justify-center">
              <img src={settings.logoUrl || '/logo.png'} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl font-bold font-serif-luxury gold-gradient-text">
              Portal Administrativo D'Santos
            </h2>
            <p className="text-xs text-stone-400">
              Acceso exclusivo para Alba (Administradora y Propietaria)
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-700/60 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleDirectLogin} className="space-y-4 text-xs relative z-10">
            <div>
              <label className="block text-stone-300 font-medium mb-1">Usuario:</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="alba"
                  className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 pl-9 pr-3 text-stone-100 placeholder-stone-500 outline-none"
                />
                <User className="w-4 h-4 text-[#D6A34A] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-medium mb-1">Contraseña:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 pl-9 pr-3 text-stone-100 placeholder-stone-500 outline-none"
                />
                <Lock className="w-4 h-4 text-[#D6A34A] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full py-3 rounded-xl gold-btn font-bold text-xs uppercase tracking-wider text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#D6A34A]/20 transition disabled:opacity-50"
            >
              {isSubmittingLogin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar al Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-800 text-center relative z-10">
            <button
              type="button"
              onClick={() => setCurrentView('catalog')}
              className="text-xs text-stone-400 hover:text-[#F5D58A] transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#D6A34A]" />
              <span>Volver a la Tienda Pública</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-stone-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#D6A34A]/30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-[#D6A34A]/50 bg-black p-0.5 overflow-hidden">
            <img src={settings.logoUrl || '/logo.png'} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-serif-luxury gold-gradient-text leading-tight">
              D'Santos • Panel de Control
            </h1>
            <p className="text-[10px] text-stone-400">
              Sesión activa: <span className="text-[#F5D58A] font-semibold">Alba (Propietaria)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('catalog')}
            className="px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-700 hover:border-[#D6A34A] text-xs text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-[#D6A34A]" />
            <span>Ver Tienda Pública</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="p-2 rounded-full text-stone-400 hover:text-red-400 hover:bg-stone-900 transition cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-[#121212] border-b border-stone-800 px-4 sm:px-8 flex overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-[#D6A34A] text-[#F5D58A]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard & Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-[#D6A34A] text-[#F5D58A]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Gestión de Catálogo & Precios</span>
        </button>

        <button
          onClick={() => setActiveTab('heroBanner')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'heroBanner'
              ? 'border-[#D6A34A] text-[#F5D58A]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Wand2 className="w-4 h-4 text-[#D6A34A]" />
          <span>Fondo HeroBanner IA & Temporadas</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-[#D6A34A] text-[#F5D58A]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Control de Existencias ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'border-[#D6A34A] text-[#F5D58A]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pedidos ({orders.length})</span>
          {orders.filter((o) => o.status === 'pendiente_confirmacion').length > 0 && (
            <span className="bg-[#D98DA5] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
              {orders.filter((o) => o.status === 'pendiente_confirmacion').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('restock')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'restock'
              ? 'border-[#D6A34A] text-[#F5D58A]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Avisos de Reposición ({restockRequests.filter((r) => !r.notified).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-[#D6A34A] text-[#F5D58A]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración & WhatsApp API</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD & METRICS */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Period selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111] p-4 rounded-2xl border border-stone-800">
              <div>
                <h2 className="text-lg font-bold font-serif-luxury text-[#F5D58A]">
                  Estadísticas Comerciales de la Tienda
                </h2>
                <p className="text-xs text-stone-400">
                  Métricas calculadas en tiempo real sin contabilizar pedidos pendientes como ventas confirmadas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">Periodo:</span>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-[#181818] border border-stone-700 rounded-xl py-1.5 px-3 text-xs text-stone-200 outline-none"
                >
                  <option value="today">Hoy</option>
                  <option value="week">Últimos 7 días</option>
                  <option value="month">Este mes</option>
                  <option value="all">Todo el historial</option>
                </select>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#D6A34A]/30 shadow-md">
                <span className="text-stone-400 text-xs block mb-1">Ventas Confirmadas:</span>
                <p className="text-2xl font-bold text-[#F5D58A]">
                  ${analyticsData?.summary?.totalSalesRevenue?.toFixed(2) || '0.00'}{' '}
                  <span className="text-xs font-normal text-stone-400">MXN</span>
                </p>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  {analyticsData?.summary?.confirmedOrders || 0} pedidos confirmados
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800 shadow-md">
                <span className="text-stone-400 text-xs block mb-1">Pedidos Pendientes:</span>
                <p className="text-2xl font-bold text-[#D98DA5]">
                  {analyticsData?.summary?.pendingOrders || 0}
                </p>
                <span className="text-[10px] text-stone-400 block mt-1">
                  Por validar con el cliente
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800 shadow-md">
                <span className="text-stone-400 text-xs block mb-1">Existencias Bajas:</span>
                <p className="text-2xl font-bold text-amber-400">
                  {products.filter((p) => p.stock > 0 && p.stock <= (settings.lowStockThreshold || 3)).length}
                </p>
                <span className="text-[10px] text-amber-400/80 block mt-1">
                  {products.filter((p) => p.stock === 0 || p.status === 'agotado').length} productos agotados
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-stone-800 shadow-md">
                <span className="text-stone-400 text-xs block mb-1">Solicitudes de Reposición:</span>
                <p className="text-2xl font-bold text-purple-400">
                  {restockRequests.length}
                </p>
                <span className="text-[10px] text-stone-400 block mt-1">
                  {restockRequests.filter((r) => !r.notified).length} pendientes de notificación
                </span>
              </div>
            </div>

            {/* Demanda Insatisfecha y Top Búsquedas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Unmet Demand (Agotados más solicitados) */}
              <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#D6A34A]" />
                  Demanda Insatisfecha (Agotados)
                </h3>
                {topWaitlist.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">No hay solicitudes de productos agotados aún.</p>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {topWaitlist.slice(0, 5).map((item) => (
                      <div key={item.productId} className="flex justify-between items-center p-2 rounded-xl bg-stone-900 border border-stone-800">
                        <div className="overflow-hidden pr-2">
                          <p className="font-bold text-stone-200 truncate">{item.productName}</p>
                          <p className="text-[10px] text-stone-400">{item.brand}</p>
                        </div>
                        <span className="bg-red-950 text-red-300 font-bold px-2 py-0.5 rounded-full text-[11px] shrink-0">
                          {item.pendingRequests} solicitados
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Searched Queries */}
              <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#D6A34A]" />
                  Términos Más Buscados en Tienda
                </h3>
                {analyticsData?.topSearches?.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">Sin búsquedas registradas en este periodo.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {analyticsData?.topSearches?.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-stone-800">
                        <span className="text-stone-300">"{s.query}"</span>
                        <span className="text-stone-400 font-semibold">{s.count} veces</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Sold Products */}
              <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D6A34A]" />
                  Productos Más Vendidos
                </h3>
                {analyticsData?.topSoldProducts?.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">Sin ventas confirmadas en este periodo.</p>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {analyticsData?.topSoldProducts?.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="font-medium text-stone-200 truncate pr-2">{p.productName}</span>
                        <span className="font-bold text-emerald-400 shrink-0">{p.units} pzas (${p.revenue} MXN)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Access Toolbar for Alba */}
            <div className="bg-gradient-to-r from-[#161616] via-[#1f170f] to-[#161616] border border-[#D6A34A]/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <h4 className="text-sm font-bold font-serif-luxury text-[#F5D58A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D6A34A]" />
                  Gestión Rápida de Inventario y Fragancias
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Agrega nuevos perfumes, actualiza fotografías de identificación o ajusta existencias al instante.
                </p>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#D6A34A] hover:bg-[#BA8032] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gestionar Catálogo & Precios</span>
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-[#D6A34A] text-xs font-semibold text-stone-200 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Package className="w-4 h-4 text-[#D6A34A]" />
                  <span>Control de Existencias</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: CATALOG MANAGEMENT (PRODUCTS, PRICING, CATEGORIES) */}
        {/* ======================================================== */}
        {activeTab === 'catalog' && (
          <CatalogManager
            onShowToast={showToast}
            onRefreshData={loadDashboardData}
          />
        )}

        {/* ======================================================== */}
        {/* TAB: HERO BANNER & SEASONAL AI GENERATOR */}
        {/* ======================================================== */}
        {activeTab === 'heroBanner' && (
          <HeroBannerGenerator />
        )}

        {/* ======================================================== */}
        {/* TAB: INVENTORY & STOCK MOVEMENTS */}
        {/* ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Inventory Status Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
                <span className="text-[11px] text-stone-400 block">Total en Catálogo</span>
                <span className="text-xl font-bold text-stone-100 font-serif-luxury">{products.length} productos</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-emerald-900/30">
                <span className="text-[11px] text-emerald-400 block">Con Existencia</span>
                <span className="text-xl font-bold text-emerald-400 font-serif-luxury">
                  {products.filter((p) => p.stock > 0 && p.status !== 'inactivo').length} disponibles
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-amber-900/30">
                <span className="text-[11px] text-amber-400 block">Pocas Piezas</span>
                <span className="text-xl font-bold text-amber-400 font-serif-luxury">
                  {products.filter((p) => p.stock > 0 && p.stock <= (settings.lowStockThreshold || 3)).length} por agotar
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-red-900/30">
                <span className="text-[11px] text-red-400 block">Agotados</span>
                <span className="text-xl font-bold text-red-400 font-serif-luxury">
                  {products.filter((p) => p.stock === 0 || p.status === 'agotado').length} productos
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111] p-4 rounded-2xl border border-stone-800">
              <div className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, marca, SKU o notas..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 pl-8 pr-3 text-xs text-stone-100 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-200 outline-none cursor-pointer"
                >
                  <option value="Todas">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowCsvImport(true)}
                  className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-stone-500 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5 cursor-pointer"
                  title="Importar catálogo masivo vía CSV"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar CSV</span>
                </button>

                <button
                  onClick={() => handleExportCsv('inventory')}
                  className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-stone-500 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5 cursor-pointer"
                  title="Descargar inventario en CSV para Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>

                {products.length > 0 && (
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        title: '¿Eliminar todo el inventario?',
                        message: 'Esta acción eliminará todos los productos registrados del catálogo actual para que puedas comenzar desde cero con tu propio inventario. ¿Deseas continuar?',
                        confirmLabel: 'Sí, Eliminar Todo',
                        onConfirm: async () => {
                          try {
                            await api.adminClearInventory();
                            await refreshCatalog();
                            showToast('Todo el inventario ha sido eliminado correctamente.', 'success');
                          } catch (err: any) {
                            showToast(err.message || 'Error al vaciar inventario', 'error');
                          } finally {
                            setConfirmDialog(null);
                          }
                        },
                      });
                    }}
                    className="px-3 py-2 rounded-xl bg-red-950/40 border border-red-900/60 hover:bg-red-900/60 text-xs font-semibold text-red-300 transition flex items-center gap-1.5 cursor-pointer"
                    title="Eliminar todos los productos del inventario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Vaciar Inventario</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveImageTab('upload');
                    setImageUploadError(null);
                    setEditingProduct({
                      name: '',
                      brand: 'Fraiche',
                      category: categories[0] || 'Perfumería Fraiche',
                      price: 320,
                      stock: 10,
                      presentation: '100 ml - Concentrado Fraiche',
                      description: '',
                      images: [PRESET_PRODUCT_IMAGES[0].url],
                      status: 'disponible',
                      tags: ['nuevo'],
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#D6A34A] hover:bg-[#BA8032] text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Nuevo Producto</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-[#1a1a1a] text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Producto / Identificación</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Precio (MXN)</th>
                      <th className="py-3 px-4">Existencia (Piezas)</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {filteredInventory.map((p) => {
                      const isOut = p.stock === 0 || p.status === 'agotado';
                      const isLow = !isOut && p.stock <= (settings.lowStockThreshold || 3);
                      const isInactive = p.status === 'inactivo';

                      return (
                        <tr key={p.id} className={`hover:bg-stone-900/50 transition ${isInactive ? 'opacity-60 bg-stone-950/40' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {/* Visual Identifier with enlarged preview trigger */}
                              <div
                                onClick={() => setPreviewingProductImage(p)}
                                className="relative w-12 h-12 rounded-xl overflow-hidden bg-black border border-stone-800 hover:border-[#D6A34A] transition-all cursor-pointer group shrink-0 shadow-sm"
                                title="Ver foto ampliada de identificación"
                              >
                                <img
                                  src={p.images[0] || '/logo.png'}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/logo.png';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5 text-[#F5D58A]" />
                                </div>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-stone-100 font-serif-luxury truncate">{p.name}</p>
                                  {p.tags?.includes('destacado') && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#D6A34A]/20 text-[#F5D58A] border border-[#D6A34A]/30">
                                      ★ Destacado
                                    </span>
                                  )}
                                  {isInactive && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-stone-800 text-stone-400">
                                      Inactivo
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-400">
                                  <strong className="text-[#D6A34A] font-semibold">{p.brand}</strong> • {p.presentation}
                                  {p.sku && <span className="ml-1 text-stone-500 font-mono">({p.sku})</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px]">
                              {p.category}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-[#F5D58A] whitespace-nowrap">
                            ${p.price.toFixed(2)}
                          </td>

                          {/* Quick Interactive Stock Editing */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {quickStockEditId === p.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={quickStockValue}
                                  onChange={(e) => setQuickStockValue(parseInt(e.target.value, 10) || 0)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickStockSave(p, quickStockValue);
                                    if (e.key === 'Escape') setQuickStockEditId(null);
                                  }}
                                  className="w-16 bg-[#1f1f1f] border border-[#D6A34A] text-stone-100 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleQuickStockSave(p, quickStockValue)}
                                  className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                  title="Guardar existencia"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setQuickStockEditId(null)}
                                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center bg-[#181818] border border-stone-800 rounded-lg p-0.5 shadow-inner">
                                  <button
                                    onClick={() => handleQuickStockStep(p, -1)}
                                    disabled={p.stock <= 0}
                                    className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                                    title="Restar 1 pieza"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                  <span
                                    onClick={() => {
                                      setQuickStockEditId(p.id);
                                      setQuickStockValue(p.stock);
                                    }}
                                    className={`px-2 font-bold cursor-pointer hover:underline text-xs ${
                                      isOut ? 'text-red-400 font-extrabold' : isLow ? 'text-amber-400' : 'text-stone-200'
                                    }`}
                                    title="Clic para editar existencia manualmente"
                                  >
                                    {p.stock}
                                  </span>
                                  <button
                                    onClick={() => handleQuickStockStep(p, 1)}
                                    className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                                    title="Sumar 1 pieza"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-stone-500">pzas</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {isInactive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-900 text-stone-400 border border-stone-800">
                                Inactivo
                              </span>
                            ) : isOut ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/40">
                                Agotado
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/40">
                                Pocas piezas
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                                Disponible
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setAdjustingStockProduct(p);
                                  setStockDelta(5);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-[#D6A34A] hover:text-black text-stone-300 text-[11px] font-medium transition cursor-pointer"
                                title="Ajustar existencias con motivo y registro en historial"
                              >
                                Stock
                              </button>
                              <button
                                onClick={() => {
                                  setActiveImageTab('upload');
                                  setImageUploadError(null);
                                  setEditingProduct(p);
                                }}
                                className="p-1.5 rounded-lg text-stone-300 hover:text-[#D6A34A] hover:bg-stone-800 transition cursor-pointer"
                                title="Editar producto completo, foto e inventario"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {isInactive ? (
                                <button
                                  onClick={async () => {
                                    await api.adminUpdateProduct(p.id, { status: p.stock > 0 ? 'disponible' : 'agotado' });
                                    await refreshCatalog();
                                  }}
                                  className="p-1.5 rounded-lg text-emerald-400 hover:bg-stone-800 transition cursor-pointer"
                                  title="Reactivar en tienda pública"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setConfirmDialog({
                                      title: 'Desactivar Producto',
                                      message: `¿Deseas ocultar temporalmente "${p.name}" del catálogo público? Los clientes ya no lo verán, pero podrás reactivarlo con un solo clic.`,
                                      confirmLabel: 'Sí, Desactivar',
                                      onConfirm: async () => {
                                        await api.adminDeleteProduct(p.id, false);
                                        await refreshCatalog();
                                        showToast(`Producto "${p.name}" desactivado del catálogo público.`, 'info');
                                        setConfirmDialog(null);
                                      },
                                    });
                                  }}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition cursor-pointer"
                                  title="Desactivar producto de la tienda"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 px-4 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border border-stone-700 flex items-center justify-center mx-auto text-[#D6A34A]">
                              <Package className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-stone-200">
                              {products.length === 0
                                ? 'Catálogo limpio: Sin productos precargados'
                                : 'No se encontraron productos con ese filtro'}
                            </h4>
                            <p className="text-xs text-stone-400">
                              {products.length === 0
                                ? 'El inventario precargado ha sido eliminado exitosamente. Puedes dar de alta tus perfumes reales con foto de identificación, notas olfativas y existencias.'
                                : 'Prueba cambiando el término de búsqueda o seleccionando otra categoría.'}
                            </p>
                            {products.length === 0 && (
                              <button
                                onClick={() => {
                                  setActiveImageTab('upload');
                                  setImageUploadError(null);
                                  setEditingProduct({
                                    name: '',
                                    brand: 'Fraiche',
                                    category: categories[0] || 'Perfumería Fraiche',
                                    price: 320,
                                    stock: 10,
                                    presentation: '100 ml - Concentrado Fraiche',
                                    description: '',
                                    images: [PRESET_PRODUCT_IMAGES[0].url],
                                    status: 'disponible',
                                    tags: ['nuevo'],
                                  });
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D6A34A] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition shadow-lg cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                <span>+ Dar de alta primer producto</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Inventory Movement History */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#D6A34A]" />
                Historial de Movimientos de Inventario (Últimas Operaciones)
              </h3>
              <div className="max-h-60 overflow-y-auto divide-y divide-stone-800 text-xs text-stone-300">
                {inventoryLogs.slice(0, 15).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-200">{log.productName}</p>
                      <p className="text-[10px] text-stone-400">
                        {log.reason} • Responsable: {log.user} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${log.quantityDelta > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {log.quantityDelta > 0 ? `+${log.quantityDelta}` : log.quantityDelta}
                      </span>
                      <p className="text-[10px] text-stone-500">
                        {log.previousStock} → {log.newStock} pzas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ORDERS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111] p-4 rounded-2xl border border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">Filtrar estado:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-[#181818] border border-stone-700 rounded-xl py-1.5 px-3 text-xs text-stone-200 outline-none"
                >
                  <option value="todos">Todos los pedidos ({orders.length})</option>
                  <option value="pendiente_confirmacion">Pendientes de confirmación</option>
                  <option value="confirmado">Confirmados</option>
                  <option value="preparando">En preparación</option>
                  <option value="listo_entrega">Listos para entrega / recogida</option>
                  <option value="entregado">Entregados</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>

              <button
                onClick={() => handleExportCsv('orders')}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs font-semibold text-stone-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Pedidos a CSV</span>
              </button>
            </div>

            {/* Orders Table */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-[#1a1a1a] text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Pedido / Fecha</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Artículos</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Entrega</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Gestionar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-500">
                          No hay pedidos con este estado.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const cleanPhone = ord.customerPhone.replace(/\D/g, '');

                        return (
                          <tr key={ord.id} className="hover:bg-stone-900/50 transition">
                            <td className="py-3 px-4">
                              <p className="font-bold text-[#F5D58A]">{ord.id}</p>
                              <p className="text-[10px] text-stone-400">
                                {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-semibold text-stone-200">{ord.customerName}</p>
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>{ord.customerPhone}</span>
                              </a>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-medium text-stone-300">{ord.items.length} artículos</p>
                              <p className="text-[10px] text-stone-500 truncate max-w-xs">
                                {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                              </p>
                            </td>

                            <td className="py-3 px-4 font-bold text-white">
                              ${ord.total.toFixed(2)} MXN
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[11px] text-stone-300 block font-medium">
                                {ord.deliveryMethod === 'recogida_tienda' ? '🏬 En Tienda' : '🚚 A Domicilio'}
                              </span>
                              {ord.deliveryAddress && (
                                <span className="text-[10px] text-stone-400 truncate block max-w-[140px]">
                                  {ord.deliveryAddress}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className={`text-[11px] font-semibold py-1 px-2 rounded-lg border outline-none cursor-pointer ${
                                  ord.status === 'pendiente_confirmacion'
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                                    : ord.status === 'confirmado'
                                    ? 'bg-blue-950/80 text-blue-300 border-blue-600/50'
                                    : ord.status === 'preparando'
                                    ? 'bg-purple-950/80 text-purple-300 border-purple-600/50'
                                    : ord.status === 'listo_entrega'
                                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50'
                                    : ord.status === 'entregado'
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                                    : 'bg-red-950/80 text-red-300 border-red-600/50'
                                }`}
                              >
                                <option value="pendiente_confirmacion">⏳ Pendiente</option>
                                <option value="confirmado">✓ Confirmado</option>
                                <option value="preparando">📦 Preparando</option>
                                <option value="listo_entrega">🚚 Listo entrega</option>
                                <option value="entregado">🎉 Entregado</option>
                                <option value="cancelado">✕ Cancelado</option>
                              </select>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-[#D6A34A] hover:text-black text-stone-200 text-xs font-medium transition cursor-pointer"
                              >
                                Ver Detalles
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: RESTOCK REQUESTS (AGOTADOS) */}
        {/* ======================================================== */}
        {activeTab === 'restock' && (
          <div className="space-y-6">
            <div className="bg-[#111] p-5 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-serif-luxury text-[#F5D58A] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#D6A34A]" />
                  Solicitudes de Productos Agotados ("Avísame cuando esté disponible")
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Clientes interesados que otorgaron consentimiento explícito para recibir aviso por WhatsApp en cuanto reabastezcas el producto.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  settings.whatsappCloudApi.configured
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}>
                  WhatsApp Cloud API: {settings.whatsappCloudApi.configured ? 'Configurada' : 'Pendiente (Usa enlaces directos)'}
                </span>

                <button
                  onClick={() => handleExportCsv('restock')}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs font-semibold text-stone-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Restock Requests Table */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-[#1a1a1a] text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Producto Solicitado</th>
                      <th className="py-3 px-4">Stock Actual</th>
                      <th className="py-3 px-4">Cliente / WhatsApp</th>
                      <th className="py-3 px-4">Fecha de Solicitud</th>
                      <th className="py-3 px-4">Estado Notificación</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {restockRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-500">
                          No hay solicitudes registradas aún.
                        </td>
                      </tr>
                    ) : (
                      restockRequests.map((reqItem) => {
                        const product = products.find((p) => p.id === reqItem.productId);
                        const hasStockNow = product && product.stock > 0;
                        const cleanPhone = reqItem.customerPhone.replace(/\D/g, '');

                        return (
                          <tr key={reqItem.id} className="hover:bg-stone-900/50 transition">
                            <td className="py-3 px-4">
                              <p className="font-bold text-stone-100 font-serif-luxury">{reqItem.productName}</p>
                              <p className="text-[10px] text-stone-400">{product?.brand || 'Boutique'}</p>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`font-bold ${hasStockNow ? 'text-emerald-400' : 'text-red-400'}`}>
                                {product ? `${product.stock} piezas` : 'Agotado'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-medium text-stone-200">{reqItem.customerName}</p>
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>{reqItem.customerPhone}</span>
                              </a>
                            </td>

                            <td className="py-3 px-4 text-stone-400">
                              {new Date(reqItem.requestedAt).toLocaleDateString()} {new Date(reqItem.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            <td className="py-3 px-4">
                              {reqItem.notified ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  ✓ Notificado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                  ⏳ Pendiente
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleNotifyWaitlist(undefined, reqItem.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer ${
                                  hasStockNow
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                                }`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{reqItem.notified ? 'Reenviar WhatsApp' : 'Notificar WhatsApp'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SETTINGS & WHATSAPP CONFIGURATION */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Seasonal HeroBanner Shortcut Card */}
            <div className="rounded-2xl bg-gradient-to-r from-[#18140e] via-[#1f1911] to-[#120f0b] border border-[#D6A34A]/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-[#D6A34A]/20 border border-[#D6A34A]/40 text-[#F5D58A] shrink-0">
                  <Wand2 className="w-5 h-5 text-[#D6A34A]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-serif-luxury text-stone-100 flex items-center gap-2">
                    <span>Fondo Estacional del HeroBanner con IA</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6A34A]/20 text-[#F5D58A] border border-[#D6A34A]/30 font-sans">
                      {settings.heroBackgroundImage ? 'Fondo Activo' : 'Gradiente Estándar'}
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Genera fondos con inteligencia artificial para Primavera, Verano, Otoño, Navidad o San Valentín.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('heroBanner')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Abrir Generador de Fondos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Store Information Form */}
            <form onSubmit={handleSaveSettings} className="bg-[#121212] border border-stone-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold font-serif-luxury text-[#F5D58A] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D6A34A]" />
                Datos Generales de la Boutique
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Nombre Comercial:</label>
                  <input
                    type="text"
                    value={tempSettings.storeName}
                    onChange={(e) => setTempSettings({ ...tempSettings, storeName: e.target.value })}
                    className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Eslogan:</label>
                  <input
                    type="text"
                    value={tempSettings.slogan}
                    onChange={(e) => setTempSettings({ ...tempSettings, slogan: e.target.value })}
                    className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">
                    Número de WhatsApp Comercial de Alba (sin signos, con código de país):
                  </label>
                  <input
                    type="text"
                    value={tempSettings.whatsappPhone}
                    onChange={(e) => setTempSettings({ ...tempSettings, whatsappPhone: e.target.value })}
                    placeholder="Ej. 525512345678"
                    className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    A este número se dirigirán todos los pedidos del catálogo y las consultas de los clientes.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Dirección física boutique:</label>
                  <input
                    type="text"
                    value={tempSettings.contactInfo.address}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        contactInfo: { ...tempSettings.contactInfo, address: e.target.value },
                      })
                    }
                    className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Horarios de atención:</label>
                  <input
                    type="text"
                    value={tempSettings.contactInfo.schedule}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        contactInfo: { ...tempSettings.contactInfo, schedule: e.target.value },
                      })
                    }
                    className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Costo Entrega Local (MXN):</label>
                    <input
                      type="number"
                      value={tempSettings.deliveryMethods.localDeliveryCost}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          deliveryMethods: {
                            ...tempSettings.deliveryMethods,
                            localDeliveryCost: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Mínimo para Envío Gratis:</label>
                    <input
                      type="number"
                      value={tempSettings.deliveryMethods.minOrderForFreeDelivery}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          deliveryMethods: {
                            ...tempSettings.deliveryMethods,
                            minOrderForFreeDelivery: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">
                    Umbral de alerta de existencias bajas (piezas):
                  </label>
                  <input
                    type="number"
                    value={tempSettings.lowStockThreshold}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        lowStockThreshold: parseInt(e.target.value, 10) || 3,
                      })
                    }
                    className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#D6A34A] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition cursor-pointer shadow-md"
              >
                Guardar Cambios de Tienda
              </button>
            </form>

            {/* Right Column: WhatsApp Business Cloud API & Security */}
            <div className="space-y-6">
              {/* WhatsApp Cloud API Box */}
              <div className="bg-[#121212] border border-stone-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-base font-bold font-serif-luxury text-[#F5D58A] flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  Integración WhatsApp Business Cloud API
                </h2>

                <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 text-xs text-stone-300 space-y-1.5">
                  <p className="font-semibold text-[#F5D58A]">
                    Estado: {tempSettings.whatsappCloudApi.configured ? '✅ Activa' : '⏳ Pendiente de Credenciales'}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Si dejas estos campos vacíos, la tienda utilizará el despacho automático con enlace directo de WhatsApp. Cuando tengas tu cuenta de desarrollador en Meta for Developers, ingresa tus tokens para envío por servidor.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Phone Number ID:</label>
                    <input
                      type="text"
                      placeholder="Ej. 109876543210987"
                      value={tempSettings.whatsappCloudApi.phoneNumberId || ''}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          whatsappCloudApi: {
                            ...tempSettings.whatsappCloudApi,
                            phoneNumberId: e.target.value,
                            configured: Boolean(e.target.value && tempSettings.whatsappCloudApi.accessToken),
                          },
                        })
                      }
                      className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Permanent Access Token (Bearer):</label>
                    <input
                      type="password"
                      placeholder="EAAG..."
                      value={tempSettings.whatsappCloudApi.accessToken || ''}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          whatsappCloudApi: {
                            ...tempSettings.whatsappCloudApi,
                            accessToken: e.target.value,
                            configured: Boolean(e.target.value && tempSettings.whatsappCloudApi.phoneNumberId),
                          },
                        })
                      }
                      className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Change Password Box */}
              <form onSubmit={handleChangePassword} className="bg-[#121212] border border-stone-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-base font-bold font-serif-luxury text-[#F5D58A] flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#D6A34A]" />
                  Seguridad y Cambio de Contraseña de Alba
                </h2>

                {passwordFeedback && (
                  <p className="text-xs p-3 rounded-xl bg-stone-900 border border-stone-800 text-[#F5D58A]">
                    {passwordFeedback}
                  </p>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Contraseña Actual:</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Nueva Contraseña:</label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#181818] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Actualizar Contraseña
                </button>
              </form>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: EDIT / CREATE PRODUCT WITH IMAGE STUDIO */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-[#141414] border border-[#D6A34A]/50 shadow-2xl p-5 sm:p-7 text-stone-100 my-6 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setEditingProduct(null);
                setImageUploadError(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer z-10"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6 border-b border-stone-800/80 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#D6A34A]/20 border border-[#D6A34A]/40 flex items-center justify-center text-[#F5D58A] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-serif-luxury text-[#F5D58A]">
                  {editingProduct.id ? 'Editar Producto e Inventario' : 'Dar de Alta Nuevo Producto en Catálogo'}
                </h3>
                <p className="text-xs text-stone-400">
                  {editingProduct.id
                    ? `Actualiza existencias, precios, detalles y fotografía oficial para ${editingProduct.name || 'este producto'}`
                    : 'Registra una nueva fragancia o cosmético en el sistema con su imagen para identificación'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ---------------------------------------------------- */}
                {/* LEFT COLUMN: IMAGE IDENTIFICATION STUDIO (5 COLS) */}
                {/* ---------------------------------------------------- */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#D6A34A]" />
                      <span>Imagen de Identificación</span>
                    </label>
                    <span className="text-[10px] text-stone-400">Foto oficial</span>
                  </div>

                  {/* High Quality Live Preview Box */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-[#D6A34A]/40 shadow-xl group">
                    <img
                      src={editingProduct.images?.[0] || '/logo.png'}
                      alt={editingProduct.name || 'Vista previa'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />

                    {/* Gradient Overlay & Badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-[#D6A34A]/40 text-[10px] font-bold text-[#F5D58A]">
                      {editingProduct.brand || 'D\'Santos'}
                    </div>

                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-stone-700 text-[10px] text-stone-200">
                      Stock: <strong className="text-white">{editingProduct.stock ?? 0} pzas</strong>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left">
                      <p className="text-xs font-bold text-white font-serif-luxury truncate drop-shadow">
                        {editingProduct.name || 'Nombre del producto'}
                      </p>
                      <p className="text-[10px] text-stone-300 drop-shadow">
                        ${Number(editingProduct.price || 0).toFixed(2)} MXN • {editingProduct.presentation || '100 ml'}
                      </p>
                    </div>

                    {/* Reset to brand logo button */}
                    {editingProduct.images?.[0] && editingProduct.images[0] !== '/logo.png' && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, images: ['/logo.png'] })}
                        className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 border border-stone-700 hover:border-red-400 text-stone-400 hover:text-red-400 text-[10px] transition cursor-pointer"
                        title="Restablecer a logotipo oficial"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Image Selector Tabs */}
                  <div className="bg-[#181818] rounded-2xl p-1 border border-stone-800 flex text-center">
                    <button
                      type="button"
                      onClick={() => setActiveImageTab('upload')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeImageTab === 'upload'
                          ? 'bg-[#D6A34A] text-black shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir / Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageTab('gallery')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeImageTab === 'gallery'
                          ? 'bg-[#D6A34A] text-black shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Galería</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageTab('url')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeImageTab === 'url'
                          ? 'bg-[#D6A34A] text-black shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>URL</span>
                    </button>
                  </div>

                  {/* Tab 1: Upload from Device / Camera */}
                  {activeImageTab === 'upload' && (
                    <div className="space-y-2">
                      <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-700 hover:border-[#D6A34A] rounded-2xl bg-[#181818]/70 hover:bg-[#1a1712] transition cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={isUploadingImage}
                          className="sr-only"
                        />
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center py-2 text-[#F5D58A]">
                            <RefreshCw className="w-6 h-6 animate-spin mb-1.5" />
                            <span className="text-xs font-semibold">Comprimiendo y guardando imagen...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center py-1">
                            <Camera className="w-7 h-7 text-[#D6A34A] mb-1.5 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-stone-200">
                              Seleccionar foto o tomar con cámara
                            </span>
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              Compatible con JPG, PNG, WebP desde tu celular o PC
                            </span>
                          </div>
                        )}
                      </label>

                      {imageUploadError && (
                        <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/50 p-2 rounded-xl">
                          {imageUploadError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Curated Boutique Preset Gallery */}
                  {activeImageTab === 'gallery' && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-stone-400">
                        Haz clic en cualquiera de las imágenes oficiales para asignarla al producto:
                      </p>
                      <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 bg-black/40 rounded-xl border border-stone-800">
                        {PRESET_PRODUCT_IMAGES.map((preset, idx) => {
                          const isSelected = editingProduct.images?.[0] === preset.url;
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  images: [preset.url],
                                })
                              }
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer group ${
                                isSelected
                                  ? 'border-[#D6A34A] ring-2 ring-[#D6A34A]/40'
                                  : 'border-stone-800 hover:border-stone-600'
                              }`}
                              title={preset.label}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#D6A34A]/30 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-black bg-[#D6A34A] rounded-full p-0.5" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Custom Web URL */}
                  {activeImageTab === 'url' && (
                    <div className="space-y-1.5">
                      <label className="block text-stone-400 text-[11px]">Enlace web de la fotografía:</label>
                      <input
                        type="text"
                        value={editingProduct.images?.[0] || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                        placeholder="https://images.unsplash.com/... o /logo.png"
                        className="w-full bg-[#1c1c1c] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* ---------------------------------------------------- */}
                {/* RIGHT COLUMN: PRODUCT & INVENTORY DETAILS (7 COLS) */}
                {/* ---------------------------------------------------- */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-stone-300 font-medium mb-1">
                        Nombre Comercial del Producto: <span className="text-[#D6A34A]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Fraiche Inspiración La Vie Est Belle, Sauvage, Good Girl..."
                        value={editingProduct.name || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full bg-[#1c1c1c] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 px-3 text-stone-100 outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-300 font-medium mb-1">
                        Marca / Casa Perfumera: <span className="text-[#D6A34A]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.brand || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        placeholder="Ej. Fraiche, Dior, Chanel..."
                        className="w-full bg-[#1c1c1c] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none text-xs mb-1.5"
                      />
                      {/* Popular Brand Quick Pills */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {POPULAR_BRANDS.slice(0, 5).map((b) => (
                          <button
                            type="button"
                            key={b}
                            onClick={() => setEditingProduct({ ...editingProduct, brand: b })}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                              editingProduct.brand === b
                                ? 'bg-[#D6A34A] text-black font-bold'
                                : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-medium mb-1">
                        Categoría: <span className="text-[#D6A34A]">*</span>
                      </label>
                      <select
                        value={editingProduct.category || categories[0]}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full bg-[#1c1c1c] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none text-xs cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Stock, Price and Commercial Status */}
                  <div className="p-3.5 rounded-2xl bg-[#191919] border border-stone-800/80 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5D58A] block">
                      Inventario y Condiciones Comerciales
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-300 font-medium mb-1">
                          Precio de Venta (MXN): <span className="text-[#D6A34A]">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={editingProduct.price ?? ''}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-[#121212] border border-stone-700 focus:border-[#D6A34A] rounded-xl py-2 pl-7 pr-3 text-[#F5D58A] font-bold outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-stone-300 font-medium mb-1">
                          Existencia en Tienda: <span className="text-[#D6A34A]">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={editingProduct.stock ?? ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setEditingProduct({
                              ...editingProduct,
                              stock: val,
                              status: val === 0 ? 'agotado' : (editingProduct.status === 'agotado' ? 'disponible' : editingProduct.status),
                            });
                          }}
                          className="w-full bg-[#121212] border border-stone-700 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 font-bold outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-300 font-medium mb-1">Estado de Venta:</label>
                        <select
                          value={editingProduct.status || 'disponible'}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              status: e.target.value as any,
                            })
                          }
                          className="w-full bg-[#121212] border border-stone-700 rounded-xl py-2 px-2 text-stone-200 outline-none text-xs cursor-pointer"
                        >
                          <option value="disponible">🟢 Disponible</option>
                          <option value="ultimas_piezas">🟡 Pocas piezas</option>
                          <option value="agotado">🔴 Agotado</option>
                          <option value="inactivo">⚪ Inactivo (Ocultar)</option>
                        </select>
                      </div>
                    </div>

                    {/* Featured & Tags Switches */}
                    <div className="flex items-center gap-4 flex-wrap pt-1 border-t border-stone-800">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editingProduct.tags?.includes('destacado') || false}
                          onChange={(e) => {
                            const currentTags = editingProduct.tags || [];
                            if (e.target.checked) {
                              setEditingProduct({ ...editingProduct, tags: [...currentTags.filter((t) => t !== 'destacado'), 'destacado'] });
                            } else {
                              setEditingProduct({ ...editingProduct, tags: currentTags.filter((t) => t !== 'destacado') });
                            }
                          }}
                          className="accent-[#D6A34A] w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-stone-300 font-medium text-[11px] flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-[#D6A34A]" />
                          Destacar en portada
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editingProduct.tags?.includes('nuevo') || false}
                          onChange={(e) => {
                            const currentTags = editingProduct.tags || [];
                            if (e.target.checked) {
                              setEditingProduct({ ...editingProduct, tags: [...currentTags.filter((t) => t !== 'nuevo'), 'nuevo'] });
                            } else {
                              setEditingProduct({ ...editingProduct, tags: currentTags.filter((t) => t !== 'nuevo') });
                            }
                          }}
                          className="accent-[#D6A34A] w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-stone-300 font-medium text-[11px]">
                          🏷️ Marcar como Nuevo
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editingProduct.tags?.includes('mas_vendido') || false}
                          onChange={(e) => {
                            const currentTags = editingProduct.tags || [];
                            if (e.target.checked) {
                              setEditingProduct({ ...editingProduct, tags: [...currentTags.filter((t) => t !== 'mas_vendido'), 'mas_vendido'] });
                            } else {
                              setEditingProduct({ ...editingProduct, tags: currentTags.filter((t) => t !== 'mas_vendido') });
                            }
                          }}
                          className="accent-[#D6A34A] w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-stone-300 font-medium text-[11px]">
                          🔥 Más vendido / Tendencia
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Presentation & SKU */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-stone-300 font-medium mb-1">Presentación / Tamaño:</label>
                      <input
                        type="text"
                        value={editingProduct.presentation || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, presentation: e.target.value })}
                        placeholder="Ej. 100 ml - Concentrado Fraiche"
                        className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-300 font-medium mb-1">Código SKU / Referencia:</label>
                      <input
                        type="text"
                        value={editingProduct.sku || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                        placeholder="Ej. FRA-LVEB-100"
                        className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Olfactory Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-stone-300 font-medium mb-1">Familia Olfativa:</label>
                      <input
                        type="text"
                        value={editingProduct.olfactoryFamily || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, olfactoryFamily: e.target.value })}
                        placeholder="Ej. Floral Frutal Gourmand, Amaderado Oriental..."
                        className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-300 font-medium mb-1">Notas Aromáticas / Ingredientes:</label>
                      <input
                        type="text"
                        value={editingProduct.notes || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, notes: e.target.value })}
                        placeholder="Ej. Bergamota, Jazmín, Vainilla, Ámbar..."
                        className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Descripción Comercial para el Catálogo:</label>
                    <textarea
                      rows={2}
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Breve reseña sobre la fijación, estela, ocasión de uso o beneficios del producto..."
                      className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none resize-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] text-stone-400">
                  <span className="text-[#D6A34A]">*</span> Campos obligatorios para publicación inmediata.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setImageUploadError(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#D6A34A] hover:bg-[#BA8032] text-black font-bold uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Producto e Inventario</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FULL RESOLUTION IMAGE IDENTIFICATION VIEWER */}
      {/* ======================================================== */}
      {previewingProductImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#141414] border border-[#D6A34A]/50 shadow-2xl p-5 text-stone-100 my-8 space-y-4">
            <button
              onClick={() => setPreviewingProductImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#D6A34A]" />
              <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A]">
                Identificación Visual de Producto
              </h3>
            </div>

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-stone-800">
              <img
                src={previewingProductImage.images[0] || '/logo.png'}
                alt={previewingProductImage.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#D6A34A] font-bold uppercase">{previewingProductImage.brand}</span>
                <span className="text-xs font-mono text-stone-400">{previewingProductImage.sku || 'Sin SKU'}</span>
              </div>
              <h4 className="text-base font-bold font-serif-luxury text-stone-100">{previewingProductImage.name}</h4>
              <p className="text-xs text-stone-400">{previewingProductImage.presentation} • {previewingProductImage.category}</p>
              <div className="flex items-center justify-between pt-2 border-t border-stone-800 mt-2">
                <span className="text-lg font-bold text-[#F5D58A]">${previewingProductImage.price.toFixed(2)} MXN</span>
                <span className="text-xs text-stone-300">
                  Existencia: <strong className="text-white">{previewingProductImage.stock} piezas</strong>
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewingProductImage(null)}
                className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewingProductImage;
                  setPreviewingProductImage(null);
                  setActiveImageTab('upload');
                  setImageUploadError(null);
                  setEditingProduct(target);
                }}
                className="px-5 py-2 rounded-xl bg-[#D6A34A] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar este Producto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ATOMIC STOCK ADJUSTMENT */}
      {/* ======================================================== */}
      {adjustingStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-[#141414] border border-[#D6A34A]/50 shadow-2xl p-6 text-stone-100 my-8">
            <button
              onClick={() => setAdjustingStockProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A] mb-1">
              Ajustar Inventario con Motivo
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Producto: <strong className="text-stone-200">{adjustingStockProduct.name}</strong> (Existencia actual: {adjustingStockProduct.stock} pzas)
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">
                  Cantidad a sumar (+) o restar (-):
                </label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none text-base font-bold"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Nueva existencia resultante: <strong className="text-[#F5D58A]">{Math.max(0, adjustingStockProduct.stock + stockDelta)} piezas</strong>
                </p>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Motivo del ajuste / movimiento: *</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl py-2 px-3 text-stone-100 outline-none mb-2"
                >
                  <option value="Entrada de mercancía de proveedor">Entrada de mercancía de proveedor Fraiche</option>
                  <option value="Ajuste periódico de inventario físico">Ajuste periódico de inventario físico</option>
                  <option value="Venta directa mostrador fuera de línea">Venta directa en mostrador físico</option>
                  <option value="Merma, daño de frasco o muestra">Merma o muestra para demostración</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustingStockProduct(null)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D6A34A] text-black font-bold uppercase tracking-wider hover:brightness-110"
                >
                  Aplicar Ajuste Atómico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ORDER DETAILS */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#141414] border border-[#D6A34A]/50 shadow-2xl p-6 text-stone-100 my-8 space-y-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D98DA5]">
                Expediente de Pedido
              </span>
              <h3 className="text-xl font-bold font-serif-luxury text-[#F5D58A]">
                Pedido {selectedOrder.id}
              </h3>
              <p className="text-xs text-stone-400">
                Recibido: {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-stone-800 text-xs space-y-2">
              <p><strong>Cliente:</strong> {selectedOrder.customerName}</p>
              <p>
                <strong>Teléfono:</strong>{' '}
                <a
                  href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  {selectedOrder.customerPhone} (Abrir en WhatsApp)
                </a>
              </p>
              <p><strong>Método de entrega:</strong> {selectedOrder.deliveryMethod === 'recogida_tienda' ? 'Recogida en boutique' : 'Entrega local a domicilio'}</p>
              {selectedOrder.deliveryAddress && <p><strong>Dirección:</strong> {selectedOrder.deliveryAddress}</p>}
              {selectedOrder.notes && <p><strong>Notas del cliente:</strong> {selectedOrder.notes}</p>}
            </div>

            {/* Items */}
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-stone-400 uppercase text-[10px]">Artículos Solicitados:</p>
              <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-stone-800 divide-y divide-stone-800">
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span>{i.quantity}x {i.productName} ({i.presentation})</span>
                    <span className="font-bold text-white">${i.subtotal.toFixed(2)} MXN</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-bold text-sm text-[#F5D58A]">
                  <span>Total Pedido:</span>
                  <span>${selectedOrder.total.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-stone-400 uppercase text-[10px]">Historial de Estado:</p>
              <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-stone-800 max-h-32 overflow-y-auto space-y-1 text-[11px]">
                {selectedOrder.statusHistory?.map((h, idx) => (
                  <p key={idx} className="text-stone-300">
                    • <strong className="text-stone-100">{h.status}</strong> ({new Date(h.timestamp).toLocaleTimeString()}): {h.note}
                  </p>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-stone-800 text-stone-200 text-xs font-semibold"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CSV IMPORT */}
      {/* ======================================================== */}
      {showCsvImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#141414] border border-[#D6A34A]/50 shadow-2xl p-6 text-stone-100 my-8 space-y-4">
            <button
              onClick={() => setShowCsvImport(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A]">
              Importar Catálogo Masivo desde CSV
            </h3>

            <p className="text-xs text-stone-400">
              Pega aquí el contenido en formato CSV con el orden de columnas:
              <br />
              <code className="text-[#F5D58A]">Nombre,Marca,Categoria,Precio,Stock,Presentacion,SKU</code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Nombre,Marca,Categoria,Precio,Stock,Presentacion,SKU&#10;Fraiche Invictus,Fraiche,Perfumería Fraiche,320,15,100 ml,FRA-INV-100&#10;Fraiche 212 VIP,Fraiche,Perfumería Fraiche,320,8,100 ml,FRA-212-100"
              className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl p-3 text-xs text-stone-100 font-mono outline-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCsvImport(false)}
                className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportCsv}
                className="px-5 py-2 rounded-xl bg-[#D6A34A] text-black font-bold text-xs uppercase tracking-wider"
              >
                Cargar Productos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 shadow-2xl border backdrop-blur-md transition-all flex items-start gap-3 bg-[#161616]/95 border-[#D6A34A]/50 text-stone-100">
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 text-[#F5D58A]" />}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-medium text-stone-200">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* In-app Confirmation Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-[#141414] border border-[#D6A34A]/50 shadow-2xl p-6 text-stone-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A]">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs hover:text-white transition cursor-pointer"
              >
                {confirmDialog.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm()}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                {confirmDialog.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
