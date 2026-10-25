import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as standalone PWA, hide
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop prompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-gradient-to-r from-[#F5D58A] to-[#D6A34A] hover:brightness-110 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
        title="Instalar D'Santos Perfumería como App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F5D58A] border border-[#D6A34A]/40 hover:bg-[#D6A34A]/10 rounded-full transition-all active:scale-95 cursor-pointer"
          title="Instalar en iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm rounded-2xl bg-[#141414] border border-[#D6A34A]/40 p-6 shadow-2xl text-stone-100">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#D6A34A]" />
                <h3 className="text-base font-bold text-[#F5D58A] font-serif-luxury">
                  Instalar D'Santos en iPhone
                </h3>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed mb-4">
                Disfruta de la tienda con acceso instantáneo, catálogo sin interrupciones y notificaciones de existencias:
              </p>

              <ol className="text-xs space-y-2.5 text-stone-200 bg-stone-900/80 p-3.5 rounded-xl border border-stone-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#D6A34A] bg-[#D6A34A]/10 px-1.5 py-0.5 rounded">1</span>
                  <span>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra de Safari.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#D6A34A] bg-[#D6A34A]/10 px-1.5 py-0.5 rounded">2</span>
                  <span>Desliza hacia abajo y pulsa en <strong>"Agregar a pantalla de inicio"</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#D6A34A] bg-[#D6A34A]/10 px-1.5 py-0.5 rounded">3</span>
                  <span>Confirma pulsando <strong>Agregar</strong> arriba a la derecha.</span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black hover:brightness-110 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
