import React from 'react';
import { useShop } from '../../context/ShopContext';
import { MessageCircle, MapPin, Clock, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, categories, setSelectedCategory, openModal, isAdmin, setCurrentView } = useShop();

  const cleanPhone = settings.whatsappPhone.replace(/\D/g, '');
  const directWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `¡Hola Alba! Me gustaría consultar información sobre existencias en D'Santos Perfumería.`
  )}`;

  return (
    <footer className="bg-[#050505] border-t border-[#D6A34A]/25 pt-14 pb-20 sm:pb-12 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Presentation */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D6A34A]/50 bg-[#080808] p-0.5 shadow-md">
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt="D'Santos Perfumería"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold font-serif-luxury gold-gradient-text leading-none">
                  D'Santos
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#D98DA5] font-semibold mt-1">
                  Perfumería Boutique
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 italic">
              "{settings.slogan}"
            </p>

            <p className="text-xs text-stone-400 leading-relaxed">
              Especialistas en perfumería Fraiche de alta fijación, fragancias originales selladas, cosméticos selectos y artículos de cuidado personal para resaltar tu estilo único.
            </p>

            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Chatear con Alba por WhatsApp</span>
            </a>
          </div>

          {/* Quick Category Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D6A34A]" />
              Categorías
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 7).map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentView('catalog');
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="text-stone-400 hover:text-[#D6A34A] transition-colors text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Boutique Information & Hours */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D6A34A]" />
              Atención y Horarios
            </h4>
            <div className="text-xs space-y-2 text-stone-400">
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#D6A34A] shrink-0 mt-0.5" />
                <span>{settings.contactInfo.schedule}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D98DA5] shrink-0 mt-0.5" />
                <span>{settings.contactInfo.address}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400">
              <p className="font-semibold text-stone-300 mb-1">Métodos de Entrega:</p>
              <p>• Recogida directa en boutique</p>
              <p>• Entrega local coordinada con Alba</p>
            </div>
          </div>

          {/* Confidence and Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5D58A] mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D6A34A]" />
              Garantía y Confianza
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Todos nuestros perfumes son elaborados con esencias de primera calidad y lote garantizado. Si buscas una fragancia agotada o personalizada, nosotros te la conseguimos.
            </p>

            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-300">
              <p className="font-medium text-[#F5D58A] mb-0.5">Política de Satisfacción</p>
              <p>{settings.returnPolicy}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (isAdmin) setCurrentView('admin');
                  else openModal('admin_login');
                }}
                className="text-[11px] text-stone-400 hover:text-[#D6A34A] flex items-center gap-1 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acceso administrativo privado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-3">
          <p>© {new Date().getFullYear()} D'Santos Perfumería — Propiedad de Alba. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Tu esencia, tu belleza, tu estilo <Heart className="w-3 h-3 text-[#D98DA5] fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};
