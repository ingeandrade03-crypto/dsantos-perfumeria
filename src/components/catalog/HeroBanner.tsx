import React from 'react';
import { useShop } from '../../context/ShopContext';
import { Sparkles, MessageCircle, ArrowRight, Award } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { settings, setSelectedCategory, setCurrentView } = useShop();

  const cleanPhone = settings.whatsappPhone.replace(/\D/g, '');
  const directWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `¡Hola Alba! Me gustaría recibir asesoría personalizada para elegir un perfume en D'Santos Perfumería.`
  )}`;

  const quickCategories = [
    'Perfumería Fraiche',
    'Perfumes originales',
    'Perfumes para dama',
    'Perfumes para caballero',
    'Cuidado facial',
  ];

  const hasBackgroundImage = Boolean(settings.heroBackgroundImage);
  const overlayOpacity = typeof settings.heroOverlayOpacity === 'number' ? settings.heroOverlayOpacity : 0.75;
  const seasonTitle = settings.heroSeasonTitle || 'Boutique Exclusiva de Alba';
  const seasonBadge = settings.heroSeasonBadge || 'Envíos Locales y Recogida';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] via-[#120f0b] to-[#080808] border-b border-[#D6A34A]/20 pt-8 pb-12 sm:pt-12 sm:pb-16">
      {/* Background Image when configured */}
      {hasBackgroundImage && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={settings.heroBackgroundImage}
            alt="Fondo de Temporada D'Santos Perfumería"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-95 scale-105 transition-all duration-1000"
          />
          {/* Multi-layered luxury dark vignette overlay for flawless text contrast */}
          <div
            className="absolute inset-0 bg-black transition-opacity duration-500"
            style={{ opacity: overlayOpacity }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#0a0a0a]/90" />
        </div>
      )}

      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#D6A34A]/10 via-[#D98DA5]/10 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Presentation */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18140e]/90 backdrop-blur-md border border-[#D6A34A]/40 text-[#F5D58A] text-xs font-medium shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D6A34A] animate-pulse" />
              <span>{seasonTitle}</span>
              <span className="text-stone-500">•</span>
              <span className="text-[#D98DA5]">{seasonBadge}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif-luxury leading-tight">
                <span className="gold-gradient-text block">D'Santos Perfumería</span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-medium text-stone-200 block italic font-serif mt-1">
                  "{settings.slogan}"
                </span>
              </h1>
              <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto lg:mx-0 leading-relaxed pt-2">
                Descubre nuestra selección de contratipos Fraiche de máxima fijación, perfumes originales sellados de diseñador, cosméticos de tendencia y fórmulas para el cuidado de tu piel.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="#catalogo"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg hover:shadow-[#D6A34A]/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full bg-[#161616] border border-emerald-500/40 text-emerald-300 font-semibold text-xs hover:bg-emerald-950/40 transition-all flex items-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Asesoría por WhatsApp</span>
              </a>
            </div>

            {/* Quality Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg mx-auto lg:mx-0 border-t border-stone-800/80 text-left">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D6A34A] shrink-0" />
                <span className="text-[11px] text-stone-300 font-medium">Alta Fijación Fraiche</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D98DA5] shrink-0" />
                <span className="text-[11px] text-stone-300 font-medium">Originales Sellados</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-stone-300 font-medium">Atención de Alba</span>
              </div>
            </div>
          </div>

          {/* Right Brand Logo & Presentation Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group">
              {/* Outer Glow Ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#D6A34A] via-[#D98DA5] to-[#D6A34A] opacity-40 blur-lg group-hover:opacity-70 transition duration-700" />

              {/* Card Container */}
              <div className="relative w-72 sm:w-80 rounded-2xl bg-[#080808] border border-[#D6A34A]/50 p-6 shadow-2xl flex flex-col items-center text-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-[#D6A34A]/60 shadow-xl bg-black p-1 mb-4 flex items-center justify-center">
                  <img
                    src={settings.logoUrl || '/logo.png'}
                    alt="D'Santos Perfumería"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="w-full pt-3 border-t border-[#D6A34A]/30">
                  <p className="text-xs font-semibold text-[#F5D58A] tracking-wider uppercase">
                    Catálogo 100% Actualizado
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Consulta precios y existencias en tiempo real
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Category Filter Bar */}
        <div className="mt-10 pt-6 border-t border-stone-800/80 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-stone-400 mr-2 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A34A]" />
            Colecciones populares:
          </span>
          {quickCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentView('catalog');
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#141414] border border-[#D6A34A]/30 text-stone-300 hover:text-[#F5D58A] hover:border-[#D6A34A] hover:bg-[#1a1610] transition-all cursor-pointer"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
