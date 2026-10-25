import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product } from '../../types';
import {
  X,
  ShoppingBag,
  Bell,
  MessageCircle,
  Sparkles,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProduct,
    closeModal,
    openModal,
    addToCart,
    settings,
    products,
  } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  if (!selectedProduct) return null;

  const isOutOfStock = selectedProduct.stock === 0 || selectedProduct.status === 'agotado';
  const isLowStock = !isOutOfStock && selectedProduct.stock <= (settings.lowStockThreshold || 3);
  const cleanPhone = settings.whatsappPhone.replace(/\D/g, '');

  const handleAdd = () => {
    const res = addToCart(selectedProduct, quantity);
    if (res.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const directWhatsAppBuy = () => {
    const message = `¡Hola Alba! Me interesa comprar directamente el siguiente producto de D'Santos Perfumería:\n\n✨ *${selectedProduct.name}*\n🏷️ Marca: ${selectedProduct.brand}\n📦 Presentación: ${selectedProduct.presentation}\n🔢 Cantidad: ${quantity}\n💰 Total: $${(selectedProduct.price * quantity).toFixed(2)} MXN\n\n¿Tienes disponible para entrega inmediata o recogida?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Find related products in the same category or brand
  const relatedProducts = products
    .filter((p) => p.id !== selectedProduct.id && (p.category === selectedProduct.category || p.brand === selectedProduct.brand) && p.status !== 'inactivo')
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#121212] border border-[#D6A34A]/40 shadow-2xl overflow-hidden text-stone-100 my-8">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Left Column: Images */}
          <div className="space-y-3">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black/80 border border-stone-800 flex items-center justify-center p-3 relative">
              <img
                src={selectedProduct.images[selectedImageIndex] || '/logo.png'}
                alt={selectedProduct.name}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                {isOutOfStock ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-700/60 shadow-lg">
                    Agotado
                  </span>
                ) : isLowStock ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-600/60 shadow-lg animate-pulse">
                    Últimas {selectedProduct.stock} piezas
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-600/50 shadow-lg">
                    Disponible ({selectedProduct.stock})
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail navigation if multiple images */}
            {selectedProduct.images.length > 1 && (
              <div className="flex gap-2">
                {selectedProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                      selectedImageIndex === idx ? 'border-[#D6A34A]' : 'border-stone-800 opacity-60'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold uppercase tracking-wider text-[#D98DA5]">
                  {selectedProduct.brand}
                </span>
                <span className="text-stone-400">
                  SKU: {selectedProduct.sku || 'N/A'}
                </span>
              </div>

              <h2 className="text-2xl font-bold font-serif-luxury text-stone-100 mt-1 gold-gradient-text">
                {selectedProduct.name}
              </h2>

              <p className="text-xs text-stone-400 mt-0.5">
                Categoría: <span className="text-stone-300 font-medium">{selectedProduct.category}</span>
                {selectedProduct.subcategory && ` • ${selectedProduct.subcategory}`}
              </p>

              {/* Price Banner */}
              <div className="mt-3 p-3 rounded-2xl bg-[#191919] border border-[#D6A34A]/25 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block">Precio en boutique:</span>
                  {selectedProduct.salePrice && selectedProduct.salePrice > 0 && selectedProduct.salePrice < selectedProduct.price ? (
                    <div className="flex items-baseline gap-2.5">
                      <p className="text-2xl font-black text-red-400">
                        ${selectedProduct.salePrice.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-stone-400">MXN</span>
                      </p>
                      <span className="text-sm text-stone-500 line-through">
                        ${selectedProduct.price.toFixed(2)}
                      </span>
                      <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        OFERTA
                      </span>
                    </div>
                  ) : (
                    <p className="text-2xl font-black text-[#F5D58A]">
                      ${selectedProduct.price.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-stone-400">MXN</span>
                    </p>
                  )}
                </div>
                <div className="text-right text-[11px] text-stone-400">
                  <span className="block font-medium text-stone-300">{selectedProduct.presentation}</span>
                  <span>IVA Incluido</span>
                </div>
              </div>

              {/* Olfactory Details */}
              {selectedProduct.olfactoryFamily && (
                <div className="mt-3 text-xs bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                  <p className="font-semibold text-[#F5D58A] flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D6A34A]" />
                    Familia Olfativa: {selectedProduct.olfactoryFamily}
                  </p>
                  {selectedProduct.notes && (
                    <p className="text-stone-300 text-[11px]">
                      <strong>Pirámide de Notas:</strong> {selectedProduct.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mt-3">
                <p className="text-xs text-stone-300 leading-relaxed max-h-36 overflow-y-auto pr-1">
                  {selectedProduct.description}
                </p>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="pt-3 border-t border-stone-800 space-y-3">
              {!isOutOfStock ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-300 font-medium">Cantidad a ordenar:</span>
                    <div className="flex items-center gap-3 bg-[#181818] border border-stone-800 rounded-full px-3 py-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-stone-400 hover:text-white p-1"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-stone-100 min-w-5 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                        className="text-stone-400 hover:text-white p-1"
                        disabled={quantity >= selectedProduct.stock}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={handleAdd}
                      className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black hover:brightness-110 active:scale-95'
                      }`}
                    >
                      {isAdded ? (
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

                    <button
                      onClick={directWhatsAppBuy}
                      className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Pedir por WhatsApp</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Out of stock restock alert button */
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-200">
                    <p className="font-semibold mb-0.5">Este artículo se encuentra agotado temporalmente.</p>
                    <p className="text-[11px] text-stone-400">
                      Regístrate para que Alba te avise directamente a tu WhatsApp cuando vuelva a llegar existencia.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      closeModal();
                      openModal('restock_modal', selectedProduct);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-[#D6A34A] text-black hover:brightness-110 shadow-lg cursor-pointer active:scale-95"
                  >
                    <Bell className="w-4 h-4 animate-bounce" />
                    <span>Avísame cuando esté disponible</span>
                  </button>
                </div>
              )}

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-stone-400 border-t border-stone-800/80">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D6A34A]" />
                  <span>Calidad boutique garantizada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#D98DA5]" />
                  <span>Entrega local o recogida</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Bar */}
        {relatedProducts.length > 0 && (
          <div className="p-6 bg-[#0a0a0a] border-t border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] mb-3">
              También te podría interesar:
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => openModal('product_detail', rel)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-[#D6A34A]/50 transition cursor-pointer"
                >
                  <img
                    src={rel.images[0] || '/logo.png'}
                    alt={rel.name}
                    className="w-10 h-10 rounded-lg object-cover bg-black"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-stone-200 truncate">{rel.name}</p>
                    <p className="text-[11px] text-[#F5D58A] font-semibold">${rel.price} MXN</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
