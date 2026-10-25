import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  X,
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { activeModal, closeModal, loginAdmin, setCurrentView } = useShop();

  const [username, setUsername] = useState('alba');
  const [password, setPassword] = useState('Alba2026*');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (activeModal !== 'admin_login') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginAdmin(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#121212] border border-[#D6A34A]/40 shadow-2xl overflow-hidden text-stone-100 my-8 p-6 sm:p-7">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#D6A34A]/10 border border-[#D6A34A]/40 flex items-center justify-center mx-auto text-[#D6A34A]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif-luxury text-[#F5D58A]">
            Portal Privado D'Santos
          </h3>
          <p className="text-xs text-stone-400">
            Acceso administrativo exclusivo para Alba
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-700/60 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-300 font-medium mb-1">
              Usuario de Administradora:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alba"
                className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 pl-9 pr-3 text-stone-100 placeholder-stone-500 outline-none"
              />
              <User className="w-4 h-4 text-[#D6A34A] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-stone-300 font-medium mb-1">
              Contraseña:
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181818] border border-stone-800 focus:border-[#D6A34A] rounded-xl py-2.5 pl-9 pr-3 text-stone-100 placeholder-stone-500 outline-none"
              />
              <Lock className="w-4 h-4 text-[#D6A34A] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Quick onboarding credential hint for owner verification */}
          <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#D6A34A] shrink-0 mt-0.5" />
            <span>
              Credenciales iniciales preconfiguradas: Usuario <strong className="text-stone-200">alba</strong> / Contraseña <strong className="text-stone-200">Alba2026*</strong> (podrás cambiarla en Configuración).
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Iniciar Sesión como Alba</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
