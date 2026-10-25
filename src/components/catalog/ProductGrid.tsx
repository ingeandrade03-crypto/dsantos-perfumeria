import React, { useMemo, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product } from '../../types';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Bell,
  Eye,
  MessageCircle,
  Check,
  AlertCircle,
  X,
  Plus,
  Minus,
} from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const {
    products,
    categories,
    settings,
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
    openModal,
    addToCart,
    isAdmin,
    setCurrentView,
  } = useShop();

  const [addedPopupId, setAddedPopupId] = useState<string | null>(null);

  // Extract all unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);
    return ['todas', ...list];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Hide inactive from public catalog
        if (p.status === 'inactivo') return false;

        // Category filter
        if (selectedCategory !== 'Todas' && p.category !== selectedCategory) {
          return false;
        }

        // Brand filter
        if (selectedBrand !== 'todas' && p.brand !== selectedBrand) {
          return false;
        }

        // Availability filter
        if (selectedAvailability === 'disponible') {
          if (p.stock === 0 || p.status === 'agotado') return false;
        } else if (selectedAvailability === 'agotado') {
          if (p.stock > 0 && p.status !== 'agotado') return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(term);
          const matchBrand = p.brand.toLowerCase().includes(term);
          const matchCategory = p.category.toLowerCase().includes(term);
          const matchOlf = p.olfactoryFamily?.toLowerCase().includes(term);
          const matchNotes = p.notes?.toLowerCase().includes(term);
          const matchDesc = p.description.toLowerCase().includes(term);
          if (!matchName && !matchBrand && !matchCategory && !matchOlf && !matchNotes && !matchDesc) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === 'precio_asc') return a.price - b.price;
        if (selectedSort === 'precio_desc') return b.price - a.price;
        if (selectedSort === 'novedades') {
          const aNew = a.tags?.includes('nuevo') ? 1 : 0;
          const bNew = b.tags?.includes('nuevo') ? 1 : 0;
          return bNew - aNew;
        }
        if (selectedSort === 'mas_vendidos') {
          const aPop = a.tags?.includes('mas_vendido') ? 1 : 0;
          const bPop = b.tags?.includes('mas_vendido') ? 1 : 0;
          return bPop - aPop;
        }
        // Default 'destacados'
        const aDest = a.tags?.includes('destacado') ? 1 : 0;
        const bDest = b.tags?.includes('destacado') ? 1 : 0;
        return bDest - aDest;
      });
  }, [products, selectedCategory, selectedBrand, selectedAvailability, searchTerm, selectedSort]);

  const handleAddToCart = (product: Product) => {
    const res = addToCart(product, 1);
    if (res.success) {
      setAddedPopupId(product.id);
      setTimeout(() => setAddedPopupId(null), 1800);
    }
  };

  const cleanPhone = settings.whatsappPhone.replace(/\D/g, '');

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Catalog Title and Counts */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#D6A34A]/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D98DA5] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A34A]" />
            <span>Colección Oficial</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury gold-gradient-text">
            Catálogo D'Santos Perfumería
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'} con inventario y precios reales en Pesos Mexicanos (MXN).
          </p>
        </div>

        {/* Search status or active reset */}
        {(searchTerm || selectedCategory !== 'Todas' || selectedBrand !== 'todas' || selectedAvailability !== 'todos') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Todas');
              setSelectedBrand('todas');
              setSelectedAvailability('todos');
            }}
            className="self-start md:self-auto text-xs text-[#F5D58A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar todos los filtros</span>
          </button>
        )}
      </div>

      {/* Filter and Sorting Controls Toolbar */}
      <div className="bg-[#121212] border border-[#D6A34A]/25 rounded-2xl p-4 sm:p-5 mb-8 shadow-lg">
        {/* Horizontal Category Slider / Pills */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
            Categoría:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('Todas')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'Todas'
                  ? 'bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black shadow-md'
                  : 'bg-[#181818] border border-stone-800 text-stone-300 hover:border-[#D6A34A]/40'
              }`}
            >
              Todas ({products.filter((p) => p.status !== 'inactivo').length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat && p.status !== 'inactivo').length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold shadow-md'
                      : 'bg-[#181818] border border-stone-800 text-stone-300 hover:border-[#D6A34A]/40'
                  }`}
                >
                  {cat} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-800/80 text-xs">
          {/* Brand Filter */}
          <div>
            <label className="block text-stone-400 mb-1 font-medium">Marca:</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-200 outline-none"
            >
              <option value="todas">Todas las marcas</option>
              {brands
                .filter((b) => b !== 'todas')
                .map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-stone-400 mb-1 font-medium">Disponibilidad:</label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-200 outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Solo en existencia</option>
              <option value="agotado">Productos agotados (solicitar aviso)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-stone-400 mb-1 font-medium">Ordenar por:</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-200 outline-none"
            >
              <option value="destacados">Destacados de la boutique</option>
              <option value="precio_asc">Precio: Menor a Mayor</option>
              <option value="precio_desc">Precio: Mayor a Menor</option>
              <option value="novedades">Novedades recién llegadas</option>
              <option value="mas_vendidos">Más vendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State when no products in catalog at all */}
      {products.length === 0 && (
        <div className="bg-[#121212] border border-[#D6A34A]/40 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D6A34A]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-[#D6A34A]/10 border border-[#D6A34A]/40 flex items-center justify-center mx-auto mb-4 text-[#D6A34A]">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif-luxury text-[#F5D58A] mb-2">
            Catálogo en Renovación
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
            El inventario precargado ha sido eliminado para dar paso a la nueva selección oficial de fragancias Fraiche, perfumes originales y cosméticos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `¡Hola Alba! Estoy viendo la tienda de D'Santos Perfumería y me gustaría cotizar o pedir una fragancia directamente contigo.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Pedir por WhatsApp a Alba</span>
            </a>

            {isAdmin ? (
              <button
                onClick={() => setCurrentView('admin')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition shadow-md cursor-pointer"
              >
                + Gestionar Inventario (Panel)
              </button>
            ) : (
              <button
                onClick={() => openModal('admin_login')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-stone-700 hover:border-[#D6A34A] text-stone-300 hover:text-white text-xs font-medium cursor-pointer"
              >
                Acceso Administradora
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State when filters return 0 results */}
      {products.length > 0 && filteredProducts.length === 0 && (
        <div className="bg-[#121212] border border-[#D6A34A]/30 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#D6A34A]/10 border border-[#D6A34A]/40 flex items-center justify-center mx-auto mb-4 text-[#D6A34A]">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-serif-luxury text-[#F5D58A] mb-2">
            No encontramos productos con ese criterio
          </h3>
          <p className="text-xs text-stone-300 leading-relaxed mb-6">
            Si estás buscando una fragancia Fraiche específica, un perfume original que no ves en lista o un cosmético agotado, ¡Alba te lo consigue directamente!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `¡Hola Alba! Estuve buscando "${searchTerm || selectedCategory}" en la tienda de D'Santos Perfumería y me gustaría saber si la tienes disponible o me la puedes cotizar.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Solicitar este producto a Alba por WhatsApp</span>
            </a>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas');
                setSelectedBrand('todas');
                setSelectedAvailability('todos');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-medium"
            >
              Ver todo el catálogo
            </button>
          </div>
        </div>
      )}

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const isOutOfStock = product.stock === 0 || product.status === 'agotado';
          const isLowStock = !isOutOfStock && (product.stock <= (settings.lowStockThreshold || 3) || product.status === 'ultimas_piezas');
          const isAvailable = !isOutOfStock;

          const whatsappAskUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
            `¡Hola Alba! Me interesa el perfume "${product.name}" (${product.brand}) que vi en D'Santos Perfumería. ¿Podrías brindarme más detalles?`
          )}`;

          return (
            <div
              key={product.id}
              className="group relative flex flex-col rounded-2xl bg-[#111111] border border-[#D6A34A]/20 hover:border-[#D6A34A]/60 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Product Image Section */}
              <div className="relative aspect-square w-full overflow-hidden bg-black/60 flex items-center justify-center p-3">
                <img
                  src={product.images[0] || '/logo.png'}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />

                {/* Status Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {/* Stock State Badge */}
                  {isOutOfStock ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-700/60 shadow-md">
                      Agotado
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-600/60 shadow-md animate-pulse">
                      Últimas {product.stock} piezas
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-md">
                      Disponible ({product.stock})
                    </span>
                  )}

                  {/* Commercial Tag Badge */}
                  {product.tags?.map((tag) => {
                    if (tag === 'nuevo') {
                      return (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#D6A34A] text-black">
                          Nuevo
                        </span>
                      );
                    }
                    if (tag === 'destacado') {
                      return (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#D98DA5] text-white">
                          Destacado
                        </span>
                      );
                    }
                    if (tag === 'mas_vendido') {
                      return (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-900 text-purple-200 border border-purple-600/40">
                          Top Ventas
                        </span>
                      );
                    }
                    if (tag === 'promocion') {
                      return (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-900 text-rose-200 border border-rose-600/40">
                          Promoción
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Quick View Button on Image */}
                <button
                  onClick={() => openModal('product_detail', product)}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-black/75 hover:bg-[#D6A34A] text-white hover:text-black border border-white/20 transition-all shadow-md opacity-90 group-hover:opacity-100 cursor-pointer"
                  title="Ver detalle del producto"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Product Info Section */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-[#D98DA5]">
                      {product.brand}
                    </span>
                    <span className="truncate max-w-[120px] text-stone-400">
                      {product.presentation}
                    </span>
                  </div>

                  <h3
                    onClick={() => openModal('product_detail', product)}
                    className="text-sm font-bold text-stone-100 hover:text-[#F5D58A] transition-colors line-clamp-1 cursor-pointer font-serif-luxury"
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {product.olfactoryFamily && (
                    <p className="text-[11px] text-stone-400 italic line-clamp-1 mt-0.5">
                      {product.olfactoryFamily}
                    </p>
                  )}

                  {product.notes && (
                    <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                      Notas: {product.notes}
                    </p>
                  )}
                </div>

                {/* Price and Action Buttons */}
                <div className="mt-4 pt-3 border-t border-stone-800">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-xs text-stone-400">Precio:</span>
                      {product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? (
                        <div className="flex items-baseline gap-2">
                          <p className="text-lg font-bold text-red-400">
                            ${product.salePrice.toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-stone-400">MXN</span>
                          </p>
                          <span className="text-xs text-stone-500 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-[#F5D58A]">
                          ${product.price.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-stone-400">MXN</span>
                        </p>
                      )}
                    </div>

                    <a
                      href={whatsappAskUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full text-emerald-400 hover:bg-emerald-950/60 transition"
                      title="Preguntar por WhatsApp a Alba"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Primary CTA Button */}
                  {isAvailable ? (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                          addedPopupId === product.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black hover:brightness-110'
                        }`}
                      >
                        {addedPopupId === product.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>¡Agregado al Carrito!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>Agregar al Carrito</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Priority Restock Notification Button */
                    <button
                      onClick={() => openModal('restock_modal', product)}
                      className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#241a18] hover:bg-[#382320] text-[#ffb0a3] border border-[#a8473a]/50 shadow-md active:scale-95"
                    >
                      <Bell className="w-3.5 h-3.5 animate-bounce" />
                      <span>Avísame cuando esté disponible</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
