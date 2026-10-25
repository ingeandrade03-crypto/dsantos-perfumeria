import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-full bg-amber-950/90 border border-amber-600/50 px-4 py-2 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md animate-fade-in">
      <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      <span>Modo sin conexión — Mostrando catálogo guardado en tu dispositivo.</span>
    </div>
  );
};
