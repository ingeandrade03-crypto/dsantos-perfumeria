export type ProductStatus = 'disponible' | 'ultimas_piezas' | 'agotado' | 'inactivo';

export type ProductTag = 'nuevo' | 'destacado' | 'mas_vendido' | 'promocion';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  description: string;
  images: string[];
  price: number; // in MXN (Precio regular de venta)
  salePrice?: number; // Precio de oferta / promocional (MXN)
  costPrice?: number; // Precio de costo de compra al proveedor (MXN)
  wholesalePrice?: number; // Precio de mayoreo / distribuidor (MXN)
  stock: number;
  status: ProductStatus;
  presentation: string; // e.g. "100 ml", "60 ml concentrado Fraiche", "Set 3 piezas"
  sku?: string;
  tags?: ProductTag[];
  olfactoryFamily?: string; // e.g. "Floral Frutal", "Amaderado Especiado", "Oriental Vainilla"
  notes?: string; // Top/Heart/Base notes e.g. "Bergamota, Jazmín, Vainilla y Ámbar"
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPresentation?: string;
}

export type OrderStatus =
  | 'pendiente_confirmacion'
  | 'confirmado'
  | 'preparando'
  | 'listo_entrega'
  | 'entregado'
  | 'cancelado';

export type DeliveryMethod = 'recogida_tienda' | 'entrega_local';

export type PaymentStatus = 'pendiente' | 'pagado_efectivo' | 'transferencia' | 'acordado';

export interface OrderItem {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  presentation?: string;
  subtotal: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  internalNotes?: string;
  statusHistory: OrderStatusHistoryItem[];
}

export interface RestockRequest {
  id: string;
  productId: string;
  productName: string;
  customerName?: string;
  customerPhone: string;
  requestedAt: string;
  consent: boolean;
  notified: boolean;
  notifiedAt?: string;
  notificationStatus?: 'pendiente' | 'enviado' | 'fallido';
  errorDetails?: string;
}

export type InventoryMovementType =
  | 'entrada_proveedor'
  | 'ajuste_inventario'
  | 'merma'
  | 'devolucion'
  | 'venta_mostrador'
  | 'pedido_confirmado'
  | 'pedido_cancelado';

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  timestamp: string;
  reason: string;
  user: string;
}

export type AnalyticsEventType =
  | 'search'
  | 'view_product'
  | 'add_to_cart'
  | 'out_of_stock_click'
  | 'order_intent';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  productId?: string;
  productName?: string;
  query?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SeasonalHeroBanner {
  id: string;
  seasonName: string;
  seasonKey: 'primavera' | 'verano' | 'otono' | 'invierno' | 'san_valentin' | 'navidad' | 'personalizado';
  imageUrl: string;
  descriptionPrompt: string;
  badgeText?: string;
  headlineHighlight?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  subtitle: string;
  logoUrl: string;
  whatsappPhone: string; // e.g. "5215512345678"
  whatsappDisplayPhone: string; // formatted e.g. "+52 55 1234 5678"
  currency: string; // "MXN"
  contactInfo: {
    address: string;
    email: string;
    schedule: string;
  };
  deliveryMethods: {
    storePickup: boolean;
    localDelivery: boolean;
    localDeliveryCost: number;
    minOrderForFreeDelivery: number;
    deliveryZones: string;
  };
  returnPolicy: string;
  lowStockThreshold: number;
  whatsappCloudApi: {
    configured: boolean;
    phoneNumberId?: string;
    accessToken?: string;
    wabaId?: string;
    templateName?: string;
  };
  heroBackgroundImage?: string;
  heroSeasonTitle?: string;
  heroSeasonBadge?: string;
  heroOverlayOpacity?: number;
  savedHeroBanners?: SeasonalHeroBanner[];
}

export interface AdminAuthSession {
  token: string;
  username: string;
  name: string;
  role: 'admin';
  expiresAt: string;
}
