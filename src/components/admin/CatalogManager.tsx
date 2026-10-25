import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { api } from '../../services/api';
import { Product, ProductStatus, ProductTag } from '../../types';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Upload,
  Download,
  AlertCircle,
  Sparkles,
  Camera,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Tag,
  FolderTree,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Layers,
  Percent,
  CheckCircle2,
  RefreshCw,
  Copy,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

// Preset luxury perfume and beauty imagery for fast visual assignment
const PRESET_PRODUCT_IMAGES = [
  {
    label: 'Perfume Dorado Lujo (Dama / Unisex)',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Floral Rosa (Dama)',
    url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Amaderado Elegante (Caballero)',
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Cítrico Fresco (Unisex)',
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Perfume Noir / Noche Intensa',
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Cosméticos y Maquillaje Fino',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Cuidado Facial y Serums',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Crema Corporal & Cuidado Personal',
    url: 'https://images.unsplash.com/photo-1608248597359-5484803716a5?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Logotipo Oficial D\'Santos',
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
  'Versace',
  'Tom Ford',
  'Jean Paul Gaultier',
  'Bath & Body Works',
  'Victoria\'s Secret',
];

const OLFACTORY_FAMILIES = [
  'Floral Frutal',
  'Amaderado Especiado',
  'Cítrico Fresco',
  'Oriental Especiado',
  'Ámbar Floral',
  'Gourmand Dulce',
  'Aromático Fougère',
  'Cuero y Tabaco',
  'Chipre Frutal',
  'Acuático Marino',
];

const PRESET_PERFUME_CATEGORIES = [
  'Perfumes Dama',
  'Perfumes Caballero',
  'Perfumes Unisex',
  'Fraiche Tendencia',
  'Decants y Muestras',
  'Cuidado Personal & Cosméticos',
  'Nicho & Exclusivos',
  'Sets & Estuches de Regalo',
  'Fragancias de Temporada',
];

type SubTab = 'products' | 'pricing' | 'categories';

interface CatalogManagerProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onRefreshData?: () => Promise<void>;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ onShowToast, onRefreshData }) => {
  const { products, categories, settings, refreshCatalog, refreshSettings } = useShop();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('products');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('Todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');

  // Product Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Image Upload state
  const [activeImageTab, setActiveImageTab] = useState<'upload' | 'gallery' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Quick inline edit state (for fast price or stock editing)
  const [inlinePriceEdit, setInlinePriceEdit] = useState<{ id: string; field: 'price' | 'salePrice' | 'costPrice' | 'wholesalePrice' | 'stock'; value: string } | null>(null);
  const [isSavingInline, setIsSavingInline] = useState(false);

  // Category Management State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [isSavingCategories, setIsSavingCategories] = useState(false);

