import React, { useState } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroBanner } from './components/catalog/HeroBanner';
import { ProductGrid } from './components/catalog/ProductGrid';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderSuccessModal } from './components/checkout/OrderSuccessModal';
import { ProductDetailModal } from './components/catalog/ProductDetailModal';
import { RestockModal } from './components/restock/RestockModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { MessageCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentView, settings } = useShop();
  const cleanPhone = settings.whatsappPhone.replace(/\D/g, '');

  const floatingWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `¡Hola Alba! Estoy navegando en la tienda de D'Santos Perfumería y me gustaría hacerte una consulta.`
  )}`;

  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col">
        <AdminDashboard />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-stone-100 selection:bg-[#D6A34A] selection:text-black">
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <ProductGrid />
      </main>
      <Footer />

      {/* Floating WhatsApp Contact Button on mobile/desktop */}
      <a
        href={floatingWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-16 sm:bottom-6 right-5 z-30 p-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        title="Consultar por WhatsApp con Alba"
      >
        <MessageCircle className="w-6 h-6 fill-white/20" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
          ¿Dudas? Chatea con Alba
        </span>
      </a>

      {/* Modals & Overlays */}
      <CartDrawer />
      <CheckoutModal />
      <OrderSuccessModal />
      <ProductDetailModal />
      <RestockModal />
      <AdminLoginModal />

      {/* PWA Offline Banner */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <MainContent />
    </ShopProvider>
  );
}
