import React from 'react';
import { useShop } from '../../context/ShopContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Truck,
  MessageCircle,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    cartTotal,
    activeModal,
    closeModal,
    openModal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    settings,
  } = useShop();

  if (activeModal !== 'cart') return null;

  const minForFreeDelivery = settings.deliveryMethods.minOrderForFreeDelivery;
  const missingForFree = Math.max(0, minForFreeDelivery - cartTotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md h-full bg-[#121212] border-l border-[#D6A34A]/30 flex flex-col justify-between text-stone-100 shadow-2xl animate-slide-left">
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D6A34A]" />
            <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A]">
              Tu Carrito ({cartCount} {cartCount === 1 ? 'artículo' : 'artículos'})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-stone-400 hover:text-red-400 transition"
              >
                Vaciar
              </button>
            )}
            <button
              onClick={closeModal}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Tracker Bar */}
        {cart.length > 0 && (
          <div className="bg-[#181510] px-5 py-2.5 border-b border-[#D6A34A]/20 text-xs">
            {missingForFree > 0 ? (
              <p className="text-stone-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#D6A34A]" />
                <span>
                  Agrega <strong className="text-[#F5D58A]">${missingForFree.toFixed(2)} MXN</strong> más para entrega local gratis.
                </span>
              </p>
            ) : (
              <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D6A34A]" />
                <span>¡Felicidades! Calificas para entrega local sin costo.</span>
              </p>
            )}
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-200 font-serif-luxury">
                  Tu carrito está vacío
                </h4>
                <p className="text-xs text-stone-400 max-w-xs mt-1 leading-relaxed">
                  Explora las fragancias Fraiche, perfumes originales y cosméticos en nuestro catálogo.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md transition"
              >
                Ver Catálogo
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const maxStock = item.product.stock;
              const subtotal = item.product.price * item.quantity;

              return (
                <div
                  key={item.product.id}
                  className="flex gap-3.5 p-3 rounded-2xl bg-[#171717] border border-stone-800/80 hover:border-[#D6A34A]/30 transition"
                >
                  <img
                    src={item.product.images[0] || '/logo.png'}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-black shrink-0 border border-stone-800"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-stone-100 truncate font-serif-luxury">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-stone-500 hover:text-red-400 p-0.5 transition"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[10px] text-[#D98DA5] uppercase font-semibold">
                        {item.product.brand} • {item.selectedPresentation || item.product.presentation}
                      </p>

                      <p className="text-xs font-bold text-[#F5D58A] mt-0.5">
                        ${item.product.price.toFixed(2)} MXN
                      </p>
                    </div>

                    {/* Quantity controls bounded by live stock */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-800 mt-2">
                      <div className="flex items-center gap-2 bg-[#1f1f1f] border border-stone-700/60 rounded-full px-2 py-0.5">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="text-stone-400 hover:text-white p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-stone-100 min-w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="text-stone-400 hover:text-white p-0.5"
                          disabled={item.quantity >= maxStock}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block">Subtotal:</span>
                        <span className="text-xs font-bold text-white">
                          ${subtotal.toFixed(2)} MXN
                        </span>
                      </div>
                    </div>

                    {item.quantity >= maxStock && (
                      <p className="text-[9px] text-amber-400 mt-1">
                        Máximo disponible en almacén ({maxStock} pzas).
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-stone-800 bg-[#0c0c0c] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>Subtotal ({cartCount} artículos):</span>
                <span className="font-medium">${cartTotal.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Entrega:</span>
                <span>Se coordinará con Alba en el siguiente paso</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#F5D58A] pt-2 border-t border-stone-800">
                <span>Total Estimado:</span>
                <span>${cartTotal.toFixed(2)} MXN</span>
              </div>
            </div>

            <button
              onClick={() => openModal('checkout')}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-black/20" />
              <span>Tramitar Pedido por WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={closeModal}
              className="w-full text-center text-xs text-stone-400 hover:text-stone-200 transition py-1"
            >
              Seguir explorando perfumes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
