import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { api } from '../../services/api';
import { SeasonalHeroBanner } from '../../types';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Check,
  Trash2,
  Eye,
  RefreshCw,
  Sliders,
  Sun,
  Snowflake,
  Heart,
  Flower2,
  Leaf,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RotateCcw,
  Palette,
  Layers,
} from 'lucide-react';

interface SeasonalPreset {
  key: 'primavera' | 'verano' | 'otono' | 'invierno' | 'san_valentin' | 'navidad' | 'personalizado';
  label: string;
  icon: React.ReactNode;
  badge: string;
  headline: string;
  prompt: string;
  previewColor: string;
}

const SEASONAL_PRESETS: SeasonalPreset[] = [
  {
    key: 'primavera',
    label: 'Primavera Floral',
    icon: <Flower2 className="w-4 h-4 text-pink-400" />,
    badge: 'Edición Primavera 2026',
    headline: 'Frescura Floral & Jardín de Rosas',
    prompt: 'Fondo de perfumería primaveral de lujo, frascos de fragancia de cristal con reflejos dorados entre peonías rosas frescas, jazmines de Grasse y sutil bruma aromática sobre fondo negro aterciopelado con iluminación ámbar suave.',
    previewColor: 'from-pink-950/40 to-[#0a0a0a]',
  },
  {
    key: 'verano',
    label: 'Verano Cítrico & Fresco',
    icon: <Sun className="w-4 h-4 text-amber-400" />,
    badge: 'Temporada de Verano',
    headline: 'Brisa Mediterránea & Cítricos Nobles',
    prompt: 'Fondo de perfumería para verano de lujo, frascos de perfume rodeados de bergamota fresca de Calabria, rodajas de mandarina, gotas de agua cristalinas y destellos solares dorados sobre fondo carbón profundo.',
    previewColor: 'from-amber-950/40 to-[#0a0a0a]',
  },
  {
    key: 'otono',
    label: 'Otoño Ámbar & Maderas',
    icon: <Leaf className="w-4 h-4 text-orange-400" />,
    badge: 'Colección Otoño 2026',
    headline: 'Calidez Ámbar & Notas Amaderadas',
    prompt: 'Fondo de alta perfumería de otoño, frasco de perfume en vidrio ámbar oscuro con reflejos de oro cálido, resinas orientales, canela en rama, virutas de cedro noble y suave bokeh de hojas otoñales doradas en atmósfera oscura.',
    previewColor: 'from-orange-950/40 to-[#0a0a0a]',
  },
  {
    key: 'invierno',
    label: 'Invierno Gala & Festivo',
    icon: <Snowflake className="w-4 h-4 text-sky-400" />,
    badge: 'Especial Invierno & Gala',
    headline: 'Elegancia Glacial & Oros Festivos',
    prompt: 'Fondo de gala invernal para perfumería exclusiva, frascos de perfume con acabados en oro de 24 quilates y cristal escarchado, sutil polvo de nieve cristalina y bokeh de luces festivas sobre fondo negro obsidiana.',
    previewColor: 'from-sky-950/40 to-[#0a0a0a]',
  },
  {
    key: 'san_valentin',
    label: 'San Valentín Romántico',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
    badge: 'Especial San Valentín',
    headline: 'Pasión Romántica & Rosas Terciopelo',
    prompt: 'Fondo romántico de perfumería de lujo para San Valentín, pétalos de rosa roja carmín con gotas de rocío, frascos de perfume seductores con tapas doradas, suave luz de velas y atmósfera íntima sobre ónix negro.',
    previewColor: 'from-rose-950/40 to-[#0a0a0a]',
  },
  {
    key: 'navidad',
    label: 'Navidad & Fin de Año',
    icon: <Sparkles className="w-4 h-4 text-yellow-400" />,
    badge: 'Campaña Fin de Año',
    headline: 'Nochebuena Dorada & Lujo Absoluto',
    prompt: 'Fondo de lujo para temporada navideña de perfumería, oros relucientes, esferas de cristal sutiles, frascos de perfume de diseñador sellados, terciopelo verde bosque oscuro y negro con destellos dorados mágicos.',
    previewColor: 'from-yellow-950/40 to-[#0a0a0a]',
  },
];

