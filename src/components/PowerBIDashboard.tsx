'use client';

import { useState, useEffect, useCallback } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { API } from '@/lib/constants';

export interface EmbedConfig {
  embedUrl: string;
  accessToken: string;
  reportId: string;
  expiration?: string;
}

interface PowerBIDashboardProps {
  appToken?: string;
  onLoaded?: () => void;
  onError?: (error: string) => void;
}

export function PowerBIDashboard({ appToken, onLoaded, onError }: PowerBIDashboardProps) {
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmbedConfig = useCallback(async () => {
    try {
      const headers: HeadersInit = {};
      if (appToken) headers['Authorization'] = `Bearer ${appToken}`;
      const res = await fetch(API.embedConfig, {
        credentials: 'include',
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      setConfig(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar el dashboard';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [appToken, onError]);

  useEffect(() => {
    fetchEmbedConfig();
  }, [fetchEmbedConfig]);

  const handleLoaded = useCallback(() => {
    onLoaded?.();
  }, [onLoaded]);

  const handleError = useCallback(
    (event?: { detail?: unknown }) => {
      const detail = event?.detail as { message?: string } | undefined;
      const message =
        detail && typeof detail.message === 'string' ? detail.message : 'Error al cargar el reporte';
      setError(message);
      onError?.(message);
    },
    [onError]
  );

  const eventHandlers = new Map([
    ['loaded', handleLoaded],
    ['error', handleError],
  ]);

  if (isLoading) return null;

  if (error || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-red-600 font-medium mb-2">Error al cargar el dashboard</p>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            fetchEmbedConfig();
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-0">
      <PowerBIEmbed
        embedConfig={{
          type: 'report',
          id: config.reportId,
          embedUrl: config.embedUrl,
          accessToken: config.accessToken,
          tokenType: models.TokenType.Embed,
          settings: {
            panes: {
              filters: { visible: false },
              pageNavigation: { visible: false },
            },
          },
        }}
        eventHandlers={eventHandlers}
        cssClassName="w-full h-full"
      />
    </div>
  );
}
