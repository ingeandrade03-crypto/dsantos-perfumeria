import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { api } from '../../services/api';
import {
  X,
  Bell,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const RestockModal: React.FC = () => {
  const { activeModal, closeModal, selectedProduct } = useShop();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  if (activeModal !== 'restock_modal' || !selectedProduct) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      setStatus('error');
      setFeedbackMessage('Por favor introduce tu número de WhatsApp.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setFeedbackMessage('Es necesario autorizar el aviso de disponibilidad por WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const res = await api.createRestockRequest({
        productId: selectedProduct.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        consent: true,
      });

      setStatus('success');
      setFeedbackMessage(res.message);
    } catch (err: any) {
      setStatus('error');
      setFeedbackMessage(err.message || 'Error al guardar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121212] border border-[#D6A34A]/40 shadow-2xl overflow-hidden text-stone-100 my-8 p-6 sm:p-7">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'success' ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif-luxury gold-gradient-text">
                ¡Solicitud Registrada!
              </h3>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                {feedbackMessage || `En cuanto Alba registre la reposición de existencias de "${selectedProduct.name}", recibirás una notificación directa por WhatsApp.`}
              </p>
            </div>
            <button
              onClick={closeModal}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#D6A34A] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition"
            >
              Listo, continuar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-300">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-luxury text-[#F5D58A]">
                  Avísame cuando esté disponible
                </h3>
                <p className="text-[11px] text-stone-400">
                  Solicitud de reposición de producto agotado
                </p>
              </div>
            </div>

            {/* Product Snapshot */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
              <img
                src={selectedProduct.images[0] || '/logo.png'}
                alt={selectedProduct.name}
                className="w-12 h-12 rounded-xl object-cover bg-black shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-100 truncate font-serif-luxury">
                  {selectedProduct.name}
                </p>
                <p className="text-[10px] text-[#D98DA5] uppercase font-semibold">
                  {selectedProduct.brand} • {selectedProduct.presentation}
                </p>
                <p className="text-xs font-bold text-[#F5D58A] mt-0.5">
                  ${selectedProduct.price.toFixed(2)} MXN
                </p>
              </div>
            </div>

            {status === 'error' && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/60 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">
                  Tu nombre (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sofía Mendoza"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 placeholder-stone-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">
                  Tu WhatsApp con lada: *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. +52 55 1234 5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2 px-3 text-stone-100 placeholder-stone-500 outline-none"
                />
              </div>

              {/* Explicit Consent Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-stone-300 select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-stone-700 text-[#D6A34A] focus:ring-0"
                  />
                  <span>
                    Acepto recibir un mensaje de WhatsApp exclusivamente cuando este producto esté disponible en almacén de D'Santos Perfumería. No se enviará publicidad no solicitada.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando solicitud...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Notificarme cuando haya stock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
