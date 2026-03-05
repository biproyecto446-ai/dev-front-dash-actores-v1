'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { API } from '@/lib/constants';

const PowerBIDashboard = dynamic(
  () => import('@/components/PowerBIDashboard').then((m) => m.PowerBIDashboard),
  { ssr: false }
);

if (typeof window !== 'undefined') {
  import('@/components/PowerBIDashboard').catch(() => {});
}

const LOADING_IMAGES = [
  '/ImagenDash/dev1.png',
  '/ImagenDash/dev3.png',
  '/ImagenDash/dev2.png',
  '/ImagenDash/dev4.png',
  '/ImagenDash/dev5.png',
  '/ImagenDash/dev6.png',
];
const LOGO_IMAGE = '/ImagenDash/LogoAtipica.png';
/** Sin mínimo: ocultar overlay en cuanto el reporte dispare "loaded". */
const MIN_LOADING_MS = 0;

type LoadingImageProps = {
  src: string;
  index: number;
  isVisible: boolean;
  isLoaded: boolean;
  onLoad: () => void;
};

function LoadingImage({ src, index, isVisible, isLoaded, onLoad }: LoadingImageProps) {
  const floatDuration = 2 + index * 0.3;
  const floatDelay = index * 0.2;

  return (
    <div
      className={`relative w-48 h-48 rounded-2xl overflow-hidden transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        transitionDelay: `${index * 50}ms`,
        animation: isVisible ? `float ${floatDuration}s ease-in-out ${floatDelay}s infinite` : 'none',
      }}
    >
      <Image
        src={src}
        alt=""
        width={192}
        height={192}
        className={`w-full h-full object-cover rounded-2xl transition-all duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={onLoad}
        priority
      />
    </div>
  );
}

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeLoadedAt, setIframeLoadedAt] = useState<number | null>(null);
  const [visibleImages, setVisibleImages] = useState<boolean[]>(() => Array(6).fill(false));
  const [loadedImages, setLoadedImages] = useState<boolean[]>(() => Array(6).fill(false));

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError(false);
    const tokenToSend = (tokenInput ?? '').trim();
    try {
      const res = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToSend }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setTokenError(true);
      }
    } catch {
      setTokenError(true);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const showNext = (index: number) => {
      if (index >= LOADING_IMAGES.length) return;
      setVisibleImages((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      setTimeout(() => showNext(index + 1), 120);
    };
    const t = setTimeout(() => showNext(0), 80);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  useEffect(() => {
    if (iframeLoadedAt === null) return;
    const remaining = Math.max(0, MIN_LOADING_MS - (Date.now() - iframeLoadedAt));
    const timer = setTimeout(() => setIsIframeLoading(false), remaining);
    return () => clearTimeout(timer);
  }, [iframeLoadedAt]);

  const handleIframeLoad = useCallback(() => setIframeLoadedAt(Date.now()), []);
  const handleDashboardError = useCallback((_msg: string) => {
    setTokenError(true);
    setIsIframeLoading(false);
  }, []);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(/fondo.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-white/30">
          <div className="text-center mb-8">
            <img
              src="/Logo-LinkTIC.png"
              alt="LinkTIC Logo"
              className="h-12 w-auto mx-auto mb-4"
             
            />
            <h1 className="text-2xl font-bold text-gray-900">Actores Electorales</h1>
            <p className="text-gray-500 text-sm mt-2">Ingrese el token de acceso para continuar</p>
          </div>

          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setTokenError(false);
                }}
                placeholder="Token de acceso"
                className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  tokenError
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {tokenError && (
              <p className="text-red-500 text-sm text-center">Token incorrecto. Intente nuevamente.</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col overflow-hidden bg-white">
      {isIframeLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-100">
          <div className="mb-6 animate-fadeIn">
            <Image
              src={LOGO_IMAGE}
              alt="Logo"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <div className="mb-8 text-center animate-fadeIn">
            <p className="text-gray-600 text-lg font-medium">Cargando Datos de Operación...</p>
            <div className="mt-3 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {LOADING_IMAGES.map((src, index) => (
              <div key={index} className={index % 2 === 0 ? '-mt-16' : 'mt-16'}>
                <LoadingImage
                  src={src}
                  index={index}
                  isVisible={visibleImages[index]}
                  isLoaded={loadedImages[index]}
                  onLoad={() => handleImageLoad(index)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 w-full relative">
        <PowerBIDashboard
          onLoaded={handleIframeLoad}
          onError={handleDashboardError}
        />
      </main>
    </div>
  );
}
