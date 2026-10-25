import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

export const OrderSuccessModal: React.FC = () => {
  const { activeModal, closeModal, lastCreatedOrder, settings } = useShop();
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'order_success' || !lastCreatedOrder) return null;

  const { order, whatsappUrl, whatsappMessage } = lastCreatedOrder;

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#121212] border border-[#D6A34A]/50 shadow-2xl overflow-hidden text-stone-100 my-8 p-6 sm:p-8 text-center space-y-5">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D98DA5]">
            ¡Pedido Solicitado con Éxito!
          </span>
          <h3 className="text-2xl font-bold font-serif-luxury gold-gradient-text mt-1">
            Pedido #{order.id}
          </h3>
          <p className="text-xs text-stone-300 mt-2 leading-relaxed">
            Hemos preparado tu resumen de compra. Si tu ventana de WhatsApp no se abrió automáticamente, pulsa el botón de abajo para enviar el mensaje directamente a Alba.
          </p>
        </div>

        {/* Pending Confirmation Status Badge */}
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-left text-xs text-amber-200 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold text-[#F5D58A]">Estado: Pendiente de confirmación</p>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Alba revisará las existencias en boutique y te confirmará por WhatsApp para acordar la hora de entrega o recogida y el pago en efectivo o transferencia.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>Abrir WhatsApp con el Pedido</span>
          </a>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1b1b1b] border border-stone-700 hover:border-stone-500 text-stone-300 font-medium text-xs flex items-center justify-center gap-2 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>¡Mensaje copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar texto del pedido</span>
              </>
            )}
          </button>
        </div>

        {/* Close & Continue */}
        <div className="pt-2 border-t border-stone-800">
          <button
            onClick={closeModal}
            className="text-xs text-stone-400 hover:text-[#F5D58A] transition"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    </div>
  );
};
