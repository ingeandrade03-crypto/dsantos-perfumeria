import { Product, Order, RestockRequest, StoreSettings, InventoryLog, AnalyticsEventType } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_CATEGORIES } from '../data/seedData';

const BASE_URL = '/api';

// Helper for local storage offline cache
const CACHE_KEYS = {
  PRODUCTS: 'dsantos_cached_products',
  SETTINGS: 'dsantos_cached_settings',
  CATEGORIES: 'dsantos_cached_categories',
  ADMIN_TOKEN: 'dsantos_admin_token',
};

// Safe JSON fetch wrapper that guards against HTML (e.g. 502/404/Vite SPA fallback)
async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error('Sesión no autorizada o expirada.');
    }
    throw new Error(`Respuesta no válida del servidor (HTTP ${res.status}).`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Error en la solicitud (HTTP ${res.status})`);
  }
  return data;
}

export const api = {
  // Public Products
  async getProducts(params?: { category?: string; q?: string; availability?: string }): Promise<{ products: Product[]; total: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.category && params.category !== 'Todas') searchParams.append('category', params.category);
      if (params?.q) searchParams.append('q', params.q);
      if (params?.availability && params.availability !== 'todos') searchParams.append('availability', params.availability);

      const res = await fetch(`${BASE_URL}/products?${searchParams.toString()}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        // Update local cache
        try {
          localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(data.products));
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('Network offline or error fetching products, using offline cache:', err);
    }

    // Offline fallback from localStorage or initial seed
    const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
    let list: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;

    if (params?.category && params.category !== 'Todas') {
      list = list.filter(p => p.category === params.category);
    }
    if (params?.q) {
      const q = params.q.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.olfactoryFamily && p.olfactoryFamily.toLowerCase().includes(q))
      );
    }
    if (params?.availability === 'disponible') {
      list = list.filter(p => p.stock > 0 && p.status !== 'agotado');
    } else if (params?.availability === 'agotado') {
      list = list.filter(p => p.stock === 0 || p.status === 'agotado');
    }

    return { products: list, total: list.length };
  },

  // Get Single Product
  async getProduct(id: string): Promise<{ product: Product; related: Product[] }> {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Offline fetch single product fallback');
    }

    const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
    const list: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
    const product = list.find(p => p.id === id) || list[0];
    const related = list.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
    return { product, related };
  },

  // Public: Create Order (Validates live server stock & gives WhatsApp URL)
  async createOrder(orderData: {
    customerName: string;
    customerPhone: string;
    deliveryMethod: 'recogida_tienda' | 'entrega_local';
    deliveryAddress?: string;
    notes?: string;
    items: { productId: string; productName: string; quantity: number; presentation?: string }[];
  }): Promise<{ success: boolean; order: Order; whatsappUrl: string; whatsappMessage: string }> {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al procesar el pedido con el servidor.');
    }
    return data;
  },

  // Public: Restock Alert Request ("Avísame cuando esté disponible")
  async createRestockRequest(requestData: {
    productId: string;
    customerName?: string;
    customerPhone: string;
    consent: boolean;
  }): Promise<{ success: boolean; message: string; request: RestockRequest }> {
    const res = await fetch(`${BASE_URL}/restock-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al registrar la solicitud de reposición.');
    }
    return data;
  },

  // Analytics Event
  async trackEvent(eventType: AnalyticsEventType, details?: { productId?: string; productName?: string; query?: string; metadata?: any }) {
    try {
      fetch(`${BASE_URL}/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, ...details }),
      }).catch(() => {});
    } catch {}
  },

  // Public: Get Store Settings
  async getSettings(): Promise<{ settings: StoreSettings; categories: string[] }> {
    try {
      const res = await fetch(`${BASE_URL}/settings`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(data.settings));
        localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(data.categories));
        return data;
      }
    } catch {}

    const cachedS = localStorage.getItem(CACHE_KEYS.SETTINGS);
    const cachedC = localStorage.getItem(CACHE_KEYS.CATEGORIES);
    return {
      settings: cachedS ? JSON.parse(cachedS) : INITIAL_SETTINGS,
      categories: cachedC ? JSON.parse(cachedC) : INITIAL_CATEGORIES,
    };
  },

  // -----------------------------------------------------------------
  // ADMIN API CALLS
  // -----------------------------------------------------------------
  getAdminToken(): string | null {
    return localStorage.getItem(CACHE_KEYS.ADMIN_TOKEN);
  },

  setAdminToken(token: string | null) {
    if (token) localStorage.setItem(CACHE_KEYS.ADMIN_TOKEN, token);
    else localStorage.removeItem(CACHE_KEYS.ADMIN_TOKEN);
  },

  async adminLogin(username: string, password: string) {
    const data = await fetchJson<{ success: boolean; token: string; username: string; name: string }>(
      `${BASE_URL}/admin/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }
    );
    this.setAdminToken(data.token);
    return data;
  },

  async adminVerify() {
    const token = this.getAdminToken();
    if (!token) return { valid: false };
    try {
      return await fetchJson<{ valid: boolean; username?: string }>(`${BASE_URL}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return { valid: false };
    }
  },

  async adminCreateProduct(productData: Partial<Product>) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
  },

  async adminUpdateProduct(id: string, productData: Partial<Product>) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
  },

  async adminDeleteProduct(id: string, hard = false) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/products/${id}?hard=${hard}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async adminAdjustStock(productId: string, delta: number, reason: string, movementType?: string) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, delta, reason, movementType }),
    });
  },

  async adminClearInventory(): Promise<{ success: boolean; message: string }> {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/admin/clear-inventory`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async adminUploadImage(image: string, fileName?: string): Promise<{ success: boolean; url: string }> {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/admin/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image, fileName }),
    });
  },

  async adminGetInventoryLogs(): Promise<{ logs: InventoryLog[] }> {
    const token = this.getAdminToken();
    if (!token) return { logs: [] };
    try {
      return await fetchJson<{ logs: InventoryLog[] }>(`${BASE_URL}/inventory/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Error al consultar registros de inventario:', err);
      return { logs: [] };
    }
  },

  async adminGetOrders(status?: string, q?: string): Promise<{ orders: Order[]; total: number }> {
    const token = this.getAdminToken();
    if (!token) return { orders: [], total: 0 };
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (q) params.append('q', q);

    try {
      return await fetchJson<{ orders: Order[]; total: number }>(`${BASE_URL}/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Error al consultar pedidos:', err);
      return { orders: [], total: 0 };
    }
  },

  async adminUpdateOrderStatus(
    orderId: string,
    status: Order['status'],
    paymentStatus?: Order['paymentStatus'],
    internalNotes?: string,
    statusNote?: string
  ) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, paymentStatus, internalNotes, statusNote }),
    });
  },

  async adminGetRestockRequests(params?: { productId?: string; notified?: string }) {
    const token = this.getAdminToken();
    if (!token) return { requests: [], total: 0, topRequested: [] };
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.append('productId', params.productId);
    if (params?.notified) searchParams.append('notified', params.notified);

    try {
      return await fetchJson<{ requests: RestockRequest[]; total: number; topRequested: any[] }>(
        `${BASE_URL}/restock-requests?${searchParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.warn('Error al consultar solicitudes de reposición:', err);
      return { requests: [], total: 0, topRequested: [] };
    }
  },

  async adminNotifyRestock(payload: { requestId?: string; productId?: string }) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/restock-requests/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  async adminGetAnalytics(period = 'all') {
    const emptyReport = {
      period,
      totalOrders: 0,
      totalDelivered: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      totalSalesRevenue: 0,
      totalPotentialOrderValue: 0,
      topSearches: [],
      topWaitlist: [],
      recentOrders: [],
    };
    const token = this.getAdminToken();
    if (!token) return emptyReport;

    try {
      return await fetchJson(`${BASE_URL}/analytics/report?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Error al consultar métricas analíticas:', err);
      return emptyReport;
    }
  },

  async adminUpdateSettings(settings: Partial<StoreSettings>, categories?: string[]) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings, categories }),
    });
  },

  async adminImportCsv(csvText: string) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/inventory/import-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ csvText }),
    });
  },

  async adminChangePassword(currentPassword: string, newPassword: string) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async adminGenerateHeroImage(params: {
    prompt: string;
    seasonKey: string;
    seasonName: string;
    badgeText?: string;
    headlineHighlight?: string;
    applyNow?: boolean;
    saveToGallery?: boolean;
  }) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/admin/generate-hero-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
  },

  async adminSelectHeroBanner(params: {
    imageUrl: string;
    badgeText?: string;
    headlineHighlight?: string;
    opacity?: number;
  }) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/admin/select-hero-banner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
  },

  async adminDeleteHeroBanner(id: string) {
    const token = this.getAdminToken();
    return await fetchJson(`${BASE_URL}/admin/saved-hero-banners/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
