import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  Product,
  Order,
  RestockRequest,
  InventoryLog,
  AnalyticsEvent,
  StoreSettings,
  OrderStatus,
  SeasonalHeroBanner,
} from './src/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
} from './src/data/seedData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'dsantos_store.json');

// Ensure data and uploads folders exist
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Password hashing helper using Node crypto
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateToken(username: string): string {
  const secret = process.env.JWT_SECRET || 'dsantos-perfumeria-secret-key-2026';
  const payload = `${username}:${Date.now() + 1000 * 60 * 60 * 24 * 7}`; // 7 days
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function verifyToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return { valid: false };
    const [username, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) return { valid: false };

    const secret = process.env.JWT_SECRET || 'dsantos-perfumeria-secret-key-2026';
    const expectedSig = crypto.createHmac('sha256', secret).update(`${username}:${expiresStr}`).digest('hex');
    if (expectedSig === signature) {
      return { valid: true, username };
    }
  } catch {
    // token parse error
  }
  return { valid: false };
}

// Database state schema
interface DbState {
  products: Product[];
  categories: string[];
  orders: Order[];
  restockRequests: RestockRequest[];
  inventoryLogs: InventoryLog[];
  analyticsEvents: AnalyticsEvent[];
  settings: StoreSettings;
  admin: {
    username: string;
    salt: string;
    passwordHash: string;
  };
}

function getDefaultDbState(): DbState {
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  // Default password for Alba: "Alba2026*"
  const defaultHash = hashPassword('Alba2026*', defaultSalt);

  return {
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    orders: [],
    restockRequests: [],
    inventoryLogs: [],
    analyticsEvents: [],
    settings: INITIAL_SETTINGS,
    admin: {
      username: 'alba',
      salt: defaultSalt,
      passwordHash: defaultHash,
    },
  };
}

let dbState: DbState;

function loadDatabase(): DbState {
  const defaultState = getDefaultDbState();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        settings: {
          ...defaultState.settings,
          ...(parsed.settings || {}),
          savedHeroBanners:
            Array.isArray(parsed.settings?.savedHeroBanners) && parsed.settings.savedHeroBanners.length > 0
              ? parsed.settings.savedHeroBanners
              : defaultState.settings.savedHeroBanners,
        },
      };
    }
  } catch (err) {
    console.error('Error reading database file, initializing default:', err);
  }
  saveDatabase(defaultState);
  return defaultState;
}