export const HeroBannerGenerator: React.FC = () => {
  const { settings, refreshSettings } = useShop();

  // Generator form state
  const [selectedPreset, setSelectedPreset] = useState<SeasonalPreset>(SEASONAL_PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState<string>(SEASONAL_PRESETS[0].prompt);
  const [badgeText, setBadgeText] = useState<string>(SEASONAL_PRESETS[0].badge);
  const [headlineHighlight, setHeadlineHighlight] = useState<string>(SEASONAL_PRESETS[0].headline);
  const [applyImmediately, setApplyImmediately] = useState<boolean>(true);
  const [saveGallery, setSaveGallery] = useState<boolean>(true);

  // Overlay opacity state
  const [overlayOpacity, setOverlayOpacity] = useState<number>(
    typeof settings.heroOverlayOpacity === 'number' ? settings.heroOverlayOpacity : 0.75
  );

  // Status & preview state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedResult, setGeneratedResult] = useState<{
    imageUrl: string;
    source: string;
    message: string;
    note?: string;
  } | null>(null);

  // Manual URL input
  const [manualImageUrl, setManualImageUrl] = useState<string>('');

  // Toast message
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSelectPreset = (preset: SeasonalPreset) => {
    setSelectedPreset(preset);
    setCustomPrompt(preset.prompt);
    setBadgeText(preset.badge);
    setHeadlineHighlight(preset.headline);
  };

  // Generate Image with AI
  const handleGenerateImage = async () => {
    if (!customPrompt.trim()) {
      showToast('error', 'Por favor ingresa una descripción para el fondo de temporada.');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationStep('Analizando descripción y estilo de temporada...');

      const stepTimer1 = setTimeout(() => {
        setGenerationStep('Invocando API de generación de imágenes con estética de perfumería...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep('Optimizando composición panorámica 16:9 y contrastes de lujo...');
      }, 3500);

      const result = await api.adminGenerateHeroImage({
        prompt: customPrompt.trim(),
        seasonKey: selectedPreset.key,
        seasonName: selectedPreset.label,
        badgeText: badgeText.trim(),
        headlineHighlight: headlineHighlight.trim(),
        applyNow: applyImmediately,
        saveToGallery: saveGallery,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (result.success) {
        setGeneratedResult({
          imageUrl: result.imageUrl,
          source: result.source,
          message: result.message,
          note: result.note,
        });

        await refreshSettings();
        showToast('success', result.message || '¡Fondo generado con éxito!');
      } else {
        throw new Error(result.error || 'No se pudo generar la imagen');
      }
    } catch (err: any) {
      console.error('Error generating hero image:', err);
      showToast('error', err.message || 'Error al conectar con el servicio de generación de imágenes');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Apply a specific banner to the store
  const handleApplyBanner = async (
    imageUrl: string,
    badge?: string,
    headline?: string
  ) => {
    try {
      const res = await api.adminSelectHeroBanner({
        imageUrl,
        badgeText: badge ?? badgeText,
        headlineHighlight: headline ?? headlineHighlight,
        opacity: overlayOpacity,
      });
      if (res.success) {
        await refreshSettings();
        showToast('success', '¡HeroBanner de temporada activado en la tienda!');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error al actualizar HeroBanner');
    }
  };

  // Update overlay opacity live
  const handleUpdateOpacity = async (newVal: number) => {
    setOverlayOpacity(newVal);
    try {
      await api.adminSelectHeroBanner({
        imageUrl: settings.heroBackgroundImage || '',
        opacity: newVal,
      });
      await refreshSettings();
    } catch (err) {
      console.error('Error saving opacity:', err);
    }
  };

  // Delete saved banner
  const handleDeleteBanner = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.adminDeleteHeroBanner(id);
      if (res.success) {
        await refreshSettings();
        showToast('info', 'Fondo eliminado de la galería.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error al eliminar fondo');
    }
  };

  // Reset to default minimalist theme
  const handleResetToDefault = async () => {
    try {
      await api.adminSelectHeroBanner({
        imageUrl: '',
        badgeText: 'Boutique Exclusiva de Alba',
        headlineHighlight: 'Envíos Locales y Recogida',
        opacity: 0.75,
      });
      await refreshSettings();
      showToast('success', 'HeroBanner restaurado a su gradiente minimalista estándar.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al restaurar');
    }
  };

  // Apply manual URL
  const handleApplyManualUrl = async () => {
    if (!manualImageUrl.trim()) return;
    await handleApplyBanner(manualImageUrl.trim(), badgeText, headlineHighlight);
    setManualImageUrl('');
  };

  const currentActiveImage = settings.heroBackgroundImage;
  const savedBanners = settings.savedHeroBanners || [];

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-red-950/95 border-red-500/50 text-red-200'
              : 'bg-stone-900/95 border-[#D6A34A]/50 text-[#F5D58A]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-[#D6A34A] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14120f] via-[#1a1610] to-[#120f0c] border border-[#D6A34A]/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D6A34A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D6A34A]/15 border border-[#D6A34A]/30 text-[#F5D58A] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D6A34A]" />
              <span>Generador de Imágenes Estacionales IA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-stone-100">
              Personalización de Fondo del HeroBanner
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Crea atmósferas visuales de temporada para la cabecera principal de tu tienda. Describe la estación del año o utiliza nuestros modelos de perfumería para generar fondos cinemáticos en proporción 16:9 con elegancia oscura y destellos dorados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentActiveImage && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 hover:text-stone-100 hover:bg-stone-800 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Quitar fondo y volver al gradiente oscuro sobrio"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                <span>Restaurar Fondo Clásico</span>
              </button>
            )}
            <a
              href="#vista-previa-hero"
              className="px-4 py-2.5 rounded-xl bg-[#D6A34A]/20 border border-[#D6A34A]/40 text-[#F5D58A] hover:bg-[#D6A34A]/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-[#D6A34A]" />
              <span>Ver Simulación en Vivo</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Generator Controls (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Select Seasonal Theme Preset */}
          <div className="rounded-2xl bg-[#0f0f0f] border border-[#D6A34A]/30 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-[#D6A34A]" />
                <h3 className="text-base font-bold text-stone-100">
                  1. Elige una Temporada o Campaña
                </h3>
              </div>
              <span className="text-xs text-stone-400">Presets predefinidos</span>
            </div>

            <p className="text-xs text-stone-400">
              Selecciona una estación para autocompletar la descripción optimizada con notas olfativas y estética de lujo:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SEASONAL_PRESETS.map((preset) => {
                const isSelected = selectedPreset.key === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#1f1910] to-[#14120e] border-[#D6A34A] ring-1 ring-[#D6A34A] shadow-md shadow-[#D6A34A]/10'
                        : 'bg-[#141414] border-stone-800 hover:border-stone-700 hover:bg-[#181818]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-black/60 border border-white/5">
                        {preset.icon}
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#D6A34A] animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-stone-200 mt-1">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-stone-400 line-clamp-1">
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Custom Description Prompt */}
          <div className="rounded-2xl bg-[#0f0f0f] border border-[#D6A34A]/30 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wand2 className="w-4 h-4 text-[#D6A34A]" />
                <h3 className="text-base font-bold text-stone-100">
                  2. Descripción del Fondo de Temporada
                </h3>
              </div>
              <span className="text-[11px] text-[#D6A34A] font-medium bg-[#D6A34A]/10 px-2 py-0.5 rounded-full border border-[#D6A34A]/20">
                Panorámica 16:9
              </span>
            </div>

            <p className="text-xs text-stone-400">
              Puedes afinar o escribir libremente los elementos visuales (frascos, flores, destellos, estación, notas aromáticas):
            </p>

            <div className="relative">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                placeholder="Describe los elementos del fondo de temporada (ej. frascos de cristal Fraiche con peonías rosas, destellos dorados y atmósfera de noche de gala)..."
                className="w-full rounded-xl bg-[#141414] border border-stone-700/80 p-3.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] transition-all leading-relaxed"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-stone-500">
                {customPrompt.length} caracteres
              </span>
            </div>

            {/* Campaign text fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                  Insignia Superior de Temporada
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="ej. Edición Primavera 2026"
                  className="w-full rounded-xl bg-[#141414] border border-stone-800 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D6A34A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                  Subtítulo / Destacado
                </label>
                <input
                  type="text"
                  value={headlineHighlight}
                  onChange={(e) => setHeadlineHighlight(e.target.value)}
                  placeholder="ej. Aromas Florales de Temporada"
                  className="w-full rounded-xl bg-[#141414] border border-stone-800 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D6A34A]"
                />
              </div>
            </div>

            {/* Options */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 border-t border-stone-800/80">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={applyImmediately}
                  onChange={(e) => setApplyImmediately(e.target.checked)}
                  className="rounded border-stone-700 text-[#D6A34A] focus:ring-[#D6A34A]"
                />
                <span>Aplicar como fondo activo del HeroBanner al terminar</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={saveGallery}
                  onChange={(e) => setSaveGallery(e.target.checked)}
                  className="rounded border-stone-700 text-[#D6A34A] focus:ring-[#D6A34A]"
                />
                <span>Guardar en la Galería de Temporadas</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="button"
                disabled={isGenerating || !customPrompt.trim()}
                onClick={handleGenerateImage}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D6A34A] via-[#E8BE68] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D6A34A]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Generando Fondo con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Generar Fondo con IA ({selectedPreset.label})</span>
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="mt-3 p-3 rounded-xl bg-[#141414] border border-[#D6A34A]/30 flex items-center gap-3 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D6A34A] animate-ping" />
                  <span className="text-xs text-[#F5D58A]">{generationStep}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Option: Enter Image URL directly */}
          <div className="rounded-2xl bg-[#0f0f0f] border border-stone-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
              <ImageIcon className="w-4 h-4 text-stone-400" />
              <span>¿Ya tienes un enlace o fotografía propia para el HeroBanner?</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/tu-foto-panoramica.jpg o /uploads/..."
                className="flex-1 rounded-xl bg-[#141414] border border-stone-800 px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D6A34A]"
              />
              <button
                type="button"
                onClick={handleApplyManualUrl}
                disabled={!manualImageUrl.trim()}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Hero Simulation & Controls */}
        <div id="vista-previa-hero" className="lg:col-span-5 space-y-6">
          {/* Live Simulation Card */}
          <div className="rounded-2xl bg-[#0f0f0f] border border-[#D6A34A]/30 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D6A34A]" />
                <h3 className="text-sm font-bold text-stone-100">
                  Previsualización en Vivo de la Tienda
                </h3>
              </div>
              <span className="text-[10px] text-[#D6A34A] bg-[#D6A34A]/10 px-2 py-0.5 rounded-full">
                {currentActiveImage ? 'Fondo de Temporada Activo' : 'Gradiente Estándar'}
              </span>
            </div>

            {/* Simulated Hero Banner Preview Box */}
            <div className="relative rounded-xl overflow-hidden border border-[#D6A34A]/40 aspect-[16/9] bg-[#0a0a0a] shadow-inner flex flex-col justify-between p-4 sm:p-5 select-none">
              {/* Background */}
              {currentActiveImage ? (
                <div className="absolute inset-0 z-0">
                  <img
                    src={currentActiveImage}
                    alt="Hero Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                  <div
                    className="absolute inset-0 bg-black transition-opacity"
                    style={{ opacity: overlayOpacity }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a0a0a] via-[#120f0b] to-[#080808]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D6A34A]/10 rounded-full blur-2xl" />
                </div>
              )}

              {/* Simulated Content */}
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#18140e]/90 border border-[#D6A34A]/40 text-[#F5D58A] text-[9px] font-medium backdrop-blur-sm">
                  <Sparkles className="w-2.5 h-2.5 text-[#D6A34A]" />
                  <span>{settings.heroSeasonTitle || 'Boutique Exclusiva de Alba'}</span>
                  <span>•</span>
                  <span className="text-[#D98DA5]">{settings.heroSeasonBadge || 'Envíos Locales'}</span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-sm sm:text-base font-extrabold font-serif-luxury text-[#F5D58A] drop-shadow-md">
                    D'Santos Perfumería
                  </div>
                  <div className="text-[10px] text-stone-200 italic font-serif">
                    "{settings.slogan}"
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black text-[9px] font-bold uppercase tracking-wider">
                  Explorar Catálogo
                </div>
                <span className="text-[9px] text-stone-400">
                  {currentActiveImage ? 'Fondo 16:9 Activo' : 'Sin fondo de imagen'}
                </span>
              </div>
            </div>

            {/* Overlay Opacity Slider */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                  <Layers className="w-3.5 h-3.5 text-[#D6A34A]" />
                  <span>Oscurecimiento de Contraste ({Math.round(overlayOpacity * 100)}%)</span>
                </div>
                <span className="text-[10px] text-stone-500">Asegura legibilidad del texto</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => handleUpdateOpacity(parseFloat(e.target.value))}
                className="w-full accent-[#D6A34A] cursor-pointer"
              />
            </div>
          </div>

          {/* Card: Last Generated Image (if any) */}
          {generatedResult && (
            <div className="rounded-2xl bg-gradient-to-br from-[#1c1811] to-[#120f0c] border border-[#D6A34A] p-5 shadow-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D6A34A] animate-pulse" />
                  <span className="text-xs font-bold text-[#F5D58A]">
                    ¡Última Imagen Generada!
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6A34A]/20 text-[#F5D58A] border border-[#D6A34A]/30">
                  {generatedResult.source === 'gemini' ? 'Gemini IA' : 'Curaduría'}
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-[#D6A34A]/40 shadow-md">
                <img
                  src={generatedResult.imageUrl}
                  alt="Última generación"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleApplyBanner(generatedResult.imageUrl, badgeText, headlineHighlight)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D6A34A] to-[#BA8032] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar al HeroBanner</span>
                </button>
                <a
                  href={generatedResult.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-stone-400 hover:text-[#F5D58A] underline"
                >
                  Abrir tamaño original
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Galería de Banners de Temporada Guardados */}
      <div className="rounded-2xl bg-[#0f0f0f] border border-[#D6A34A]/30 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#D6A34A]" />
              <h3 className="text-lg font-serif-luxury font-bold text-stone-100">
                Galería de Fondos de Temporada ({savedBanners.length})
              </h3>
            </div>
            <p className="text-xs text-stone-400">
              Colección de fondos generados y temáticos. Haz clic en "Activar" para cambiar la temporada de tu tienda al instante.
            </p>
          </div>

          {currentActiveImage && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-stone-400" />
              <span>Desactivar fondo activo</span>
            </button>
          )}
        </div>

        {savedBanners.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-stone-800 rounded-xl space-y-3">
            <Sparkles className="w-8 h-8 text-[#D6A34A]/60 mx-auto" />
            <p className="text-sm font-semibold text-stone-300">
              Aún no tienes fondos guardados en tu galería
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Utiliza el generador de arriba con la estación que prefieras para crear y guardar tus composiciones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedBanners.map((banner) => {
              const isActive = currentActiveImage === banner.imageUrl;
              return (
                <div
                  key={banner.id}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                    isActive
                      ? 'border-[#D6A34A] ring-2 ring-[#D6A34A]/40 shadow-xl shadow-[#D6A34A]/10 bg-[#16130e]'
                      : 'border-stone-800 bg-[#141414] hover:border-[#D6A34A]/40'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-black">
                    <img
                      src={banner.imageUrl}
                      alt={banner.seasonName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Season Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/80 text-[#F5D58A] border border-[#D6A34A]/40 backdrop-blur-sm">
                        {banner.badgeText || banner.seasonName}
                      </span>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                        <span>En Vivo</span>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBanner(banner.id, e)}
                      className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-white/10 hover:border-red-500/40 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Eliminar de la galería"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Info & Action */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-stone-200 line-clamp-1">
                        {banner.seasonName}
                      </h4>
                      <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                        {banner.descriptionPrompt}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500">
                        {banner.createdAt ? new Date(banner.createdAt).toLocaleDateString() : 'Temporada'}
                      </span>

                      {isActive ? (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Fondo Activo</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyBanner(banner.imageUrl, banner.badgeText, banner.headlineHighlight)}
                          className="px-3 py-1.5 rounded-lg bg-[#1a1610] hover:bg-[#D6A34A] text-[#F5D58A] hover:text-black border border-[#D6A34A]/40 hover:border-[#D6A34A] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Activar en Tienda</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