  // Batch CSV Import Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Unique brands list
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => {
      if (p.brand?.trim()) brandsSet.add(p.brand.trim());
    });
    return Array.from(brandsSet).sort();
  }, [products]);

  // Product counts per category
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      counts[c] = 0;
    });
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [categories, products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryFilter !== 'Todas' && p.category !== selectedCategoryFilter) return false;
      if (selectedBrandFilter !== 'Todas' && p.brand !== selectedBrandFilter) return false;
      if (selectedStatusFilter === 'disponible' && (p.stock === 0 || p.status === 'agotado' || p.status === 'inactivo')) return false;
      if (selectedStatusFilter === 'agotado' && p.stock > 0 && p.status !== 'agotado') return false;
      if (selectedStatusFilter === 'inactivo' && p.status !== 'inactivo') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const matchesFamily = p.olfactoryFamily ? p.olfactoryFamily.toLowerCase().includes(q) : false;
        const matchesNotes = p.notes ? p.notes.toLowerCase().includes(q) : false;
        return matchesName || matchesBrand || matchesSku || matchesFamily || matchesNotes;
      }
      return true;
    });
  }, [products, selectedCategoryFilter, selectedBrandFilter, selectedStatusFilter, searchQuery]);

  // Pricing calculations summary
  const pricingSummary = useMemo(() => {
    let totalInventoryValueSale = 0;
    let totalInventoryCost = 0;
    let productsWithCost = 0;
    let productsOnSale = 0;

    products.forEach((p) => {
      const currentPrice = p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
      totalInventoryValueSale += currentPrice * p.stock;
      if (p.costPrice && p.costPrice > 0) {
        totalInventoryCost += p.costPrice * p.stock;
        productsWithCost++;
      }
      if (p.salePrice && p.salePrice > 0 && p.salePrice < p.price) {
        productsOnSale++;
      }
    });

    const estimatedGrossProfit = totalInventoryValueSale - totalInventoryCost;
    const avgMarginPercent = totalInventoryValueSale > 0 && totalInventoryCost > 0
      ? ((estimatedGrossProfit / totalInventoryValueSale) * 100).toFixed(1)
      : '0.0';

    return {
      totalProducts: products.length,
      totalInventoryValueSale,
      totalInventoryCost,
      estimatedGrossProfit,
      avgMarginPercent,
      productsWithCost,
      productsOnSale,
    };
  }, [products]);

  // Open modal for new product
  const handleOpenCreateModal = () => {
    setEditingProduct({
      name: '',
      brand: 'Fraiche',
      category: categories[0] || 'Perfumes Dama',
      description: '',
      presentation: '100 ml',
      price: 450,
      salePrice: undefined,
      costPrice: 220,
      wholesalePrice: 380,
      stock: 5,
      status: 'disponible',
      sku: `DSP-${Date.now().toString().slice(-6)}`,
      tags: ['nuevo'],
      olfactoryFamily: 'Floral Frutal',
      notes: '',
      images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80'],
    });
    setImageUploadError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct({
      ...product,
      images: product.images && product.images.length > 0 ? product.images : ['/logo.png'],
    });
    setImageUploadError(null);
    setIsModalOpen(true);
  };

  // Save product (create or update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name?.trim() || !editingProduct.brand?.trim() || !editingProduct.category?.trim() || editingProduct.price === undefined) {
      onShowToast('Por favor completa los campos requeridos: Nombre, Marca, Categoría y Precio.', 'error');
      return;
    }

    setIsSavingProduct(true);
    try {
      const numStock = typeof editingProduct.stock === 'number' ? Math.max(0, editingProduct.stock) : 0;
      let computedStatus: ProductStatus = editingProduct.status || 'disponible';
      if (numStock === 0) computedStatus = 'agotado';
      else if (computedStatus === 'agotado' && numStock > 0) computedStatus = 'disponible';

      const payload: Partial<Product> = {
        ...editingProduct,
        name: editingProduct.name.trim(),
        brand: editingProduct.brand.trim(),
        category: editingProduct.category.trim(),
        stock: numStock,
        status: computedStatus,
        price: Math.max(0, parseFloat(String(editingProduct.price)) || 0),
        salePrice: editingProduct.salePrice !== undefined && editingProduct.salePrice !== null && String(editingProduct.salePrice).trim() !== ''
          ? Math.max(0, parseFloat(String(editingProduct.salePrice)))
          : undefined,
        costPrice: editingProduct.costPrice !== undefined && editingProduct.costPrice !== null && String(editingProduct.costPrice).trim() !== ''
          ? Math.max(0, parseFloat(String(editingProduct.costPrice)))
          : undefined,
        wholesalePrice: editingProduct.wholesalePrice !== undefined && editingProduct.wholesalePrice !== null && String(editingProduct.wholesalePrice).trim() !== ''
          ? Math.max(0, parseFloat(String(editingProduct.wholesalePrice)))
          : undefined,
        images: editingProduct.images && editingProduct.images.length > 0 && editingProduct.images[0]?.trim()
          ? editingProduct.images
          : ['/logo.png'],
      };

      if (editingProduct.id) {
        await api.adminUpdateProduct(editingProduct.id, payload);
        onShowToast(`Producto "${payload.name}" actualizado correctamente.`, 'success');
      } else {
        await api.adminCreateProduct(payload);
        onShowToast(`Nuevo producto "${payload.name}" cargado exitosamente.`, 'success');
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      await refreshCatalog();
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Error al guardar el producto', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Image Upload handler with client compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Formato de archivo inválido. Selecciona una imagen JPG, PNG o WebP.');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
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
            setImageUploadError('Error al procesar la imagen');
            setIsUploadingImage(false);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          try {
            const res = await api.adminUploadImage(compressedBase64, file.name);
            setEditingProduct((prev) => (prev ? { ...prev, images: [res.url] } : { images: [res.url] }));
            onShowToast('Imagen cargada y asignada al producto.', 'success');
          } catch {
            // Fallback directly to compressed base64
            setEditingProduct((prev) => (prev ? { ...prev, images: [compressedBase64] } : { images: [compressedBase64] }));
            onShowToast('Imagen optimizada y vinculada.', 'success');
          }
        } catch (procErr: any) {
          setImageUploadError('Error al comprimir: ' + procErr.message);
        } finally {
          setIsUploadingImage(false);
        }
      };
      img.onerror = () => {
        setImageUploadError('No se pudo procesar el archivo de imagen.');
        setIsUploadingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setImageUploadError('Error al leer el archivo del dispositivo.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Quick inline price/stock save
  const handleSaveInline = async (productId: string) => {
    if (!inlinePriceEdit || inlinePriceEdit.id !== productId) return;
    setIsSavingInline(true);
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const numVal = parseFloat(inlinePriceEdit.value);
      if (isNaN(numVal) && inlinePriceEdit.value !== '') {
        onShowToast('Ingresa un valor numérico válido.', 'error');
        setIsSavingInline(false);
        return;
      }

      const updatePayload: Partial<Product> = {};
      if (inlinePriceEdit.field === 'price') {
        updatePayload.price = Math.max(0, numVal);
      } else if (inlinePriceEdit.field === 'salePrice') {
        updatePayload.salePrice = inlinePriceEdit.value === '' ? undefined : Math.max(0, numVal);
      } else if (inlinePriceEdit.field === 'costPrice') {
        updatePayload.costPrice = inlinePriceEdit.value === '' ? undefined : Math.max(0, numVal);
      } else if (inlinePriceEdit.field === 'wholesalePrice') {
        updatePayload.wholesalePrice = inlinePriceEdit.value === '' ? undefined : Math.max(0, numVal);
      } else if (inlinePriceEdit.field === 'stock') {
        updatePayload.stock = Math.max(0, parseInt(inlinePriceEdit.value, 10) || 0);
      }

      await api.adminUpdateProduct(productId, updatePayload);
      setInlinePriceEdit(null);
      await refreshCatalog();
      onShowToast('Precio/existencia actualizada.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al actualizar', 'error');
    } finally {
      setIsSavingInline(false);
    }
  };

  // Delete product confirmation
  const handleDeleteProduct = (product: Product) => {
    setConfirmDialog({
      title: 'Eliminar Producto del Catálogo',
      message: `¿Estás segura de eliminar permanentemente "${product.name}" (${product.brand})? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar Producto',
      onConfirm: async () => {
        try {
          await api.adminDeleteProduct(product.id, true);
          onShowToast(`Producto "${product.name}" eliminado del catálogo.`, 'info');
          await refreshCatalog();
          if (onRefreshData) await onRefreshData();
        } catch (err: any) {
          onShowToast(err.message || 'Error al eliminar producto', 'error');
        }
      },
    });
  };

  // Duplicate / Clone Product
  const handleDuplicateProduct = async (product: Product) => {
    try {
      const cloneData: Partial<Product> = {
        ...product,
        name: `${product.name} (Copia)`,
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        stock: 5,
        status: 'disponible',
      };
      delete cloneData.id;
      delete cloneData.createdAt;
      delete cloneData.updatedAt;

      await api.adminCreateProduct(cloneData);
      onShowToast(`Copia creada de "${product.name}".`, 'success');
      await refreshCatalog();
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Error al duplicar producto', 'error');
    }
  };

  // ----------------------------------------------------------------------
  // CATEGORIES MANAGEMENT
  // ----------------------------------------------------------------------

  // Add new category
  const handleAddCategory = async (nameToAdd?: string) => {
    const targetName = (nameToAdd || newCategoryName).trim();
    if (!targetName) {
      onShowToast('Ingresa un nombre para la categoría.', 'error');
      return;
    }

    if (categories.some((c) => c.toLowerCase() === targetName.toLowerCase())) {
      onShowToast(`La categoría "${targetName}" ya existe en el catálogo.`, 'info');
      return;
    }

    setIsSavingCategories(true);
    try {
      const updatedCategories = [...categories, targetName];
      await api.adminUpdateSettings(settings, updatedCategories);
      await refreshSettings();
      setNewCategoryName('');
      onShowToast(`Categoría "${targetName}" agregada con éxito.`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al guardar categoría', 'error');
    } finally {
      setIsSavingCategories(false);
    }
  };

  // Save renamed category and offer to auto-reassign existing products
  const handleSaveRenameCategory = async (oldCategory: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldCategory) {
      setEditingCategoryIndex(null);
      return;
    }

    setIsSavingCategories(true);
    try {
      const updatedCategories = categories.map((c) => (c === oldCategory ? trimmedNew : c));
      await api.adminUpdateSettings(settings, updatedCategories);

      // Check if products have oldCategory and reassign them
      const affectedProducts = products.filter((p) => p.category === oldCategory);
      if (affectedProducts.length > 0) {
        for (const p of affectedProducts) {
          await api.adminUpdateProduct(p.id, { category: trimmedNew });
        }
      }

      await refreshSettings();
      await refreshCatalog();
      setEditingCategoryIndex(null);
      onShowToast(
        `Categoría renombrada a "${trimmedNew}" (${affectedProducts.length} productos actualizados).`,
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Error al renombrar categoría', 'error');
    } finally {
      setIsSavingCategories(false);
    }
  };

  // Delete category with validation
  const handleDeleteCategory = (catToDelete: string) => {
    const productCount = productCountByCategory[catToDelete] || 0;
    if (categories.length <= 1) {
      onShowToast('Debes mantener al menos una categoría en la perfumería.', 'error');
      return;
    }

    setConfirmDialog({
      title: 'Eliminar Categoría de Perfumería',
      message:
        productCount > 0
          ? `La categoría "${catToDelete}" tiene ${productCount} producto(s) asignado(s). Si la eliminas, estos productos se moverán a "${categories[0]}". ¿Deseas continuar?`
          : `¿Confirmas que deseas eliminar la categoría "${catToDelete}"?`,
      confirmLabel: 'Eliminar Categoría',
      onConfirm: async () => {
        setIsSavingCategories(true);
        try {
          const fallbackCategory = categories.find((c) => c !== catToDelete) || 'Perfumes Dama';
          const updatedCategories = categories.filter((c) => c !== catToDelete);

          // Reassign affected products
          const affectedProducts = products.filter((p) => p.category === catToDelete);
          for (const p of affectedProducts) {
            await api.adminUpdateProduct(p.id, { category: fallbackCategory });
          }

          await api.adminUpdateSettings(settings, updatedCategories);
          await refreshSettings();
          await refreshCatalog();
          onShowToast(`Categoría "${catToDelete}" eliminada correctamente.`, 'info');
        } catch (err: any) {
          onShowToast(err.message || 'Error al eliminar categoría', 'error');
        } finally {
          setIsSavingCategories(false);
        }
      },
    });
  };

  // Reorder category (move up or down)
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...categories];
    const item = reordered.splice(index, 1)[0];
    reordered.splice(newIndex, 0, item);

    setIsSavingCategories(true);
    try {
      await api.adminUpdateSettings(settings, reordered);
      await refreshSettings();
      onShowToast('Orden de categorías actualizado.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al reordenar', 'error');
    } finally {
      setIsSavingCategories(false);
    }
  };

  // Batch CSV Import
  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setIsImportingCsv(true);
    try {
      const res = await api.adminImportCsv(csvText);
      onShowToast(res.message || 'Productos importados con éxito', 'success');
      setShowCsvModal(false);
      setCsvText('');
      await refreshCatalog();
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Error al importar CSV', 'error');
    } finally {
      setIsImportingCsv(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Nombre',
      'Marca',
      'Categoria',
      'Precio_Venta_MXN',
      'Precio_Oferta_MXN',
      'Precio_Costo_MXN',
      'Precio_Mayoreo_MXN',
      'Stock',
      'Estado',
      'SKU',
      'Familia_Olfativa',
      'Notas',
      'Presentacion',
    ];
    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.price,
      p.salePrice || '',
      p.costPrice || '',
      p.wholesalePrice || '',
      p.stock,
      `"${p.status}"`,
      `"${p.sku || ''}"`,
      `"${(p.olfactoryFamily || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${(p.presentation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dsantos_catalogo_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Catálogo descargado en formato CSV.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-tab Navigation */}
      <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#D6A34A]/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#D6A34A] tracking-wider uppercase">
                Módulo Central
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-[11px] text-stone-400">
                {products.length} productos en {categories.length} categorías
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-luxury gold-gradient-text">
              Gestión Integral del Catálogo
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Administra perfumes, define esquemas de precios y márgenes, y organiza las categorías de la perfumería.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#B88628] hover:from-[#E5B55E] hover:to-[#C69332] text-black font-semibold text-xs transition shadow-md shadow-[#D6A34A]/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar Nuevo Producto</span>
            </button>

            <button
              onClick={() => setShowCsvModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-[#D6A34A] text-xs text-stone-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
              title="Importar catálogo masivo vía CSV"
            >
              <Upload className="w-3.5 h-3.5 text-[#D6A34A]" />
              <span>Importar CSV</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-[#D6A34A] text-xs text-stone-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
              title="Descargar catálogo completo a CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#D6A34A]" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Pills Bar */}
        <div className="flex border-t border-stone-800/80 mt-5 pt-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'products'
                ? 'bg-[#D6A34A] text-black shadow-md shadow-[#D6A34A]/20'
                : 'bg-stone-900/80 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos & Fragancias ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'pricing'
                ? 'bg-[#D6A34A] text-black shadow-md shadow-[#D6A34A]/20'
                : 'bg-stone-900/80 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Definición de Precios & Márgenes</span>
            {pricingSummary.productsOnSale > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {pricingSummary.productsOnSale} en oferta
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'categories'
                ? 'bg-[#D6A34A] text-black shadow-md shadow-[#D6A34A]/20'
                : 'bg-stone-900/80 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categorías de Perfumería ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: PRODUCT LIST & LOADER */}
      {/* ================================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#111] p-4 rounded-2xl border border-stone-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar perfume por nombre, marca, SKU o notas olfativas..."
                className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 pl-9 pr-3 text-stone-100 placeholder-stone-500 outline-none"
              />
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-200 outline-none cursor-pointer"
              >
                <option value="Todas">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c} ({productCountByCategory[c] || 0})
                  </option>
                ))}
              </select>

              {/* Brand Dropdown */}
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-200 outline-none cursor-pointer"
              >
                <option value="Todas">Todas las marcas</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-200 outline-none cursor-pointer"
              >
                <option value="todos">Todos los estados</option>
                <option value="disponible">En existencia (&gt;0)</option>
                <option value="agotado">Agotados (0)</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>

          {/* Table of Products */}
          <div className="bg-[#121212] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#181818] border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fragancia & Marca</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Presentación & Familia</th>
                    <th className="py-3 px-4">Precios (PVP / Oferta)</th>
                    <th className="py-3 px-4">Existencia</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <Package className="w-10 h-10 mx-auto text-stone-600 mb-2" />
                        <p className="text-sm font-semibold text-stone-300">No se encontraron productos</p>
                        <p className="text-xs text-stone-500 mt-1">
                          Prueba ajustando los filtros de búsqueda o agrega un nuevo producto al catálogo.
                        </p>
                        <button
                          onClick={handleOpenCreateModal}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#D6A34A] text-black font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cargar Primer Producto</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const hasSale = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
                      return (
                        <tr key={p.id} className="hover:bg-stone-900/50 transition">
                          {/* Fragrance & Brand */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border border-stone-800 bg-black overflow-hidden shrink-0 relative">
                                <img
                                  src={p.images?.[0] || '/logo.png'}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/logo.png';
                                  }}
                                />
                                {hasSale && (
                                  <span className="absolute top-0 right-0 bg-red-600 text-[8px] font-bold text-white px-1 rounded-bl">
                                    OFERTA
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-stone-100 hover:text-[#F5D58A] transition block leading-tight">
                                  {p.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                                  <span className="text-[#D6A34A] font-medium">{p.brand}</span>
                                  {p.sku && <span>• SKU: {p.sku}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-stone-300">
                            <span className="font-medium text-stone-200">{p.category}</span>
                          </td>

                          {/* Presentation & Notes */}
                          <td className="py-3 px-4 text-stone-400">
                            <div className="text-stone-300 font-medium">{p.presentation}</div>
                            {p.olfactoryFamily && (
                              <div className="text-[10px] text-stone-500 mt-0.5">{p.olfactoryFamily}</div>
                            )}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4">
                            {inlinePriceEdit?.id === p.id && inlinePriceEdit.field === 'price' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={inlinePriceEdit.value}
                                  onChange={(e) =>
                                    setInlinePriceEdit({ ...inlinePriceEdit, value: e.target.value })
                                  }
                                  className="w-20 bg-black border border-[#D6A34A] rounded px-1.5 py-0.5 text-stone-100 text-xs"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveInline(p.id)}
                                  disabled={isSavingInline}
                                  className="p-1 text-emerald-400 hover:bg-stone-800 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setInlinePriceEdit(null)}
                                  className="p-1 text-stone-400 hover:bg-stone-800 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  setInlinePriceEdit({
                                    id: p.id,
                                    field: 'price',
                                    value: String(p.price),
                                  })
                                }
                                className="cursor-pointer group flex items-baseline gap-1.5"
                                title="Clic para editar precio regular"
                              >
                                {hasSale ? (
                                  <>
                                    <span className="text-red-400 font-bold text-sm">
                                      ${p.salePrice?.toFixed(2)}
                                    </span>
                                    <span className="text-stone-500 line-through text-[11px]">
                                      ${p.price.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[#F5D58A] font-bold text-sm group-hover:text-white">
                                    ${p.price.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-[10px] text-stone-500">MXN</span>
                              </div>
                            )}
                          </td>

                          {/* Stock */}
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold ${
                                p.stock === 0
                                  ? 'text-red-400'
                                  : p.stock <= (settings.lowStockThreshold || 3)
                                  ? 'text-amber-400'
                                  : 'text-stone-200'
                              }`}
                            >
                              {p.stock} pzas
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`text-[11px] font-medium ${
                                p.status === 'disponible' && p.stock > 0
                                  ? 'text-emerald-400'
                                  : p.status === 'ultimas_piezas'
                                  ? 'text-amber-400'
                                  : p.status === 'agotado' || p.stock === 0
                                  ? 'text-red-400'
                                  : 'text-stone-500'
                              }`}
                            >
                              {p.status === 'disponible' && p.stock > 0
                                ? '● Disponible'
                                : p.status === 'ultimas_piezas'
                                ? '● Últimas piezas'
                                : p.status === 'agotado' || p.stock === 0
                                ? '● Agotado'
                                : '● Inactivo'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded-lg text-stone-300 hover:text-[#F5D58A] hover:bg-stone-800 transition cursor-pointer"
                                title="Editar perfume y precios"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateProduct(p)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
                                title="Duplicar producto"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition cursor-pointer"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* ================================================================= */}
      {/* SUB-TAB 2: PRICE DEFINITION & PROFIT MARGIN STRATEGY */}
      {/* ================================================================= */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-6">
          {/* Metrics summary cards for pricing strategy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-4">
              <span className="text-[11px] text-stone-400 font-medium">Valor Total Catálogo (PVP)</span>
              <div className="text-xl font-bold font-serif-luxury text-[#F5D58A] mt-1">
                ${pricingSummary.totalInventoryValueSale.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </div>
              <p className="text-[10px] text-stone-500 mt-1">Calculado sobre existencias actuales</p>
            </div>

            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-4">
              <span className="text-[11px] text-stone-400 font-medium">Costo de Inversión</span>
              <div className="text-xl font-bold font-serif-luxury text-stone-200 mt-1">
                ${pricingSummary.totalInventoryCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </div>
              <p className="text-[10px] text-stone-500 mt-1">{pricingSummary.productsWithCost} productos con costo asignado</p>
            </div>

            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-4">
              <span className="text-[11px] text-stone-400 font-medium">Ganancia Bruta Estimada</span>
              <div className="text-xl font-bold font-serif-luxury text-emerald-400 mt-1">
                ${pricingSummary.estimatedGrossProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </div>
              <p className="text-[10px] text-emerald-500 mt-1">Margen comercial proyectado</p>
            </div>

            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-4">
              <span className="text-[11px] text-stone-400 font-medium">Margen Promedio Global</span>
              <div className="text-xl font-bold font-serif-luxury text-[#D6A34A] mt-1">
                {pricingSummary.avgMarginPercent}%
              </div>
              <p className="text-[10px] text-stone-500 mt-1">{pricingSummary.productsOnSale} fragancias en precio de oferta</p>
            </div>
          </div>

          {/* Pricing Table with Direct Inline Editing */}
          <div className="bg-[#121212] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-stone-800 bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold font-serif-luxury text-[#F5D58A] text-sm sm:text-base">
                  Matriz de Precios y Márgenes por Producto
                </h3>
                <p className="text-xs text-stone-400">
                  Haz clic en cualquier celda para editar el precio de costo, PVP regular, precio oferta o mayoreo sin abrir ventanas.
                </p>
              </div>
              <div className="text-xs text-stone-400">
                Mostrando <span className="text-white font-semibold">{filteredProducts.length}</span> perfumes
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#181818] border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fragancia</th>
                    <th className="py-3 px-4">Precio Costo (Prov.)</th>
                    <th className="py-3 px-4">Precio Venta (PVP)</th>
                    <th className="py-3 px-4">Precio Oferta</th>
                    <th className="py-3 px-4">Precio Mayoreo</th>
                    <th className="py-3 px-4">Ganancia Neta</th>
                    <th className="py-3 px-4">Margen %</th>
                    <th className="py-3 px-4 text-right">Edición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredProducts.map((p) => {
                    const cost = p.costPrice || 0;
                    const effectivePrice = p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
                    const profit = cost > 0 ? effectivePrice - cost : 0;
                    const marginPercent = cost > 0 && effectivePrice > 0 ? ((profit / effectivePrice) * 100).toFixed(1) : null;

                    return (
                      <tr key={p.id} className="hover:bg-stone-900/50 transition">
                        {/* Name and brand */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-100">{p.name}</div>
                          <div className="text-[11px] text-stone-400">{p.brand} • {p.category}</div>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4">
                          {inlinePriceEdit?.id === p.id && inlinePriceEdit.field === 'costPrice' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={inlinePriceEdit.value}
                                onChange={(e) =>
                                  setInlinePriceEdit({ ...inlinePriceEdit, value: e.target.value })
                                }
                                className="w-20 bg-black border border-[#D6A34A] rounded px-1.5 py-0.5 text-stone-100 text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInline(p.id)}
                                disabled={isSavingInline}
                                className="p-1 text-emerald-400 hover:bg-stone-800 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInlinePriceEdit(null)}
                                className="p-1 text-stone-400 hover:bg-stone-800 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setInlinePriceEdit({
                                  id: p.id,
                                  field: 'costPrice',
                                  value: p.costPrice !== undefined ? String(p.costPrice) : '',
                                })
                              }
                              className="text-stone-300 hover:text-[#F5D58A] transition cursor-pointer font-medium"
                              title="Editar costo proveedor"
                            >
                              {p.costPrice !== undefined ? `$${p.costPrice.toFixed(2)}` : <span className="text-stone-600 italic">Sin costo</span>}
                            </button>
                          )}
                        </td>

                        {/* Regular Price (PVP) */}
                        <td className="py-3 px-4">
                          {inlinePriceEdit?.id === p.id && inlinePriceEdit.field === 'price' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={inlinePriceEdit.value}
                                onChange={(e) =>
                                  setInlinePriceEdit({ ...inlinePriceEdit, value: e.target.value })
                                }
                                className="w-20 bg-black border border-[#D6A34A] rounded px-1.5 py-0.5 text-stone-100 text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInline(p.id)}
                                disabled={isSavingInline}
                                className="p-1 text-emerald-400 hover:bg-stone-800 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInlinePriceEdit(null)}
                                className="p-1 text-stone-400 hover:bg-stone-800 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setInlinePriceEdit({
                                  id: p.id,
                                  field: 'price',
                                  value: String(p.price),
                                })
                              }
                              className="text-[#F5D58A] font-bold hover:text-white transition cursor-pointer"
                              title="Editar precio regular PVP"
                            >
                              ${p.price.toFixed(2)}
                            </button>
                          )}
                        </td>

                        {/* Sale Price */}
                        <td className="py-3 px-4">
                          {inlinePriceEdit?.id === p.id && inlinePriceEdit.field === 'salePrice' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={inlinePriceEdit.value}
                                placeholder="0 para quitar"
                                onChange={(e) =>
                                  setInlinePriceEdit({ ...inlinePriceEdit, value: e.target.value })
                                }
                                className="w-20 bg-black border border-[#D6A34A] rounded px-1.5 py-0.5 text-stone-100 text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInline(p.id)}
                                disabled={isSavingInline}
                                className="p-1 text-emerald-400 hover:bg-stone-800 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInlinePriceEdit(null)}
                                className="p-1 text-stone-400 hover:bg-stone-800 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setInlinePriceEdit({
                                  id: p.id,
                                  field: 'salePrice',
                                  value: p.salePrice !== undefined ? String(p.salePrice) : '',
                                })
                              }
                              className={`transition cursor-pointer font-medium ${
                                p.salePrice && p.salePrice > 0 ? 'text-red-400 font-bold' : 'text-stone-600 hover:text-stone-400'
                              }`}
                              title="Editar precio promocional"
                            >
                              {p.salePrice && p.salePrice > 0 ? `$${p.salePrice.toFixed(2)}` : 'Sin oferta'}
                            </button>
                          )}
                        </td>

                        {/* Wholesale Price */}
                        <td className="py-3 px-4">
                          {inlinePriceEdit?.id === p.id && inlinePriceEdit.field === 'wholesalePrice' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={inlinePriceEdit.value}
                                onChange={(e) =>
                                  setInlinePriceEdit({ ...inlinePriceEdit, value: e.target.value })
                                }
                                className="w-20 bg-black border border-[#D6A34A] rounded px-1.5 py-0.5 text-stone-100 text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInline(p.id)}
                                disabled={isSavingInline}
                                className="p-1 text-emerald-400 hover:bg-stone-800 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInlinePriceEdit(null)}
                                className="p-1 text-stone-400 hover:bg-stone-800 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setInlinePriceEdit({
                                  id: p.id,
                                  field: 'wholesalePrice',
                                  value: p.wholesalePrice !== undefined ? String(p.wholesalePrice) : '',
                                })
                              }
                              className="text-stone-300 hover:text-[#F5D58A] transition cursor-pointer"
                              title="Editar precio mayoreo"
                            >
                              {p.wholesalePrice !== undefined ? `$${p.wholesalePrice.toFixed(2)}` : <span className="text-stone-600 italic">-</span>}
                            </button>
                          )}
                        </td>

                        {/* Net Profit */}
                        <td className="py-3 px-4 font-semibold">
                          {cost > 0 ? (
                            <span className={profit > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              ${profit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-stone-600">-</span>
                          )}
                        </td>

                        {/* Margin % */}
                        <td className="py-3 px-4">
                          {marginPercent !== null ? (
                            <span
                              className={`font-bold ${
                                parseFloat(marginPercent) >= 40
                                  ? 'text-emerald-400'
                                  : parseFloat(marginPercent) >= 20
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {marginPercent}%
                            </span>
                          ) : (
                            <span className="text-stone-600">-</span>
                          )}
                        </td>

                        {/* Full Edit Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium transition cursor-pointer"
                          >
                            Editar Completo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: PERFUME CATEGORY MANAGEMENT */}
      {/* ================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Section */}
          <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold font-serif-luxury text-[#F5D58A] text-base mb-1">
              Agregar Nueva Categoría de Perfumería
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Crea categorías personalizadas para organizar tus perfumes en la tienda pública y en los filtros de navegación.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCategory();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej. Perfumes Nicho, Fragancias Árabes, Tendencia Fraiche..."
                  className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 pl-9 pr-3 text-stone-100 placeholder-stone-500 text-xs outline-none"
                />
                <Tag className="w-4 h-4 text-[#D6A34A] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="submit"
                disabled={isSavingCategories || !newCategoryName.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#B88628] hover:from-[#E5B55E] hover:to-[#C69332] text-black font-semibold text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Categoría</span>
              </button>
            </form>

            {/* Quick suggested categories */}
            <div className="mt-4 pt-3 border-t border-stone-800/80">
              <span className="text-[11px] text-stone-500 block mb-2 font-medium">
                Sugerencias populares de perfumería (clic para agregar):
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PERFUME_CATEGORIES.filter((preset) => !categories.includes(preset)).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddCategory(preset)}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-[#D6A34A] text-stone-300 hover:text-white text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-[#D6A34A]" />
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List and Ordering of Existing Categories */}
          <div className="bg-[#121212] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-stone-800 bg-[#161616] flex items-center justify-between">
              <div>
                <h3 className="font-bold font-serif-luxury text-[#F5D58A] text-sm sm:text-base">
                  Categorías Activas ({categories.length})
                </h3>
                <p className="text-xs text-stone-400">
                  Usa las flechas para ordenar cómo se mostrarán las pestañas en la tienda.
                </p>
              </div>
            </div>

            <div className="divide-y divide-stone-800/60">
              {categories.map((category, index) => {
                const count = productCountByCategory[category] || 0;
                const isEditing = editingCategoryIndex === index;

                return (
                  <div
                    key={category}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-900/40 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Drag / Position indicator */}
                      <span className="w-6 h-6 rounded-md bg-stone-800 text-stone-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <input
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            className="w-full bg-black border border-[#D6A34A] rounded-lg px-3 py-1.5 text-stone-100 text-xs outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRenameCategory(category, editingCategoryValue)}
                            disabled={isSavingCategories}
                            className="p-2 text-emerald-400 hover:bg-stone-800 rounded-lg cursor-pointer"
                            title="Confirmar cambio de nombre"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingCategoryIndex(null)}
                            className="p-2 text-stone-400 hover:bg-stone-800 rounded-lg cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-100 text-sm">{category}</span>
                            <span className="text-xs text-stone-400">({count} productos)</span>
                          </div>
                          <span className="text-[10px] text-stone-500">
                            {count === 0 ? 'Sin productos asignados actualmente' : `Vinculado a ${count} perfume(s) en catálogo`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions: Reorder & Delete */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => handleMoveCategory(index, 'up')}
                          disabled={index === 0 || isSavingCategories}
                          className="p-2 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 transition disabled:opacity-30 cursor-pointer"
                          title="Mover arriba"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleMoveCategory(index, 'down')}
                          disabled={index === categories.length - 1 || isSavingCategories}
                          className="p-2 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 transition disabled:opacity-30 cursor-pointer"
                          title="Mover abajo"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingCategoryIndex(index);
                            setEditingCategoryValue(category);
                          }}
                          className="p-2 rounded-lg bg-stone-900 border border-stone-800 hover:border-[#D6A34A] text-stone-300 hover:text-[#F5D58A] transition cursor-pointer ml-1"
                          title="Renombrar categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(category)}
                          disabled={isSavingCategories}
                          className="p-2 rounded-lg bg-stone-900 border border-stone-800 hover:border-red-600 text-stone-400 hover:text-red-400 transition cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PRODUCT CREATION / EDIT MODAL */}
      {/* ================================================================= */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#121212] border border-[#D6A34A]/50 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#181818] border-b border-stone-800 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D6A34A]/10 border border-[#D6A34A]/40 flex items-center justify-center text-[#D6A34A]">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A]">
                    {editingProduct.id ? 'Editar Perfume / Producto' : 'Cargar Nuevo Perfume al Catálogo'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Define la información olfativa, imágenes, existencias y estructura de precios.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* SECTION 1: ESSENTIAL PRODUCT INFO */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D6A34A] mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Identidad de la Fragancia</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-stone-300 font-medium mb-1">Nombre del Perfume o Producto *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="Ej. Good Girl Suprême, Sauvage Parfum, Concentrado Fraiche 212 VIP..."
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 placeholder-stone-500 outline-none"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Marca o Línea *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.brand || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      placeholder="Ej. Fraiche, Carolina Herrera, Dior..."
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {POPULAR_BRANDS.slice(0, 5).map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, brand })}
                          className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[10px] text-stone-400 hover:text-white hover:border-[#D6A34A] transition cursor-pointer"
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Categoría de Perfumería *</label>
                    <select
                      required
                      value={editingProduct.category || categories[0]}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Presentation / Size */}
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Presentación / Mililitros *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.presentation || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, presentation: e.target.value })}
                      placeholder="Ej. 100 ml, 60 ml concentrado Fraiche, 50 ml EDP, Decant 10 ml..."
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>

                  {/* Olfactory Family */}
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Familia Olfativa</label>
                    <select
                      value={editingProduct.olfactoryFamily || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, olfactoryFamily: e.target.value })}
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none cursor-pointer"
                    >
                      <option value="">Seleccionar familia olfativa...</option>
                      {OLFACTORY_FAMILIES.map((fam) => (
                        <option key={fam} value={fam}>
                          {fam}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Olfactory Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-stone-300 font-medium mb-1">
                      Pirámide Olfativa (Notas de Salida, Corazón y Fondo)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.notes || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, notes: e.target.value })}
                      placeholder="Ej. Salida: Bergamota y Pimienta Rosa; Corazón: Jazmín Sambac; Fondo: Vainilla de Bourbon, Haba Tonka."
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 placeholder-stone-500 outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-stone-300 font-medium mb-1">Descripción / Recomendación de Uso</label>
                    <textarea
                      rows={2}
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Detalles sobre duración, fijación, ocasión recomendada..."
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 placeholder-stone-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRICE DEFINITION & MARGINS */}
              <div className="bg-[#161616] border border-stone-800 rounded-2xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D6A34A] mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>2. Definición de Precios y Esquema de Ganancias</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Regular Price (PVP) */}
                  <div>
                    <label className="block text-stone-200 font-medium mb-1">
                      Precio de Venta (PVP) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D6A34A] font-bold">$</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        required
                        value={editingProduct.price ?? ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0.00"
                        className="w-full bg-[#1c1c1c] border border-stone-700 focus:border-[#D6A34A] rounded-xl py-2 pl-7 pr-3 text-stone-100 font-bold outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Precio público general (MXN)</span>
                  </div>

                  {/* Promotional Sale Price */}
                  <div>
                    <label className="block text-stone-200 font-medium mb-1">
                      Precio Oferta / Promo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={editingProduct.salePrice ?? ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            salePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        placeholder="Opcional"
                        className="w-full bg-[#1c1c1c] border border-stone-700 focus:border-red-500 rounded-xl py-2 pl-7 pr-3 text-red-300 font-bold outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Reemplaza el PVP si es menor</span>
                  </div>

                  {/* Cost Price */}
                  <div>
                    <label className="block text-stone-200 font-medium mb-1">
                      Precio de Costo (Proveedor)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={editingProduct.costPrice ?? ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            costPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        placeholder="Opcional"
                        className="w-full bg-[#1c1c1c] border border-stone-700 focus:border-stone-500 rounded-xl py-2 pl-7 pr-3 text-stone-100 outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Para cálculo de margen neto</span>
                  </div>

                  {/* Wholesale Price */}
                  <div>
                    <label className="block text-stone-200 font-medium mb-1">
                      Precio Mayoreo / Distribuidor
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={editingProduct.wholesalePrice ?? ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            wholesalePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        placeholder="Opcional"
                        className="w-full bg-[#1c1c1c] border border-stone-700 focus:border-stone-500 rounded-xl py-2 pl-7 pr-3 text-stone-100 outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Para pedidos por docena</span>
                  </div>
                </div>

                {/* Profit Margin Preview Bar */}
                {editingProduct.price !== undefined && editingProduct.costPrice !== undefined && editingProduct.costPrice > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-stone-400 text-[10px] block">Ganancia Unitaria Neta:</span>
                        <span className="text-emerald-400 font-bold text-sm">
                          ${(
                            (editingProduct.salePrice && editingProduct.salePrice > 0
                              ? editingProduct.salePrice
                              : editingProduct.price) - editingProduct.costPrice
                          ).toFixed(2)}{' '}
                          MXN
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Margen sobre Venta:</span>
                        <span className="text-[#D6A34A] font-bold text-sm">
                          {(
                            (((editingProduct.salePrice && editingProduct.salePrice > 0
                              ? editingProduct.salePrice
                              : editingProduct.price) -
                              editingProduct.costPrice) /
                              (editingProduct.salePrice && editingProduct.salePrice > 0
                                ? editingProduct.salePrice
                                : editingProduct.price)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Margen saludable sugerido en perfumería fina: <span className="text-stone-200 font-semibold">&gt; 35%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: STOCK & SKU */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D6A34A] mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>3. Inventario y Existencias</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Stock */}
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Existencias Iniciales *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editingProduct.stock ?? 0}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stock: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 font-bold outline-none"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-stone-300 font-medium">SKU / Código</label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            sku: `DSP-${Date.now().toString().slice(-6)}`,
                          })
                        }
                        className="text-[10px] text-[#D6A34A] hover:underline cursor-pointer"
                      >
                        Generar
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      placeholder="DSP-10001"
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Estado en Catálogo</label>
                    <select
                      value={editingProduct.status || 'disponible'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          status: e.target.value as ProductStatus,
                        })
                      }
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 outline-none cursor-pointer"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="ultimas_piezas">Últimas Piezas</option>
                      <option value="agotado">Agotado</option>
                      <option value="inactivo">Inactivo (Oculto)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRODUCT IMAGE */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D6A34A] mb-3 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>4. Fotografía de la Fragancia</span>
                </h4>

                {/* Image tabs */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveImageTab('upload')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      activeImageTab === 'upload'
                        ? 'bg-[#D6A34A] text-black font-semibold'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    Subir de Dispositivo / Cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageTab('gallery')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      activeImageTab === 'gallery'
                        ? 'bg-[#D6A34A] text-black font-semibold'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    Galería Curada de Perfumes
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageTab('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      activeImageTab === 'url'
                        ? 'bg-[#D6A34A] text-black font-semibold'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    Ingresar URL Externa
                  </button>
                </div>

                {imageUploadError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{imageUploadError}</span>
                  </div>
                )}

                {activeImageTab === 'upload' && (
                  <div className="border-2 border-dashed border-stone-800 hover:border-[#D6A34A] rounded-2xl p-6 text-center transition bg-[#181818]/60">
                    <input
                      type="file"
                      accept="image/*"
                      id="fragrance-image-file"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="fragrance-image-file"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-[#D6A34A]">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-stone-200 text-xs">
                        {isUploadingImage ? 'Procesando y comprimiendo imagen...' : 'Selecciona una foto o toma una fotografía'}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Formatos soportados: JPG, PNG, WebP (se optimizará automáticamente).
                      </span>
                    </label>
                  </div>
                )}

                {activeImageTab === 'gallery' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 bg-[#181818] rounded-xl border border-stone-800">
                    {PRESET_PRODUCT_IMAGES.map((preset) => {
                      const isSelected = editingProduct.images?.[0] === preset.url;
                      return (
                        <div
                          key={preset.url}
                          onClick={() => setEditingProduct({ ...editingProduct, images: [preset.url] })}
                          className={`relative rounded-xl overflow-hidden border cursor-pointer group transition ${
                            isSelected ? 'border-[#D6A34A] ring-2 ring-[#D6A34A]/50' : 'border-stone-800 hover:border-stone-600'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-20 object-cover" />
                          <div className="p-1 bg-black/90 text-[10px] text-stone-300 truncate">
                            {preset.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeImageTab === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                      placeholder="https://ejemplo.com/foto-perfume.jpg"
                      className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 placeholder-stone-500 outline-none text-xs"
                    />
                  </div>
                )}

                {/* Image Preview Box */}
                {editingProduct.images && editingProduct.images.length > 0 && editingProduct.images[0] && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-stone-900/80 rounded-xl border border-stone-800">
                    <img
                      src={editingProduct.images[0]}
                      alt="Vista previa"
                      className="w-14 h-14 object-cover rounded-lg border border-stone-700 bg-black"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                    <div className="flex-1 truncate">
                      <span className="text-stone-300 font-medium block text-xs truncate">
                        Imagen Seleccionada
                      </span>
                      <span className="text-[10px] text-stone-500 truncate block">
                        {editingProduct.images[0]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-stone-800 pt-4 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#B88628] hover:from-[#E5B55E] hover:to-[#C69332] text-black font-bold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-[#D6A34A]/20 flex items-center gap-2"
                >
                  {isSavingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProduct.id ? 'Guardar Cambios' : 'Dar de Alta Perfume'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* BATCH CSV IMPORT MODAL */}
      {/* ================================================================= */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121212] border border-[#D6A34A]/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold font-serif-luxury text-[#F5D58A] text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#D6A34A]" />
                <span>Importación Masiva de Perfumes vía CSV</span>
              </h3>
              <button
                onClick={() => setShowCsvModal(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Pega aquí el contenido de un archivo CSV con las columnas:{' '}
              <code className="text-[#D6A34A]">
                nombre,marca,categoria,precio,stock,presentacion,sku,notas
              </code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`nombre,marca,categoria,precio,stock,presentacion,sku,notas\n"Good Girl Suprême","Carolina Herrera","Perfumes Dama",1850,4,"100 ml EDP","CH-001","Jazmín Sambac, Haba Tonka"\n"Concentrado Tendencia Sauvage","Fraiche","Fraiche Tendencia",480,10,"60 ml concentrado","FR-002","Bergamota, Ambroxan"`}
              className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl p-3 text-stone-100 font-mono text-[11px] outline-none resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportCsv}
                disabled={isImportingCsv || !csvText.trim()}
                className="px-5 py-2 rounded-xl bg-[#D6A34A] text-black font-semibold text-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isImportingCsv ? 'Procesando...' : 'Importar al Catálogo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* IN-APP CONFIRMATION DIALOG (No window.confirm in iframe) */}
      {/* ================================================================= */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161616] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-700/60 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100 font-serif-luxury">
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs cursor-pointer transition shadow-md shadow-red-900/30"
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