function saveDatabase(state: DbState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

dbState = loadDatabase();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Auth Middleware for Admin routes
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Acceso no autorizado. Inicie sesión como administradora.' });
      return;
    }
    const token = authHeader.substring(7);
    const verification = verifyToken(token);
    if (!verification.valid) {
      res.status(401).json({ error: 'Sesión expirada o token inválido.' });
      return;
    }
    (req as any).adminUser = verification.username;
    next();
  };

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health and System Status
  app.get('/api/status', (_req, res) => {
    const available = dbState.products.filter(p => p.stock > 0 && p.status !== 'inactivo').length;
    const outOfStock = dbState.products.filter(p => p.stock === 0 || p.status === 'agotado').length;
    const pendingOrders = dbState.orders.filter(o => o.status === 'pendiente_confirmacion').length;
    const restockCount = dbState.restockRequests.filter(r => !r.notified).length;

    res.json({
      status: 'online',
      storeName: dbState.settings.storeName,
      productsCount: dbState.products.length,
      availableCount: available,
      outOfStockCount: outOfStock,
      pendingOrdersCount: pendingOrders,
      pendingRestockCount: restockCount,
      whatsappCloudApiReady: dbState.settings.whatsappCloudApi.configured,
    });
  });

  // Admin Auth: Login
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
      return;
    }

    const trimmedUser = username.trim().toLowerCase();
    if (trimmedUser !== dbState.admin.username) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    const calculatedHash = hashPassword(password, dbState.admin.salt);
    if (calculatedHash !== dbState.admin.passwordHash) {
      res.status(401).json({ error: 'Contraseña incorrecta.' });
      return;
    }

    const token = generateToken(trimmedUser);
    res.json({
      success: true,
      token,
      username: dbState.admin.username,
      name: 'Alba (Administradora)',
      role: 'admin',
      expiresIn: '7 días',
    });
  });

  // Admin Auth: Verify token
  app.get('/api/admin/verify', requireAdmin, (req, res) => {
    res.json({
      valid: true,
      username: (req as any).adminUser,
      name: 'Alba',
      role: 'admin',
    });
  });

  // Admin Auth: Change password
  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const currentHash = hashPassword(currentPassword, dbState.admin.salt);
    if (currentHash !== dbState.admin.passwordHash) {
      res.status(400).json({ error: 'La contraseña actual no coincide.' });
      return;
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);
    dbState.admin.salt = newSalt;
    dbState.admin.passwordHash = newHash;
    saveDatabase(dbState);

    res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
  });

  // Public & Admin: Get Products
  app.get('/api/products', (req, res) => {
    const isAdmin = Boolean(req.headers.authorization && verifyToken(req.headers.authorization.substring(7)).valid);
    let list = dbState.products;

    if (!isAdmin) {
      // Hide inactive products from public view
      list = list.filter(p => p.status !== 'inactivo');
    }

    // Category filter
    const category = req.query.category as string;
    if (category && category !== 'Todas') {
      list = list.filter(p => p.category === category);
    }

    // Search query
    const q = req.query.q as string;
    if (q) {
      const term = q.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        (p.olfactoryFamily && p.olfactoryFamily.toLowerCase().includes(term)) ||
        (p.notes && p.notes.toLowerCase().includes(term)) ||
        p.category.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    // Availability filter
    const availability = req.query.availability as string;
    if (availability === 'disponible') {
      list = list.filter(p => p.stock > 0 && p.status !== 'agotado');
    } else if (availability === 'agotado') {
      list = list.filter(p => p.stock === 0 || p.status === 'agotado');
    }

    res.json({ products: list, total: list.length });
  });

  // Get Single Product
  app.get('/api/products/:id', (req, res) => {
    const product = dbState.products.find(p => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }
    // Related products (same category or brand)
    const related = dbState.products
      .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand) && p.status !== 'inactivo')
      .slice(0, 4);

    res.json({ product, related });
  });

  // Admin: Upload Image (Base64 file from device, camera or drag & drop)
  app.post('/api/admin/upload-image', requireAdmin, (req, res) => {
    try {
      const { image, fileName } = req.body;
      if (!image || typeof image !== 'string') {
        res.status(400).json({ error: 'Imagen requerida en formato Base64 o URL.' });
        return;
      }

      // If it's already an HTTP / relative URL, return it directly
      if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
        res.json({ success: true, url: image });
        return;
      }

      // Check for base64 data url
      const matches = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!matches) {
        res.status(400).json({ error: 'Formato de imagen no reconocido. Debe ser una imagen en base64 o URL.' });
        return;
      }

      let extension = matches[1].toLowerCase();
      if (extension === 'jpeg') extension = 'jpg';
      if (extension === 'svg+xml') extension = 'svg';

      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const safeName = `dsantos-${Date.now()}-${Math.floor(Math.random() * 10000)}.${extension}`;
      const filePath = path.resolve(UPLOADS_DIR, safeName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${safeName}`;
      res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error('Error saving uploaded image:', err);
      res.status(500).json({ error: 'Error al procesar y guardar la imagen.' });
    }
  });

  // Admin: Create Product
  app.post('/api/products', requireAdmin, (req, res) => {
    const {
      name,
      brand,
      category,
      subcategory,
      description,
      price,
      salePrice,
      costPrice,
      wholesalePrice,
      stock,
      presentation,
      sku,
      tags,
      olfactoryFamily,
      notes,
      images,
    } = req.body;
    if (!name || !brand || !category || price === undefined || stock === undefined) {
      res.status(400).json({ error: 'Campos obligatorios incompletos: nombre, marca, categoría, precio y existencias.' });
      return;
    }

    const numStock = Math.max(0, parseInt(stock, 10) || 0);
    const numPrice = Math.max(0, parseFloat(price) || 0);
    const numSalePrice = salePrice !== undefined && salePrice !== null && salePrice !== '' ? Math.max(0, parseFloat(salePrice)) : undefined;
    const numCostPrice = costPrice !== undefined && costPrice !== null && costPrice !== '' ? Math.max(0, parseFloat(costPrice)) : undefined;
    const numWholesalePrice = wholesalePrice !== undefined && wholesalePrice !== null && wholesalePrice !== '' ? Math.max(0, parseFloat(wholesalePrice)) : undefined;
    const lowThreshold = dbState.settings.lowStockThreshold || 3;

    let computedStatus: Product['status'] = 'disponible';
    if (numStock === 0) computedStatus = 'agotado';
    else if (numStock <= lowThreshold) computedStatus = 'ultimas_piezas';

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      subcategory: subcategory?.trim(),
      description: description?.trim() || '',
      price: numPrice,
      salePrice: numSalePrice,
      costPrice: numCostPrice,
      wholesalePrice: numWholesalePrice,
      stock: numStock,
      status: computedStatus,
      presentation: presentation?.trim() || 'Estándar',
      sku: sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      tags: Array.isArray(tags) ? tags : [],
      olfactoryFamily: olfactoryFamily?.trim(),
      notes: notes?.trim(),
      images: Array.isArray(images) && images.length > 0 ? images : ['/logo.png'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbState.products.unshift(newProduct);

    // Record initial inventory log
    dbState.inventoryLogs.unshift({
      id: `log-${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      movementType: 'entrada_proveedor',
      quantityDelta: numStock,
      previousStock: 0,
      newStock: numStock,
      timestamp: new Date().toISOString(),
      reason: 'Alta de nuevo producto en catálogo',
      user: 'Alba',
    });

    saveDatabase(dbState);
    res.status(201).json({ success: true, product: newProduct });
  });

  // Admin: Update Product
  app.put('/api/products/:id', requireAdmin, (req, res) => {
    const index = dbState.products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const prev = dbState.products[index];
    const {
      name,
      brand,
      category,
      subcategory,
      description,
      price,
      salePrice,
      costPrice,
      wholesalePrice,
      stock,
      presentation,
      sku,
      tags,
      olfactoryFamily,
      notes,
      images,
      status,
    } = req.body;

    const numStock = stock !== undefined ? Math.max(0, parseInt(stock, 10)) : prev.stock;
    const numPrice = price !== undefined ? Math.max(0, parseFloat(price)) : prev.price;
    const numSalePrice = salePrice !== undefined ? (salePrice !== null && salePrice !== '' ? Math.max(0, parseFloat(salePrice)) : undefined) : prev.salePrice;
    const numCostPrice = costPrice !== undefined ? (costPrice !== null && costPrice !== '' ? Math.max(0, parseFloat(costPrice)) : undefined) : prev.costPrice;
    const numWholesalePrice = wholesalePrice !== undefined ? (wholesalePrice !== null && wholesalePrice !== '' ? Math.max(0, parseFloat(wholesalePrice)) : undefined) : prev.wholesalePrice;
    const lowThreshold = dbState.settings.lowStockThreshold || 3;

    let computedStatus = status || prev.status;
    if (numStock === 0) computedStatus = 'agotado';
    else if (numStock <= lowThreshold && computedStatus !== 'inactivo') computedStatus = 'ultimas_piezas';
    else if (computedStatus !== 'inactivo') computedStatus = 'disponible';

    // Stock change check
    const stockDelta = numStock - prev.stock;
    if (stockDelta !== 0) {
      dbState.inventoryLogs.unshift({
        id: `log-${Date.now()}`,
        productId: prev.id,
        productName: name || prev.name,
        movementType: stockDelta > 0 ? 'entrada_proveedor' : 'ajuste_inventario',
        quantityDelta: stockDelta,
        previousStock: prev.stock,
        newStock: numStock,
        timestamp: new Date().toISOString(),
        reason: 'Modificación manual desde panel de edición',
        user: 'Alba',
      });
    }

    dbState.products[index] = {
      ...prev,
      name: name !== undefined ? name.trim() : prev.name,
      brand: brand !== undefined ? brand.trim() : prev.brand,
      category: category !== undefined ? category.trim() : prev.category,
      subcategory: subcategory !== undefined ? subcategory.trim() : prev.subcategory,
      description: description !== undefined ? description.trim() : prev.description,
      price: numPrice,
      salePrice: numSalePrice,
      costPrice: numCostPrice,
      wholesalePrice: numWholesalePrice,
      stock: numStock,
      status: computedStatus,
      presentation: presentation !== undefined ? presentation.trim() : prev.presentation,
      sku: sku !== undefined ? sku.trim() : prev.sku,
      tags: tags !== undefined ? tags : prev.tags,
      olfactoryFamily: olfactoryFamily !== undefined ? olfactoryFamily.trim() : prev.olfactoryFamily,
      notes: notes !== undefined ? notes.trim() : prev.notes,
      images: images !== undefined ? images : prev.images,
      updatedAt: new Date().toISOString(),
    };

    saveDatabase(dbState);
    res.json({ success: true, product: dbState.products[index] });
  });

  // Admin: Delete or Deactivate Product
  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const index = dbState.products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }
    // Hard delete or deactivate depending on query
    if (req.query.hard === 'true') {
      dbState.products.splice(index, 1);
    } else {
      dbState.products[index].status = 'inactivo';
      dbState.products[index].updatedAt = new Date().toISOString();
    }
    saveDatabase(dbState);
    res.json({ success: true, message: 'Producto actualizado.' });
  });

  // Admin: Clear All Products / Delete Preloaded Inventory
  app.post('/api/admin/clear-inventory', requireAdmin, (req, res) => {
    try {
      dbState.products = [];
      dbState.inventoryLogs = [];
      dbState.orders = [];
      dbState.restockRequests = [];
      saveDatabase(dbState);
      res.json({ success: true, message: 'Inventario vaciado correctamente. Todo el inventario precargado ha sido eliminado.' });
    } catch (err: any) {
      console.error('Error clearing inventory:', err);
      res.status(500).json({ error: 'Error al vaciar el inventario.' });
    }
  });

  // Admin: Adjust Stock Atomically with Reason
  app.post('/api/inventory/adjust', requireAdmin, (req, res) => {
    const { productId, delta, reason, movementType } = req.body;
    if (!productId || delta === undefined || !reason) {
      res.status(400).json({ error: 'Faltan parámetros obligatorios (productId, delta, reason).' });
      return;
    }

    const product = dbState.products.find(p => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const previousStock = product.stock;
    const numDelta = parseInt(delta, 10);
    const newStock = Math.max(0, previousStock + numDelta);
    const lowThreshold = dbState.settings.lowStockThreshold || 3;

    product.stock = newStock;
    if (newStock === 0) product.status = 'agotado';
    else if (newStock <= lowThreshold) product.status = 'ultimas_piezas';
    else product.status = 'disponible';
    product.updatedAt = new Date().toISOString();

    const log: InventoryLog = {
      id: `log-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      movementType: movementType || (numDelta > 0 ? 'entrada_proveedor' : 'ajuste_inventario'),
      quantityDelta: numDelta,
      previousStock,
      newStock,
      timestamp: new Date().toISOString(),
      reason: reason.trim(),
      user: 'Alba',
    };
    dbState.inventoryLogs.unshift(log);

    // If restocked from 0 to positive, count pending waitlist requests
    const pendingWaitlists = previousStock === 0 && newStock > 0
      ? dbState.restockRequests.filter(r => r.productId === product.id && !r.notified)
      : [];

    saveDatabase(dbState);
    res.json({
      success: true,
      product,
      log,
      pendingWaitlistsCount: pendingWaitlists.length,
      message: `Inventario actualizado de ${previousStock} a ${newStock} unidades.`,
    });
  });

  // Admin: Inventory Logs
  app.get('/api/inventory/logs', requireAdmin, (_req, res) => {
    res.json({ logs: dbState.inventoryLogs.slice(0, 150) });
  });

  // Public: Create Order (With Server-Side Stock Validation!)
  app.post('/api/orders', (req, res) => {
    const { customerName, customerPhone, deliveryMethod, deliveryAddress, notes, items } = req.body;

    if (!customerName || !customerPhone || !deliveryMethod || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Datos incompletos para procesar el pedido.' });
      return;
    }

    // Live Server-Side Stock & Price Validation
    const validatedItems: Order['items'] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = dbState.products.find(p => p.id === item.productId);
      if (!product) {
        res.status(400).json({ error: `El producto "${item.productName || item.productId}" ya no existe en el catálogo.` });
        return;
      }
      if (product.status === 'inactivo' || product.status === 'agotado' || product.stock < item.quantity) {
        res.status(400).json({
          error: `Existencias insuficientes para "${product.name}". Solicitado: ${item.quantity}, disponible en inventario: ${product.stock}.`,
        });
        return;
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        price: product.price,
        quantity: item.quantity,
        presentation: item.presentation || product.presentation,
        subtotal: itemSubtotal,
      });
    }

    // Delivery cost
    const deliveryCost = deliveryMethod === 'entrega_local'
      ? (subtotal >= dbState.settings.deliveryMethods.minOrderForFreeDelivery ? 0 : dbState.settings.deliveryMethods.localDeliveryCost)
      : 0;

    const total = subtotal + deliveryCost;

    // Generate unique order ID: DSP-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `DSP-2026-${randomSuffix}`;

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      deliveryAddress: deliveryAddress?.trim(),
      notes: notes?.trim(),
      items: validatedItems,
      subtotal,
      deliveryCost,
      total,
      status: 'pendiente_confirmacion',
      paymentStatus: 'pendiente',
      statusHistory: [
        {
          status: 'pendiente_confirmacion',
          timestamp: new Date().toISOString(),
          note: 'Pedido recibido desde la tienda web, pendiente de confirmación por Alba.',
        },
      ],
    };

    dbState.orders.unshift(newOrder);

    // Record order intent / creation analytics event
    dbState.analyticsEvents.push({
      id: `ev-${Date.now()}`,
      eventType: 'order_intent',
      productName: validatedItems.map(i => i.productName).join(', '),
      metadata: { orderId, total, itemsCount: validatedItems.length },
      timestamp: new Date().toISOString(),
    });

    saveDatabase(dbState);

    // Format pre-filled WhatsApp message for Alba's WhatsApp number
    const targetPhone = dbState.settings.whatsappPhone.replace(/\D/g, '');
    const itemsListText = validatedItems
      .map(i => `• ${i.quantity}x ${i.productName} (${i.presentation}) — $${i.subtotal.toFixed(2)} MXN`)
      .join('\n');

    const deliveryText = deliveryMethod === 'recogida_tienda'
      ? '🏬 Recogida en tienda'
      : `🚚 Entrega local a domicilio (${deliveryAddress || 'Por acordar'})${deliveryCost > 0 ? ` +$${deliveryCost} MXN de envío` : ' (¡Envío gratis!)'}`;

    const whatsappMessage = `🌸 *NUEVO PEDIDO D'SANTOS PERFUMERÍA* 🌸
#️⃣ *No. de Pedido:* ${orderId}
👤 *Cliente:* ${customerName}
📱 *Teléfono:* ${customerPhone}
📦 *Método de entrega:* ${deliveryText}
${notes ? `📝 *Notas:* ${notes}\n` : ''}
🛒 *Artículos solicitados:*
${itemsListText}

💰 *Subtotal:* $${subtotal.toFixed(2)} MXN
${deliveryCost > 0 ? `🚚 *Envío:* $${deliveryCost.toFixed(2)} MXN\n` : ''}💵 *TOTAL:* $${total.toFixed(2)} MXN

⏳ *Estado:* Pendiente de confirmación de la tienda
¡Hola Alba! Acabo de armar mi pedido en la tienda web de D'Santos Perfumería. ¿Podrías confirmarme existencias y coordinar la entrega? Muchas gracias.`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

    res.status(201).json({
      success: true,
      order: newOrder,
      whatsappUrl,
      whatsappMessage,
      targetPhone,
    });
  });

  // Admin: List Orders
  app.get('/api/orders', requireAdmin, (req, res) => {
    let list = dbState.orders;
    const status = req.query.status as string;
    if (status && status !== 'todos') {
      list = list.filter(o => o.status === status);
    }
    const q = req.query.q as string;
    if (q) {
      const term = q.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.customerPhone.includes(term)
      );
    }
    res.json({ orders: list, total: list.length });
  });

  // Admin: Update Order Status & Notes
  app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
    const { status, paymentStatus, internalNotes, statusNote } = req.body;
    const order = dbState.orders.find(o => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Pedido no encontrado.' });
      return;
    }

    const prevStatus = order.status;
    const newStatus = status as OrderStatus;

    if (newStatus && newStatus !== prevStatus) {
      // If moving to 'confirmado' for the first time: deduct inventory atomically
      if (newStatus === 'confirmado' && prevStatus === 'pendiente_confirmacion') {
        for (const item of order.items) {
          const product = dbState.products.find(p => p.id === item.productId);
          if (product) {
            const previousStock = product.stock;
            const updatedStock = Math.max(0, previousStock - item.quantity);
            product.stock = updatedStock;
            const lowThreshold = dbState.settings.lowStockThreshold || 3;
            if (updatedStock === 0) product.status = 'agotado';
            else if (updatedStock <= lowThreshold) product.status = 'ultimas_piezas';
            product.updatedAt = new Date().toISOString();

            dbState.inventoryLogs.unshift({
              id: `log-${Date.now()}-${item.productId}`,
              productId: product.id,
              productName: product.name,
              movementType: 'pedido_confirmado',
              quantityDelta: -item.quantity,
              previousStock,
              newStock: updatedStock,
              timestamp: new Date().toISOString(),
              reason: `Deducción por confirmación de pedido ${order.id}`,
              user: 'Alba',
            });
          }
        }
      }

      // If moving to 'cancelado' after having been confirmed: restore inventory
      if (newStatus === 'cancelado' && prevStatus !== 'pendiente_confirmacion' && prevStatus !== 'cancelado') {
        for (const item of order.items) {
          const product = dbState.products.find(p => p.id === item.productId);
          if (product) {
            const previousStock = product.stock;
            const updatedStock = previousStock + item.quantity;
            product.stock = updatedStock;
            product.status = updatedStock > (dbState.settings.lowStockThreshold || 3) ? 'disponible' : 'ultimas_piezas';
            product.updatedAt = new Date().toISOString();

            dbState.inventoryLogs.unshift({
              id: `log-${Date.now()}-${item.productId}`,
              productId: product.id,
              productName: product.name,
              movementType: 'pedido_cancelado',
              quantityDelta: item.quantity,
              previousStock,
              newStock: updatedStock,
              timestamp: new Date().toISOString(),
              reason: `Restitución de stock por cancelación de pedido ${order.id}`,
              user: 'Alba',
            });
          }
        }
      }

      order.status = newStatus;
      order.statusHistory.unshift({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: statusNote || `Estado actualizado a ${newStatus} por Alba`,
      });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes;
    }

    saveDatabase(dbState);
    res.json({ success: true, order });
  });

  // Public: Restock Waitlist Request ("Avísame cuando esté disponible")
  app.post('/api/restock-requests', (req, res) => {
    const { productId, customerName, customerPhone, consent } = req.body;
    if (!productId || !customerPhone || !consent) {
      res.status(400).json({ error: 'El número de WhatsApp y el consentimiento son obligatorios.' });
      return;
    }

    const product = dbState.products.find(p => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      res.status(400).json({ error: 'Por favor ingrese un número de WhatsApp válido (con lada de país).' });
      return;
    }

    // Prevent duplicate active request for same phone & product
    const existing = dbState.restockRequests.find(
      r => r.productId === productId && r.customerPhone.replace(/\D/g, '') === cleanPhone && !r.notified
    );
    if (existing) {
      res.json({
        success: true,
        message: '¡Ya teníamos registrada tu solicitud para este producto! Te contactaremos por WhatsApp en cuanto llegue.',
        request: existing,
      });
      return;
    }

    const newRequest: RestockRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productName: product.name,
      customerName: customerName?.trim() || 'Cliente interesado',
      customerPhone: customerPhone.trim(),
      requestedAt: new Date().toISOString(),
      consent: true,
      notified: false,
      notificationStatus: 'pendiente',
    };

    dbState.restockRequests.unshift(newRequest);

    // Record analytics event
    dbState.analyticsEvents.push({
      id: `ev-${Date.now()}`,
      eventType: 'out_of_stock_click',
      productId: product.id,
      productName: product.name,
      metadata: { phone: cleanPhone },
      timestamp: new Date().toISOString(),
    });

    saveDatabase(dbState);

    res.status(201).json({
      success: true,
      message: '¡Solicitud registrada con éxito! Te avisaremos por WhatsApp en cuanto tengamos existencia disponible.',
      request: newRequest,
    });
  });

  // Admin: Get Restock Requests
  app.get('/api/restock-requests', requireAdmin, (req, res) => {
    let list = dbState.restockRequests;
    const productId = req.query.productId as string;
    if (productId) {
      list = list.filter(r => r.productId === productId);
    }
    const notified = req.query.notified as string;
    if (notified === 'false') {
      list = list.filter(r => !r.notified);
    } else if (notified === 'true') {
      list = list.filter(r => r.notified);
    }

    // Aggregate by most requested out-of-stock products
    const productCounts: Record<string, { product: Product | undefined; count: number; unnotifiedCount: number }> = {};
    for (const reqItem of dbState.restockRequests) {
      if (!productCounts[reqItem.productId]) {
        const prod = dbState.products.find(p => p.id === reqItem.productId);
        productCounts[reqItem.productId] = { product: prod, count: 0, unnotifiedCount: 0 };
      }
      productCounts[reqItem.productId].count++;
      if (!reqItem.notified) {
        productCounts[reqItem.productId].unnotifiedCount++;
      }
    }

    const topRequested = Object.entries(productCounts)
      .map(([id, data]) => ({
        productId: id,
        productName: data.product ? data.product.name : 'Producto',
        brand: data.product ? data.product.brand : '',
        stock: data.product ? data.product.stock : 0,
        totalRequests: data.count,
        pendingRequests: data.unnotifiedCount,
      }))
      .sort((a, b) => b.pendingRequests - a.pendingRequests);

    res.json({
      requests: list,
      total: list.length,
      topRequested,
      whatsappCloudApiConfigured: dbState.settings.whatsappCloudApi.configured,
    });
  });

  // Admin: Notify Restocked Customers via WhatsApp Cloud API or Prepare Direct WhatsApp Messages
  app.post('/api/restock-requests/notify', requireAdmin, async (req, res) => {
    const { requestId, productId } = req.body;
    let targets: RestockRequest[] = [];

    if (requestId) {
      const single = dbState.restockRequests.find(r => r.id === requestId);
      if (single) targets = [single];
    } else if (productId) {
      targets = dbState.restockRequests.filter(r => r.productId === productId && !r.notified);
    }

    if (targets.length === 0) {
      res.status(400).json({ error: 'No se encontraron solicitudes pendientes para notificar.' });
      return;
    }

    const cloudApi = dbState.settings.whatsappCloudApi;
    const isCloudConfigured = Boolean(cloudApi.configured && cloudApi.phoneNumberId && cloudApi.accessToken);

    const results: any[] = [];

    for (const reqItem of targets) {
      const product = dbState.products.find(p => p.id === reqItem.productId);
      const cleanPhone = reqItem.customerPhone.replace(/\D/g, '');
      const greetingName = reqItem.customerName && reqItem.customerName !== 'Cliente interesado' ? reqItem.customerName : 'Hola';

      const messageText = `🌸 *¡BUENAS NOTICIAS DE D'SANTOS PERFUMERÍA!* 🌸\n\n${greetingName}, te avisamos que el producto que solicitaste ya está disponible:\n\n✨ *${product ? product.name : reqItem.productName}*\n💰 Precio: $${product ? product.price.toFixed(2) : ''} MXN\n📦 Existencia lista para entrega o apartado.\n\n¿Deseas que te apartemos el tuyo antes de que se agote? Escríbenos para confirmar tu pedido. ¡Gracias por tu preferencia!`;

      if (isCloudConfigured) {
        try {
          // Real WhatsApp Cloud API Call
          const response = await fetch(`https://graph.facebook.com/v19.0/${cloudApi.phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cloudApi.accessToken}`,
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanPhone,
              type: 'text',
              text: { preview_url: false, body: messageText },
            }),
          });

          const data = (await response.json()) as any;
          if (response.ok && data.messages) {
            reqItem.notified = true;
            reqItem.notifiedAt = new Date().toISOString();
            reqItem.notificationStatus = 'enviado';
            results.push({ id: reqItem.id, status: 'enviado', response: data });
          } else {
            reqItem.notificationStatus = 'fallido';
            reqItem.errorDetails = data.error ? data.error.message : 'Error desconocido de WhatsApp Cloud API';
            results.push({ id: reqItem.id, status: 'fallido', error: reqItem.errorDetails });
          }
        } catch (err: any) {
          reqItem.notificationStatus = 'fallido';
          reqItem.errorDetails = err.message || 'Error de conexión con WhatsApp Cloud API';
          results.push({ id: reqItem.id, status: 'fallido', error: reqItem.errorDetails });
        }
      } else {
        // Direct WhatsApp Web / App link preparation
        reqItem.notified = true;
        reqItem.notifiedAt = new Date().toISOString();
        reqItem.notificationStatus = 'enviado';
        const directLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
        results.push({
          id: reqItem.id,
          status: 'preparado_directo',
          directLink,
          customerPhone: cleanPhone,
          message: messageText,
        });
      }
    }

    saveDatabase(dbState);

    res.json({
      success: true,
      isCloudConfigured,
      processedCount: targets.length,
      results,
      message: isCloudConfigured
        ? `Notificaciones enviadas a través de WhatsApp Cloud API.`
        : `Enlaces directos de WhatsApp preparados para contactar a los clientes.`,
    });
  });

  // Public: Commercial Analytics Event Tracking
  app.post('/api/analytics/event', (req, res) => {
    const { eventType, productId, productName, query, metadata } = req.body;
    if (!eventType) {
      res.status(400).json({ error: 'eventType requerido' });
      return;
    }

    const event: AnalyticsEvent = {
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      productId,
      productName,
      query: query?.trim().toLowerCase(),
      metadata,
      timestamp: new Date().toISOString(),
    };

    dbState.analyticsEvents.push(event);

    // Keep memory lean (keep last 2000 events)
    if (dbState.analyticsEvents.length > 2000) {
      dbState.analyticsEvents = dbState.analyticsEvents.slice(-2000);
    }

    saveDatabase(dbState);
    res.json({ success: true });
  });

  // Admin: Analytics & Demand Report
  app.get('/api/analytics/report', requireAdmin, (req, res) => {
    const period = (req.query.period as string) || 'all'; // 'today', 'week', 'month', 'all'
    const now = Date.now();

    const isWithinPeriod = (timestamp: string) => {
      if (period === 'all') return true;
      const t = new Date(timestamp).getTime();
      if (period === 'today') return now - t < 1000 * 60 * 60 * 24;
      if (period === 'week') return now - t < 1000 * 60 * 60 * 24 * 7;
      if (period === 'month') return now - t < 1000 * 60 * 60 * 24 * 30;
      return true;
    };

    // Filter orders
    const periodOrders = dbState.orders.filter(o => isWithinPeriod(o.createdAt));
    const confirmedOrders = periodOrders.filter(o => o.status !== 'cancelado' && o.status !== 'pendiente_confirmacion');
    const totalDeliveredOrders = periodOrders.filter(o => o.status === 'entregado');
    const pendingOrders = periodOrders.filter(o => o.status === 'pendiente_confirmacion');
    const cancelledOrders = periodOrders.filter(o => o.status === 'cancelado');

    const totalSalesRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalPotentialOrderValue = periodOrders.reduce((sum, o) => sum + o.total, 0);

    // Filter analytics events
    const periodEvents = dbState.analyticsEvents.filter(e => isWithinPeriod(e.timestamp));

    // Top searched terms
    const searchCounts: Record<string, number> = {};
    for (const e of periodEvents) {
      if (e.eventType === 'search' && e.query) {
        searchCounts[e.query] = (searchCounts[e.query] || 0) + 1;
      }
    }
    const topSearches = Object.entries(searchCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Products sold breakdown
    const productSales: Record<string, { productName: string; units: number; revenue: number }> = {};
    for (const o of confirmedOrders) {
      for (const item of o.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { productName: item.productName, units: 0, revenue: 0 };
        }
        productSales[item.productId].units += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      }
    }
    const topSoldProducts = Object.values(productSales)
      .sort((a, b) => b.units - a.units)
      .slice(0, 10);

    // Unmet demand: out of stock requests
    const waitlistDemand: Record<string, { productName: string; requests: number }> = {};
    for (const r of dbState.restockRequests) {
      if (isWithinPeriod(r.requestedAt)) {
        if (!waitlistDemand[r.productId]) {
          waitlistDemand[r.productId] = { productName: r.productName, requests: 0 };
        }
        waitlistDemand[r.productId].requests++;
      }
    }
    const topUnmetDemand = Object.values(waitlistDemand)
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    // Conversion rate: (Confirmed orders / Unique session interactions or Views)
    const productViewsCount = periodEvents.filter(e => e.eventType === 'view_product').length;
    const cartAddsCount = periodEvents.filter(e => e.eventType === 'add_to_cart').length;
    const totalOrderIntents = periodOrders.length;
    const conversionRate = productViewsCount > 0
      ? ((confirmedOrders.length / productViewsCount) * 100).toFixed(1)
      : '0.0';

    res.json({
      period,
      summary: {
        totalOrders: periodOrders.length,
        pendingOrders: pendingOrders.length,
        confirmedOrders: confirmedOrders.length,
        deliveredOrders: totalDeliveredOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalSalesRevenue,
        totalPotentialOrderValue,
        conversionRatePercent: parseFloat(conversionRate),
        productViewsCount,
        cartAddsCount,
        totalRestockRequests: dbState.restockRequests.length,
      },
      topSearches,
      topSoldProducts,
      topUnmetDemand,
    });
  });

  // Admin: Export CSV
  app.get('/api/analytics/export', requireAdmin, (req, res) => {
    const type = req.query.type as string; // 'inventory', 'orders', 'restock'

    if (type === 'inventory') {
      const headers = ['ID', 'Nombre', 'Marca', 'Categoria', 'Precio_MXN', 'Stock', 'Estado', 'SKU', 'Presentacion'];
      const rows = dbState.products.map(p => [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.price,
        p.stock,
        p.status,
        `"${p.sku || ''}"`,
        `"${p.presentation || ''}"`,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="dsantos_inventario.csv"');
      res.send(csv);
      return;
    }

    if (type === 'orders') {
      const headers = ['Pedido', 'Fecha', 'Cliente', 'Telefono', 'Metodo_Entrega', 'Subtotal_MXN', 'Total_MXN', 'Estado', 'Estado_Pago'];
      const rows = dbState.orders.map(o => [
        `"${o.id}"`,
        `"${o.createdAt}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerPhone}"`,
        `"${o.deliveryMethod}"`,
        o.subtotal,
        o.total,
        `"${o.status}"`,
        `"${o.paymentStatus}"`,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="dsantos_pedidos.csv"');
      res.send(csv);
      return;
    }

    // Default restock requests
    const headers = ['ID', 'Producto', 'Cliente', 'WhatsApp', 'Fecha_Solicitud', 'Notificado', 'Estado_Notificacion'];
    const rows = dbState.restockRequests.map(r => [
      `"${r.id}"`,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${(r.customerName || '').replace(/"/g, '""')}"`,
      `"${r.customerPhone}"`,
      `"${r.requestedAt}"`,
      r.notified ? 'SI' : 'NO',
      `"${r.notificationStatus || 'pendiente'}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dsantos_solicitudes_agotados.csv"');
    res.send(csv);
  });

  // Admin: Batch CSV Product Import
  app.post('/api/inventory/import-csv', requireAdmin, (req, res) => {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      res.status(400).json({ error: 'Texto CSV requerido.' });
      return;
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      res.status(400).json({ error: 'El archivo CSV debe contener encabezado y al menos una fila.' });
      return;
    }

    let importedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Simple parse respecting quotes
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 4) {
        const name = cols[0];
        const brand = cols[1];
        const category = cols[2];
        const price = parseFloat(cols[3]) || 0;
        const stock = parseInt(cols[4], 10) || 0;
        const presentation = cols[5] || 'Estándar';
        const sku = cols[6] || `SKU-${Date.now().toString().slice(-6)}`;

        if (name && brand && category) {
          const newProduct: Product = {
            id: `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name,
            brand,
            category,
            description: `Producto de alta calidad importado por D'Santos Perfumería.`,
            price,
            stock,
            status: stock > 0 ? (stock <= 3 ? 'ultimas_piezas' : 'disponible') : 'agotado',
            presentation,
            sku,
            tags: ['nuevo'],
            images: ['/logo.png'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          dbState.products.push(newProduct);
          importedCount++;
        }
      }
    }

    saveDatabase(dbState);
    res.json({ success: true, importedCount, message: `Se importaron ${importedCount} productos con éxito.` });
  });

  // Admin: Generate Seasonal Hero Banner Image via Google GenAI
  app.post('/api/admin/generate-hero-image', requireAdmin, async (req, res) => {
    const {
      prompt,
      seasonKey,
      seasonName,
      badgeText,
      headlineHighlight,
      applyNow = false,
      saveToGallery = true,
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'La descripción de temporada es obligatoria.' });
      return;
    }

    // High-resolution curated seasonal fragrance palettes as baseline & fallback
    const SEASON_FALLBACKS: Record<string, string> = {
      primavera: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1920&q=80',
      verano: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1920&q=80',
      otono: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1920&q=80',
      invierno: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1920&q=80',
      san_valentin: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1920&q=80',
      navidad: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1920&q=80',
      personalizado: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=1920&q=80',
    };

    let generatedImageUrl = '';
    let usedSource: 'gemini' | 'curated-fallback' = 'curated-fallback';
    let generationNote = '';

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Prompt crafted specifically for luxury perfume boutique 16:9 banner
        const enhancedPrompt = `Wide 16:9 panoramic luxury perfume boutique hero background. Theme: ${prompt.trim()}. Elegance, haute perfumery flacons with amber and gold reflections, dark obsidian and deep charcoal aesthetic matching #0a0a0a with warm golden light, cinematic lighting, shallow depth of field with soft bokeh, photorealistic, 8k, empty central space for typography, no text, no letters, no watermark.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              {
                text: enhancedPrompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9',
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const base64Data = part.inlineData.data;
            const ext = part.inlineData.mimeType?.includes('png') ? 'png' : 'jpg';
            const filename = `hero-season-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
            const filepath = path.resolve(UPLOADS_DIR, filename);
            fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
            generatedImageUrl = `/uploads/${filename}`;
            usedSource = 'gemini';
            generationNote = 'Fondo generado con IA de Gemini';
            break;
          }
        }
      } catch (err: any) {
        console.warn('Gemini image generation notice:', err?.message || err);
        generationNote = `Aviso: ${err?.message || 'Error de IA'}. Se asignó composición estacional curada.`;
      }
    } else {
      generationNote = 'GEMINI_API_KEY no detectada. Se asignó fondo curado de alta resolución para esta temporada.';
    }

    if (!generatedImageUrl) {
      generatedImageUrl = SEASON_FALLBACKS[seasonKey] || SEASON_FALLBACKS.personalizado;
      usedSource = 'curated-fallback';
    }

    const bannerRecord: SeasonalHeroBanner = {
      id: `banner-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      seasonName: seasonName?.trim() || 'Fondo de Temporada',
      seasonKey: (seasonKey as any) || 'personalizado',
      imageUrl: generatedImageUrl,
      descriptionPrompt: prompt.trim(),
      badgeText: badgeText?.trim() || 'Edición de Temporada',
      headlineHighlight: headlineHighlight?.trim() || 'Colección Exclusiva',
      createdAt: new Date().toISOString(),
    };

    if (saveToGallery) {
      if (!Array.isArray(dbState.settings.savedHeroBanners)) {
        dbState.settings.savedHeroBanners = [];
      }
      dbState.settings.savedHeroBanners.unshift(bannerRecord);
      if (dbState.settings.savedHeroBanners.length > 30) {
        dbState.settings.savedHeroBanners = dbState.settings.savedHeroBanners.slice(0, 30);
      }
    }

    if (applyNow) {
      dbState.settings.heroBackgroundImage = generatedImageUrl;
      if (badgeText) dbState.settings.heroSeasonBadge = badgeText.trim();
      if (headlineHighlight) dbState.settings.heroSeasonTitle = headlineHighlight.trim();
    }

    saveDatabase(dbState);

    res.json({
      success: true,
      imageUrl: generatedImageUrl,
      source: usedSource,
      banner: bannerRecord,
      settings: dbState.settings,
      note: generationNote,
      message: usedSource === 'gemini'
        ? '¡Imagen de fondo generada exitosamente con IA!'
        : 'Fondo de temporada asignado y listo para usar en tu tienda.',
    });
  });

  // Admin: Set Active Hero Banner
  app.post('/api/admin/select-hero-banner', requireAdmin, (req, res) => {
    const { imageUrl, badgeText, headlineHighlight, opacity } = req.body;
    if (imageUrl !== undefined) {
      dbState.settings.heroBackgroundImage = imageUrl;
    }
    if (badgeText !== undefined) {
      dbState.settings.heroSeasonBadge = badgeText;
    }
    if (headlineHighlight !== undefined) {
      dbState.settings.heroSeasonTitle = headlineHighlight;
    }
    if (typeof opacity === 'number') {
      dbState.settings.heroOverlayOpacity = Math.max(0.1, Math.min(0.95, opacity));
    }
    saveDatabase(dbState);
    res.json({ success: true, settings: dbState.settings, message: 'HeroBanner actualizado correctamente.' });
  });

  // Admin: Delete Saved Hero Banner from Gallery
  app.delete('/api/admin/saved-hero-banners/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    if (Array.isArray(dbState.settings.savedHeroBanners)) {
      dbState.settings.savedHeroBanners = dbState.settings.savedHeroBanners.filter(b => b.id !== id);
      saveDatabase(dbState);
    }
    res.json({ success: true, settings: dbState.settings, message: 'Fondo eliminado de la galería.' });
  });

  // Public: Get Store Settings
  app.get('/api/settings', (_req, res) => {
    // Return settings without sensitive access tokens to public
    const publicSettings = {
      ...dbState.settings,
      whatsappCloudApi: {
        configured: dbState.settings.whatsappCloudApi.configured,
        phoneNumberId: dbState.settings.whatsappCloudApi.phoneNumberId ? 'Configurado' : '',
        templateName: dbState.settings.whatsappCloudApi.templateName,
      },
    };
    res.json({ settings: publicSettings, categories: dbState.categories });
  });

  // Admin: Update Store Settings (including WhatsApp Business Cloud API & Logo)
  app.put('/api/settings', requireAdmin, (req, res) => {
    const { settings, categories } = req.body;
    if (settings) {
      dbState.settings = {
        ...dbState.settings,
        ...settings,
        whatsappCloudApi: {
          ...dbState.settings.whatsappCloudApi,
          ...(settings.whatsappCloudApi || {}),
        },
      };
    }
    if (Array.isArray(categories)) {
      dbState.categories = categories.map((c: string) => c.trim()).filter(Boolean);
    }
    saveDatabase(dbState);
    res.json({ success: true, settings: dbState.settings, categories: dbState.categories });
  });

  // Fallback for unmatched API routes: always return JSON 404, never pass to Vite SPA HTML fallback
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Ruta API no encontrada' });
  });

  // -------------------------------------------------------------
  // VITE DEV SERVER OR STATIC PRODUCTION SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: { middlewareMode: true, hmr: false, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 D'Santos Perfumería server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start D\'Santos Perfumería server:', err);
});
