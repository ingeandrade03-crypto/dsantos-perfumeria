import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { api } from '../../services/api';
import {
  X,
  MessageCircle,
  Truck,
  Store,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartTotal,
    activeModal,
    closeModal,
    openModal,
    clearCart,
    settings,
    setLastCreatedOrder,
  } = useShop();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'recogida_tienda' | 'entrega_local'>('recogida_tienda');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (activeModal !== 'checkout' || cart.length === 0) return null;

  const deliveryCost =
    deliveryMethod === 'entrega_local'
      ? cartTotal >= settings.deliveryMethods.minOrderForFreeDelivery
        ? 0
        : settings.deliveryMethods.localDeliveryCost
      : 0;

  const total = cartTotal + deliveryCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Por favor ingrese su nombre.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor ingrese un número de teléfono o WhatsApp válido de al menos 10 dígitos.');
      return;
    }
    if (deliveryMethod === 'entrega_local' && !deliveryAddress.trim()) {
      setErrorMessage('Para entrega local a domicilio, por favor especifique su dirección o colonia.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit order to server for real stock validation and persistence
      const result = await api.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim(),
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          presentation: i.selectedPresentation || i.product.presentation,
        })),
      });

      // 2. Save order result into context
      setLastCreatedOrder({
        order: result.order,
        whatsappUrl: result.whatsappUrl,
        whatsappMessage: result.whatsappMessage,
      });

      // 3. Clear cart
      clearCart();

      // 4. Open Order Success Modal with direct WhatsApp send button
      openModal('order_success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al validar existencias del pedido. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#121212] border border-[#D6A34A]/40 shadow-2xl overflow-hidden text-stone-100 my-8">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 bg-[#0a0a0a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D6A34A]/10 border border-[#D6A34A]/40 flex items-center justify-center text-[#D6A34A]">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A]">
                Confirmar Pedido por WhatsApp
              </h3>
              <p className="text-[11px] text-stone-400">
                Paso final: Coordinar entrega y pago directamente con Alba
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-6 space-y-5">
          {/* Order Summary Snapshot */}
          <div className="bg-[#181818] border border-stone-800 rounded-2xl p-4 text-xs space-y-2">
            <p className="font-semibold text-stone-300 uppercase tracking-wider text-[10px] text-[#F5D58A]">
              Resumen de artículos ({cart.length}):
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-800/60">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-1.5 flex justify-between items-center">
                  <span className="text-stone-200">
                    {item.quantity}x {item.product.name} ({item.selectedPresentation || item.product.presentation})
                  </span>
                  <span className="font-medium text-stone-300 shrink-0 ml-2">
                    ${(item.product.price * item.quantity).toFixed(2)} MXN
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-700/80 space-y-1">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Costo de envío:</span>
                <span>
                  {deliveryMethod === 'recogida_tienda'
                    ? 'Gratis (En boutique)'
                    : deliveryCost === 0
                    ? '¡Gratis por compra mayor a $' + settings.deliveryMethods.minOrderForFreeDelivery + '!'
                    : `$${deliveryCost.toFixed(2)} MXN`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#F5D58A] pt-1">
                <span>Total a acordar con la tienda:</span>
                <span>${total.toFixed(2)} MXN</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Details Form */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-stone-300 font-medium mb-1">
                Nombre completo o cómo te gusta que te llamemos: *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. María Fernanda González"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 px-3.5 text-stone-100 placeholder-stone-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-medium mb-1">
                Número de WhatsApp (con lada): *
              </label>
              <input
                type="tel"
                required
                placeholder="Ej. 55 1234 5678 o +52 55 1234 5678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 px-3.5 text-stone-100 placeholder-stone-500 outline-none"
              />
            </div>

            {/* Delivery Method Selector */}
            <div>
              <label className="block text-stone-300 font-medium mb-1.5">
                Método de entrega preferido: *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('recogida_tienda')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                    deliveryMethod === 'recogida_tienda'
                      ? 'border-[#D6A34A] bg-[#221c12] text-[#F5D58A]'
                      : 'border-stone-800 bg-[#171717] text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Store className="w-4 h-4 text-[#D6A34A]" />
                    <span>Recoger en Tienda</span>
                  </div>
                  <span className="text-[10px] text-stone-400">Sin costo • Local 12</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('entrega_local')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                    deliveryMethod === 'entrega_local'
                      ? 'border-[#D6A34A] bg-[#221c12] text-[#F5D58A]'
                      : 'border-stone-800 bg-[#171717] text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Truck className="w-4 h-4 text-[#D98DA5]" />
                    <span>Entrega Local</span>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {cartTotal >= settings.deliveryMethods.minOrderForFreeDelivery
                      ? '¡Envío Gratis!'
                      : `$${settings.deliveryMethods.localDeliveryCost} MXN`}
                  </span>
                </button>
              </div>
            </div>

            {/* Delivery Address if local */}
            {deliveryMethod === 'entrega_local' && (
              <div>
                <label className="block text-stone-300 font-medium mb-1">
                  Dirección o colonia para entrega local: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Calle, número, colonia, referencias..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 px-3.5 text-stone-100 placeholder-stone-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-stone-300 font-medium mb-1">
                Notas adicionales o especificaciones (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Si es para regalo, preferencia de horario, consultar por otro aroma..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 placeholder-stone-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Privacy and Process Disclaimer */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-[11px] text-stone-400 leading-relaxed flex items-start gap-2">
            <Clock className="w-4 h-4 text-[#D6A34A] shrink-0 mt-0.5" />
            <span>
              Al enviar tu pedido, se abrirá WhatsApp con el mensaje prellenado para contactar directamente a Alba. Tu pedido quedará registrado en estado <strong>Pendiente de confirmación</strong> hasta que la tienda lo valide y acuerden el método de pago (efectivo al recibir o transferencia).
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando existencias...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Enviar Pedido a WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
