import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import {
  Search,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  X,
  SlidersHorizontal,
  Home,
  Grid,
} from 'lucide-react';

export const Header: React.FC<{ onToggleFilters?: () => void }> = ({ onToggleFilters }) => {
  const {
    settings,
    cartCount,
    searchTerm,
    setSearchTerm,
    openModal,
    isAdmin,
    currentView,
    setCurrentView,
  } = useShop();

  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);

  const cleanPhone = settings.whatsappPhone.replace(/\D/g, '');
  const directWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `¡Hola Alba! Me comunico desde la tienda web de D'Santos Perfumería para solicitar información y asesoría sobre fragancias.`
  )}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-[#D6A34A]/20 transition-all">
        {/* Top Announcement Bar */}
        <div className="bg-gradient-to-r from-[#141414] via-[#241a10] to-[#141414] border-b border-[#D6A34A]/20 py-1.5 px-4 text-center text-[11px] font-medium text-[#F5D58A] flex items-center justify-between">
          <span className="hidden sm:inline text-stone-400">
            📍 {settings.contactInfo.address}
          </span>
          <span className="mx-auto flex items-center gap-1.5">
            ✨ {settings.slogan} — Perfumería Fraiche, Originales y Alta Cosmética
          </span>
          <div className="hidden sm:flex items-center gap-3">
            <PWAInstallButton />
          </div>
        </div>

        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          {/* Logo & Brand Name */}
          <div
            onClick={() => setCurrentView('catalog')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            {/* Authentic Brand Logo Image without distortion */}
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-[#D6A34A]/40 shadow-lg group-hover:border-[#D6A34A] transition-all bg-[#080808] flex items-center justify-center p-0.5">
              <img
                src={settings.logoUrl || '/logo.png'}
                alt="D'Santos Perfumería"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold tracking-wider gold-gradient-text font-serif-luxury leading-none">
                D'Santos
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#D98DA5] font-semibold mt-1">
                Perfumería
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar por fragancia, Fraiche, marca o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141414] border border-[#D6A34A]/30 focus:border-[#D6A34A] rounded-full py-2 pl-10 pr-10 text-xs text-stone-200 placeholder-stone-500 focus:outline-none transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-[#D6A34A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions / Right Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
              className="md:hidden p-2 text-stone-300 hover:text-[#D6A34A] rounded-full hover:bg-stone-900 transition"
              title="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Filter Toggle Button (if onToggleFilters provided) */}
            {onToggleFilters && currentView === 'catalog' && (
              <button
                onClick={onToggleFilters}
                className="p-2 text-stone-300 hover:text-[#D6A34A] rounded-full hover:bg-stone-900 transition flex items-center gap-1 sm:hidden"
                title="Filtros"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            )}

            {/* Direct WhatsApp Contact Button */}
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-full transition shadow-sm"
              title="Contactar a Alba por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Shopping Cart Button */}
            <button
              onClick={() => openModal('cart')}
              className="relative p-2.5 rounded-full bg-[#141414] border border-[#D6A34A]/40 text-[#F5D58A] hover:bg-[#D6A34A] hover:text-black transition-all cursor-pointer shadow-md group"
              title="Ver Carrito de Compras"
            >
              <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#D98DA5] to-[#c74c72] text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#080808] shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Switch / Portal Button */}
            {isAdmin ? (
              <button
                onClick={() => setCurrentView(currentView === 'admin' ? 'catalog' : 'admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                  currentView === 'admin'
                    ? 'bg-[#D6A34A] text-black border-[#D6A34A]'
                    : 'bg-stone-900 text-[#F5D58A] border-[#D6A34A]/40 hover:bg-[#1f1a12]'
                }`}
                title="Panel de Administración"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{currentView === 'admin' ? 'Ver Tienda' : 'Panel Alba'}</span>
              </button>
            ) : (
              <button
                onClick={() => openModal('admin_login')}
                className="p-2 text-stone-400 hover:text-[#D6A34A] rounded-full transition text-xs"
                title="Acceso exclusivo Administradora"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown Bar */}
        {isSearchOpenMobile && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-stone-800 bg-[#0c0c0c] animate-fade-in">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar perfume, Fraiche, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-[#181818] border border-[#D6A34A]/40 rounded-full py-2 pl-10 pr-10 text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#D6A34A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (App Experience) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-[#D6A34A]/30 py-2 px-3 flex items-center justify-around">
        <button
          onClick={() => {
            setCurrentView('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 ${
            currentView === 'catalog' ? 'text-[#D6A34A]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Catálogo</span>
        </button>

        {onToggleFilters && currentView === 'catalog' && (
          <button
            onClick={onToggleFilters}
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-200"
          >
            <Grid className="w-4 h-4" />
            <span className="text-[10px]">Categorías</span>
          </button>
        )}

        <button
          onClick={() => openModal('cart')}
          className="relative flex flex-col items-center gap-1 text-[#F5D58A]"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#D98DA5] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Carrito</span>
        </button>

        <a
          href={directWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-emerald-400"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-[10px]">WhatsApp</span>
        </a>

        {isAdmin && (
          <button
            onClick={() => setCurrentView(currentView === 'admin' ? 'catalog' : 'admin')}
            className={`flex flex-col items-center gap-1 ${
              currentView === 'admin' ? 'text-[#D6A34A]' : 'text-stone-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px]">Alba</span>
          </button>
        )}
      </nav>
    </>
  );
};
